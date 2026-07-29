import { google } from "googleapis";

const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SID = () => process.env.SPREADSHEET_ID || "";

async function values(range: string): Promise<string[][]> {
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({ 
    spreadsheetId: SID(), 
    range 
  });
  return (res.data.values || []) as string[][];
}

async function append(range: string, row: string[]) {
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SID(),
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}

async function ensureSheet(title: string, header: string[]) {
  const sheets = google.sheets({ version: "v4", auth });
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SID(),
    fields: "sheets.properties.title",
  });
  const names = (meta.data.sheets || []).map((s) => s.properties?.title);
  if (!names.includes(title)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SID(),
      requestBody: { requests: [{ addSheet: { properties: { title } } }] },
    });
    await append(title + "!A:Z", header);
  }
}

function toObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];
  const head = rows[0].map((h) => String(h).trim());
  return rows.slice(1).map((r) => {
    const o: Record<string, string> = {};
    head.forEach((h, i) => {
      o[h] = (r[i] ?? "").toString();
    });
    return o;
  });
}

export async function getStudents() {
  return toObjects(await values("Students!A:Z"));
}

export async function getAttendance() {
  return toObjects(await values("Attendance!A:Z"));
}

export async function getSettingsMap() {
  const rows = await values("Settings!A:B");
  const m: Record<string, string> = {};
  rows.slice(1).forEach((r) => {
    m[String(r[0]).trim()] = (r[1] ?? "").toString();
  });
  return m;
}

export async function findWebUser(email: string) {
  try {
    const rows = toObjects(await values("WebUsers!A:Z"));
    return rows.find((r) => (r.Email || "").toLowerCase() === email.toLowerCase()) || null;
  } catch {
    return null;
  }
}

export async function createWebUser(u: {
  UserID: string;
  Email: string;
  PasswordHash: string;
  Role: string;
  CreatedAt: string;
}) {
  await ensureSheet("WebUsers", ["UserID", "Email", "PasswordHash", "Role", "CreatedAt"]);
  await append("WebUsers!A:Z", [u.UserID, u.Email, u.PasswordHash, u.Role, u.CreatedAt]);
}
// ============================================
// OTP FUNCTIONS (untuk lupa password)
// ============================================
export async function getOtpRecord(email: string) {
  try {
    const rows = toObjects(await values("OTPCodes!A:C"));
    const record = rows.find((r) => (r.Email || "").toLowerCase() === email.toLowerCase());
    if (!record) return null;
    return {
      email: record.Email,
      otp: record.OTP,
      expiry: parseInt(record.Expiry || "0", 10),
    };
  } catch {
    return null;
  }
}

export async function saveOtpRecord(email: string, otp: string, expiry: number) {
  await ensureSheet("OTPCodes", ["Email", "OTP", "Expiry"]);
  const rows = await values("OTPCodes!A:C");
  let found = false;
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i][0] || "").toString().toLowerCase() === email.toLowerCase()) {
      const sheets = google.sheets({ version: "v4", auth });
      await sheets.spreadsheets.values.update({
        spreadsheetId: SID(),
        range: `OTPCodes!B${i + 1}:C${i + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[otp, expiry.toString()]] },
      });
      found = true;
      break;
    }
  }
  if (!found) {
    await append("OTPCodes!A:C", [email, otp, expiry.toString()]);
  }
}

export async function deleteOtpRecord(email: string) {
  try {
    const rows = await values("OTPCodes!A:C");
    for (let i = 1; i < rows.length; i++) {
      if ((rows[i][0] || "").toString().toLowerCase() === email.toLowerCase()) {
        const sheets = google.sheets({ version: "v4", auth });
        await sheets.spreadsheets.values.clear({
          spreadsheetId: SID(),
          range: `OTPCodes!A${i + 1}:C${i + 1}`,
        });
        break;
      }
    }
  } catch {}
}

export async function updateWebUserPassword(email: string, passwordHash: string) {
  const sheets = google.sheets({ version: "v4", auth });
  const rows = await values("WebUsers!A:E");
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i][1] || "").toString().toLowerCase() === email.toLowerCase()) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SID(),
        range: `WebUsers!C${i + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[passwordHash]] },
      });
      return;
    }
  }
}
