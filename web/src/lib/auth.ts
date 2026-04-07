import { SignJWT, jwtVerify } from "jose";
import type { NextRequest, NextResponse } from "next/server";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");

export const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionPayload = {
  userId: string;
  email: string;
  role?: "merchant" | "admin";
};

const defaultAdminEmails = ["merchant@test.local"];

function getAdminEmails() {
  const raw = process.env.PLATFORM_ADMIN_EMAILS ?? "";
  const fromEnv = raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return fromEnv.length > 0 ? fromEnv : defaultAdminEmails;
}

export function isPlatformAdmin(session: SessionPayload | null) {
  if (!session) {
    return false;
  }

  if (session.role === "admin") {
    return true;
  }

  return getAdminEmails().includes(session.email.toLowerCase());
}

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as SessionPayload;
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}

export async function getSessionFromCookieStore(cookieStore: CookieReader) {
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}
