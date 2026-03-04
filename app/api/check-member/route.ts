import { NextRequest, NextResponse } from "next/server";
import { getMemberById } from "@/lib/googleSheets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id: unknown = body?.id;

    if (typeof id !== "string") {
      return NextResponse.json(
        { found: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    const trimmedId = id.trim();

    if (trimmedId.length < 5 || trimmedId.length > 6) {
      return NextResponse.json(
        { found: false, error: "Member ID must be 5–6 characters long." },
        { status: 400 }
      );
    }

    // Allow letters and digits in member IDs, but no symbols.
    if (!/^[0-9A-Za-z]+$/.test(trimmedId)) {
      return NextResponse.json(
        {
          found: false,
          error: "Member ID should contain only letters and digits."
        },
        { status: 400 }
      );
    }

    const member = await getMemberById(trimmedId);

    if (!member) {
      return NextResponse.json(
        { found: false, error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      found: true,
      member
    });
  } catch (error) {
    console.error("Error in /api/check-member:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    const body: {
      found: false;
      error: string;
      debug?: string;
    } = {
      found: false,
      error: "Something went wrong. Please try again later."
    };

    // In development, include a debug message to make setup issues easier to see.
    if (process.env.NODE_ENV !== "production") {
      body.debug = message;
    }

    return NextResponse.json(body, { status: 500 });
  }
}

