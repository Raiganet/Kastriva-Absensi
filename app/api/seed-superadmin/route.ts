import { NextResponse } from "next/server";
import { google } from "googleapis";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const SID = () => process.env.SPREADSHEET_ID || "";

export async function POST(req: Request) {
  // Proteksi: hanya boleh dipanggil dengan secret khusus
  const { email, password, secret: reqSecret } = await req.json().catch(() => ({}));
  if (reqSecret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password wajib." }, { status: 400 });
  }

  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SID(), range: "WebUsers!A:G" });
  const rows = (res.data.values || []) as string[][];
  
  // Cek apakah sudah ada Super Admin
  const hasSuperAdmin = rows.slice(1).some((r) => r[3]?.toString().trim().toLowerCase() === "super_admin");
  if (hasSuperAdmin) {
    return NextResponse.json({ error: "Super Admin sudah ada. Tidak bisa seed lagi." }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 10);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SID(),
    range: "WebUsers!A:G",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[randomUUID(), email.toLowerCase(), hash, "super_admin", new Date().toISOString(), "", "all"]] },
  });

  return NextResponse.json({ success: true, message: "Super Admin created." });
}
