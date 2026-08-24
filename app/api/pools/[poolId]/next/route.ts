import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { supabaseAdmin } from "@/lib/supabase";
import { FORBIDDEN, requireEligiblePool } from "@/lib/gate";
import { findNextTask } from "@/lib/labelstudio";
import {
  buildContext,
  caseIdFor,
  normalizeConfig,
  type RawEvalConfig,
} from "@/lib/eval-config";

export const dynamic = "force-dynamic";

/**
 * The next task in a pool for this clinician.
 *
 * 403 if they are not gated into the pool, 204 once the pool is drained.
 * The response carries the task payload and the project's config — never an
 * LS id the client could act on directly, and never an LS URL or token.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ poolId: string }> }
) {
  return withAuth(req, async (_req, auth) => {
    const { poolId } = await params;

    const pool = await requireEligiblePool(auth.clinicianId, poolId);
    if (!pool) return FORBIDDEN();

    const [{ data: completions }, flagged] = await Promise.all([
      supabaseAdmin
        .from("task_completions")
        .select("ls_task_id")
        .eq("clinician_id", auth.clinicianId)
        .eq("pool_id", pool.id),
      loadFlaggedTaskIds(auth.clinicianId, pool.id),
    ]);

    const seen = new Set<number>(flagged);
    for (const row of completions ?? []) seen.add(row.ls_task_id);

    let task;
    try {
      task = await findNextTask(pool.lsProjectId, seen, pool.maxAnnotations);
    } catch (err) {
      console.error(`[next] LS unreachable for pool ${pool.id}`, err);
      return NextResponse.json(
        { error: "We could not reach the case store. Try again in a moment." },
        { status: 502 }
      );
    }

    if (!task) return new NextResponse(null, { status: 204 });

    const raw = pool.evalConfig as RawEvalConfig | null;
    const config = normalizeConfig(raw);
    const data = (task.data ?? {}) as Record<string, unknown>;

    return NextResponse.json({
      task_id: task.id,
      pool: { id: pool.id, name: pool.name, purpose: config.purpose },
      case_id: caseIdFor(raw, data),
      context: buildContext(raw, data),
      eval_config: {
        instructions: config.instructions,
        fields: config.fields,
        classes: config.classes,
      },
      already_reviewed_count: completions?.length ?? 0,
    });
  });
}

/** Flags are optional infrastructure; a missing table must not break serving. */
async function loadFlaggedTaskIds(
  clinicianId: string,
  poolId: string
): Promise<number[]> {
  const { data, error } = await supabaseAdmin
    .from("task_flags")
    .select("ls_task_id")
    .eq("clinician_id", clinicianId)
    .eq("pool_id", poolId);

  if (error) return [];
  return (data ?? []).map((row) => row.ls_task_id as number);
}
