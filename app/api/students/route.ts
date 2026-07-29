import { NextResponse } from "next/server";
import { google } from "googleapis";

const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");
const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
const SID = () => process.env.SPREADSHEET_ID || "";

export async function GET() {
  try {
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SID(), range: "Students!A:Z" });
    const rows = res.data.values || [];
    if (rows.length < 2) return NextResponse.json([]);
    
    const headers = rows[0].map((h: string) => h.trim());
    const data = rows.slice(1).map((row: string[]) => {
      const obj: any = {};
      headers.forEach((h: string, i: number) => { obj[h] = row[i] || ""; });
      return obj;
    });
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}