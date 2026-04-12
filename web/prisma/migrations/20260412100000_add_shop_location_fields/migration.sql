-- Add missing location fields for Shop in production-safe way
ALTER TABLE "Shop"
ADD COLUMN IF NOT EXISTS "postalCode" TEXT,
ADD COLUMN IF NOT EXISTS "regionCountry" TEXT;
