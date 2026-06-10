import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const entityType = searchParams.get("entityType");
  const entityId   = searchParams.get("entityId");

  if (!entityType || !entityId) {
    return NextResponse.json({ error: "entityType et entityId requis" }, { status: 400 });
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      ownerUserId: session.userId,
      entityType,
      entityId,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (logs.length === 0) return NextResponse.json({ entries: [] });

  const actorIds = [...new Set(logs.map(l => l.actorUserId))];
  const actors   = await prisma.user.findMany({
    where:  { id: { in: actorIds } },
    select: { id: true, fullName: true },
  });
  const actorMap = Object.fromEntries(actors.map(a => [a.id, a.fullName]));

  return NextResponse.json({
    entries: logs.map(l => ({
      id:        l.id,
      actorName: actorMap[l.actorUserId] ?? "Inconnu",
      action:    l.action,
      createdAt: l.createdAt,
    })),
  });
}
