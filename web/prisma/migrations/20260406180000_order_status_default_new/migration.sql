-- Set default after enum values are already committed in a previous migration.
ALTER TABLE "public"."Order"
    ALTER COLUMN "status" SET DEFAULT 'new';