import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, verifyWebhookTimestamp } from "@/lib/geniuspay";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const sig       = request.headers.get("x-webhook-signature");
  const timestamp = request.headers.get("x-webhook-timestamp");
  const eventType = request.headers.get("x-webhook-event") ?? "";

  if (!verifyWebhookSignature(rawBody, sig, timestamp)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  if (!verifyWebhookTimestamp(timestamp)) {
    return NextResponse.json({ error: "Webhook expiré" }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  // La transaction GeniusPay est dans payload.data ou directement dans payload
  const txData = (payload.data ?? payload) as Record<string, unknown>;
  const providerReference = (txData.reference ?? "") as string;

  // Idempotence : vérifier si l'événement a déjà été traité
  const existing = await prisma.webhookEvent.findFirst({
    where: { provider: "geniuspay", providerReference, eventType },
  });
  if (existing?.processed) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const webhookEvent = await prisma.webhookEvent.create({
    data: {
      provider:  "geniuspay",
      eventType,
      providerReference: providerReference || null,
      payload,
      processed: false,
    },
  });

  try {
    if (eventType === "payment.success" || eventType === "payment.completed") {
      await handlePaymentSuccess(txData, providerReference);
    } else if (eventType === "payment.failed") {
      await handlePaymentFailed(providerReference, txData);
    } else if (eventType === "payment.cancelled") {
      await handlePaymentCancelled(providerReference, txData);
    }

    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { processed: true, processedAt: new Date() },
    });
  } catch (err) {
    console.error("[GeniusPay webhook] processing error:", err);
  }

  return NextResponse.json({ ok: true });
}

async function handlePaymentSuccess(
  txData: Record<string, unknown>,
  providerReference: string,
) {
  // Retrouver notre transaction via les metadata ou la référence GeniusPay
  const metadata = txData.metadata as Record<string, string> | undefined;
  const internalTxId = metadata?.transactionId;

  const transaction = internalTxId
    ? await prisma.paymentTransaction.findUnique({ where: { id: internalTxId }, include: { plan: true } })
    : providerReference
    ? await prisma.paymentTransaction.findUnique({ where: { providerReference }, include: { plan: true } })
    : null;

  if (!transaction) {
    console.error("[webhook] transaction introuvable pour", { internalTxId, providerReference });
    return;
  }
  if (transaction.status === "paid") return; // déjà traité

  // Vérifications de sécurité
  const paidAmount   = Number(txData.amount ?? 0);
  const paidCurrency = ((txData.currency ?? "XOF") as string).toUpperCase();

  if (paidCurrency !== transaction.currency.toUpperCase()) {
    throw new Error(`Devise incorrecte: reçu ${paidCurrency}, attendu ${transaction.currency}`);
  }
  if (paidAmount < Number(transaction.amount)) {
    throw new Error(`Montant insuffisant: reçu ${paidAmount}, attendu ${Number(transaction.amount)}`);
  }

  const now       = new Date();
  const expiresAt = new Date(now);
  if (transaction.billingCycle === "yearly") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  const geniusPayRef = providerReference || (txData.reference as string | undefined) || null;

  await prisma.$transaction([
    prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status:            "paid",
        providerReference: geniusPayRef ?? transaction.providerReference,
        providerPaymentId: txData.id != null ? String(txData.id) : transaction.providerPaymentId,
        webhookPayload:    txData,
      },
    }),
    prisma.subscription.upsert({
      where:  { userId: transaction.userId },
      create: {
        userId:            transaction.userId,
        planId:            transaction.planId,
        status:            "active",
        billingCycle:      transaction.billingCycle,
        startedAt:         now,
        expiresAt,
        provider:          "geniuspay",
        providerReference: geniusPayRef,
        providerPaymentId: txData.id != null ? String(txData.id) : null,
      },
      update: {
        planId:            transaction.planId,
        status:            "active",
        billingCycle:      transaction.billingCycle,
        startedAt:         now,
        expiresAt,
        provider:          "geniuspay",
        providerReference: geniusPayRef,
        providerPaymentId: txData.id != null ? String(txData.id) : null,
      },
    }),
  ]);
}

async function handlePaymentFailed(
  providerReference: string,
  txData: Record<string, unknown>,
) {
  const metadata    = txData.metadata as Record<string, string> | undefined;
  const internalTxId = metadata?.transactionId;

  if (internalTxId) {
    await prisma.paymentTransaction.updateMany({
      where: { id: internalTxId, status: "pending" },
      data:  { status: "failed" },
    });
  } else if (providerReference) {
    await prisma.paymentTransaction.updateMany({
      where: { providerReference, status: "pending" },
      data:  { status: "failed" },
    });
  }
}

async function handlePaymentCancelled(
  providerReference: string,
  txData: Record<string, unknown>,
) {
  const metadata    = txData.metadata as Record<string, string> | undefined;
  const internalTxId = metadata?.transactionId;

  if (internalTxId) {
    await prisma.paymentTransaction.updateMany({
      where: { id: internalTxId, status: "pending" },
      data:  { status: "cancelled" },
    });
  } else if (providerReference) {
    await prisma.paymentTransaction.updateMany({
      where: { providerReference, status: "pending" },
      data:  { status: "cancelled" },
    });
  }
}
