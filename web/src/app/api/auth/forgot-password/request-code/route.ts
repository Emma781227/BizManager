import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordRequestSchema } from "@/lib/validators";
import { sendPasswordResetCodeEmail } from "@/lib/mailer";

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = forgotPasswordRequestSchema.safeParse(body);

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Payload invalide";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const email = result.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  // Reponse neutre pour ne pas divulguer l'existence d'un compte.
  const successResponse = NextResponse.json({
    data: { message: "Si cet email existe, un code a ete envoye." },
  });

  if (!user) {
    return successResponse;
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.pendingPasswordReset.upsert({
    where: { email },
    update: { code, expiresAt },
    create: { email, code, expiresAt },
  });

  try {
    await sendPasswordResetCodeEmail(email, code);
  } catch (error) {
    console.error("Password reset email error:", error);
    return NextResponse.json(
      { error: "Impossible d'envoyer le code. Verifiez la configuration email." },
      { status: 500 },
    );
  }

  return successResponse;
}
