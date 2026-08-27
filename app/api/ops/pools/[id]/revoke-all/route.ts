import { NextRequest, NextResponse } from "next/server";
import { withOps } from "@/lib/ops-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Pulls a pool back entirely: closed to new grants, and nobody keeps it.
 *
 * Closing a pool on its own stops future grants but leaves current access in
 * place. This is the action for withdrawing a client's material from the panel,
 * so it does both and reports the resulting count.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOps(req, async () => {
    const { id } = await params;

    const { data: pool } = await supabaseAdmin
      .from("pools").select("id, name").eq("id", id).maybeSingle();
    if (!pool) return NextResponse.json({ error: "No such pool." }, { status: 404 });

    const { count: before } = await supabaseAdmin
      .from("pool_eligibility")
      .select("id", { count: "exact", head: true })
      .eq("pool_id", id);

    await supabaseAdmin.from("pools").update({ open_access: false }).eq("id", id);
    const { error } = await supabaseAdmin.from("pool_eligibility").delete().eq("pool_id", id);

    if (error) {
      console.error("[ops] revoke-all failed", error);
      return NextResponse.json({ error: "Revoking did not complete." }, { status: 500 });
    }

    const { count: after } = await supabaseAdmin
      .from("pool_eligibility")
      .select("id", { count: "exact", head: true })
      .eq("pool_id", id);

    return NextResponse.json({
      pool: pool.name,
      open_access: false,
      revoked: before ?? 0,
      eligible_now: after ?? 0,
    });
  });
}
