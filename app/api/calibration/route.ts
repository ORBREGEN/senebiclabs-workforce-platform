import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { supabaseAdmin } from "@/lib/supabase";
import { normalizeConfig, type RawEvalConfig } from "@/lib/eval-config";

export const dynamic = "force-dynamic";

/**
 * Pools that carry a calibration, with this clinician's standing in each.
 *
 * Passing a calibration is the only thing that flips eligibility — there are no
 * levels or prerequisites. A pool the clinician is already eligible for reads
 * as passed.
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (_req, auth) => {
    const [{ data: pools, error }, { data: eligibility }, { data: attempts }] =
      await Promise.all([
        supabaseAdmin
          .from("pools")
          .select("id, name, eval_config, calibration_items"),
        supabaseAdmin
          .from("pool_eligibility")
          .select("pool_id, eligible, eligible_since")
          .eq("clinician_id", auth.clinicianId),
        supabaseAdmin
          .from("calibration_attempts")
          .select("pool_id, passed, attempted_at")
          .eq("clinician_id", auth.clinicianId),
      ]);

    if (error) {
      console.error("[calibration] pool query failed", error);
      return NextResponse.json(
        { error: "We could not load calibrations." },
        { status: 500 }
      );
    }

    const eligibleSince = new Map<string, string | null>();
    for (const row of eligibility ?? []) {
      if (row.eligible) eligibleSince.set(row.pool_id, row.eligible_since);
    }

    const attemptCount = new Map<string, number>();
    for (const row of attempts ?? []) {
      attemptCount.set(row.pool_id, (attemptCount.get(row.pool_id) ?? 0) + 1);
    }

    const listed = (pools ?? [])
      .map((pool) => {
        const items = Array.isArray(pool.calibration_items)
          ? pool.calibration_items
          : [];
        const config = normalizeConfig(
          (pool.eval_config ?? null) as RawEvalConfig | null
        );
        const passed = eligibleSince.has(pool.id);

        return {
          id: pool.id,
          name: pool.name,
          purpose: config.purpose,
          description: config.title,
          item_count: items.length,
          status: passed ? ("passed" as const) : ("not_attempted" as const),
          passed_at: passed ? (eligibleSince.get(pool.id) ?? null) : null,
          attempts: attemptCount.get(pool.id) ?? 0,
        };
      })
      // A pool with no calibration items cannot be qualified for here.
      .filter((pool) => pool.item_count > 0 || pool.status === "passed");

    listed.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ pools: listed });
  });
}
