import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { createHash, randomBytes } from "crypto";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ invitationId: string }> }) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { invitationId } = await params;
  const body = await request.json().catch(() => ({})) as { action?: string };

  const invitation = await prisma.teamInvitation.findFirst({
    where: { id: invitationId, ownerUserId: session.userId },
  });
  if (!invitation) return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });

  if (body.action === "cancel") {
    if (invitation.status !== "pending") {
      return NextResponse.json({ error: "Seules les invitations en attente peuvent être annulées" }, { status: 400 });
    }
    const updated = await prisma.teamInvitation.update({
      where: { id: invitationId },
      data:  { status: "cancelled" },
    });
    return NextResponse.json({ data: updated });
  }

  if (body.action === "resend") {
    if (invitation.status !== "pending") {
      return NextResponse.json({ error: "Seules les invitations en attente peuvent être renvoyées" }, { status: 400 });
    }
    const rawToken  = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const updated   = await prisma.teamInvitation.update({
      where: { id: invitationId },
      data:  { token: hashToken(rawToken), expiresAt },
    });
    const owner  = await prisma.user.findUnique({ where: { id: session.userId }, select: { fullName: true } });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://bizmanager.app";
    try {
      const { sendTeamInvitationEmail } = await import("@/lib/mailer");
      await sendTeamInvitationEmail({
        to:        invitation.email,
        ownerName: owner?.fullName ?? "Un marchand",
        role:      invitation.role,
        inviteUrl: `${appUrl}/accept-invitation?token=${rawToken}`,
        expiresAt,
      });
    } catch { /* email non bloquant */ }
    return NextResponse.json({ data: updated });
  }

  return NextResponse.json({ error: "Action invalide (cancel ou resend)" }, { status: 400 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ invitationId: string }> }) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { invitationId } = await params;

  const invitation = await prisma.teamInvitation.findFirst({
    where: { id: invitationId, ownerUserId: session.userId, status: { in: ["cancelled", "expired", "accepted"] } },
  });
  if (!invitation) return NextResponse.json({ error: "Invitation introuvable ou non supprimable" }, { status: 404 });

  await prisma.teamInvitation.delete({ where: { id: invitationId } });
  return NextResponse.json({ success: true });
}
