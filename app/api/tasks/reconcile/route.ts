import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { deleteAnnotation, listTasks } from "@/lib/labelstudio";

export const dynamic = "force-dynamic";

/**
 * Divergence between Label Studio and our completion records.
 *
 * An orphan is an annotation in LS with no completion row behind it — the
 * signature of a write that succeeded in LS and then failed to record. Submit
 * rolls those back itself; this endpoint is the safety net for the case where
 * the rollback also failed, and the monitor for whether that is happening.
 *
 * Operator endpoint: authorised by OPS_API_KEY, never a clinician session.
 */

interface Orphan {
  ls_task_id: number;
  annotation_id: number;
  created_at: string | null;
}

async function findOrphans(
  poolId: string,
  projectId: number
): Promise<{ orphans: Orphan[]; lsCount: number; dbCount: number }> {
  const tasks = await listTasks(projectId);

  const { data: completions } = await supabaseAdmin
    .from("task_completions")
    .select("ls_task_id")
    .eq("pool_id", poolId);

  // How many completions we hold per task, versus how many annotations exist.
  const recorded = new Map<number, number>();
  for (const row of completions ?? []) {
    recorded.set(row.ls_task_id, (recorded.get(row.ls_task_id) ?? 0) + 1);
  }

  const orphans: Orphan[] = [];
  let lsCount = 0;

  for (const task of tasks) {
    const annotations = (task.annotations ?? []) as {
      id: number;
      created_at?: string;
    }[];
    lsCount += annotations.length;

    const surplus = annotations.length - (recorded.get(task.id) ?? 0);
    if (surplus <= 0) continue;

    // The newest annotations are the ones a failed write would have left.
    for (const annotation of annotations.slice(-surplus)) {
      orphans.push({
        ls_task_id: task.id,
        annotation_id: annotation.id,
        created_at: annotation.created_at ?? null,
      });
    }
  }

  return { orphans, lsCount, dbCount: completions?.length ?? 0 };
}

function authorise(req: NextRequest): boolean {
  const expected = process.env.OPS_API_KEY;
  if (!expected) return false;
  const presented =
    req.headers.get("x-ops-key") ?? req.headers.get("x-delivery-key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return presented === expected;
}

async function resolvePool(poolId: string) {
  const { data } = await supabaseAdmin
    .from("pools")
    .select("id, name, ls_project_id")
    .eq("id", poolId)
    .maybeSingle();
  return data;
}

/** Reports divergence. Read-only — safe to run on a schedule. */
export async function GET(req: NextRequest) {
  if (!authorise(req)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const poolId = new URL(req.url).searchParams.get("poolId");
  if (!poolId) {
    return NextResponse.json(
      { error: "poolId is required." },
      { status: 400 }
    );
  }

  const pool = await resolvePool(poolId);
  if (!pool) return NextResponse.json({ error: "Not found." }, { status: 404 });

  try {
    const { orphans, lsCount, dbCount } = await findOrphans(
      pool.id,
      pool.ls_project_id
    );
    return NextResponse.json({
      pool: pool.name,
      checked_at: new Date().toISOString(),
      ls_annotations: lsCount,
      db_completions: dbCount,
      diverged: lsCount !== dbCount,
      orphans_found: orphans.length,
      orphans,
    });
  } catch (err) {
    console.error("[reconcile] check failed", err);
    return NextResponse.json(
      { error: "Could not reach the case store." },
      { status: 502 }
    );
  }
}

/** Deletes the orphan annotations found for a pool. Destructive. */
export async function POST(req: NextRequest) {
  if (!authorise(req)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const url = new URL(req.url);
  const poolId = url.searchParams.get("poolId");
  if (url.searchParams.get("action") !== "cleanup") {
    return NextResponse.json(
      { error: "Pass action=cleanup to delete orphan annotations." },
      { status: 400 }
    );
  }
  if (!poolId) {
    return NextResponse.json({ error: "poolId is required." }, { status: 400 });
  }

  const pool = await resolvePool(poolId);
  if (!pool) return NextResponse.json({ error: "Not found." }, { status: 404 });

  try {
    const { orphans } = await findOrphans(pool.id, pool.ls_project_id);
    let deleted = 0;
    const failures: number[] = [];

    for (const orphan of orphans) {
      try {
        await deleteAnnotation(orphan.annotation_id);
        deleted++;
      } catch {
        failures.push(orphan.annotation_id);
      }
    }

    return NextResponse.json({
      pool: pool.name,
      orphans_found: orphans.length,
      deleted,
      failed: failures,
    });
  } catch (err) {
    console.error("[reconcile] cleanup failed", err);
    return NextResponse.json(
      { error: "Could not reach the case store." },
      { status: 502 }
    );
  }
}
