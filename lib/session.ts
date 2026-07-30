import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { COOKIE } from "@/lib/constants";
import { normalizeRole, type Role } from "@/lib/rbac";
import * as sheets from "@/lib/sheets";

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret");

// akses defensif: tidak gagal build walau sheets.ts tak mengekspor findWebUser
const findUser = (sheets as any).findWebUser as ((email: string) => Promise<any>) | undefined;

export interface Session {
  sub?: string;
  email?: string;
  role: Role;
}

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
    return null;
  }

  const email = typeof payload?.email === "string" ? payload.email : undefined;
  const sub = typeof payload?.sub === "string" ? payload.sub : undefined;
  let roleRaw: string | undefined = typeof payload?.role === "string" ? payload.role : undefined;

  // peran terkini dari sheet (sumber kebenaran) bila tersedia; fallback ke klaim token
  if (email && typeof findUser === "function") {
    try {
      const u = await findUser(email);
      if (u && typeof u.Role === "string") roleRaw = u.Role;
    } catch {
      /* abaikan -> pakai klaim token */
    }
  }

  return { sub, email, role: normalizeRole(roleRaw) };
}
