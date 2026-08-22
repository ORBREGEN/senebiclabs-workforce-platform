import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { supabaseAdmin } from "@/lib/supabase";
import { FORBIDDEN, requireEligiblePoolForTask } from "@/lib/gate";
import {
  createAnnotation,
  deleteAnnotation,
  getTask,
  listTasks,
  selectNextTask,
} from "@/lib/labelstudio";
import {
  answersToLsResult,
  buildContext,
  caseIdFor,
  normalizeConfig,
  TranslationError,
  type RawEvalConfig,
} from "@/lib/eval-config";

export const dynamic = "force-dynamic";

/**
 * Records one completed review.
 *
 * The body is a plain { fieldname: value } map — the client knows nothing of
 * Label Studio's shapes. The order here matters: write to LS first, then record
 * the completion. If the LS write fails the request fails and the clinician
 * keeps their answers; if the completion insert fails afterwards, the LS
 * annotation is rolled back so the two never diverge.
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

    let answers: Record<string, unknown>;
    try {
      const body = await request.json();
      answers = body?.answers;
      if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
        return NextResponse.json(
          { error: "No answers were sent." },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json({ error: "Malformed request." }, { status: 400 });
    }

    // The task must belong to a project backing a pool this clinician holds.
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

    // Idempotency: the unique index on (clinician_id, ls_task_id) is the real
    // guard, this just turns a double-submit into a clean answer.
    const { data: existing } = await supabaseAdmin
      .from("task_completions")
      .select("id")
      .eq("clinician_id", auth.clinicianId)
      .eq("ls_task_id", taskId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this case." },
        { status: 409 }
      );
    }

    const raw = pool.evalConfig as RawEvalConfig | null;
    const config = normalizeConfig(raw);

    let result;
    try {
      result = answersToLsResult(config, answers);
    } catch (err) {
      if (err instanceof TranslationError) {
        return NextResponse.json({ error: err.message }, { status: 422 });
      }
      throw err;
    }

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Complete at least one field before submitting." },
        { status: 422 }
      );
    }

    // 1. Write to LS.
    let annotationId: number;
    try {
      annotationId = await createAnnotation(taskId, result);
    } catch (err) {
      console.error(`[submit] LS write failed for task ${taskId}`, err);
      return NextResponse.json(
        { error: "We could not save your review. Your answers are still here." },
        { status: 502 }
      );
    }

    // 2. Record the completion. On failure, undo the LS write.
    const { error: insertError } = await supabaseAdmin
      .from("task_completions")
      .insert({
        clinician_id: auth.clinicianId,
        pool_id: pool.id,
        ls_task_id: taskId,
        annotation_data: result,
      });

    if (insertError) {
      // The annotation is already in LS, so it must come back out — including
      // on 23505. That code means a concurrent request won the race and has
      // already recorded this completion, which makes ours the duplicate.
      try {
        await deleteAnnotation(annotationId);
      } catch (rollbackError) {
        // Left for the reconcile endpoint to sweep up.
        console.error(
          `[submit] ORPHAN annotation ${annotationId} on task ${taskId}`,
          rollbackError
        );
      }

      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "You have already reviewed this case." },
          { status: 409 }
        );
      }

      console.error(`[submit] completion insert failed for ${taskId}`, insertError);
      return NextResponse.json(
        { error: "We could not save your review. Your answers are still here." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      recorded: true,
      next: await nextTaskFor(auth.clinicianId, pool, raw),
    });
  });
}

async function nextTaskFor(
  clinicianId: string,
  pool: { id: string; name: string; lsProjectId: number; maxAnnotations: number | null },
  raw: RawEvalConfig | null
) {
  const [{ data: completions }, { data: flags }] = await Promise.all([
    supabaseAdmin
      .from("task_completions")
      .select("ls_task_id")
      .eq("clinician_id", clinicianId)
      .eq("pool_id", pool.id),
    supabaseAdmin
      .from("task_flags")
      .select("ls_task_id")
      .eq("clinician_id", clinicianId)
      .eq("pool_id", pool.id),
  ]);

  const seen = new Set<number>();
  for (const row of completions ?? []) seen.add(row.ls_task_id);
  for (const row of flags ?? []) seen.add(row.ls_task_id as number);

  let task;
  try {
    task = selectNextTask(
      await listTasks(pool.lsProjectId),
      seen,
      pool.maxAnnotations
    );
  } catch {
    return null;
  }

  if (!task) return null;

  const config = normalizeConfig(raw);
  const data = (task.data ?? {}) as Record<string, unknown>;

  return {
    task_id: task.id,
    pool: { id: pool.id, name: pool.name, purpose: config.purpose },
    case_id: caseIdFor(raw, data),
    context: buildContext(raw, data),
    eval_config: {
      instructions: config.instructions,
      fields: config.fields,
      classes: config.classes,
    },
    already_reviewed_count: (completions?.length ?? 0) + 1,
  };
}
