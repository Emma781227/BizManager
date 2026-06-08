import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSession, setSessionCookie } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";

// GET /api/auth/accept-invitation?token=xxx
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
    include: { owner: { select: { fullName: true, email: true } } },
  });

  if (!invitation) return NextResponse.json({ error: "Invitation invalide" }, { status: 404 });
  if (invitation.status !== "pending") {
    return NextResponse.json(
      { error: "Cette invitation a déjà été utilisée ou annulée", status: invitation.status },
      { status: 410 },
    );
  }
  if (invitation.expiresAt < new Date()) {
    await prisma.teamInvitation.update({ where: { token }, data: { status: "expired" } });
    return NextResponse.json({ error: "Cette invitation a expiré", status: "expired" }, { status: 410 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: invitation.email },
    select: { id: true, fullName: true },
  });

  const shops = await prisma.shop.findMany({
    where: { id: { in: invitation.shopIds }, userId: invitation.ownerUserId },
    select: { id: true, name: true },
  });

  return NextResponse.json({
    invitation: {
      id:        invitation.id,
      email:     invitation.email,
      role:      invitation.role,
      expiresAt: invitation.expiresAt,
      shops,
      ownerName: invitation.owner.fullName,
    },
    userExists: !!existingUser,
  });
}

// POST /api/auth/accept-invitation
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    token:     string;
    password?: string;
    fullName?: string;
  } | null;

  if (!body?.token) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

  const invitation = await prisma.teamInvitation.findUnique({
    where: { token: body.token },
  });
  if (!invitation)                       return NextResponse.json({ error: "Invitation invalide" }, { status: 404 });
  if (invitation.status !== "pending")   return NextResponse.json({ error: "Invitation déjà utilisée ou annulée" }, { status: 410 });
  if (invitation.expiresAt < new Date()) {
    await prisma.teamInvitation.update({ where: { token: body.token }, data: { status: "expired" } });
    return NextResponse.json({ error: "Invitation expirée" }, { status: 410 });
  }

  let user = await prisma.user.findUnique({ where: { email: invitation.email } });

  if (!user) {
    if (!body.fullName?.trim()) return NextResponse.json({ error: "Nom complet requis" }, { status: 400 });
    if (!body.password || body.password.length < 8) {
      return NextResponse.json({ error: "Mot de passe requis (min. 8 caractères)" }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    user = await prisma.user.create({
      data: {
        email:        invitation.email,
        fullName:     body.fullName.trim(),
        passwordHash,
        role:         "merchant",
      },
    });
  }

  // Créer ou réactiver le membership
  const resolvedUser = user;
  await prisma.$transaction(async (tx) => {
    const existing = await tx.teamMembership.findFirst({
      where: { userId: resolvedUser.id, ownerUserId: invitation.ownerUserId },
    });

    let membershipId: string;

    if (existing) {
      await tx.teamMembership.update({
        where: { id: existing.id },
        data:  { role: invitation.role, status: "active" },
      });
      await tx.teamMembershipShop.deleteMany({ where: { membershipId: existing.id } });
      membershipId = existing.id;
    } else {
      const created = await tx.teamMembership.create({
        data: {
          userId:      resolvedUser.id,
          ownerUserId: invitation.ownerUserId,
          role:        invitation.role,
          status:      "active",
          invitedBy:   invitation.invitedBy,
        },
      });
      membershipId = created.id;
    }

    if (invitation.shopIds.length > 0) {
      await tx.teamMembershipShop.createMany({
        data: invitation.shopIds.map(shopId => ({ membershipId, shopId })),
        skipDuplicates: true,
      });
    }

    await tx.teamInvitation.update({
      where: { token: body.token },
      data:  { status: "accepted" },
    });
  });

  await logAudit({
    actorUserId: resolvedUser.id,
    ownerUserId: invitation.ownerUserId,
    action:      "team.invitation_accepted",
    entityType:  "team_invitation",
    entityId:    invitation.id,
  });

  const sessionToken = await signSession({ userId: resolvedUser.id, email: resolvedUser.email, role: "merchant", sessionVersion: resolvedUser.sessionVersion });
  const response = NextResponse.json({ success: true, redirectTo: "/dashboard" });
  setSessionCookie(response, sessionToken);
  return response;
}
