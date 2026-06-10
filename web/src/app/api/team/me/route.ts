import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

// Retourne le membership actif de l'utilisateur connecté (null si propriétaire ou non-membre)
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ membership: null }, { status: 401 });

  const membership = await prisma.teamMembership.findFirst({
    where:   { userId: session.userId, status: "active" },
    include: {
      shopAccess: { include: { shop: { select: { id: true, name: true } } } },
    },
  });

  if (!membership) return NextResponse.json({ membership: null });

  const owner = await prisma.user.findUnique({
    where:  { id: membership.ownerUserId },
    select: { fullName: true },
  });

  return NextResponse.json({
    membership: {
      role:      membership.role,
      ownerName: owner?.fullName ?? "votre responsable",
      shops:     membership.shopAccess.map(sa => sa.shop),
    },
  });
}
