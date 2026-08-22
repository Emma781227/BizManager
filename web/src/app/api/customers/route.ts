import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { customerSchema } from "@/lib/validators";
import { resolveShop } from "@/lib/shop";
import { hasPermission } from "@/lib/permissions";

// GET /api/customers?shopId=xxx&q=...
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const shopId = request.nextUrl.searchParams.get("shopId")?.trim();
  const shop   = await resolveShop(session.userId, shopId);
  if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

  const search = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  const customers = await prisma.customer.findMany({
    where: {
      shopId: shop.id,
      ...(search ? { OR: [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone:    { contains: search, mode: "insensitive" } },
        { email:    { contains: search, mode: "insensitive" } },
      ]} : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: customers });
}

// POST /api/customers
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const shopId = request.nextUrl.searchParams.get("shopId")?.trim();
  const shop   = await resolveShop(session.userId, shopId);
  if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

  if (!hasPermission(shop._staffRole, "canManageCustomers")) {
    return NextResponse.json({ error: "Accès refusé : droits insuffisants" }, { status: 403 });
  }

  const body   = await request.json().catch(() => null);
  const result = customerSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: "Payload invalide" }, { status: 400 });

  const customer = await prisma.customer.create({
    data: {
      shopId:   shop.id,
      fullName: result.data.fullName.trim(),
      phone:    result.data.phone.trim(),
      email:    result.data.email?.trim()   || null,
      address:  result.data.address?.trim() || null,
      notes:    result.data.notes?.trim()   || null,
    },
  });

  return NextResponse.json({ data: customer }, { status: 201 });
}
