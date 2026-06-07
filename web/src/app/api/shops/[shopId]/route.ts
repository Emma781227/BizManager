import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { resolveShop } from "@/lib/shop";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

const patchSchema = z.object({
  name:        z.string().min(2).optional(),
  description: z.string().max(500).optional(),
  city:        z.string().max(100).optional(),
  isPublished: z.boolean().optional(),
  status:      z.enum(["active", "inactive", "suspended", "closed"]).optional(),
}).strict();

// GET /api/shops/[shopId] → détail boutique + comptages
export async function GET(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

    const { shopId } = await params;
    const resolved = await resolveShop(session.userId, shopId);
    if (!resolved) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: { _count: { select: { products: true, orders: true, customers: true } } },
    });
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

    return NextResponse.json({ data: shop });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/shops/[shopId] → mise à jour partielle
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

    const { shopId } = await params;
    const resolved = await resolveShop(session.userId, shopId);
    if (!resolved) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

    if (!hasPermission(resolved._staffRole, "canManageShops")) {
      return NextResponse.json({ error: "Accès refusé — droits insuffisants" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const result = patchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message ?? "Payload invalide" }, { status: 400 });
    }

    const shop = await prisma.shop.update({ where: { id: shopId }, data: result.data });
    return NextResponse.json({ data: shop });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/shops/[shopId] → supprime une boutique
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

    const { shopId } = await params;
    const resolved = await resolveShop(session.userId, shopId);
    if (!resolved) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

    if (!hasPermission(resolved._staffRole, "canDeleteShop")) {
      return NextResponse.json({ error: "Accès refusé — droits insuffisants" }, { status: 403 });
    }

    // Empêcher la suppression si c'est la seule boutique
    const total = await prisma.shop.count({ where: { userId: resolved._ownerUserId } });
    if (total <= 1) {
      return NextResponse.json({ error: "Impossible de supprimer la dernière boutique" }, { status: 400 });
    }

    await prisma.shop.delete({ where: { id: shopId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur serveur" }, { status: 500 });
  }
}
