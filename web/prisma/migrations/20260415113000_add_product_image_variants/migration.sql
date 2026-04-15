-- Add product image variants (up to 4 handled at application layer)
ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "imageVariants" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
