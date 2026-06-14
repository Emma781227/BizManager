-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'online';

-- CreateTable
CREATE TABLE "OrderPaymentTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL DEFAULT 'geniuspay',
    "providerReference" TEXT,
    "providerPaymentId" TEXT,
    "checkoutUrl" TEXT,
    "webhookPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderPaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderPaymentTransaction_orderId_key" ON "OrderPaymentTransaction"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderPaymentTransaction_providerReference_key" ON "OrderPaymentTransaction"("providerReference");

-- CreateIndex
CREATE INDEX "OrderPaymentTransaction_orderId_idx" ON "OrderPaymentTransaction"("orderId");

-- CreateIndex
CREATE INDEX "OrderPaymentTransaction_shopId_idx" ON "OrderPaymentTransaction"("shopId");

-- CreateIndex
CREATE INDEX "OrderPaymentTransaction_providerReference_idx" ON "OrderPaymentTransaction"("providerReference");

-- AddForeignKey
ALTER TABLE "OrderPaymentTransaction" ADD CONSTRAINT "OrderPaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPaymentTransaction" ADD CONSTRAINT "OrderPaymentTransaction_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
