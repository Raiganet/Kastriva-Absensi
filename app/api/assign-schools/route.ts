import { NextResponse } from "next/server";
import { google } from "googleapis";
import { readSessionNode } from "@/lib/session";
import { normalizeRole } from "@/lib/rbac";

export const runtime = "nodejs";

const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const SID = () => process.env.SPREADSHEET_ID || "";

function sheets() {
  return google.sheets({ version: "v4", auth });
}

// Deteksi sekolah berdasarkan nama kelas
function detectSchool(className: string): string {
  const c = className.toUpperCase().trim();
  if (!c) return "";
  
  // TK
  if (c.includes("TK")) return "TK";
  
  // SD: kelas 1-6 saja (tanpa romawi)
  if (/^[1-6]\s*[A-Z]?\s*$/.test(c)) return "SD";
  if (/^SD\s/.test(c)) return "SD";
  
  // SMP: VII, VIII, IX atau 7, 8, 9
  if (/^(VII|VIII|IX|7|8|9)\s/.test(c)) return "SMP";
  if (/^SMP\s/.test(c)) return "SMP";
  
  // SMA: X, XI, XII atau mengandung IPA/IPS
  if (/^(X|XI|XII)\s/.test(c)) return "SMA";
  if (c.includes("IPA") || c.includes("IPS") || c.includes("BAHASA")) return "SMA";
  
  // Default: kosong (perlu manual)
  return "";
}

export async function POST(req: Request) {
  try {
    const session = await readSessionNode();
    if (!session || normalizeRole(session.role) !== "super_admin") {
      return NextResponse.json({ error: "Hanya Super Admin." }, { status: 403 });
    }

    const { dryRun = true } = await req.json().catch(() => ({}));

    const res = await sheets().spreadsheets.values.get({
      spreadsheetId: SID(),
      range: "Students!A:Z",
    });
    const rows = (res.data.values || []) as string[][];
    if (rows.length < 2) return NextResponse.json({ updated: 0, message: "Tidak ada data." });

    const headers = (rows[0] || []).map((h) => (h || "").toString().trim());
    const classIdx = headers.indexOf("Class_Name");
    const schoolIdx = headers.indexOf("School");

    if (classIdx < 0) {
      return NextResponse.json({ error: "Kolom Class_Name tidak ditemukan." }, { status: 400 });
    }

    // Jika kolom School belum ada, tambahkan
    let finalSchoolIdx = schoolIdx;
    if (schoolIdx < 0) {
      const newCol = String.fromCharCode(65 + headers.length);
      await sheets().spreadsheets.values.update({
        spreadsheetId: SID(),
        range: `Students!${newCol}1`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [["School"]] },
      });
      finalSchoolIdx = headers.length;
    }

    const updates: { row: number; school: string; className: string }[] = [];

    for (let i = 1; i < rows.length; i++) {
      const className = (rows[i][classIdx] || "").toString().trim();
      const currentSchool = (rows[i][finalSchoolIdx] || "").toString().trim();
      const detected = detectSchool(className);

      // Hanya update jika belum ada school atau berbeda dengan deteksi
      if (!currentSchool && detected) {
        updates.push({ row: i + 1, school: detected, className });
      }
    }

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        total: rows.length - 1,
        toUpdate: updates.length,
        preview: updates.slice(0, 20),
        message: `Akan mengupdate ${updates.length} dari ${rows.length - 1} siswa. Kirim {dryRun: false} untuk eksekusi.`,
      });
    }

    // Eksekusi update batch
    if (updates.length > 0) {
      const batchUpdates = updates.map((u) => ({
        range: `Students!${String.fromCharCode(65 + finalSchoolIdx)}${u.row}`,
        values: [[u.school]],
      }));

      await sheets().spreadsheets.values.batchUpdate({
        spreadsheetId: SID(),
        requestBody: { data: batchUpdates, valueInputOption: "USER_ENTERED" },
      });
    }

    return NextResponse.json({
      dryRun: false,
      updated: updates.length,
      total: rows.length - 1,
      message: `${updates.length} siswa diupdate dengan School.`,
    });
  } catch (e: any) {
    console.error("[assign-schools] error:", e);
    return NextResponse.json({ error: e.message || "Gagal." }, { status: 500 });
  }
}
