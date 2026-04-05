import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";
import { setSessionCookie, signSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = loginSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  const email = result.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  const passwordOk = await bcrypt.compare(result.data.password, user.passwordHash);
  if (!passwordOk) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  const token = await signSession({ userId: user.id, email: user.email });
  const response = NextResponse.json(
    {
      data: { id: user.id, email: user.email, fullName: user.fullName },
    },
    { status: 200 },
  );
  setSessionCookie(response, token);

  return response;
}
