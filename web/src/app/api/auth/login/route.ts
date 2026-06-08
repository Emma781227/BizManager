import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";
import { setSessionCookie, signSession } from "@/lib/auth";
import { ensureUserSubscription } from "@/lib/subscription";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = loginSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }
  //const { email, password, rememberMe } = await req.json();
  const email = result.data.email.toLowerCase().trim();

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Can't reach database server")) {
      return NextResponse.json(
        { error: "Base de données indisponible. Lancez PostgreSQL puis réessayez." },
        { status: 503 },
      );
    }

    throw error;
  }

  if (!user) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  const passwordOk = await bcrypt.compare(result.data.password, user.passwordHash);
  if (!passwordOk) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  await ensureUserSubscription(user.id);

  const token = await signSession({ userId: user.id, email: user.email, role: user.role, sessionVersion: user.sessionVersion });
  const response = NextResponse.json(
    {
      data: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    },
    { status: 200 },
  );
  setSessionCookie(response, token);

  return response;
}
