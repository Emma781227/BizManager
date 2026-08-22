import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSession, setSessionCookie } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

// 10 tentatives / 15 min par IP - protège GET (reconnaissance) et POST (acceptation)
const RL_MAX = 3;
const RL_WINDOW = 15 * 60 * 1000;

function applyRateLimit(request: NextRequest): NextResponse | null {
  const ip  = getClientIp(request);
  const res = checkRateLimit(`accept-invitation:${ip}`, RL_MAX, RL_WINDOW);
  if (!res.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      {
        status: 429,
        headers: { "Retry-After": String(res.retryAfter) },
      },
    );
  }
  return null;
}

// GET /api/auth/accept-invitation?token=xxx
export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request);
  if (limited) return limited;

  const rawToken = request.nextUrl.searchParams.get("token")?.trim();
  if (!rawToken) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

  const tokenHash = hashToken(rawToken);
  const invitation = await prisma.teamInvitation.findUnique({
    where: { token: tokenHash },
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
    await prisma.teamInvitation.update({ where: { token: tokenHash }, data: { status: "expired" } });
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
  const limited = applyRateLimit(request);
  if (limited) return limited;

  const body = await request.json().catch(() => null) as {
    token:     string;
    password?: string;
    fullName?: string;
  } | null;

  if (!body?.token) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

  const tokenHash = hashToken(body.token);
  const invitation = await prisma.teamInvitation.findUnique({
    where: { token: tokenHash },
  });
  if (!invitation)                       return NextResponse.json({ error: "Invitation invalide" }, { status: 404 });
  if (invitation.status !== "pending")   return NextResponse.json({ error: "Invitation déjà utilisée ou annulée" }, { status: 410 });
  if (invitation.expiresAt < new Date()) {
    await prisma.teamInvitation.update({ where: { token: tokenHash }, data: { status: "expired" } });
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
      where: { token: tokenHash },
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

  // Notifier le propriétaire - non bloquant
  try {
    const owner = await prisma.user.findUnique({
      where:  { id: invitation.ownerUserId },
      select: { email: true },
    });
    if (owner) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://bizmanager.app";
      const { sendTeamMemberJoinedEmail } = await import("@/lib/mailer");
      await sendTeamMemberJoinedEmail({
        to:          owner.email,
        memberName:  resolvedUser.fullName,
        memberEmail: resolvedUser.email,
        role:        invitation.role,
        teamPageUrl: `${appUrl}/team`,
      });
    }
  } catch { /* notification non bloquante */ }

  const sessionToken = await signSession({ userId: resolvedUser.id, email: resolvedUser.email, role: "merchant", sessionVersion: resolvedUser.sessionVersion });
  const response = NextResponse.json({ success: true, redirectTo: "/dashboard" });
  setSessionCookie(response, sessionToken);
  return response;
}
