import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { supabaseAdmin } from "@/lib/supabase";
import { getAvailableTasks } from "@/lib/labelstudio";

const CURRENT_AGREEMENT_VERSION = "1.0";

export async function POST(req: NextRequest) {
  return withAuth(req, async (req, auth) => {
    const { poolId, taskId } = await req.json();

    // Input validation
    if (!poolId || typeof poolId !== "string") {
      return NextResponse.json(
        { error: "Invalid poolId" },
        { status: 400 }
      );
    }
    if (!taskId || typeof taskId !== "number") {
      return NextResponse.json(
        { error: "Invalid taskId" },
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
          { error: "Agreement not accepted." },
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
          { error: "Not eligible for this pool." },
          { status: 403 }
        );
      }

      // 3. Get pool with eval_config and LS project ID
      const { data: pool, error: poolError } = await supabaseAdmin
        .from("pools")
        .select("eval_config, ls_project_id, maximum_annotations")
        .eq("id", poolId)
        .single();

      if (poolError || !pool) {
        return NextResponse.json(
          { error: "Pool not found." },
          { status: 404 }
        );
      }

      // 4. Validate taskId belongs to this pool's LS project (SECURITY GATE)
      let task: any = null;
      try {
        const allTasks = await getAvailableTasks(pool.ls_project_id, [], 999);
        task = allTasks.find((t: any) => t.id === taskId);
      } catch (lsError: any) {
        console.error("Label Studio error validating task:", lsError);
        return NextResponse.json(
          { error: "Unable to validate task. Please try again." },
          { status: 500 }
        );
      }

      if (!task) {
        return NextResponse.json(
          { error: "Task not found or does not belong to this pool." },
          { status: 404 }
        );
      }

      // Return config + task data
      return NextResponse.json({
        evalConfig: pool.eval_config || { schema: { fields: [] } },
        taskData: {
          id: task.id,
          data: task.data,
        },
        poolId,
        taskId,
      });
    } catch (error) {
      console.error("Task config error:", error);
      return NextResponse.json(
        { error: "An error occurred. Please try again or contact support." },
        { status: 500 }
      );
    }
  });
}
