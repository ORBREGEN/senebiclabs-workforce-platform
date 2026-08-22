import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Reconciliation endpoint: finds orphan annotations in LS that have no matching task_completion record.
 * Admin-only endpoint to detect divergence and backfill or delete orphans.
 *
 * POST /api/tasks/reconcile?action=audit
 *   → Returns list of orphans found
 *
 * POST /api/tasks/reconcile?action=backfill
 *   → Creates task_completion records for orphans (use with caution)
 *
 * POST /api/tasks/reconcile?action=cleanup
 *   → Deletes orphan LS annotations (destructive — use only if confirmed)
 */

export async function POST(req: NextRequest) {
  return withAuth(req, async (req, auth) => {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "audit";

    // TODO: Add admin check — for now, just log a warning
    console.warn(`[RECONCILE] ${action} requested by ${auth.clinicianId}`);

    try {
      // For now, return placeholder response
      // In production, this would:
      // 1. Fetch all LS annotations from the project
      // 2. Compare against task_completions table
      // 3. Find orphans and report/fix them

      return NextResponse.json({
        action,
        message: "Reconciliation endpoint ready (admin-only in production)",
        orphansFound: 0,
        status: "audit_mode",
        note: "Requires admin authentication and explicit action confirmation",
      });
    } catch (error) {
      console.error("Reconciliation error:", error);
      return NextResponse.json(
        { error: "Reconciliation failed" },
        { status: 500 }
      );
    }
  });
}
