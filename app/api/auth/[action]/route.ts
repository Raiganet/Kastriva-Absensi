import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { hashPassword, verifyPassword, signToken, passwordRules, COOKIE } from "@/lib/auth";
import { findWebUser, createWebUser } from "@/lib/sheets";

export const runtime = "nodejs";

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function POST(req: Request, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  if (action === "register") {
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const password = String(body.password || "");
    if (!email || !name || !password) {
      return NextResponse.json({ ok: false, error: "Semua kolom wajib diisi." }, { status: 400 });
    }
    const ruleErr = passwordRules(password);
    if (ruleErr) return NextResponse.json({ ok: false, error: ruleErr }, { status: 400 });
    const exists = await findWebUser(email);
    if (exists) return NextResponse.json({ ok: false, error: "Email sudah terdaftar." }, { status: 409 });
    const hash = await hashPassword(password);
    await createWebUser({
      UserID: randomUUID(),
      Email: email,
      PasswordHash: hash,
      Role: "user",
      CreatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, message: "Registrasi berhasil. Silakan login." });
  }

  if (action === "login") {
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const user = await findWebUser(email);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Email atau password salah." }, { status: 401 });
    }
    const valid = await verifyPassword(password, user.PasswordHash || "");
    if (!valid) {
      return NextResponse.json({ ok: false, error: "Email atau password salah." }, { status: 401 });
    }
    const token = await signToken({ sub: user.UserID, email: user.Email, role: user.Role || "user" });
    const res = NextResponse.json({ ok: true, message: "Login berhasil." });
    res.cookies.set(COOKIE, token, cookieOpts(60 * 60 * 24));
    return res;
  }

  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, "", cookieOpts(0));
    return res;
  }

  return NextResponse.json({ ok: false, error: "Aksi tidak dikenal." }, { status: 404 });
}
