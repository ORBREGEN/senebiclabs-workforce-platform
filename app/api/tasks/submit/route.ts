import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { supabaseAdmin } from "@/lib/supabase";
import { submitAnnotation, getAvailableTasks } from "@/lib/labelstudio";

const CURRENT_AGREEMENT_VERSION = "1.0";

export async function POST(req: NextRequest) {
  return withAuth(req, async (req, auth) => {
    const { poolId, taskId, annotation } = await req.json();

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
    if (!annotation || typeof annotation !== "object") {
      return NextResponse.json(
        { error: "Invalid annotation data" },
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

      // 3. Get pool details (validate pool exists and get LS project)
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

      // 4. Check if already submitted (idempotency - prevent double-write)
      const { data: existing, error: checkError } = await supabaseAdmin
        .from("task_completions")
        .select("id")
        .eq("clinician_id", auth.clinicianId)
        .eq("ls_task_id", taskId)
        .single();

      if (existing) {
        // Already submitted — idempotent success without re-submitting to LS
        return NextResponse.json({
          success: true,
          nextTask: null,
          message: "Task already completed",
        });
      }

      // 5. Validate taskId belongs to this pool's LS project
      let taskExists = false;
      try {
        const allTasks = await getAvailableTasks(pool.ls_project_id, [], 999);
        taskExists = allTasks.some((t: any) => t.id === taskId);
      } catch (err) {
        console.error("Error validating task belongs to pool:", err);
        return NextResponse.json(
          { error: "Unable to validate task. Please try again." },
          { status: 500 }
        );
      }

      if (!taskExists) {
        return NextResponse.json(
          { error: "Task does not belong to this pool." },
          { status: 400 }
        );
      }

      // 6. CRITICAL: Submit to Label Studio FIRST
      // Only record locally if LS succeeds. Never diverge.
      let lsAnnotationId: number | null = null;

      try {
        const lsResult = await submitAnnotation(taskId, annotation);
        lsAnnotationId = lsResult.id; // Save for potential rollback
      } catch (lsError: any) {
        console.error("Label Studio submission failed:", lsError);
        // Don't record locally — LS write failed, so abort here
        return NextResponse.json(
          { error: "Failed to save annotation. Please try again." },
          { status: 500 }
        );
      }

      // 7. LS succeeded — now record locally
      const { error: insertError } = await supabaseAdmin
        .from("task_completions")
        .insert({
          clinician_id: auth.clinicianId,
          pool_id: poolId,
          ls_task_id: taskId,
          annotation_data: annotation,
        });

      if (insertError) {
        // UNIQUE constraint violation (23505) = already inserted (shouldn't happen, but handle gracefully)
        if (insertError.code === "23505") {
          return NextResponse.json({
            success: true,
            nextTask: null,
            message: "Task already completed",
          });
        }

        // CRITICAL: DB insert failed but LS annotation exists (orphan!)
        // Compensating rollback: DELETE the LS annotation to prevent divergence
        console.error("Database insert failed after LS success. Rolling back LS annotation...", insertError);
        if (lsAnnotationId) {
          try {
            await fetch(`${process.env.LABEL_STUDIO_API_URL}/api/annotations/${lsAnnotationId}/`, {
              method: "DELETE",
              headers: {
                Authorization: `Token ${process.env.LABEL_STUDIO_API_TOKEN}`,
              },
            });
            console.log(`[ROLLBACK] Deleted orphan LS annotation ${lsAnnotationId} on task ${taskId}`);
          } catch (rollbackError) {
            console.error(`[CRITICAL] Failed to rollback LS annotation ${lsAnnotationId}:`, rollbackError);
            // Even if rollback fails, we still return error to user
          }
        }

        return NextResponse.json(
          { error: "Failed to save locally. Please retry — your answer is still in Label Studio." },
          { status: 500 }
        );
      }

      // 8. Fetch next available task for smooth flow
      const { data: completions, error: complError } = await supabaseAdmin
        .from("task_completions")
        .select("ls_task_id")
        .eq("clinician_id", auth.clinicianId)
        .eq("pool_id", poolId);

      if (complError) {
        console.error("Error fetching completions:", complError);
        // Non-critical — still return success
        return NextResponse.json({
          success: true,
          nextTask: null,
        });
      }

      const completedTaskIds = (completions || []).map((c: any) => c.ls_task_id);
      const availableTasks = await getAvailableTasks(
        pool.ls_project_id,
        completedTaskIds,
        pool.maximum_annotations
      );

      // Return success + next task (or null if no more)
      return NextResponse.json({
        success: true,
        nextTask: availableTasks.length > 0 ? {
          id: availableTasks[0].id,
          data: availableTasks[0].data,
          annotations: availableTasks[0].annotations || [],
        } : null,
      });
    } catch (error) {
      console.error("Task submit error:", error);
      return NextResponse.json(
        { error: "An error occurred. Please try again or contact support." },
        { status: 500 }
      );
    }
  });
}
