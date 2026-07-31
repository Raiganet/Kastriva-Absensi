import { NextResponse } from "next/server";
import { google } from "googleapis";
import { readSessionNode } from "@/lib/session";

const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const SID = () => process.env.SPREADSHEET_ID || "";

function sheets() {
  return google.sheets({ version: "v4", auth });
}

export async function GET() {
  try {
    const session = await readSessionNode();
    const res = await sheets().spreadsheets.values.get({ spreadsheetId: SID(), range: "Attendance!A:Z" });
    const rows = (res.data.values || []) as string[][];
    if (rows.length < 2) return NextResponse.json([]);

    const headers = (rows[0] || []).map((h) => (h || "").toString().trim());
    let data = rows
      .slice(1)
      .filter((r) => r.some((c) => (c || "").toString().trim() !== ""))
      .map((r) => {
        const o: Record<string, string> = {};
        headers.forEach((h, i) => { if (h) o[h] = (r[i] || "").toString(); });
        return o;
      });

    // FILTER PER SEKOLAH
    if (session && session.scope === "school" && session.school !== "all") {
      // Admin/Kepsek hanya lihat kehadiran di sekolahnya
      data = data.filter((a) => (a.School || "").toString().trim() === session.school);
    } else if (session && session.scope === "class") {
      // Wali kelas hanya lihat kelas binaannya di sekolahnya
      const classSet = new Set(session.classes.map((c) => c.toLowerCase()));
      data = data.filter((a) => {
        const schoolMatch = (a.School || "").toString().trim() === session.school;
        const classMatch = classSet.has((a.Class_Name || "").toString().trim().toLowerCase());
        return schoolMatch && classMatch;
      });
    }
    // Super Admin lihat semua

    return NextResponse.json(data);
  } catch (e) {
    console.error("[attendance] GET", e);
    return NextResponse.json({ error: "Gagal memuat data kehadiran." }, { status: 500 });
  }
}
