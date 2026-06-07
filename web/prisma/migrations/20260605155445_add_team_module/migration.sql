-- CreateEnum
CREATE TYPE "public"."StaffRole" AS ENUM ('owner', 'manager', 'staff');

-- CreateEnum
CREATE TYPE "public"."MembershipStatus" AS ENUM ('invited', 'active', 'suspended', 'revoked');

-- CreateEnum
CREATE TYPE "public"."InvitationStatus" AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- AlterTable
ALTER TABLE "public"."Plan" ADD COLUMN     "maxTeamMembers" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."TeamMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "role" "public"."StaffRole" NOT NULL DEFAULT 'staff',
    "status" "public"."MembershipStatus" NOT NULL DEFAULT 'active',
    "invitedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamMembershipShop" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMembershipShop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "public"."StaffRole" NOT NULL DEFAULT 'staff',
    "ownerUserId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "public"."InvitationStatus" NOT NULL DEFAULT 'pending',
    "shopIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "shopId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamMembership_ownerUserId_idx" ON "public"."TeamMembership"("ownerUserId");

-- CreateIndex
CREATE INDEX "TeamMembership_userId_idx" ON "public"."TeamMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembership_userId_ownerUserId_key" ON "public"."TeamMembership"("userId", "ownerUserId");

-- CreateIndex
CREATE INDEX "TeamMembershipShop_membershipId_idx" ON "public"."TeamMembershipShop"("membershipId");

-- CreateIndex
CREATE INDEX "TeamMembershipShop_shopId_idx" ON "public"."TeamMembershipShop"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMembershipShop_membershipId_shopId_key" ON "public"."TeamMembershipShop"("membershipId", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitation_token_key" ON "public"."TeamInvitation"("token");

-- CreateIndex
CREATE INDEX "TeamInvitation_ownerUserId_idx" ON "public"."TeamInvitation"("ownerUserId");

-- CreateIndex
CREATE INDEX "TeamInvitation_email_ownerUserId_idx" ON "public"."TeamInvitation"("email", "ownerUserId");

-- CreateIndex
CREATE INDEX "TeamInvitation_expiresAt_idx" ON "public"."TeamInvitation"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "public"."AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_ownerUserId_createdAt_idx" ON "public"."AuditLog"("ownerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_shopId_idx" ON "public"."AuditLog"("shopId");

-- AddForeignKey
ALTER TABLE "public"."TeamMembership" ADD CONSTRAINT "TeamMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMembership" ADD CONSTRAINT "TeamMembership_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMembershipShop" ADD CONSTRAINT "TeamMembershipShop_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "public"."TeamMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMembershipShop" ADD CONSTRAINT "TeamMembershipShop_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamInvitation" ADD CONSTRAINT "TeamInvitation_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
