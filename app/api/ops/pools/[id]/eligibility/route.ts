import { NextRequest, NextResponse } from "next/server";
import { withOps } from "@/lib/ops-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Who may see this pool: every clinician, with their current state on it. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOps(req, async () => {
    const { id } = await params;

    const [{ data: pool }, { data: people }, { data: rows }] = await Promise.all([
      supabaseAdmin.from("pools").select("id, name, open_access").eq("id", id).maybeSingle(),
      supabaseAdmin.from("clinicians").select("id, email, name").order("created_at"),
      supabaseAdmin.from("pool_eligibility").select("clinician_id, eligible").eq("pool_id", id),
    ]);

    if (!pool) return NextResponse.json({ error: "No such pool." }, { status: 404 });

    const held = new Map((rows ?? []).map((r) => [r.clinician_id, r.eligible !== false]));

    return NextResponse.json({
      pool,
      clinicians: (people ?? []).map((c) => ({
        id: c.id,
        email: c.email,
        name: c.name,
        eligible: held.get(c.id) === true,
      })),
    });
  });
}

/**
 * Sets who may see this pool.
 *
 * Takes the full intended list and makes the table match it, so the operator
 * states the end result rather than issuing a sequence of grants and revokes
 * that could half-apply.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOps(req, async () => {
    const { id } = await params;

    let wanted: string[];
    try {
      const body = await req.json();
      wanted = Array.isArray(body?.clinician_ids) ? body.clinician_ids.map(String) : [];
    } catch {
      return NextResponse.json({ error: "Malformed request." }, { status: 400 });
    }

    const { data: pool } = await supabaseAdmin
      .from("pools").select("id").eq("id", id).maybeSingle();
    if (!pool) return NextResponse.json({ error: "No such pool." }, { status: 404 });

    const { data: rows } = await supabaseAdmin
      .from("pool_eligibility")
      .select("id, clinician_id, eligible")
      .eq("pool_id", id);

    const existing = new Map((rows ?? []).map((r) => [r.clinician_id, r]));
    const target = new Set(wanted);

    let granted = 0;
    let revoked = 0;

    // Grant or re-enable everyone on the list.
    for (const clinicianId of target) {
      const row = existing.get(clinicianId);
      if (!row) {
        const { error } = await supabaseAdmin.from("pool_eligibility").insert({
          clinician_id: clinicianId,
          pool_id: id,
          eligible: true,
          eligible_since: new Date().toISOString(),
        });
        if (!error) granted++;
      } else if (row.eligible === false) {
        await supabaseAdmin
          .from("pool_eligibility")
          .update({ eligible: true })
          .eq("id", row.id);
        granted++;
      }
    }

    // Remove the row for anyone left off it, so the pool disappears from their
    // dashboard rather than lingering as a disabled record.
    for (const [clinicianId, row] of existing) {
      if (target.has(clinicianId)) continue;
      await supabaseAdmin.from("pool_eligibility").delete().eq("id", row.id);
      revoked++;
    }

    const { count } = await supabaseAdmin
      .from("pool_eligibility")
      .select("id", { count: "exact", head: true })
      .eq("pool_id", id)
      .eq("eligible", true);

    return NextResponse.json({ granted, revoked, eligible_now: count ?? 0 });
  });
}
