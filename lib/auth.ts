import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { COOKIE } from "@/lib/constants";

export { COOKIE };

const secret = () =>
  new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret");

export async function hashPassword(p: string) {
  return bcrypt.hash(p, 10);
}

export async function verifyPassword(p: string, hash: string) {
  try {
    return await bcrypt.compare(p, hash);
  } catch {
    return false;
  }
}

export async function signToken(payload: JWTPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret());
}

export function passwordRules(p: string): string | null {
  if (!p || p.length < 8) return "Password minimal 8 karakter.";
  if (!/[A-Z]/.test(p)) return "Password harus mengandung huruf besar.";
  if (!/[a-z]/.test(p)) return "Password harus mengandung huruf kecil.";
  if (!/[0-9]/.test(p)) return "Password harus mengandung angka.";
  if (!/[^A-Za-z0-9]/.test(p)) return "Password harus mengandung simbol.";
  return null;
}
