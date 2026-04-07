DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'UserRole'
  ) THEN
    CREATE TYPE "UserRole" AS ENUM ('merchant', 'admin');
  END IF;
END
$$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "role" "UserRole";

UPDATE "User"
SET "role" = 'merchant'
WHERE "role" IS NULL;

ALTER TABLE "User"
  ALTER COLUMN "role" SET DEFAULT 'merchant';

ALTER TABLE "User"
  ALTER COLUMN "role" SET NOT NULL;
