import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { COOKIE } from "@/lib/constants";
import { normalizeRole, type Role } from "@/lib/rbac";
import { findWebUser } from "@/lib/sheets";

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret");

export interface Session {
  sub?: string;
  email?: string;
  role: Role;
}

// Verifikasi token + ambil peran TERKINI dari sheet (sumber kebenaran).
// Node-only (memanggil Google Sheets). Bila token tak punya email, pakai
// klaim role di token sebagai fallback (tetap berfungsi, hanya tak "live").
export async function readSessionNode(): Promise<Session | null> {
  let token: string | undefined;
  try {
    token = (await cookies()).get(COOKIE)?.value;
  } catch {
    return null;
  }
  if (!token) return null;

  let payload: any;
  try {
    const { payload: p } = await jwtVerify(token, secret());
    payload = p;
  } catch {
    return null; // token tidak valid / kedaluwarsa
  }

  const email = typeof payload?.email === "string" ? payload.email : undefined;
  const sub = typeof payload?.sub === "string" ? payload.sub : undefined;
  let roleRaw: string | undefined = typeof payload?.role === "string" ? payload.role : undefined;

  if (email) {
    try {
      const u = await findWebUser(email);
      if (u && (u as any).Role !== undefined && (u as any).Role !== null) {
        roleRaw = (u as any).Role as string; // peran terkini menang
      }
    } catch {
      /* sheet gagal -> pakai klaim token */
    }
  }

  return { sub, email, role: normalizeRole(roleRaw) };
}
