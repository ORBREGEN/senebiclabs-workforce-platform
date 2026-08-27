import { NextRequest, NextResponse } from "next/server";
import { withOps } from "@/lib/ops-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Opens or closes a pool to automatic granting.
 *
 * Opening means the next sign-in tops every clinician up with it. Closing stops
 * new grants but deliberately leaves existing ones alone — pulling a pool back
 * from people who already have it is revoke-all, so that closing a pool by
 * accident cannot silently strip a working panel of its access.
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
      .from("pools")
      .update({ open_access: value })
      .eq("id", id)
      .select("id, name, open_access");

    if (error) {
      console.error("[ops] open_access update failed", error);
      return NextResponse.json({ error: "That did not save." }, { status: 500 });
    }
    if (!data?.length) {
      return NextResponse.json({ error: "No such pool." }, { status: 404 });
    }

    const { count } = await supabaseAdmin
      .from("pool_eligibility")
      .select("id", { count: "exact", head: true })
      .eq("pool_id", id)
      .eq("eligible", true);

    return NextResponse.json({
      pool: data[0],
      // Said plainly, because closing alone is the thing operators misread.
      note: value
        ? "Open. Clinicians are granted this pool on their next sign-in."
        : "Closed to new grants. The clinicians who already have it keep it — use Close and revoke all to remove them.",
      still_eligible: count ?? 0,
    });
  });
}
