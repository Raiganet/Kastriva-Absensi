import { google } from "googleapis";

const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const SID = () => process.env.SPREADSHEET_ID || "";

function sheets() {
  return google.sheets({ version: "v4", auth });
}

async function values(range: string): Promise<string[][]> {
  const res = await sheets().spreadsheets.values.get({ spreadsheetId: SID(), range });
  return (res.data.values || []) as string[][];
}

async function append(range: string, row: (string | number)[]) {
  await sheets().spreadsheets.values.append({
    spreadsheetId: SID(),
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}

function toObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => (h || "").toString().trim());
  return rows.slice(1).map((r) => {
    const o: Record<string, string> = {};
    headers.forEach((h, i) => { if (h) o[h] = (r[i] || "").toString(); });
    return o;
  });
}

// pastikan sheet ada + header sesuai (menambah kolom kurang, mis. Classes)
async function ensureSheet(name: string, headers: string[]) {
  const ss = await sheets().spreadsheets.get({ spreadsheetId: SID() });
  const exists = (ss.data.sheets || []).some((s: any) => s.properties?.title === name);
  if (!exists) {
    await sheets().spreadsheets.batchUpdate({
      spreadsheetId: SID(),
      requestBody: { requests: [{ addSheet: { properties: { title: name } } }] },
    });
    await sheets().spreadsheets.values.update({
      spreadsheetId: SID(),
      range: `${name}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [headers] },
    });
    return;
  }
  // tambah kolom header yang belum ada
  const cur = ((await values(`${name}!1:1`))[0] || []).map((h) => (h || "").toString().trim());
  const missing = headers.filter((h) => !cur.includes(h));
  for (const h of missing) {
    const col = String.fromCharCode(65 + cur.length); // A,B,C,...
    await sheets().spreadsheets.values.update({
      spreadsheetId: SID(),
      range: `${name}!${col}1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[h]] },
    });
    cur.push(h);
  }
}

// ============================ WebUsers ============================
const WEBUSERS_HEADERS = ["UserID", "Email", "PasswordHash", "Role", "CreatedAt", "Classes"];

export interface WebUser {
  UserID: string; Email: string; PasswordHash?: string;
  Role?: string; CreatedAt?: string; Classes?: string;
}

export async function findWebUser(email: string): Promise<WebUser | null> {
  await ensureSheet("WebUsers", WEBUSERS_HEADERS);
  const rows = toObjects(await values("WebUsers!A:F"));
  const hit = rows.find((r) => (r.Email || "").toLowerCase() === (email || "").toLowerCase());
 return hit ? (hit as unknown as WebUser) : null;
}

export async function createWebUser(u: WebUser) {
  await ensureSheet("WebUsers", WEBUSERS_HEADERS);
  await append("WebUsers!A:F", [
    u.UserID, u.Email, u.PasswordHash || "", u.Role || "user", u.CreatedAt || new Date().toISOString(), u.Classes || "",
  ]);
}

// ============================ OTP ============================
export async function getOtpRecord(email: string) {
  const rows = toObjects(await values("OTPCodes!A:C"));
  const hit = rows.find((r) => (r.Email || "").toLowerCase() === (email || "").toLowerCase());
  if (!hit) return null;
  return { email: hit.Email, otp: hit.OTP, expiry: parseInt(hit.Expiry || "0", 10) };
}

export async function saveOtpRecord(email: string, otp: string, expiry: number) {
  await ensureSheet("OTPCodes", ["Email", "OTP", "Expiry"]);
  const rows = await values("OTPCodes!A:C");
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i][0] || "").toString().toLowerCase() === email.toLowerCase()) {
      await sheets().spreadsheets.values.update({
        spreadsheetId: SID(),
        range: `OTPCodes!B${i + 1}:C${i + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[otp, expiry.toString()]] },
      });
      return;
    }
  }
  await append("OTPCodes!A:C", [email, otp, expiry.toString()]);
}

export async function deleteOtpRecord(email: string) {
  const rows = await values("OTPCodes!A:C");
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i][0] || "").toString().toLowerCase() === email.toLowerCase()) {
      await sheets().spreadsheets.values.clear({ spreadsheetId: SID(), range: `OTPCodes!A${i + 1}:C${i + 1}` });
      return;
    }
  }
}

export async function updateWebUserPassword(email: string, passwordHash: string) {
  const rows = await values("WebUsers!A:F");
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i][1] || "").toString().toLowerCase() === email.toLowerCase()) {
      await sheets().spreadsheets.values.update({
        spreadsheetId: SID(),
        range: `WebUsers!C${i + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[passwordHash]] },
      });
      return;
    }
  }
}
