import { NextRequest, NextResponse } from "next/server";
import { getMemberById, incrementMemberSpinCount } from "@/lib/googleSheets";
import { pickWeightedOutcome, wheelSegments } from "@/app/wheel/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id: unknown = body?.id;

    if (typeof id !== "string") {
      return NextResponse.json(
        { ok: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    const trimmedId = id.trim();

    if (trimmedId.length < 5 || trimmedId.length > 6) {
      return NextResponse.json(
        { ok: false, error: "Member ID must be 5–6 characters long." },
        { status: 400 }
      );
    }

    if (!/^[0-9A-Za-z]+$/.test(trimmedId)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Member ID should contain only letters and digits."
        },
        { status: 400 }
      );
    }

    const member = await getMemberById(trimmedId);
    if (!member) {
      return NextResponse.json(
        { ok: false, error: "Member not found" },
        { status: 404 }
      );
    }

    const totalSpins = member.spins || 0;

    if (totalSpins <= 0) {
      return NextResponse.json(
        { ok: false, error: "No spins remaining for this member." },
        { status: 400 }
      );
    }

    const segmentIndex = pickWeightedOutcome(wheelSegments);
    const segment = wheelSegments[segmentIndex];

    const outcome = {
      label: segment.label,
      value: segment.value,
      segmentIndex
    };

    const newSpinCount = await incrementMemberSpinCount(trimmedId, outcome.label);

    return NextResponse.json({
      ok: true,
      memberId: member.id,
      newSpinCount,
      outcome
    });
  } catch (error) {
    console.error("Error in /api/wheel-spin:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to record spin" },
      { status: 500 }
    );
  }
}

