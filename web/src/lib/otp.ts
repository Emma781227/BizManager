import crypto from "crypto";

const OTP_SECRET = process.env.OTP_SECRET ?? "bizmanager-otp-default-secret-change-in-prod";

export const OTP_EXPIRY_MINUTES = 30;
export const OTP_MAX_ATTEMPTS   = 5;

export function generateOtpCode(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

export function hashOtpCode(code: string, orderId: string): string {
  return crypto
    .createHmac("sha256", OTP_SECRET)
    .update(`${code}:${orderId}`)
    .digest("hex");
}

export function verifyOtpCode(
  code: string,
  orderId: string,
  storedHash: string,
): boolean {
  const expected = hashOtpCode(code, orderId);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(storedHash, "hex"),
    );
  } catch {
    return false;
  }
}

export function otpExpiresAt(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + OTP_EXPIRY_MINUTES);
  return d;
}

export function maskPhone(phone: string): string {
  const clean = phone.replace(/\s/g, "");
  if (clean.length < 4) return phone;
  return clean.slice(0, -4).replace(/\d/g, "*") + clean.slice(-4);
}
