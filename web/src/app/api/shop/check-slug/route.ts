import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("slug") ?? "";
  const slug = raw
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug || slug.length < 3) {
    return NextResponse.json({ available: false, slug, reason: "Slug trop court (minimum 3 caractères)" });
  }
  if (slug.length > 63) {
    return NextResponse.json({ available: false, slug, reason: "Slug trop long (maximum 63 caractères)" });
  }

  const existing = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
  return NextResponse.json({ available: !existing, slug });
}
