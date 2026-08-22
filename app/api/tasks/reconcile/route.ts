import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { supabaseAdmin } from "@/lib/supabase";

const LS_API_URL = process.env.LABEL_STUDIO_API_URL!;
const LS_API_TOKEN = process.env.LABEL_STUDIO_API_TOKEN!;

async function lsRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${LS_API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Token ${LS_API_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Label Studio API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

async function deleteAnnotation(annotationId: number): Promise<void> {
  await lsRequest(`/api/annotations/${annotationId}/`, {
    method: "DELETE",
  });
}

async function findOrphans(projectId: number): Promise<any[]> {
  // Fetch all tasks with annotations for this project
  const tasks = await lsRequest(
    `/api/projects/${projectId}/tasks/?limit=1000&include=annotations`
  );

  const orphans: any[] = [];

  for (const task of tasks) {
    for (const annotation of task.annotations || []) {
      // Check if this annotation has a matching task_completion record
      const { data: completion } = await supabaseAdmin
        .from("task_completions")
        .select("id")
        .eq("ls_task_id", task.id)
        .eq("annotation_data", JSON.stringify(annotation.result || []))
        .maybeSingle();

      if (!completion) {
        orphans.push({
          taskId: task.id,
          annotationId: annotation.id,
          createdBy: annotation.created_username,
          createdAt: annotation.created_at,
        });
      }
    }
  }

  return orphans;
}

export async function GET(req: NextRequest) {
  return withAuth(req, async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const projectId = searchParams.get("projectId");

      if (!projectId) {
        return NextResponse.json(
          { error: "projectId query parameter required" },
          { status: 400 }
        );
      }

      const orphans = await findOrphans(parseInt(projectId));

      return NextResponse.json({
        projectId: parseInt(projectId),
        orphansFound: orphans.length,
        orphans,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Reconciliation GET error:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Reconciliation failed",
        },
        { status: 500 }
      );
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const action = searchParams.get("action") || "audit";
      const body = await req.json();
      const { projectId, annotationIds } = body;

      if (!projectId) {
        return NextResponse.json(
          { error: "projectId required" },
          { status: 400 }
        );
      }

      if (action === "audit") {
        // Find and report orphans
        const orphans = await findOrphans(projectId);

        return NextResponse.json({
          action: "audit",
          projectId,
          orphansFound: orphans.length,
          orphans,
          timestamp: new Date().toISOString(),
          message:
            orphans.length > 0
              ? `Found ${orphans.length} orphan annotation(s). Use action=cleanup to delete.`
              : "No orphans found.",
        });
      }

      if (action === "cleanup") {
        if (!annotationIds || !Array.isArray(annotationIds)) {
          return NextResponse.json(
            { error: "annotationIds array required for cleanup action" },
            { status: 400 }
          );
        }

        const results = {
          deleted: 0,
          failed: 0,
          errors: [] as string[],
        };

        for (const annotationId of annotationIds) {
          try {
            await deleteAnnotation(annotationId);
            results.deleted++;
          } catch (err) {
            results.failed++;
            results.errors.push(
              `Failed to delete annotation ${annotationId}: ${
                err instanceof Error ? err.message : "Unknown error"
              }`
            );
          }
        }

        return NextResponse.json({
          action: "cleanup",
          projectId,
          deleted: results.deleted,
          failed: results.failed,
          errors: results.errors,
          timestamp: new Date().toISOString(),
          message: `Deleted ${results.deleted} orphan annotation(s). ${
            results.failed > 0 ? `${results.failed} deletions failed.` : ""
          }`,
        });
      }

      return NextResponse.json(
        { error: `Unknown action: ${action}` },
        { status: 400 }
      );
    } catch (error) {
      console.error("Reconciliation POST error:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Reconciliation failed",
        },
        { status: 500 }
      );
    }
  });
}
