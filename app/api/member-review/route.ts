import { NextRequest, NextResponse } from "next/server";
import { setMemberReviewPosted } from "@/lib/googleSheets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id: unknown = body?.id;
    const posted: unknown = body?.posted;

    if (typeof id !== "string" || typeof posted !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    const trimmedId = id.trim();

    await setMemberReviewPosted(trimmedId, posted);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in /api/member-review:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to flag review as posted" },
      { status: 500 }
    );
  }
}

