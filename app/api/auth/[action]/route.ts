import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { hashPassword, verifyPassword, signToken, passwordRules, COOKIE } from "@/lib/auth";
import { findWebUser, createWebUser, getOtpRecord, saveOtpRecord, deleteOtpRecord, updateWebUserPassword } from "@/lib/sheets";
import { sendOtpEmail } from "@/lib/email";

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

  // REGISTER
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

  // LOGIN
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

  // LOGOUT
  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, "", cookieOpts(0));
    return res;
  }

  // FORGOT PASSWORD - Kirim OTP
  if (action === "forgotPassword") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Email wajib diisi." }, { status: 400 });
    }
    const user = await findWebUser(email);
    if (!user) {
      return NextResponse.json({ ok: true, message: "Jika email terdaftar, kode OTP telah dikirim." });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000;
    await saveOtpRecord(email, otp, expiry);
    try {
      await sendOtpEmail(email, otp);
    } catch (err) {
      console.error("Email send error:", err);
      return NextResponse.json({ ok: false, error: "Gagal mengirim email. Coba lagi." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, message: "Jika email terdaftar, kode OTP telah dikirim." });
  }

  // VERIFY OTP
  if (action === "verifyOtp") {
    const email = String(body.email || "").trim().toLowerCase();
    const otp = String(body.otp || "").trim();
    if (!email || !otp) {
      return NextResponse.json({ ok: false, error: "Email dan OTP wajib diisi." }, { status: 400 });
    }
    const record = await getOtpRecord(email);
    if (!record) {
      return NextResponse.json({ ok: false, error: "Kode OTP tidak valid." }, { status: 400 });
    }
    if (Date.now() > record.expiry) {
      await deleteOtpRecord(email);
      return NextResponse.json({ ok: false, error: "Kode OTP sudah kedaluwarsa." }, { status: 400 });
    }
    if (record.otp !== otp) {
      return NextResponse.json({ ok: false, error: "Kode OTP salah." }, { status: 400 });
    }
    return NextResponse.json({ ok: true, message: "OTP valid." });
  }

  // RESET PASSWORD
  if (action === "resetPassword") {
    const email = String(body.email || "").trim().toLowerCase();
    const otp = String(body.otp || "").trim();
    const newPassword = String(body.newPassword || "");
    if (!email || !otp || !newPassword) {
      return NextResponse.json({ ok: false, error: "Semua kolom wajib diisi." }, { status: 400 });
    }
    const ruleErr = passwordRules(newPassword);
    if (ruleErr) return NextResponse.json({ ok: false, error: ruleErr }, { status: 400 });
    const record = await getOtpRecord(email);
    if (!record || record.otp !== otp || Date.now() > record.expiry) {
      return NextResponse.json({ ok: false, error: "OTP tidak valid atau kedaluwarsa." }, { status: 400 });
    }
    const hash = await hashPassword(newPassword);
    await updateWebUserPassword(email, hash);
    await deleteOtpRecord(email);
    return NextResponse.json({ ok: true, message: "Password berhasil direset. Silakan login." });
  }

  return NextResponse.json({ ok: false, error: "Aksi tidak dikenal." }, { status: 404 });
}
