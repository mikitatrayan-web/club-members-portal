import { NextRequest, NextResponse } from "next/server";
import {
  MemberArchetype,
  setMemberArchetype
} from "@/lib/googleSheets";

const ALLOWED_ARCHETYPES: MemberArchetype[] = [
  "Indica warrior",
  "Sativa wizard",
  "Hash gnome",
  "Hybrid elf"
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id: unknown = body?.id;
    const archetype: unknown = body?.archetype;

    if (typeof id !== "string" || typeof archetype !== "string") {
      return NextResponse.json(
        { ok: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    const trimmedId = id.trim();
    const normalizedArchetype = archetype.trim() as MemberArchetype;

    if (!ALLOWED_ARCHETYPES.includes(normalizedArchetype)) {
      return NextResponse.json(
        { ok: false, error: "Unknown archetype" },
        { status: 400 }
      );
    }

    await setMemberArchetype(trimmedId, normalizedArchetype);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in /api/member-archetype:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to save archetype" },
      { status: 500 }
    );
  }
}

