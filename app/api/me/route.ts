import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { supabaseAdmin } from "@/lib/supabase";

const AGREEMENT_VERSION = "1.0";

/** The signed-in clinician, and which pools they are gated into. */
export async function GET(req: NextRequest) {
  return withAuth(req, async (_req, auth) => {
    const [{ data: clinician }, { data: acceptance }, { data: eligibility }] =
      await Promise.all([
        supabaseAdmin
          .from("clinicians")
          .select("id, name, email, active, can_invite")
          .eq("id", auth.clinicianId)
          .maybeSingle(),
        supabaseAdmin
          .from("agreement_acceptances")
          .select("version, accepted_at")
          .eq("clinician_id", auth.clinicianId)
          .eq("version", AGREEMENT_VERSION)
          .maybeSingle(),
        supabaseAdmin
          .from("pool_eligibility")
          .select("pool_id")
          .eq("clinician_id", auth.clinicianId)
          .eq("eligible", true),
      ]);

    if (!clinician) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    if (clinician.active === false) {
      return NextResponse.json(
        { error: "This account is not active." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: clinician.id,
      name: clinician.name,
      email: clinician.email,
      can_invite: clinician.can_invite === true,
      agreement_accepted: Boolean(acceptance),
      eligible_pool_ids: (eligibility ?? []).map((row) => row.pool_id),
    });
  });
}
