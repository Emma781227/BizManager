-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: multi_shop_architecture
-- Description: Migre de l'architecture mono-boutique (userId) vers
--              l'architecture multi-boutiques (shopId).
--              Ajoute Plan, Subscription, WhatsappLog.
--              Ajoute channel sur Order, syncStatus sur Product, status sur Shop.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Nouveaux types ENUM
CREATE TYPE "SubscriptionStatus" AS ENUM ('trialing', 'active', 'cancelled', 'expired');
CREATE TYPE "ShopStatus"         AS ENUM ('active', 'inactive', 'suspended', 'closed');
CREATE TYPE "SyncStatus"         AS ENUM ('ok', 'pending', 'error');
CREATE TYPE "OrderChannel"       AS ENUM ('whatsapp', 'online', 'manual');
CREATE TYPE "WhatsappLogType"    AS ENUM ('relance', 'confirmation', 'custom', 'template');

-- 2. Supprimer la contrainte unique sur Shop.userId (1 user → N shops)
ALTER TABLE "Shop" DROP CONSTRAINT IF EXISTS "Shop_userId_key";

-- 3. Ajouter colonnes sur les tables existantes
ALTER TABLE "Shop"    ADD COLUMN "status" "ShopStatus" NOT NULL DEFAULT 'active';
ALTER TABLE "Product" ADD COLUMN "shopId"     TEXT;
ALTER TABLE "Product" ADD COLUMN "syncStatus" "SyncStatus" NOT NULL DEFAULT 'ok';
ALTER TABLE "Order"   ADD COLUMN "shopId"  TEXT;
ALTER TABLE "Order"   ADD COLUMN "channel" "OrderChannel" NOT NULL DEFAULT 'manual';
ALTER TABLE "Order"   ADD COLUMN "notes"   TEXT;
ALTER TABLE "Customer" ADD COLUMN "shopId" TEXT;

-- 4. Backfill shopId depuis userId (via la boutique du marchand)
UPDATE "Product" p
  SET "shopId" = s.id
  FROM "Shop" s
  WHERE s."userId" = p."userId";

UPDATE "Order" o
  SET "shopId" = s.id
  FROM "Shop" s
  WHERE s."userId" = o."userId";

UPDATE "Customer" c
  SET "shopId" = s.id
  FROM "Shop" s
  WHERE s."userId" = c."userId";

-- 5. Supprimer les enregistrements orphelins (sans boutique correspondante)
DELETE FROM "OrderItem"
  WHERE "orderId" IN (SELECT id FROM "Order" WHERE "shopId" IS NULL);

DELETE FROM "Order"    WHERE "shopId" IS NULL;
DELETE FROM "Product"  WHERE "shopId" IS NULL;
DELETE FROM "Customer" WHERE "shopId" IS NULL;

-- 6. Rendre shopId NOT NULL
ALTER TABLE "Product"  ALTER COLUMN "shopId" SET NOT NULL;
ALTER TABLE "Order"    ALTER COLUMN "shopId" SET NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "shopId" SET NOT NULL;

-- 7. Supprimer les anciennes contraintes FK userId
ALTER TABLE "Product"  DROP CONSTRAINT IF EXISTS "Product_userId_fkey";
ALTER TABLE "Order"    DROP CONSTRAINT IF EXISTS "Order_userId_fkey";
ALTER TABLE "Customer" DROP CONSTRAINT IF EXISTS "Customer_userId_fkey";

-- 8. Supprimer les colonnes userId devenues obsolètes
ALTER TABLE "Product"  DROP COLUMN "userId";
ALTER TABLE "Order"    DROP COLUMN "userId";
ALTER TABLE "Customer" DROP COLUMN "userId";

-- 9. Ajouter les nouvelles FK shopId
ALTER TABLE "Product"  ADD CONSTRAINT "Product_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order"    ADD CONSTRAINT "Order_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Customer" ADD CONSTRAINT "Customer_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. Supprimer les anciens index userId
DROP INDEX IF EXISTS "Product_userId_createdAt_idx";
DROP INDEX IF EXISTS "Product_userId_name_idx";
DROP INDEX IF EXISTS "Order_userId_createdAt_idx";
DROP INDEX IF EXISTS "Order_userId_status_idx";
DROP INDEX IF EXISTS "Customer_userId_createdAt_idx";
DROP INDEX IF EXISTS "Customer_userId_phone_idx";

-- 11. Créer les nouveaux index shopId
CREATE INDEX "Shop_userId_idx"            ON "Shop"("userId");
CREATE INDEX "Product_shopId_createdAt_idx" ON "Product"("shopId", "createdAt");
CREATE INDEX "Product_shopId_name_idx"    ON "Product"("shopId", "name");
CREATE INDEX "Order_shopId_createdAt_idx" ON "Order"("shopId", "createdAt");
CREATE INDEX "Order_shopId_status_idx"    ON "Order"("shopId", "status");
CREATE INDEX "Order_shopId_channel_idx"   ON "Order"("shopId", "channel");
CREATE INDEX "Customer_shopId_createdAt_idx" ON "Customer"("shopId", "createdAt");
CREATE INDEX "Customer_shopId_phone_idx"  ON "Customer"("shopId", "phone");

-- 12. Table Plan
CREATE TABLE "Plan" (
  "id"           TEXT         NOT NULL,
  "name"         TEXT         NOT NULL,
  "displayName"  TEXT         NOT NULL,
  "maxShops"     INTEGER      NOT NULL,
  "maxProducts"  INTEGER      NOT NULL,
  "priceMonthly" DECIMAL(10,2) NOT NULL,
  "features"     TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
  "isActive"     BOOLEAN      NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- 13. Table Subscription
CREATE TABLE "Subscription" (
  "id"        TEXT                 NOT NULL,
  "userId"    TEXT                 NOT NULL,
  "planId"    TEXT                 NOT NULL,
  "status"    "SubscriptionStatus" NOT NULL DEFAULT 'active',
  "startedAt" TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");
CREATE INDEX "Subscription_planId_idx"       ON "Subscription"("planId");

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON UPDATE CASCADE;

-- 14. Table WhatsappLog
CREATE TABLE "WhatsappLog" (
  "id"      TEXT             NOT NULL,
  "shopId"  TEXT             NOT NULL,
  "orderId" TEXT,
  "type"    "WhatsappLogType" NOT NULL,
  "message" TEXT             NOT NULL,
  "sentAt"  TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WhatsappLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WhatsappLog_shopId_idx"  ON "WhatsappLog"("shopId");
CREATE INDEX "WhatsappLog_orderId_idx" ON "WhatsappLog"("orderId");

ALTER TABLE "WhatsappLog" ADD CONSTRAINT "WhatsappLog_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WhatsappLog" ADD CONSTRAINT "WhatsappLog_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 15. Seed des plans par défaut
INSERT INTO "Plan" ("id", "name", "displayName", "maxShops", "maxProducts", "priceMonthly", "features")
VALUES
  (gen_random_uuid()::text, 'starter',  'Starter',  1,  50,    0,     ARRAY['1 boutique', 'WhatsApp basic', '50 produits']),
  (gen_random_uuid()::text, 'business', 'Business', 3,  500,   9900,  ARRAY['3 boutiques', 'WhatsApp avancé', '500 produits', 'Import/Export', 'Analytics']),
  (gen_random_uuid()::text, 'premium',  'Premium',  10, -1,    19900, ARRAY['10 boutiques', 'WhatsApp illimité', 'Produits illimités', 'API', 'Support prioritaire'])
ON CONFLICT ("name") DO NOTHING;
