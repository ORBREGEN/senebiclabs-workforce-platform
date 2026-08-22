import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Real counts only.
 *
 * Every figure here is a count of rows this clinician actually produced. A
 * stat with no source is omitted from the response rather than estimated —
 * agreement score needs consensus data this service does not yet hold, so it
 * is absent until it can be computed.
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (_req, auth) => {
    const weekStart = new Date();
    weekStart.setUTCDate(weekStart.getUTCDate() - 7);

    const [total, week] = await Promise.all([
      supabaseAdmin
        .from("task_completions")
        .select("id", { count: "exact", head: true })
        .eq("clinician_id", auth.clinicianId),
      supabaseAdmin
        .from("task_completions")
        .select("id", { count: "exact", head: true })
        .eq("clinician_id", auth.clinicianId)
        .gte("completed_at", weekStart.toISOString()),
    ]);

    if (total.error || week.error) {
      console.error("[stats] count failed", total.error ?? week.error);
      return NextResponse.json(
        { error: "We could not load your figures." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reviewed_total: total.count ?? 0,
      reviewed_this_week: week.count ?? 0,
    });
  });
}
