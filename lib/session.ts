import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { COOKIE } from "@/lib/constants";
import { normalizeRole, normalizeSchool, scopeForRole, type Role, type DataScope, type School } from "@/lib/rbac";
import * as sheets from "@/lib/sheets";

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret");
const findUser = (sheets as any).findWebUser as ((email: string) => Promise<any>) | undefined;

export interface Session {
  sub?: string;
  email?: string;
  role: Role;
  scope: DataScope;
  school: School; // TK/SD/SMP/SMA/all
  classes: string[];
}

export function parseClasses(raw: unknown): string[] {
  return (raw ?? "")
    .toString()
    .split(/[,;|\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
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
  let schoolRaw: unknown = undefined;
  let classesRaw: unknown = undefined;

  if (email && typeof findUser === "function") {
    try {
      const u = await findUser(email);
      if (u) {
        if (typeof u.Role === "string") roleRaw = u.Role;
        schoolRaw = (u as any).School;
        classesRaw = (u as any).Classes;
      }
    } catch {
      /* abaikan */
    }
  }

  const role = normalizeRole(roleRaw);
  const school = role === "super_admin" ? "all" : normalizeSchool(schoolRaw);
  return {
    sub,
    email,
    role,
    scope: scopeForRole(role),
    school,
    classes: parseClasses(classesRaw),
  };
}
