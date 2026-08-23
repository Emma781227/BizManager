import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveShop } from "@/lib/shop";
import { hasPermission } from "@/lib/permissions";
import { verifyOtpCode, OTP_MAX_ATTEMPTS } from "@/lib/otp";

const verifySchema = z.object({
  code: z
    .string()
    .length(6, "Le code doit contenir exactement 6 chiffres")
    .regex(/^\d+$/, "Le code doit contenir uniquement des chiffres"),
});

type RouteParams = { params: Promise<{ orderId: string }> };

export async function POST(request: NextRequest, context: RouteParams) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { orderId } = await context.params;

  const body   = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Code invalide : 6 chiffres requis" }, { status: 400 });
  }
  const { code } = parsed.data;

  const order = await prisma.order.findUnique({
    where:  { id: orderId },
    select: { id: true, shopId: true, paymentStatus: true, totalAmount: true, paymentMethod: true, status: true },
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

  if (order.paymentStatus === "paid") {
    return NextResponse.json({ error: "Cette commande est déjà payée" }, { status: 400 });
  }

  const otp = await prisma.deliveryOtp.findFirst({
    where:   { orderId, status: "pending" },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return NextResponse.json(
      { error: "Aucun code actif pour cette commande. Générez un nouveau code." },
      { status: 400 },
    );
  }

  if (new Date() > otp.expiresAt) {
    await prisma.deliveryOtp.update({ where: { id: otp.id }, data: { status: "expired" } });
    return NextResponse.json({ error: "Code expiré. Générez un nouveau code." }, { status: 400 });
  }

  if (otp.attemptCount >= OTP_MAX_ATTEMPTS) {
    await prisma.deliveryOtp.update({ where: { id: otp.id }, data: { status: "failed" } });
    return NextResponse.json({ error: "Trop de tentatives. Générez un nouveau code." }, { status: 400 });
  }

  const updated = await prisma.deliveryOtp.update({
    where: { id: otp.id },
    data:  { attemptCount: { increment: 1 } },
  });

  const isValid = verifyOtpCode(code, orderId, otp.codeHash);

  if (!isValid) {
    const remaining = OTP_MAX_ATTEMPTS - updated.attemptCount;
    if (remaining <= 0) {
      await prisma.deliveryOtp.update({ where: { id: otp.id }, data: { status: "failed" } });
      return NextResponse.json(
        { verified: false, error: "Code incorrect : trop de tentatives. Générez un nouveau code.", remainingAttempts: 0 },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        verified: false,
        error: `Code incorrect. ${remaining} tentative${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}.`,
        remainingAttempts: remaining,
      },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.deliveryOtp.update({
      where: { id: otp.id },
      data:  { status: "verified", verifiedAt: new Date() },
    }),
    prisma.order.update({
      where: { id: orderId },
      data:  {
        paymentStatus: "paid",
        paidAmount:    order.totalAmount,
        status:        "delivered",
      },
    }),
  ]);

  return NextResponse.json({ verified: true });
}
