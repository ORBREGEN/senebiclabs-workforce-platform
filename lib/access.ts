import "server-only";
import { supabaseAdmin } from "./supabase";

/**
 * How a clinician becomes able to review.
 *
 * Two regimes, chosen by a flag:
 *
 *   calibration OFF (default) — an invitation is the qualification, and
 *     accepting one grants eligibility for the pools that have been opened.
 *
 *   calibration ON — access is earned per pool by passing that pool's
 *     calibration, and nothing is granted at acceptance.
 *
 * Neither regime bypasses the gate. Access is always a row in pool_eligibility
 * and requireEligiblePool stays the single authority on who may see what, so
 * revoking access remains a row change rather than a deploy.
 */
export const CALIBRATION_ENABLED =
  process.env.NEXT_PUBLIC_CALIBRATION_ENABLED === "true";

/**
 * Grants a clinician eligibility for every pool marked `open_access`.
 *
 * Closed pools are never granted automatically — a new client's pool is
 * invisible to the panel until someone opens it deliberately. Returns how many
 * pools were newly granted.
 *
 * Only missing rows are inserted. A row someone set to `eligible = false` is a
 * deliberate revocation and is left alone, so signing in cannot quietly restore
 * access that was taken away.
 */
export async function grantDirectAccess(clinicianId: string): Promise<number> {
  if (CALIBRATION_ENABLED) return 0;

  const { data: openPools, error } = await supabaseAdmin
    .from("pools")
    .select("id")
    .eq("open_access", true);

  if (error) {
    // Before migration 004 the column does not exist. Fail closed: granting
    // nothing is recoverable, granting everything is not.
    console.error(
      "[access] cannot read pools.open_access — granting nothing. Apply migration 004.",
      error.message
    );
    return 0;
  }

  if (!openPools?.length) return 0;

  const { data: existing } = await supabaseAdmin
    .from("pool_eligibility")
    .select("pool_id")
    .eq("clinician_id", clinicianId);

  const held = new Set((existing ?? []).map((r) => r.pool_id));
  const missing = openPools.filter((p) => !held.has(p.id));
  if (missing.length === 0) return 0;

  const now = new Date().toISOString();
  const { error: insertError } = await supabaseAdmin
    .from("pool_eligibility")
    .insert(
      missing.map((p) => ({
        clinician_id: clinicianId,
        pool_id: p.id,
        eligible: true,
        eligible_since: now,
      }))
    );

  if (insertError) {
    console.error("[access] granting open pools failed", insertError);
    return 0;
  }

  return missing.length;
}
