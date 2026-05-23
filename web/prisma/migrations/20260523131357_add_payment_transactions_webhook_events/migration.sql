-- CreateEnum
CREATE TYPE "public"."PaymentTransactionStatus" AS ENUM ('pending', 'paid', 'failed', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "public"."BillingCycle" AS ENUM ('monthly', 'yearly');

-- AlterTable
ALTER TABLE "public"."Subscription" ADD COLUMN     "billingCycle" "public"."BillingCycle" NOT NULL DEFAULT 'monthly',
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "providerPaymentId" TEXT,
ADD COLUMN     "providerReference" TEXT;

-- CreateTable
CREATE TABLE "public"."PaymentTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "planId" TEXT NOT NULL,
    "billingCycle" "public"."BillingCycle" NOT NULL DEFAULT 'monthly',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "status" "public"."PaymentTransactionStatus" NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL DEFAULT 'geniuspay',
    "providerReference" TEXT,
    "providerPaymentId" TEXT,
    "checkoutUrl" TEXT,
    "webhookPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "providerReference" TEXT,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_providerReference_key" ON "public"."PaymentTransaction"("providerReference");

-- CreateIndex
CREATE INDEX "PaymentTransaction_userId_idx" ON "public"."PaymentTransaction"("userId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_subscriptionId_idx" ON "public"."PaymentTransaction"("subscriptionId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_planId_idx" ON "public"."PaymentTransaction"("planId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_providerReference_idx" ON "public"."PaymentTransaction"("providerReference");

-- CreateIndex
CREATE INDEX "WebhookEvent_provider_eventType_idx" ON "public"."WebhookEvent"("provider", "eventType");

-- CreateIndex
CREATE INDEX "WebhookEvent_providerReference_idx" ON "public"."WebhookEvent"("providerReference");

-- AddForeignKey
ALTER TABLE "public"."PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
