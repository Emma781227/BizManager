import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const logs = await prisma.auditLog.findMany({
    where: {
      ownerUserId: session.userId,
      action: { startsWith: "team." },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // Résoudre les noms des acteurs en une seule requête
  const actorIds = [...new Set(logs.map(l => l.actorUserId))];
  const actors = await prisma.user.findMany({
    where:  { id: { in: actorIds } },
    select: { id: true, fullName: true },
  });
  const actorMap = Object.fromEntries(actors.map(a => [a.id, a.fullName]));

  return NextResponse.json({
    activity: logs.map(l => ({
      id:          l.id,
      action:      l.action,
      actorUserId: l.actorUserId,
      actorName:   actorMap[l.actorUserId] ?? "Utilisateur inconnu",
      entityId:    l.entityId,
      metadata:    l.metadata,
      createdAt:   l.createdAt,
    })),
  });
}
