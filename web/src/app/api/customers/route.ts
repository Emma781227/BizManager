import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { customerSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  const customers = await prisma.customer.findMany({
    where: {
      userId: session.userId,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: customers });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const result = customerSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const customer = await prisma.customer.create({
    data: {
      userId: session.userId,
      fullName: result.data.fullName.trim(),
      phone: result.data.phone.trim(),
      email: result.data.email?.trim() || null,
      address: result.data.address?.trim() || null,
      notes: result.data.notes?.trim() || null,
    },
  });

  return NextResponse.json({ data: customer }, { status: 201 });
}
