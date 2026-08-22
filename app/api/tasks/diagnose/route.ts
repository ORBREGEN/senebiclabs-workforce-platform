import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Diagnostic endpoint: identifies orphan annotations (exist in LS but no DB record)
 * and can reconcile them.
 *
 * GET /api/tasks/diagnose?poolId=<pool_id>
 *   → Returns orphan count and details
 *
 * POST /api/tasks/diagnose?poolId=<pool_id>&action=cleanup
 *   → Deletes orphan LS annotations (admin only)
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const poolId = searchParams.get("poolId");

  if (!poolId) {
    return NextResponse.json({ error: "poolId required" }, { status: 400 });
  }

  try {
    // Get pool's LS project ID
    const { data: pool } = await supabaseAdmin
      .from("pools")
      .select("ls_project_id")
      .eq("id", poolId)
      .single();

    if (!pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    // Get all tasks with annotations from LS project
    const lsUrl = `${process.env.LABEL_STUDIO_API_URL}/api/tasks/?project=${pool.ls_project_id}&limit=500`;
    const lsRes = await fetch(lsUrl, {
      headers: { Authorization: `Token ${process.env.LABEL_STUDIO_API_TOKEN}` },
    });
    const lsData = await lsRes.json();
    const lsTasks = lsData.tasks || [];

    // Get annotated task IDs (have annotations)
    const lsAnnotatedTaskIds = lsTasks
      .filter((t: any) => t.total_annotations > 0)
      .map((t: any) => t.id);

    // Get task_completions task IDs for this pool
    const { data: completions } = await supabaseAdmin
      .from("task_completions")
      .select("ls_task_id")
      .eq("pool_id", poolId);

    const dbTaskIds = (completions || []).map((c: any) => c.ls_task_id);

    // Find orphans: LS annotations with no matching DB record
    const orphanLsTaskIds = lsAnnotatedTaskIds.filter(
      (id: number) => !dbTaskIds.includes(id)
    );

    // Get orphan annotations
    const orphanAnnotations: any[] = [];
    for (const taskId of orphanLsTaskIds) {
      const task = lsTasks.find((t: any) => t.id === taskId);
      if (task?.annotations && task.annotations.length > 0) {
        for (const anno of task.annotations) {
          orphanAnnotations.push({
            annotationId: anno.id,
            taskId: taskId,
            taskData: task.data,
          });
        }
      }
    }

    return NextResponse.json({
      poolId,
      lsProjectId: pool.ls_project_id,
      lsAnnotatedTaskIds: lsAnnotatedTaskIds,
      dbTaskIds: dbTaskIds,
      orphanCount: orphanAnnotations.length,
      orphans: orphanAnnotations,
      dbRecordCount: dbTaskIds.length,
      lsAnnotationCount: lsAnnotatedTaskIds.length,
      status:
        orphanAnnotations.length === 0
          ? "✓ No divergence"
          : `⚠ ${orphanAnnotations.length} orphan(s) found`,
    });
  } catch (error) {
    console.error("Diagnose error:", error);
    return NextResponse.json({ error: "Diagnosis failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const poolId = searchParams.get("poolId");
  const action = searchParams.get("action");

  if (!poolId || action !== "cleanup") {
    return NextResponse.json(
      { error: "poolId and action=cleanup required" },
      { status: 400 }
    );
  }

  try {
    // Get pool
    const { data: pool } = await supabaseAdmin
      .from("pools")
      .select("ls_project_id")
      .eq("id", poolId)
      .single();

    if (!pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    // Fetch orphans
    const lsUrl = `${process.env.LABEL_STUDIO_API_URL}/api/tasks/?project=${pool.ls_project_id}&limit=500`;
    const lsRes = await fetch(lsUrl, {
      headers: { Authorization: `Token ${process.env.LABEL_STUDIO_API_TOKEN}` },
    });
    const lsData = await lsRes.json();
    const lsTasks = lsData.tasks || [];

    const lsAnnotatedTaskIds = lsTasks
      .filter((t: any) => t.total_annotations > 0)
      .map((t: any) => t.id);

    const { data: completions } = await supabaseAdmin
      .from("task_completions")
      .select("ls_task_id")
      .eq("pool_id", poolId);

    const dbTaskIds = (completions || []).map((c: any) => c.ls_task_id);
    const orphanLsTaskIds = lsAnnotatedTaskIds.filter(
      (id: number) => !dbTaskIds.includes(id)
    );

    // Delete orphan annotations
    let deletedCount = 0;
    for (const taskId of orphanLsTaskIds) {
      const task = lsTasks.find((t: any) => t.id === taskId);
      if (task?.annotations) {
        for (const anno of task.annotations) {
          try {
            await fetch(
              `${process.env.LABEL_STUDIO_API_URL}/api/annotations/${anno.id}/`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Token ${process.env.LABEL_STUDIO_API_TOKEN}`,
                },
              }
            );
            deletedCount++;
          } catch (e) {
            console.error(`Failed to delete annotation ${anno.id}:`, e);
          }
        }
      }
    }

    return NextResponse.json({
      poolId,
      deletedCount,
      status: `✓ Cleaned ${deletedCount} orphan annotation(s)`,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
