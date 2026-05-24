import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerVerifySchema } from "@/lib/validators";
import { setSessionCookie, signSession } from "@/lib/auth";
import { resolvePlan } from "@/lib/subscription";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = registerVerifySchema.safeParse(body);

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Payload invalide";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const email = result.data.email.toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email } });

  if (exists) {
    return NextResponse.json({ error: "Email deja utilise" }, { status: 409 });
  }

  const pending = await prisma.pendingRegistration.findUnique({ where: { email } });
  if (!pending) {
    return NextResponse.json(
      { error: "Code introuvable. Demandez un nouveau code." },
      { status: 400 },
    );
  }

  if (pending.expiresAt.getTime() < Date.now()) {
    await prisma.pendingRegistration.delete({ where: { email } });
    return NextResponse.json({ error: "Code expire. Demandez un nouveau code." }, { status: 400 });
  }

  if (pending.code !== result.data.code) {
    return NextResponse.json({ error: "Code de verification invalide" }, { status: 400 });
  }

  const passwordOk = await bcrypt.compare(result.data.password, pending.passwordHash);
  if (!passwordOk || pending.fullName !== result.data.fullName.trim()) {
    return NextResponse.json(
      { error: "Les informations ont change. Demandez un nouveau code." },
      { status: 400 },
    );
  }

  const planName = result.data.plan ?? "starter";
  const isPaidPlan = planName === "business" || planName === "premium";

  // Pour les plans payants, on crée le compte sans subscription active.
  // La subscription sera activée par le webhook GeniusPay après paiement.
  // Pour le plan starter (gratuit), activation immédiate.
  let userData: Parameters<typeof prisma.user.create>[0]["data"];

  if (isPaidPlan) {
    userData = {
      fullName: pending.fullName,
      email,
      passwordHash: pending.passwordHash,
      role: "merchant",
    };
  } else {
    const plan = await resolvePlan(planName);
    userData = {
      fullName: pending.fullName,
      email,
      passwordHash: pending.passwordHash,
      role: "merchant",
      subscription: {
        create: { planId: plan.id, status: "active" },
      },
    };
  }

  const user = await prisma.user.create({
    data: userData,
    select: { id: true, email: true, fullName: true, role: true },
  });

  await prisma.pendingRegistration.delete({ where: { email } });

  const token = await signSession({ userId: user.id, email: user.email, role: user.role });
  const response = NextResponse.json({ data: user }, { status: 201 });
  setSessionCookie(response, token);

  return response;
}
