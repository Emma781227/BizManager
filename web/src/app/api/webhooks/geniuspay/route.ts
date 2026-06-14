import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, verifyWebhookTimestamp } from "@/lib/geniuspay";

function toJson(v: unknown): Prisma.InputJsonValue {
  return v as unknown as Prisma.InputJsonValue;
}

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
      payload: toJson(payload),
      processed: false,
    },
  });

  const metadata   = (payload.metadata ?? (payload.data as Record<string, unknown>)?.metadata) as Record<string, string> | undefined;
  const isOrderPay = metadata?.type === "order";

  try {
    if (eventType === "payment.success" || eventType === "payment.completed") {
      if (isOrderPay) await handleOrderPaymentSuccess(txData, providerReference, metadata);
      else await handlePaymentSuccess(txData, providerReference);
    } else if (eventType === "payment.failed") {
      if (isOrderPay) await handleOrderPaymentFailed(providerReference, metadata);
      else await handlePaymentFailed(providerReference, txData);
    } else if (eventType === "payment.cancelled") {
      if (isOrderPay) await handleOrderPaymentCancelled(providerReference, metadata);
      else await handlePaymentCancelled(providerReference, txData);
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
  const paidCurrency = ((txData.currency ?? "XAF") as string).toUpperCase();

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
        webhookPayload:    toJson(txData),
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

// ─── Order payment handlers ───────────────────────────────────────────────────

async function handleOrderPaymentSuccess(
  txData: Record<string, unknown>,
  providerReference: string,
  metadata?: Record<string, string>,
) {
  const internalTxId = metadata?.orderTransactionId;
  const tx = internalTxId
    ? await prisma.orderPaymentTransaction.findUnique({ where: { id: internalTxId } })
    : providerReference
    ? await prisma.orderPaymentTransaction.findUnique({ where: { providerReference } })
    : null;

  if (!tx) {
    console.error("[webhook] orderPaymentTransaction introuvable", { internalTxId, providerReference });
    return;
  }
  if (tx.status === "paid") return;

  const paidAmount   = Number(txData.amount ?? 0);
  const paidCurrency = ((txData.currency ?? "XOF") as string).toUpperCase();
  if (paidCurrency !== tx.currency.toUpperCase()) throw new Error(`Devise incorrecte: reçu ${paidCurrency}, attendu ${tx.currency}`);
  if (paidAmount < Number(tx.amount)) throw new Error(`Montant insuffisant: reçu ${paidAmount}, attendu ${Number(tx.amount)}`);

  const geniusRef = providerReference || (txData.reference as string | undefined) || null;

  await prisma.$transaction([
    prisma.orderPaymentTransaction.update({
      where: { id: tx.id },
      data: {
        status: "paid",
        providerReference: geniusRef ?? tx.providerReference,
        providerPaymentId: txData.id != null ? String(txData.id) : tx.providerPaymentId,
        webhookPayload: toJson(txData),
      },
    }),
    prisma.order.update({
      where: { id: tx.orderId },
      data: { paymentStatus: "paid", paidAmount: String(paidAmount), status: "confirmed" },
    }),
  ]);
}

async function handleOrderPaymentFailed(
  providerReference: string,
  metadata?: Record<string, string>,
) {
  const internalTxId = metadata?.orderTransactionId;
  if (internalTxId) {
    await prisma.orderPaymentTransaction.updateMany({ where: { id: internalTxId, status: "pending" }, data: { status: "failed" } });
  } else if (providerReference) {
    await prisma.orderPaymentTransaction.updateMany({ where: { providerReference, status: "pending" }, data: { status: "failed" } });
  }
}

async function handleOrderPaymentCancelled(
  providerReference: string,
  metadata?: Record<string, string>,
) {
  const internalTxId = metadata?.orderTransactionId;
  if (internalTxId) {
    await prisma.orderPaymentTransaction.updateMany({ where: { id: internalTxId, status: "pending" }, data: { status: "cancelled" } });
  } else if (providerReference) {
    await prisma.orderPaymentTransaction.updateMany({ where: { providerReference, status: "pending" }, data: { status: "cancelled" } });
  }
}

// ─── Subscription payment handlers ────────────────────────────────────────────

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
