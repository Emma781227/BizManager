DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'PaymentMethod'
    ) THEN
        CREATE TYPE "public"."PaymentMethod" AS ENUM ('cash', 'mobile_money', 'bank_transfer', 'cod');
    END IF;
END
$$;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'OrderStatus' AND e.enumlabel = 'new'
    ) THEN
        ALTER TYPE "public"."OrderStatus" ADD VALUE 'new';
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'OrderStatus' AND e.enumlabel = 'in_progress'
    ) THEN
        ALTER TYPE "public"."OrderStatus" ADD VALUE 'in_progress';
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'OrderStatus' AND e.enumlabel = 'ready'
    ) THEN
        ALTER TYPE "public"."OrderStatus" ADD VALUE 'ready';
    END IF;
END
$$;

-- AlterTable
ALTER TABLE "public"."Order"
    ADD COLUMN IF NOT EXISTS "paymentMethod" "public"."PaymentMethod";

-- AlterTable
ALTER TABLE "public"."Product"
    ADD COLUMN IF NOT EXISTS "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS "category" TEXT,
    ADD COLUMN IF NOT EXISTS "description" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."Shop" (
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
CREATE UNIQUE INDEX IF NOT EXISTS "Shop_userId_key" ON "public"."Shop"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Shop_slug_key" ON "public"."Shop"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Shop_name_idx" ON "public"."Shop"("name");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Shop_userId_fkey'
    ) THEN
        ALTER TABLE "public"."Shop"
            ADD CONSTRAINT "Shop_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;
