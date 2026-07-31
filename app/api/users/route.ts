import { NextResponse } from "next/server";
import { google } from "googleapis";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { readSessionNode } from "@/lib/session";
import { canManageUser, normalizeRole, normalizeSchool } from "@/lib/rbac";

export const runtime = "nodejs";

const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const SID = () => process.env.SPREADSHEET_ID || "";
const SHEET = "WebUsers";

function sheets() {
  return google.sheets({ version: "v4", auth });
}

async function readUsers() {
  const res = await sheets().spreadsheets.values.get({ spreadsheetId: SID(), range: `${SHEET}!A:G` });
  const rows = (res.data.values || []) as string[][];
  const headers = (rows[0] || []).map((h) => (h || "").toString().trim());
  return { headers, rows };
}

function countSuperAdmins(rows: string[][], roleIdx: number): number {
  if (roleIdx < 0) return 0;
  return rows.slice(1).filter((r) => normalizeRole(r[roleIdx]) === "super_admin").length;
}

export async function GET() {
  try {
    const { headers, rows } = await readUsers();
    if (headers.length === 0) return NextResponse.json([]);
    const pwIdx = headers.indexOf("PasswordHash");
    const data = rows
      .slice(1)
      .filter((r) => r.some((c) => (c || "").toString().trim() !== ""))
      .map((r) => {
        const o: Record<string, string> = {};
        headers.forEach((h, i) => { if (h && i !== pwIdx) o[h] = (r[i] || "").toString(); });
        return o;
      });
    return NextResponse.json(data);
  } catch (e) {
    console.error("[users] GET", e);
    return NextResponse.json({ error: "Gagal memuat pengguna." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await readSessionNode();
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });

    const gate = canManageUser(session.role, "user", { op: "edit" });
    if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const email = (body.Email || "").toString().trim().toLowerCase();
    const password = (body.Password || "").toString();
    const role = normalizeRole(body.Role);
    const classes = (body.Classes || "").toString().trim();
    const school = normalizeSchool(body.School);
    if (!email || !password) return NextResponse.json({ error: "Email dan Password wajib diisi." }, { status: 400 });

    if (role === "super_admin" && normalizeRole(session.role) !== "super_admin") {
      return NextResponse.json({ error: "Hanya Super Admin yang dapat membuat akun Super Admin." }, { status: 403 });
    }
    if (role !== "super_admin" && session.school !== "all" && school !== session.school) {
      return NextResponse.json({ error: `Administrator hanya dapat membuat akun untuk sekolah ${session.school}.` }, { status: 403 });
    }

    const { headers, rows } = await readUsers();
    const emailIdx = headers.indexOf("Email");
    if (emailIdx >= 0 && rows.slice(1).some((r) => (r[emailIdx] || "").toString().trim().toLowerCase() === email)) {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
    }

    const PasswordHash = await bcrypt.hash(password, 10);
    await sheets().spreadsheets.values.append({
      spreadsheetId: SID(),
      range: `${SHEET}!A:G`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[randomUUID(), email, PasswordHash, role, new Date().toISOString(), classes, school]] },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[users] POST", e);
    return NextResponse.json({ error: "Gagal menambah pengguna." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await readSessionNode();
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const targetId = (body.UserID || "").toString().trim();
    if (!targetId) return NextResponse.json({ error: "UserID diperlukan." }, { status: 400 });

    const { headers, rows } = await readUsers();
    const idIdx = headers.indexOf("UserID");
    const roleIdx = headers.indexOf("Role");
    const emailIdx = headers.indexOf("Email");
    const pwIdx = headers.indexOf("PasswordHash");
    const createdIdx = headers.indexOf("CreatedAt");
    const classesIdx = headers.indexOf("Classes");
    const schoolIdx = headers.indexOf("School");

    const targetRowIdx = rows.slice(1).findIndex((r) => (r[idIdx] || "").toString().trim() === targetId);
    if (targetRowIdx < 0) return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    const targetRow = rows[targetRowIdx + 1];

    const targetRole = targetRow[roleIdx];
    const targetEmail = (targetRow[emailIdx] || "").toString().trim().toLowerCase();
    const isSelf = (session.email || "").toLowerCase() === targetEmail;
    const superAdminCount = countSuperAdmins(rows, roleIdx);

    const gate = canManageUser(session.role, targetRole, { op: "edit", isSelf, superAdminCount });
    if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 403 });

    const newRole = normalizeRole(body.Role ?? targetRole);
    if (newRole === "super_admin" && normalizeRole(session.role) !== "super_admin") {
      return NextResponse.json({ error: "Hanya Super Admin yang dapat memberikan peran Super Admin." }, { status: 403 });
    }

    const newEmail = (body.Email || targetRow[emailIdx] || "").toString().trim().toLowerCase();
    const newPassword = (body.Password || "").toString();
    const newHash = newPassword ? await bcrypt.hash(newPassword, 10) : (pwIdx >= 0 ? targetRow[pwIdx] : "");
    const newClasses = body.Classes !== undefined ? (body.Classes || "").toString().trim() : (classesIdx >= 0 ? (targetRow[classesIdx] || "") : "");
    const newSchool = body.School !== undefined ? normalizeSchool(body.School) : (schoolIdx >= 0 ? normalizeSchool(targetRow[schoolIdx]) : "all");

    await sheets().spreadsheets.values.update({
      spreadsheetId: SID(),
      range: `${SHEET}!A${targetRowIdx + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[targetId, newEmail, newHash, newRole, createdIdx >= 0 ? (targetRow[createdIdx] || "") : "", newClasses, newSchool]],
      },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[users] PUT", e);
    return NextResponse.json({ error: "Gagal memperbarui pengguna." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await readSessionNode();
    if (!session) return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const targetId = (searchParams.get("id") || "").trim();
    if (!targetId) return NextResponse.json({ error: "UserID diperlukan." }, { status: 400 });

    const { headers, rows } = await readUsers();
    const idIdx = headers.indexOf("UserID");
    const roleIdx = headers.indexOf("Role");
    const emailIdx = headers.indexOf("Email");

    const targetRowIdx = rows.slice(1).findIndex((r) => (r[idIdx] || "").toString().trim() === targetId);
    if (targetRowIdx < 0) return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    const targetRow = rows[targetRowIdx + 1];

    const targetRole = targetRow[roleIdx];
    const targetEmail = (targetRow[emailIdx] || "").toString().trim().toLowerCase();
    const isSelf = (session.email || "").toLowerCase() === targetEmail;
    const superAdminCount = countSuperAdmins(rows, roleIdx);

    const gate = canManageUser(session.role, targetRole, { op: "delete", isSelf, superAdminCount });
    if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 403 });

    const meta = await sheets().spreadsheets.get({ spreadsheetId: SID() });
    const sheetId = (meta.data.sheets || []).find((s: any) => s.properties?.title === SHEET)?.properties?.sheetId;
    if (sheetId == null) return NextResponse.json({ error: "Sheet WebUsers tidak ditemukan." }, { status: 500 });

    const physical = targetRowIdx + 1;
    await sheets().spreadsheets.batchUpdate({
      spreadsheetId: SID(),
      requestBody: {
        requests: [{ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: physical, endIndex: physical + 1 } } }],
      },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[users] DELETE", e);
    return NextResponse.json({ error: "Gagal menghapus pengguna." }, { status: 500 });
  }
}
