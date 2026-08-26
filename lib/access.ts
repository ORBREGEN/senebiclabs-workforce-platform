import "server-only";
import { supabaseAdmin } from "./supabase";

/**
 * How a clinician becomes able to review.
 *
 * Two regimes, chosen by a flag:
 *
 *   calibration OFF (default) — an invitation is the qualification. Accepting
 *     one grants access to the open pools immediately, so an invited clinician
 *     signs in and starts reviewing.
 *
 *   calibration ON — access is earned per pool by passing that pool's
 *     calibration, and nothing is granted at acceptance.
 *
 * The flag decides *how eligibility is granted*. It never bypasses the gate:
 * access is always a row in pool_eligibility, so requireEligiblePool stays the
 * single authority on who may see what, and revoking access stays a matter of
 * flipping a row rather than redeploying.
 */
export const CALIBRATION_ENABLED =
  process.env.NEXT_PUBLIC_CALIBRATION_ENABLED === "true";

/**
 * Grants a clinician access to the pools open without calibration.
 *
 * Returns how many pools were granted. A no-op when calibration is on.
 */
export async function grantDirectAccess(clinicianId: string): Promise<number> {
  if (CALIBRATION_ENABLED) return 0;

  const { data: pools } = await supabaseAdmin.from("pools").select("id");
  if (!pools?.length) return 0;

  const { data: existing } = await supabaseAdmin
    .from("pool_eligibility")
    .select("pool_id")
    .eq("clinician_id", clinicianId);

  const held = new Set((existing ?? []).map((r) => r.pool_id));
  const missing = pools.filter((p) => !held.has(p.id));

  if (missing.length === 0) {
    // Already has rows — make sure none of them are switched off.
    await supabaseAdmin
      .from("pool_eligibility")
      .update({ eligible: true })
      .eq("clinician_id", clinicianId);
    return 0;
  }

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("pool_eligibility").insert(
    missing.map((p) => ({
      clinician_id: clinicianId,
      pool_id: p.id,
      eligible: true,
      eligible_since: now,
    }))
  );

  if (error) {
    console.error("[access] granting direct access failed", error);
    return 0;
  }

  return missing.length;
}
