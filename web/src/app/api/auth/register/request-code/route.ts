import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerRequestCodeSchema } from "@/lib/validators";
import { sendVerificationCodeEmail } from "@/lib/mailer";

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = registerRequestCodeSchema.safeParse(body);

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Payload invalide";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const email = result.data.email.toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return NextResponse.json({ error: "Email deja utilise" }, { status: 409 });
  }

  const code = generateCode();
  const passwordHash = await bcrypt.hash(result.data.password, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  try {
    await prisma.pendingRegistration.upsert({
      where: { email },
      update: {
        fullName: result.data.fullName.trim(),
        passwordHash,
        code,
        expiresAt,
      },
      create: {
        email,
        fullName: result.data.fullName.trim(),
        passwordHash,
        code,
        expiresAt,
      },
    });

    await sendVerificationCodeEmail(email, code);
  } catch (error) {
    console.error("Email verification error:", {
      email,
      error,
    });

    await prisma.pendingRegistration.deleteMany({ where: { email } }).catch(() => null);

    return NextResponse.json(
      { error: "Impossible d'envoyer le code. Verifiez la configuration email." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: { message: "Code envoye. Verifiez votre boite email." },
  });
}
