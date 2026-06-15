-- CreateEnum
CREATE TYPE "DeliveryOtpStatus" AS ENUM ('pending', 'verified', 'expired', 'failed');

-- CreateTable
CREATE TABLE "DeliveryOtp" (
    "id"           TEXT NOT NULL,
    "orderId"      TEXT NOT NULL,
    "phone"        TEXT NOT NULL,
    "codeHash"     TEXT NOT NULL,
    "status"       "DeliveryOtpStatus" NOT NULL DEFAULT 'pending',
    "expiresAt"    TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt"   TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliveryOtp_orderId_idx" ON "DeliveryOtp"("orderId");

-- CreateIndex
CREATE INDEX "DeliveryOtp_expiresAt_idx" ON "DeliveryOtp"("expiresAt");

-- AddForeignKey
ALTER TABLE "DeliveryOtp" ADD CONSTRAINT "DeliveryOtp_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
