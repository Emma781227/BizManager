import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { setSessionCookie, signSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = registerSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const email = result.data.email.toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email } });

  if (exists) {
    return NextResponse.json({ error: "Email deja utilise" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(result.data.password, 10);
  const user = await prisma.user.create({
    data: {
      fullName: result.data.fullName.trim(),
      email,
      passwordHash,
      role: "merchant",
    },
    select: { id: true, email: true, fullName: true, role: true },
  });

  const token = await signSession({ userId: user.id, email: user.email, role: user.role });
  const response = NextResponse.json({ data: user }, { status: 201 });
  setSessionCookie(response, token);

  return response;
}
