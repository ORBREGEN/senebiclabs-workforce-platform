import "server-only";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "./supabase";

/**
 * The confidentiality gate.
 *
 * Every pool- or task-scoped request re-checks eligibility here against the
 * database. Nothing about eligibility is ever taken from the client, and a
 * refusal reveals nothing about the pool — same 403 body whether the pool
 * exists or not.
 */

export interface GatedPool {
  id: string;
  name: string;
  lsProjectId: number;
  maxAnnotations: number | null;
  evalConfig: Record<string, unknown> | null;
}

export const FORBIDDEN = () =>
  NextResponse.json(
    { error: "You are not eligible for this pool." },
    { status: 403 }
  );

/**
 * Resolves a pool for a clinician, or null if they may not have it.
 *
 * Returns null for "does not exist" and for "exists but not eligible" alike, so
 * callers cannot leak the difference.
 */
export async function requireEligiblePool(
  clinicianId: string,
  poolId: string
): Promise<GatedPool | null> {
  if (!poolId || typeof poolId !== "string") return null;

  const { data: eligibility } = await supabaseAdmin
    .from("pool_eligibility")
    .select("pool_id")
    .eq("clinician_id", clinicianId)
    .eq("pool_id", poolId)
    .eq("eligible", true)
    .maybeSingle();

  if (!eligibility) return null;

  const { data: pool } = await supabaseAdmin
    .from("pools")
    .select("id, name, ls_project_id, eval_config, maximum_annotations")
    .eq("id", poolId)
    .maybeSingle();

  if (!pool) return null;

  return {
    id: pool.id,
    name: pool.name,
    lsProjectId: pool.ls_project_id,
    maxAnnotations: pool.maximum_annotations ?? null,
    evalConfig: pool.eval_config ?? null,
  };
}

/**
 * Resolves the pool that owns an LS task, checking eligibility first.
 *
 * A task id alone is not authority to write: the task must belong to a project
 * backing a pool this clinician is gated into.
 */
export async function requireEligiblePoolForTask(
  clinicianId: string,
  lsTaskId: number,
  projectId: number
): Promise<GatedPool | null> {
  const { data: rows } = await supabaseAdmin
    .from("pool_eligibility")
    .select("pool_id, pools!inner(id, name, ls_project_id, eval_config, maximum_annotations)")
    .eq("clinician_id", clinicianId)
    .eq("eligible", true);

  const match = (rows ?? [])
    .map((row) => (row as unknown as { pools: Record<string, unknown> }).pools)
    .find((pool) => pool && Number(pool.ls_project_id) === projectId);

  if (!match) return null;

  return {
    id: String(match.id),
    name: String(match.name),
    lsProjectId: Number(match.ls_project_id),
    maxAnnotations: (match.maximum_annotations as number | null) ?? null,
    evalConfig: (match.eval_config as Record<string, unknown> | null) ?? null,
  };
}
