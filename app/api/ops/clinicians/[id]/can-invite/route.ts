import { NextRequest, NextResponse } from "next/server";
import { withOps } from "@/lib/ops-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Grants or withdraws the right to invite colleagues.
 *
 * The clinician's invite panel is rendered from this flag, so it appears for
 * them without a deploy and disappears the same way.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOps(req, async () => {
    const { id } = await params;

    let value: boolean;
    try {
      value = Boolean((await req.json())?.value);
    } catch {
      return NextResponse.json({ error: "Malformed request." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("clinicians")
      .update({ can_invite: value })
      .eq("id", id)
      .select("id, email, can_invite");

    if (error) {
      console.error("[ops] can_invite update failed", error);
      return NextResponse.json({ error: "That did not save." }, { status: 500 });
    }
    if (!data?.length) {
      return NextResponse.json({ error: "No such clinician." }, { status: 404 });
    }

    return NextResponse.json({ clinician: data[0] });
  });
}
