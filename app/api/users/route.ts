import { NextResponse } from "next/server";
import { google } from "googleapis";
import bcrypt from "bcryptjs";

const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");
const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
const SID = () => process.env.SPREADSHEET_ID || "";

export async function GET() {
  try {
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SID(), range: "WebUsers!A:E" });
    const rows = res.data.values || [];
    if (rows.length < 2) return NextResponse.json([]);
    
    const headers = ["UserID", "Email", "PasswordHash", "Role", "CreatedAt"];
    const data = rows.slice(1).map((row: string[]) => {
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ""; });
      delete obj.PasswordHash; // Jangan kirim password hash ke client
      return obj;
    });
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { Email, Password, Role } = body;
    
    if (!Email || !Password) {
      return NextResponse.json({ error: "Email dan Password wajib diisi" }, { status: 400 });
    }
    
    const sheets = google.sheets({ version: "v4", auth });
    
    // Cek apakah email sudah ada
    const existing = await sheets.spreadsheets.values.get({ spreadsheetId: SID(), range: "WebUsers!B:B" });
    const emails = (existing.data.values || []).slice(1).map((row: string[]) => row[0]?.toLowerCase());
    
    if (emails.includes(Email.toLowerCase())) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }
    
    // Hash password
    const PasswordHash = await bcrypt.hash(Password, 10);
    const UserID = crypto.randomUUID();
    const CreatedAt = new Date().toISOString();
    
    // Pastikan sheet ada
    const allSheets = await sheets.spreadsheets.get({ spreadsheetId: SID() });
    const sheetNames = allSheets.data.sheets?.map((s: any) => s.properties?.title) || [];
    
    if (!sheetNames.includes("WebUsers")) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SID(),
        requestBody: {
          requests: [{
            addSheet: { properties: { title: "WebUsers" } }
          }]
        }
      });
      // Tambah header
      await sheets.spreadsheets.values.update({
        spreadsheetId: SID(),
        range: "WebUsers!A1:E1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [["UserID", "Email", "PasswordHash", "Role", "CreatedAt"]] }
      });
    }
    
    // Tambah user baru
    await sheets.spreadsheets.values.append({
      spreadsheetId: SID(),
      range: "WebUsers!A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[UserID, Email, PasswordHash, Role || "user", CreatedAt]] }
    });
    
    return NextResponse.json({ success: true, message: "User berhasil ditambahkan" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { UserID, Email, Role, Password } = body;
    
    if (!UserID) {
      return NextResponse.json({ error: "UserID diperlukan" }, { status: 400 });
    }
    
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SID(), range: "WebUsers!A:E" });
    const rows = res.data.values || [];
    
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === UserID) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    
    const oldEmail = rows[rowIndex - 1][1];
    const oldRole = rows[rowIndex - 1][3];
    const oldPasswordHash = rows[rowIndex - 1][2];
    
    // Jika email diubah, cek apakah sudah ada
    if (Email !== oldEmail) {
      const allEmails = rows.slice(1).map((row: string[]) => row[1]?.toLowerCase());
      if (allEmails.includes(Email.toLowerCase())) {
        return NextResponse.json({ error: "Email sudah digunakan" }, { status: 409 });
      }
    }
    
    // Hash password baru jika ada
    const newPasswordHash = Password ? await bcrypt.hash(Password, 10) : oldPasswordHash;
    
    // Update row
    await sheets.spreadsheets.values.update({
      spreadsheetId: SID(),
      range: `WebUsers!A${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[UserID, Email, newPasswordHash, Role || oldRole, rows[rowIndex - 1][4]]] }
    });
    
    return NextResponse.json({ success: true, message: "User berhasil diupdate" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");
    
    if (!userId) {
      return NextResponse.json({ error: "UserID diperlukan" }, { status: 400 });
    }
    
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SID(), range: "WebUsers!A:E" });
    const rows = res.data.values || [];
    
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === userId) {
        rowIndex = i;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    
    // Hapus row (Google Sheets API tidak support delete row langsung, jadi kita clear saja)
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SID(),
      range: `WebUsers!A${rowIndex + 1}:E${rowIndex + 1}`
    });
    
    return NextResponse.json({ success: true, message: "User berhasil dihapus" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
