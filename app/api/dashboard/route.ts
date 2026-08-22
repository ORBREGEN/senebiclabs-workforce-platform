import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { supabaseAdmin } from "@/lib/supabase";

const CURRENT_AGREEMENT_VERSION = "1.0";

export async function GET(req: NextRequest) {
  return withAuth(req, async (req, auth) => {
    try {
      // Check if clinician has accepted the current agreement
      const { data: acceptance, error: agreementError } = await supabaseAdmin
        .from("agreement_acceptances")
        .select("*")
        .eq("clinician_id", auth.clinicianId)
        .eq("version", CURRENT_AGREEMENT_VERSION)
        .single();

      if (!acceptance) {
        return NextResponse.json(
          { error: "You must accept the agreement first", requiresAgreement: true },
          { status: 403 }
        );
      }

      // Get all eligible pools for this clinician
      const { data: eligibilities, error: eligError } = await supabaseAdmin
        .from("pool_eligibility")
        .select("pool_id, eligible, pool:pools(id, name, ls_project_id)")
        .eq("clinician_id", auth.clinicianId)
        .eq("eligible", true);

      if (eligError) throw eligError;

      // For each eligible pool, check if there are available tasks
      const poolsWithStatus = await Promise.all(
        (eligibilities || []).map(async (elig: any) => {
          const pool = elig.pool;

          // Count completed tasks for this clinician in this pool
          const { count: completedCount } = await supabaseAdmin
            .from("task_completions")
            .select("id", { count: "exact" })
            .eq("clinician_id", auth.clinicianId)
            .eq("pool_id", pool.id);

          return {
            id: pool.id,
            name: pool.name,
            lsProjectId: pool.ls_project_id,
            tasksCompleted: completedCount || 0,
          };
        })
      );

      return NextResponse.json({
        pools: poolsWithStatus,
        email: auth.email,
      });
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to fetch dashboard" },
        { status: 500 }
      );
    }
  });
}
