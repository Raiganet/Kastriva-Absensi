import { NextResponse } from "next/server";
import { google } from "googleapis";
import { readSessionNode } from "@/lib/session";

const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const SID = () => process.env.SPREADSHEET_ID || "";
const SHEET = "Students";

function sheets() {
  return google.sheets({ version: "v4", auth });
}

async function sheetIdByName(name: string): Promise<number | null> {
  const res = await sheets().spreadsheets.get({ spreadsheetId: SID() });
  const found = (res.data.sheets || []).find((s: any) => s.properties?.title === name);
  return found?.properties?.sheetId ?? null;
}

async function readAll() {
  const res = await sheets().spreadsheets.values.get({ spreadsheetId: SID(), range: `${SHEET}!A:Z` });
  const rows = (res.data.values || []) as string[][];
  const headers = (rows[0] || []).map((h) => (h || "").toString().trim());
  return { headers, rows };
}

function rowToObj(headers: string[], row: string[]): Record<string, string> {
  const o: Record<string, string> = {};
  headers.forEach((h, i) => { if (h) o[h] = (row[i] || "").toString(); });
  return o;
}

function buildRow(headers: string[], src: Record<string, string>): string[] {
  return headers.map((h) => (h ? src[h] ?? "" : ""));
}

export async function GET() {
  try {
    const session = await readSessionNode();
    const { headers, rows } = await readAll();
    if (headers.length === 0) return NextResponse.json([]);

    let data = rows
      .slice(1)
      .filter((r) => r.some((c) => (c || "").toString().trim() !== ""))
      .map((r) => rowToObj(headers, r));

    // FILTER PER SEKOLAH
    if (session && session.scope === "school" && session.school !== "all") {
      // Admin/Kepsek hanya lihat sekolahnya sendiri
      data = data.filter((s) => (s.School || "").toString().trim() === session.school);
    } else if (session && session.scope === "class") {
      // Wali kelas hanya lihat kelas binaannya di sekolahnya
      const classSet = new Set(session.classes.map((c) => c.toLowerCase()));
      data = data.filter((s) => {
        const schoolMatch = (s.School || "").toString().trim() === session.school;
        const classMatch = classSet.has((s.Class_Name || "").toString().trim().toLowerCase());
        return schoolMatch && classMatch;
      });
    }
    // Super Admin (scope === "all") lihat semua

    return NextResponse.json(data);
  } catch (e) {
    console.error("[students] GET", e);
    return NextResponse.json({ error: "Gagal memuat data siswa." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await readSessionNode();
    
    // Cek izin manage_students
    if (!session || session.role === "kepsek" || session.role === "wali_kelas") {
      return NextResponse.json({ error: "Anda tidak memiliki izin untuk mengubah data siswa." }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, any>;
    const id = (body.Student_ID || "").toString().trim();
    if (!id) return NextResponse.json({ error: "NIS wajib diisi." }, { status: 400 });

    const { headers, rows } = await readAll();
    if (headers.length === 0) return NextResponse.json({ error: "Header sheet Students kosong." }, { status: 500 });

    const idCol = headers.indexOf("Student_ID");
    let foundIdx = -1;
    if (idCol >= 0) {
      for (let i = 1; i < rows.length; i++) {
        if ((rows[i][idCol] || "").toString().trim().toLowerCase() === id.toLowerCase()) { foundIdx = i; break; }
      }
    }

    // Pastikan siswa yang diedit/ditambah sesuai sekolah user (kecuali Super Admin)
    const schoolCol = headers.indexOf("School");
    const userSchool = session.school;
    const userScope = session.scope;

    if (foundIdx >= 0) {
      // UPDATE
      const merged: Record<string, string> = { ...rowToObj(headers, rows[foundIdx]) };
      Object.keys(body).forEach((k) => { if (body[k] !== undefined) merged[k] = body[k].toString(); });
      merged.Student_ID = id;
      
      // Admin tidak bisa ubah siswa dari sekolah lain
      if (userScope === "school" && userSchool !== "all") {
        merged.School = userSchool;
      }
      
      await sheets().spreadsheets.values.update({
        spreadsheetId: SID(),
        range: `${SHEET}!A${foundIdx + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [buildRow(headers, merged)] },
      });
      return NextResponse.json({ success: true, mode: "update" });
    }

    // INSERT
    const src: Record<string, string> = {};
    Object.keys(body).forEach((k) => { src[k] = (body[k] ?? "").toString(); });
    
    // Auto-set school untuk admin (kecuali super admin)
    if (userScope === "school" && userSchool !== "all" && !src.School) {
      src.School = userSchool;
    }
    
    await sheets().spreadsheets.values.append({
      spreadsheetId: SID(),
      range: `${SHEET}!A:Z`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [buildRow(headers, src)] },
    });
    return NextResponse.json({ success: true, mode: "insert" });
  } catch (e) {
    console.error("[students] POST", e);
    return NextResponse.json({ error: "Gagal menyimpan siswa." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await readSessionNode();
    
    // Cek izin manage_students
    if (!session || session.role === "kepsek" || session.role === "wali_kelas") {
      return NextResponse.json({ error: "Anda tidak memiliki izin untuk menghapus siswa." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = (searchParams.get("id") || "").trim();
    if (!id) return NextResponse.json({ error: "NIS diperlukan." }, { status: 400 });

    const { headers, rows } = await readAll();
    const col = headers.indexOf("Student_ID");
    let targetRow1 = -1;
    if (col >= 0) {
      for (let i = 1; i < rows.length; i++) {
        if ((rows[i][col] || "").toString().trim().toLowerCase() === id.toLowerCase()) { targetRow1 = i + 1; break; }
      }
    }
    if (targetRow1 < 0) return NextResponse.json({ error: "Siswa tidak ditemukan." }, { status: 404 });

    // Cek apakah siswa yang akan dihapus milik sekolah user (kecuali super admin)
    const schoolIdx = headers.indexOf("School");
    const studentSchool = schoolIdx >= 0 ? rows[targetRow1 - 1][schoolIdx] : "";
    
    if (session.scope === "school" && session.school !== "all" && studentSchool !== session.school) {
      return NextResponse.json({ error: "Anda tidak dapat menghapus siswa dari sekolah lain." }, { status: 403 });
    }

    const sid = await sheetIdByName(SHEET);
    if (sid === null) return NextResponse.json({ error: "Sheet Students tidak ditemukan." }, { status: 500 });

    const physical = targetRow1 - 1;
    await sheets().spreadsheets.batchUpdate({
      spreadsheetId: SID(),
      requestBody: {
        requests: [{
          deleteDimension: {
            range: { sheetId: sid, dimension: "ROWS", startIndex: physical, endIndex: physical + 1 },
          },
        }],
      },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[students] DELETE", e);
    return NextResponse.json({ error: "Gagal menghapus siswa." }, { status: 500 });
  }
}
