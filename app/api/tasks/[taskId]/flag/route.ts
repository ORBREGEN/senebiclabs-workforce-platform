import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { supabaseAdmin } from "@/lib/supabase";
import { FORBIDDEN, requireEligiblePoolForTask } from "@/lib/gate";
import { getTask } from "@/lib/labelstudio";

export const dynamic = "force-dynamic";

/**
 * Skips a case without writing an annotation.
 *
 * Flagging is the escape hatch for a case a clinician cannot judge — it must
 * never produce a guess in Label Studio, so nothing is written there. The flag
 * only records that this clinician should not be served the case again.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  return withAuth(req, async (request, auth) => {
    const taskId = Number((await params).taskId);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return NextResponse.json({ error: "Unknown task." }, { status: 400 });
    }

    let reason = "";
    try {
      const body = await request.json().catch(() => ({}));
      reason = typeof body?.reason === "string" ? body.reason.slice(0, 500) : "";
    } catch {
      reason = "";
    }

    let lsTask;
    try {
      lsTask = await getTask(taskId);
    } catch {
      return FORBIDDEN();
    }

    const projectId = Number(
      (lsTask as unknown as { project?: number }).project
    );
    const pool = await requireEligiblePoolForTask(
      auth.clinicianId,
      taskId,
      projectId
    );
    if (!pool) return FORBIDDEN();

    const { error } = await supabaseAdmin.from("task_flags").insert({
      clinician_id: auth.clinicianId,
      pool_id: pool.id,
      ls_task_id: taskId,
      reason,
    });

    // 23505 = already flagged; that is the desired end state either way.
    if (error && error.code !== "23505") {
      console.error(`[flag] insert failed for task ${taskId}`, error);
      return NextResponse.json(
        { error: "We could not record that flag. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ flagged: true });
  });
}
