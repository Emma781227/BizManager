import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordResetSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const result = forgotPasswordResetSchema.safeParse(body);

    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Payload invalide";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const email = result.data.email.toLowerCase().trim();
    const pending = await prisma.pendingPasswordReset.findUnique({ where: { email } });

    if (!pending) {
      return NextResponse.json({ error: "Code introuvable. Demandez un nouveau code." }, { status: 400 });
    }

    if (pending.expiresAt.getTime() < Date.now()) {
      await prisma.pendingPasswordReset.delete({ where: { email } });
      return NextResponse.json({ error: "Code expire. Demandez un nouveau code." }, { status: 400 });
    }

    if (pending.code !== result.data.code) {
      return NextResponse.json({ error: "Code invalide" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(result.data.newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({ where: { email }, data: { passwordHash } }),
      prisma.pendingPasswordReset.delete({ where: { email } }),
    ]);

    return NextResponse.json({ data: { message: "Mot de passe reinitialise avec succes." } });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Impossible de reinitialiser le mot de passe." },
      { status: 500 },
    );
  }
}
