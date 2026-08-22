import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveShop } from "@/lib/shop";
import { hasPermission } from "@/lib/permissions";
import { generateOtpCode, hashOtpCode, otpExpiresAt, maskPhone } from "@/lib/otp";
import { sendEmail, getSmtpConfig } from "@/lib/mailer";

type RouteParams = { params: Promise<{ orderId: string }> };

export async function POST(request: NextRequest, context: RouteParams) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { orderId } = await context.params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      shop:     { select: { id: true, userId: true, name: true } },
      customer: { select: { phone: true, email: true, fullName: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const shop = await resolveShop(session.userId, order.shopId);
  if (!shop) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (!hasPermission(shop._staffRole, "canManageOrders")) {
    return NextResponse.json({ error: "Droits insuffisants pour confirmer un paiement" }, { status: 403 });
  }

  if (order.paymentMethod !== "cash" && order.paymentMethod !== "cod") {
    return NextResponse.json(
      { error: "OTP uniquement disponible pour les paiements espèces ou à la livraison" },
      { status: 400 },
    );
  }

  if (order.paymentStatus === "paid") {
    return NextResponse.json({ error: "Cette commande est déjà payée" }, { status: 400 });
  }

  if (order.status === "cancelled") {
    return NextResponse.json({ error: "Impossible d'envoyer un OTP pour une commande annulée" }, { status: 400 });
  }

  // Expire les OTPs précédents pour cette commande
  await prisma.deliveryOtp.updateMany({
    where: { orderId, status: "pending" },
    data:  { status: "expired" },
  });

  const code      = generateOtpCode();
  const codeHash  = hashOtpCode(code, orderId);
  const expiresAt = otpExpiresAt();
  const phone     = order.customer.phone;

  const otp = await prisma.deliveryOtp.create({
    data: { orderId, phone, codeHash, expiresAt },
  });

  let sentVia: "email" | "dashboard" = "dashboard";
  const customerEmail = order.customer.email;

  if (customerEmail && getSmtpConfig()) {
    try {
      await sendEmail({
        to:      customerEmail,
        subject: `[${order.shop.name}] Code de confirmation de livraison`,
        text: [
          `Bonjour ${order.customer.fullName},`,
          ``,
          `Votre livreur de ${order.shop.name} est à votre porte.`,
          `Communiquez-lui ce code pour confirmer la réception de votre commande :`,
          ``,
          `Code : ${code}`,
          ``,
          `Ce code est valable 30 minutes.`,
          `Si vous n'attendez pas de livraison, ignorez cet email.`,
        ].join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;max-width:480px;margin:0 auto">
            <div style="background:#0A8F45;padding:20px 24px;border-radius:12px 12px 0 0">
              <h2 style="margin:0;color:#fff;font-size:17px">Confirmation de livraison · ${order.shop.name}</h2>
            </div>
            <div style="background:#fff;padding:24px;border:1px solid #e8ecea;border-top:none;border-radius:0 0 12px 12px">
              <p style="margin:0 0 14px;font-size:14px">
                Bonjour <strong>${order.customer.fullName}</strong>,
              </p>
              <p style="margin:0 0 18px;font-size:14px;color:#1f2937">
                Votre livreur de <strong>${order.shop.name}</strong> est à votre porte.<br/>
                Communiquez-lui ce code pour confirmer la réception de votre commande :
              </p>
              <div style="text-align:center;margin:0 0 20px">
                <div style="display:inline-block;padding:16px 32px;border-radius:14px;background:#e8f5ef;color:#0A8F45;font-size:32px;font-weight:800;letter-spacing:10px;font-family:monospace">
                  ${code}
                </div>
              </div>
              <p style="margin:0 0 8px;font-size:12px;color:#667085;text-align:center">
                Ce code expire dans 30 minutes.
              </p>
              <p style="margin:0;font-size:12px;color:#98A2B3;text-align:center">
                Si vous n'attendez pas de livraison, ignorez cet email.
              </p>
            </div>
          </div>
        `,
      });
      sentVia = "email";
    } catch (err) {
      console.error("[OTP] Échec envoi email:", err);
    }
  }

  return NextResponse.json({
    data: {
      otpId:       otp.id,
      maskedPhone: maskPhone(phone),
      sentVia,
      code:        sentVia === "dashboard" ? code : undefined,
      expiresAt:   expiresAt.toISOString(),
    },
  });
}
