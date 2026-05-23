import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { WEBHOOK_SECRET, verifyWebhookTimestamp } from "@/lib/geniuspay";
import { createHmac, timingSafeEqual } from "crypto";

// Compute HMAC-SHA256 signature for webhook verification
function computeSignature(body: string): string {
  return createHmac("sha256", WEBHOOK_SECRET).update(body, "utf8").digest("hex");
}

function verifySignature(body: string, header: string | null): boolean {
  if (!WEBHOOK_SECRET || !header) return false;
  const expected = computeSignature(body);
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(header, "hex"));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const sig = request.headers.get("x-geniuspay-signature") ?? request.headers.get("x-webhook-signature");

  if (!verifySignature(rawBody, sig)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  if (!verifyWebhookTimestamp(payload.timestamp ?? payload.created_at)) {
    return NextResponse.json({ error: "Webhook expiré" }, { status: 400 });
  }

  const eventType = (payload.event ?? payload.type ?? payload.event_type ?? "") as string;
  const providerReference = (payload.reference ?? payload.transaction_reference ?? payload.payment_reference ?? "") as string;

  // Idempotency: check if event was already processed
  const existing = await prisma.webhookEvent.findFirst({
    where: { provider: "geniuspay", providerReference, eventType },
  });

  if (existing?.processed) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // Record the event
  const webhookEvent = await prisma.webhookEvent.create({
    data: {
      provider: "geniuspay",
      eventType,
      providerReference: providerReference || null,
      payload,
      processed: false,
    },
  });

  try {
    if (eventType === "payment.success" || eventType === "payment.completed" || eventType === "payment_success") {
      await handlePaymentSuccess(payload, providerReference);
    } else if (eventType === "payment.failed" || eventType === "payment_failed") {
      await handlePaymentFailed(providerReference);
    } else if (eventType === "payment.cancelled" || eventType === "payment_cancelled") {
      await handlePaymentCancelled(providerReference);
    }

    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { processed: true, processedAt: new Date() },
    });
  } catch (err) {
    console.error("[GeniusPay webhook] processing error:", err);
    // Don't throw — return 200 so GeniusPay won't retry with a bad payload
  }

  return NextResponse.json({ ok: true });
}

async function handlePaymentSuccess(payload: Record<string, unknown>, providerReference: string) {
  if (!providerReference) return;

  const transaction = await prisma.paymentTransaction.findUnique({
    where: { providerReference },
    include: { plan: true, user: true },
  });

  if (!transaction) return;
  if (transaction.status === "paid") return; // already handled

  // Security checks
  const paidAmount = Number(payload.amount ?? payload.paid_amount ?? 0);
  const paidCurrency = (payload.currency ?? "XOF") as string;

  if (paidCurrency.toUpperCase() !== transaction.currency.toUpperCase()) {
    throw new Error(`Devise incorrecte: reçu ${paidCurrency}, attendu ${transaction.currency}`);
  }

  if (paidAmount < Number(transaction.amount)) {
    throw new Error(`Montant insuffisant: reçu ${paidAmount}, attendu ${Number(transaction.amount)}`);
  }

  const now = new Date();
  const expiresAt = new Date(now);
  if (transaction.billingCycle === "yearly") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  await prisma.$transaction([
    prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: "paid",
        webhookPayload: payload,
        providerPaymentId: (payload.payment_id ?? payload.id ?? transaction.providerPaymentId) as string | null,
      },
    }),
    prisma.subscription.upsert({
      where: { userId: transaction.userId },
      create: {
        userId: transaction.userId,
        planId: transaction.planId,
        status: "active",
        billingCycle: transaction.billingCycle,
        startedAt: now,
        expiresAt,
        provider: "geniuspay",
        providerReference,
        providerPaymentId: transaction.providerPaymentId ?? null,
      },
      update: {
        planId: transaction.planId,
        status: "active",
        billingCycle: transaction.billingCycle,
        startedAt: now,
        expiresAt,
        provider: "geniuspay",
        providerReference,
        providerPaymentId: transaction.providerPaymentId ?? null,
      },
    }),
    prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: { subscription: { connect: { userId: transaction.userId } } },
    }),
  ]);
}

async function handlePaymentFailed(providerReference: string) {
  if (!providerReference) return;
  await prisma.paymentTransaction.updateMany({
    where: { providerReference, status: "pending" },
    data: { status: "failed" },
  });
}

async function handlePaymentCancelled(providerReference: string) {
  if (!providerReference) return;
  await prisma.paymentTransaction.updateMany({
    where: { providerReference, status: "pending" },
    data: { status: "cancelled" },
  });
}
