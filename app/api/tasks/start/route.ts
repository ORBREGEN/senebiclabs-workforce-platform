import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { supabaseAdmin } from "@/lib/supabase";
import { getAvailableTasks } from "@/lib/labelstudio";

const CURRENT_AGREEMENT_VERSION = "1.0";

export async function POST(req: NextRequest) {
  return withAuth(req, async (req, auth) => {
    const { poolId } = await req.json();

    // Input validation
    if (!poolId || typeof poolId !== "string") {
      return NextResponse.json(
        { error: "Invalid poolId" },
        { status: 400 }
      );
    }

    try {
      // 1. Check agreement acceptance (GATE 1)
      const { data: acceptance } = await supabaseAdmin
        .from("agreement_acceptances")
        .select("*")
        .eq("clinician_id", auth.clinicianId)
        .eq("version", CURRENT_AGREEMENT_VERSION)
        .single();

      if (!acceptance) {
        return NextResponse.json(
          { error: "Agreement not accepted. Please review and accept to continue." },
          { status: 403 }
        );
      }

      // 2. Verify eligibility for pool (GATE 2 - CONFIDENTIALITY)
      const { data: eligibility, error: eligError } = await supabaseAdmin
        .from("pool_eligibility")
        .select("*")
        .eq("clinician_id", auth.clinicianId)
        .eq("pool_id", poolId)
        .eq("eligible", true)
        .single();

      if (eligError || !eligibility) {
        return NextResponse.json(
          { error: "You are not eligible for this pool." },
          { status: 403 }
        );
      }

      // 3. Get pool details (validate pool exists, get LS project + overlap settings)
      const { data: pool, error: poolError } = await supabaseAdmin
        .from("pools")
        .select("ls_project_id, maximum_annotations")
        .eq("id", poolId)
        .single();

      if (poolError || !pool) {
        return NextResponse.json(
          { error: "Pool not found." },
          { status: 404 }
        );
      }

      // 4. Get tasks already completed by this clinician in this pool
      const { data: completions, error: complError } = await supabaseAdmin
        .from("task_completions")
        .select("ls_task_id")
        .eq("clinician_id", auth.clinicianId)
        .eq("pool_id", poolId);

      if (complError) {
        console.error("Error fetching completions:", complError);
        throw complError;
      }

      const completedTaskIds = (completions || []).map((c: any) => c.ls_task_id);

      // 5. Get available tasks from Label Studio (excludes: already completed by this clinician, at overlap limit)
      let availableTasks: any[] = [];
      try {
        availableTasks = await getAvailableTasks(
          pool.ls_project_id,
          completedTaskIds,
          pool.maximum_annotations
        );
      } catch (lsError: any) {
        console.error("Label Studio error:", lsError);
        return NextResponse.json(
          { error: "Unable to load tasks. Please try again." },
          { status: 500 }
        );
      }

      if (availableTasks.length === 0) {
        return NextResponse.json(
          { error: "No tasks available. Check back later." },
          { status: 404 }
        );
      }

      // Return first available task
      const firstTask = availableTasks[0];
      return NextResponse.json({
        task: {
          id: firstTask.id,
          data: firstTask.data,
          annotations: firstTask.annotations || [],
        },
        poolId,
      });
    } catch (error) {
      console.error("Task start error:", error);
      return NextResponse.json(
        { error: "An error occurred. Please try again or contact support." },
        { status: 500 }
      );
    }
  });
}
