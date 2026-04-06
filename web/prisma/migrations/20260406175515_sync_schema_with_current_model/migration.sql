-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('cash', 'mobile_money', 'bank_transfer', 'cod');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."OrderStatus" ADD VALUE 'new';
ALTER TYPE "public"."OrderStatus" ADD VALUE 'in_progress';
ALTER TYPE "public"."OrderStatus" ADD VALUE 'ready';

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "paymentMethod" "public"."PaymentMethod",
ALTER COLUMN "status" SET DEFAULT 'new';

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "category" TEXT,
ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "public"."Shop" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notificationEmail" TEXT,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "description" TEXT,
    "city" TEXT,
    "whatsappNumber" TEXT NOT NULL,
    "category" TEXT,
    "address" TEXT,
    "openingHours" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_userId_key" ON "public"."Shop"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_slug_key" ON "public"."Shop"("slug");

-- CreateIndex
CREATE INDEX "Shop_name_idx" ON "public"."Shop"("name");

-- AddForeignKey
ALTER TABLE "public"."Shop" ADD CONSTRAINT "Shop_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
