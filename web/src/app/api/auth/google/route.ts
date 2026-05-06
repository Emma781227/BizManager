import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSession, setSessionCookie } from "@/lib/auth";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const id_token = body?.id_token;

  if (!id_token) {
    return NextResponse.json({ error: "Missing id_token" }, { status: 400 });
  }

  try {
    const ticket = await client.verifyIdToken({ idToken: id_token, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    const email = payload?.email?.toLowerCase();
    if (!email) return NextResponse.json({ error: "No email in token" }, { status: 400 });

    const name = payload?.name ?? "";
    const picture = payload?.picture ?? null;

    // find or create user - schema requires passwordHash and fullName
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const randomPwd = (Math.random() + 1).toString(36).slice(2);
      const passwordHash = await bcrypt.hash(randomPwd, 10);
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName: name || email.split("@")[0],
        },
      });
    } else {
      // update name/avatar if missing
      const updates: any = {};
      if (!user.fullName && name) updates.fullName = name;
      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({ where: { id: user.id }, data: updates });
      }
    }

    const token = await signSession({ userId: user.id, email: user.email, role: user.role });
    const response = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, fullName: user.fullName } }, { status: 200 });
    setSessionCookie(response, token);
    return response;
  } catch (err) {
    console.error("/api/auth/google error:", err);
    return NextResponse.json({ error: "Token verification failed" }, { status: 401 });
  }
}
