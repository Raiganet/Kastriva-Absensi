import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE } from "@/lib/constants";
import { can, normalizeRole, NAV_ITEMS, type Action } from "@/lib/rbac";

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret");

function pageGateForPath(pathname: string): Action {
  const hit = NAV_ITEMS.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
  return hit ? hit.gate : "view_dashboard";
}

function apiGateForPath(method: string, pathname: string): Action | null {
  const m = method.toUpperCase();
  if (pathname.startsWith("/api/students")) return m === "GET" ? "view_students" : "manage_students";
  if (pathname.startsWith("/api/users")) return m === "GET" ? "view_users" : "manage_users";
  if (pathname.startsWith("/api/settings")) return m === "GET" || m === "HEAD" ? "view_settings" : "manage_settings";
  if (pathname.startsWith("/api/attendance")) return "view_attendance";
  return null; // endpoint lain (auth, me, dll) tidak dipagari di sini
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  let payload: any = null;
  if (token) {
    try {
      const r = await jwtVerify(token, secret());
      payload = r.payload;
    } catch {
      payload = null;
    }
  }

  // BELUM LOGIN -> perilaku lama persis: lempar ke /login
  if (!payload) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // SUDAH LOGIN -> tegakkan peran (fail-open ke admin bila role tak terbaca)
  const role = normalizeRole(payload?.role);
  const path = req.nextUrl.pathname;

  if (path.startsWith("/api/")) {
    const gate = apiGateForPath(req.method, path);
    if (gate && !can(role, gate)) {
      return NextResponse.json({ ok: false, error: "Akses ditolak untuk peran Anda." }, { status: 403 });
    }
    return NextResponse.next();
  }

  const gate = pageGateForPath(path);
  if (!can(role, gate)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard"; // bukan /login -> tidak pernah loop
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/students/:path*",
    "/api/users/:path*",
    "/api/settings/:path*",
    "/api/attendance/:path*",
  ],
};
