import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { checkTeamQuota } from "@/lib/shop";
import { logAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/permissions";
import { randomBytes } from "crypto";

const ALLOWED_ROLES = ["manager", "staff"] as const;
type InviteRole = (typeof ALLOWED_ROLES)[number];

// GET /api/team — liste membres + invitations pending
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const [memberships, invitations] = await Promise.all([
    prisma.teamMembership.findMany({
      where: { ownerUserId: session.userId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        shopAccess: {
          include: { shop: { select: { id: true, name: true, slug: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.teamInvitation.findMany({
      where: { ownerUserId: session.userId, status: "pending" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ members: memberships, invitations });
}

// POST /api/team — inviter un collaborateur
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Vérifier que l'appelant est bien owner (pas un staff qui essaierait d'inviter)
  const callerMembership = await prisma.teamMembership.findFirst({
    where: { userId: session.userId },
  });
  if (callerMembership && !hasPermission(callerMembership.role, "canInviteTeamMembers")) {
    return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 });
  }

  const quotaError = await checkTeamQuota(session.userId);
  if (quotaError) return NextResponse.json({ error: quotaError }, { status: 403 });

  const body = await request.json().catch(() => null) as {
    email?: string;
    role?: string;
    shopIds?: string[];
  } | null;

  if (!body?.email?.trim()) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }
  if (!body.role || !(ALLOWED_ROLES as readonly string[]).includes(body.role)) {
    return NextResponse.json({ error: "Rôle invalide (manager ou staff)" }, { status: 400 });
  }
  if (!Array.isArray(body.shopIds) || body.shopIds.length === 0) {
    return NextResponse.json({ error: "Sélectionnez au moins une boutique" }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const role  = body.role as InviteRole;

  // Vérifier que les boutiques appartiennent à l'owner
  const shops = await prisma.shop.findMany({
    where: { id: { in: body.shopIds }, userId: session.userId },
    select: { id: true },
  });
  if (shops.length !== body.shopIds.length) {
    return NextResponse.json({ error: "Une ou plusieurs boutiques invalides" }, { status: 400 });
  }

  // Vérifier doublon d'invitation active
  const existingInvitation = await prisma.teamInvitation.findFirst({
    where: { email, ownerUserId: session.userId, status: "pending" },
  });
  if (existingInvitation) {
    return NextResponse.json({ error: "Une invitation est déjà en attente pour cet email" }, { status: 409 });
  }

  // Vérifier membership actif existant
  const invitedUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (invitedUser) {
    const existingMembership = await prisma.teamMembership.findFirst({
      where: { userId: invitedUser.id, ownerUserId: session.userId, status: { in: ["active", "suspended"] } },
    });
    if (existingMembership) {
      return NextResponse.json({ error: "Cet utilisateur est déjà membre de votre équipe" }, { status: 409 });
    }
  }

  const token     = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

  const invitation = await prisma.teamInvitation.create({
    data: {
      email,
      role,
      ownerUserId: session.userId,
      token,
      shopIds:    body.shopIds,
      expiresAt,
      invitedBy:  session.userId,
    },
  });

  // Envoyer l'email d'invitation
  const owner = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true, email: true },
  });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://bizmanager.app";

  try {
    const { sendTeamInvitationEmail } = await import("@/lib/mailer");
    await sendTeamInvitationEmail({
      to:           email,
      ownerName:    owner?.fullName ?? "Un marchand",
      role,
      inviteUrl:    `${appUrl}/accept-invitation?token=${token}`,
      expiresAt,
    });
  } catch {
    // L'invitation est créée même si l'email échoue
  }

  await logAudit({
    actorUserId: session.userId,
    ownerUserId: session.userId,
    action:      "team.invite",
    entityType:  "team_invitation",
    entityId:    invitation.id,
    metadata:    { email, role, shopIds: body.shopIds },
  });

  return NextResponse.json({ data: invitation }, { status: 201 });
}
