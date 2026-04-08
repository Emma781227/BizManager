-- CreateTable
CREATE TABLE IF NOT EXISTS "PendingPasswordReset" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingPasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PendingPasswordReset_email_key" ON "PendingPasswordReset"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PendingPasswordReset_expiresAt_idx" ON "PendingPasswordReset"("expiresAt");
