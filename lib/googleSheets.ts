import { google, sheets_v4 } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

export type MemberArchetype =
  | "Indica warrior"
  | "Sativa wizard"
  | "Hash gnome"
  | "Hybrid elf";

type MemberRow = {
  id: string;
  prerolls: number;
  spins: number;
  drinks: number;
  snacks: number;
  archetype?: MemberArchetype | null;
  reviewPosted?: boolean;
};

let sheetsClient: sheets_v4.Sheets | null = null;

function getSheetsClient(): sheets_v4.Sheets {
  if (sheetsClient) return sheetsClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !privateKey) {
    throw new Error("Google service account credentials are not configured.");
  }

  const jwt = new google.auth.JWT({
    email,
    key: privateKey.replace(/\\n/g, "\n"),
    scopes: SCOPES
  });

  const sheets = google.sheets({ version: "v4", auth: jwt });
  sheetsClient = sheets;
  return sheets;
}

export async function getMemberById(id: string): Promise<MemberRow | null> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const configuredRange = process.env.GOOGLE_SHEETS_RANGE || "Sheet1!A:G";

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not configured.");
  }

  const sheets = getSheetsClient();
  const [sheetName] = configuredRange.split("!");

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    // Fetch full rows including archetype and review flags.
    range: `${sheetName}!A:G`
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    return null;
  }

  // Assume first row is header:
  // ID, Prerolls, Spins, Drinks, Snacks, Archetype, ReviewPosted
  const [, ...dataRows] = rows;

  for (const row of dataRows) {
    const [
      rowId,
      prerolls,
      spins,
      drinks,
      snacks,
      archetype,
      reviewPosted
    ] = row;
    if (String(rowId).trim() === id) {
      return {
        id: String(rowId).trim(),
        prerolls: Number(prerolls) || 0,
        spins: Number(spins) || 0,
        drinks: Number(drinks) || 0,
        snacks: Number(snacks) || 0,
        archetype:
          typeof archetype === "string" && archetype.trim().length > 0
            ? (archetype.trim() as MemberArchetype)
            : null,
        reviewPosted:
          reviewPosted === 1 ||
          reviewPosted === "1" ||
          (typeof reviewPosted === "string" &&
            reviewPosted.toLowerCase() === "true")
      };
    }
  }

  return null;
}

export async function setMemberArchetype(
  id: string,
  archetype: MemberArchetype
): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const configuredRange = process.env.GOOGLE_SHEETS_RANGE || "Sheet1!A:G";

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not configured.");
  }

  const [sheetName] = configuredRange.split("!");
  const sheets = getSheetsClient();

  const valuesResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    // Read the whole sheet to avoid range issues.
    range: sheetName
  });

  const rows = valuesResponse.data.values;
  if (!rows || rows.length < 2) {
    throw new Error("No rows found in member sheet.");
  }

  const [, ...dataRows] = rows;

  let rowNumber: number | null = null;
  dataRows.forEach((row, index) => {
    const [rowId] = row;
    if (String(rowId).trim() === id) {
      rowNumber = index + 2; // account for header row
    }
  });

  if (!rowNumber) {
    throw new Error("Member not found when setting archetype.");
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!F${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[archetype]]
    }
  });
}

export async function setMemberReviewPosted(
  id: string,
  posted: boolean
): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const configuredRange = process.env.GOOGLE_SHEETS_RANGE || "Sheet1!A:G";

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not configured.");
  }

  const [sheetName] = configuredRange.split("!");
  const sheets = getSheetsClient();

  const valuesResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName
  });

  const rows = valuesResponse.data.values;
  if (!rows || rows.length < 2) {
    throw new Error("No rows found in member sheet.");
  }

  const [, ...dataRows] = rows;

  let rowNumber: number | null = null;
  dataRows.forEach((row, index) => {
    const [rowId] = row;
    if (String(rowId).trim() === id) {
      rowNumber = index + 2; // account for header row
    }
  });

  if (!rowNumber) {
    throw new Error("Member not found when setting review flag.");
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!G${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[posted ? 1 : 0]]
    }
  });
}



