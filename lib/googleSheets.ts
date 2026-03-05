import { google, sheets_v4 } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

export type MemberArchetype =
  | "Indica warrior"
  | "Sativa wizard"
  | "Hash gnome"
  | "Hybrid elf";

type MemberRow = {
  id: string;
  spins: number;
  archetype?: MemberArchetype | null;
  reviewPosted?: boolean;
  reviewCredited?: boolean;
  referredBy?: string | null;
  referrals?: string[];
  igSubscribed?: boolean;
  collectibles?: string[];
  /**
   * Total number of wheel spins used by this member.
   * Backed by column M in the Google Sheet.
   */
  spinUses?: number;
};

function sheetValueToBoolean(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes" || v === "y";
  }
  return false;
}

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
  const configuredRange = process.env.GOOGLE_SHEETS_RANGE || "Sheet1!A:M";
  const normalizedId = id.trim().toUpperCase();

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not configured.");
  }

  const sheets = getSheetsClient();
  const [sheetName] = configuredRange.split("!");

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    // Fetch full rows including archetype, review flags, credited tickbox,
    // referrals, quests, collectibles and spin usage counter in column M.
    range: `${sheetName}!A:M`
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    return null;
  }

  // Assume first row is header:
  // ID, Prerolls, Spins, Drinks, Snacks, Archetype,
  // ReviewPosted, ReviewCredited, ReferredBy, IgSubscribed, ..., Collectibles, SpinUses
  const [, ...dataRows] = rows;

  let matched: MemberRow | null = null;

  for (const row of dataRows) {
    const [
      rowId,
      ,
      spins,
      spinUsesRaw,
      ,
      archetype,
      reviewPosted,
      reviewCredited,
      referredBy,
      igSubscribed,
      ,
      collectiblesRaw,
    ] = row;
    if (String(rowId).trim().toUpperCase() === normalizedId) {
      // Lightweight debug to help diagnose sheet mapping issues in development.
      if (process.env.NODE_ENV !== "production") {
        console.log("Matched member row from Sheets", {
          rowId,
          spins,
          archetype,
          reviewPostedRaw: reviewPosted,
          reviewCreditedRaw: reviewCredited,
          reviewPostedParsed: sheetValueToBoolean(reviewPosted),
          reviewCreditedParsed: sheetValueToBoolean(reviewCredited)
        });
      }
      matched = {
        id: String(rowId).trim(),
        spins: Number(spins) || 0,
        archetype:
          typeof archetype === "string" && archetype.trim().length > 0
            ? (archetype.trim() as MemberArchetype)
            : null,
        reviewPosted: sheetValueToBoolean(reviewPosted),
        reviewCredited: sheetValueToBoolean(reviewCredited),
        referredBy:
          typeof referredBy === "string" && referredBy.trim().length > 0
            ? referredBy.trim()
            : null,
        referrals: [],
        igSubscribed: sheetValueToBoolean(igSubscribed),
        collectibles:
          typeof collectiblesRaw === "string" && collectiblesRaw.trim().length
            ? collectiblesRaw
                .split(/[,，]/)
                .map((v) => v.trim())
                .filter((v) => v.length > 0)
            : [],
        spinUses: Number(spinUsesRaw) || 0
      };
      break;
    }
  }
  if (!matched) {
    return null;
  }

  // Collect referrals: any row whose "ReferredBy" (column I) matches this member's ID.
  const referrals: string[] = [];
  dataRows.forEach((row) => {
    const [rowId, , , , , , , , referredBy] = row;
    if (
      typeof referredBy === "string" &&
      referredBy.trim().toUpperCase() === normalizedId
    ) {
      referrals.push(String(rowId).trim());
    }
  });

  return {
    ...matched,
    referrals
  };
}

export async function setMemberArchetype(
  id: string,
  archetype: MemberArchetype
): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const configuredRange = process.env.GOOGLE_SHEETS_RANGE || "Sheet1!A:G";
  const normalizedId = id.trim().toUpperCase();

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
    if (String(rowId).trim().toUpperCase() === normalizedId) {
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
  const normalizedId = id.trim().toUpperCase();

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
    if (String(rowId).trim().toUpperCase() === normalizedId) {
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

export async function incrementMemberSpinCount(id: string, outcomeLabel: string): Promise<number> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const configuredRange = process.env.GOOGLE_SHEETS_RANGE || "Sheet1!A:M";
  const normalizedId = id.trim().toUpperCase();

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
    if (String(rowId).trim().toUpperCase() === normalizedId) {
      rowNumber = index + 2; // account for header row
    }
  });

  if (!rowNumber) {
    throw new Error("Member not found when incrementing spin count.");
  }

  // Read current spin balance (col C), spin uses counter (col D), and spin log (col B).
  const cellsResponse = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: [
      `${sheetName}!B${rowNumber}`,
      `${sheetName}!C${rowNumber}`,
      `${sheetName}!D${rowNumber}`
    ]
  });

  const valueRanges = cellsResponse.data.valueRanges ?? [];
  const rawLog = valueRanges[0]?.values?.[0]?.[0];
  const rawSpins = valueRanges[1]?.values?.[0]?.[0];
  const rawUses = valueRanges[2]?.values?.[0]?.[0];

  const currentSpins = Number(rawSpins) || 0;
  const currentUses = Number(rawUses) || 0;

  const nextSpins = Math.max(0, currentSpins - 1);
  const nextUses = currentUses + 1;

  const now = new Date();
  const timestamp = now.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const entry = `${outcomeLabel} (${timestamp})`;
  const existingLog = typeof rawLog === "string" && rawLog.trim().length > 0 ? rawLog.trim() : "";
  const newLog = existingLog ? `${existingLog}\n${entry}` : entry;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: [
        { range: `${sheetName}!B${rowNumber}`, values: [[newLog]] },
        { range: `${sheetName}!C${rowNumber}`, values: [[nextSpins]] },
        { range: `${sheetName}!D${rowNumber}`, values: [[nextUses]] }
      ]
    }
  });

  return nextUses;
}

