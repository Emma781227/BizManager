import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const ALLOWED_ROLES    = ["manager", "staff"] as const;
const ALLOWED_STATUSES = ["active", "suspended", "revoked"] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { memberId } = await params;

  const membership = await prisma.teamMembership.findFirst({
    where: { id: memberId, ownerUserId: session.userId },
  });
  if (!membership) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

  const body = await request.json().catch(() => ({})) as {
    role?:    string;
    shopIds?: string[];
    status?:  string;
  };

  const updateData: Record<string, unknown> = {};

  if (body.role !== undefined) {
    if (!(ALLOWED_ROLES as readonly string[]).includes(body.role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }
    updateData.role = body.role;
  }

  if (body.status !== undefined) {
    if (!(ALLOWED_STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    updateData.status = body.status;
  }

  // Mise à jour des boutiques si fourni
  if (Array.isArray(body.shopIds)) {
    if (body.shopIds.length === 0) {
      return NextResponse.json({ error: "Sélectionnez au moins une boutique" }, { status: 400 });
    }
    const shops = await prisma.shop.findMany({
      where: { id: { in: body.shopIds }, userId: session.userId },
      select: { id: true },
    });
    if (shops.length !== body.shopIds.length) {
      return NextResponse.json({ error: "Une ou plusieurs boutiques invalides" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.teamMembershipShop.deleteMany({ where: { membershipId: memberId } }),
      prisma.teamMembershipShop.createMany({
        data: body.shopIds.map(shopId => ({ membershipId: memberId, shopId })),
      }),
    ]);
  }

  const updated = await prisma.teamMembership.update({
    where: { id: memberId },
    data: updateData,
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      shopAccess: { include: { shop: { select: { id: true, name: true } } } },
    },
  });

  await logAudit({
    actorUserId: session.userId,
    ownerUserId: session.userId,
    action:      "team.update",
    entityType:  "team_membership",
    entityId:    memberId,
    metadata:    { changes: body },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { memberId } = await params;

  const membership = await prisma.teamMembership.findFirst({
    where: { id: memberId, ownerUserId: session.userId },
    select: { id: true, userId: true },
  });
  if (!membership) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

  await prisma.teamMembership.update({
    where: { id: memberId },
    data:  { status: "revoked" },
  });

  await logAudit({
    actorUserId: session.userId,
    ownerUserId: session.userId,
    action:      "team.revoke",
    entityType:  "team_membership",
    entityId:    memberId,
    metadata:    { revokedUserId: membership.userId },
  });

  return NextResponse.json({ success: true });
}
