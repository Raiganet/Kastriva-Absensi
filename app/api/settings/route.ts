import { NextResponse } from "next/server";
import { google } from "googleapis";

const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");
const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
const SID = () => process.env.SPREADSHEET_ID || "";

export async function GET() {
  try {
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SID(), range: "Settings!A:B" });
    const rows = res.data.values || [];
    const settings: any = {};
    rows.slice(1).forEach((row) => {
      settings[row[0]] = row[1] || "";
    });
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ school_name: "Sistem Absensi Digital" });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sheets = google.sheets({ version: "v4", auth });

    // Pastikan sheet Settings punya header
    const existing = await sheets.spreadsheets.values.get({ spreadsheetId: SID(), range: "Settings!A:B" });
    const rows = existing.data.values || [];
    
    if (rows.length === 0 || rows[0][0] !== "Key") {
      // Buat header baru
      await sheets.spreadsheets.values.update({
        spreadsheetId: SID(),
        range: "Settings!A1:B1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [["Key", "Value"]] },
      });
    }

    // Update atau tambahkan setiap key
    const keys = ["school_name", "school_tagline", "school_website", "principal_name", "card_bg_preset", "logo_url"];
    
    for (const key of keys) {
      const value = body[key] || "";
      const currentRows = await sheets.spreadsheets.values.get({ spreadsheetId: SID(), range: "Settings!A:B" });
      const data = currentRows.data.values || [];
      
      let found = false;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === key) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SID(),
            range: `Settings!B${i + 1}`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [[value]] },
          });
          found = true;
          break;
        }
      }
      
      if (!found) {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SID(),
          range: "Settings!A:B",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [[key, value]] },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}