import "server-only";

/**
 * Label Studio client. Server-only, by construction.
 *
 * The `server-only` import above makes the build fail if any of this is ever
 * pulled into a client component. Clinicians authenticate to this platform and
 * never receive an LS URL or token — every read and write goes server-to-server
 * through the functions here.
 */

const LS_URL = process.env.LABEL_STUDIO_API_URL;
const LS_TOKEN = process.env.LABEL_STUDIO_API_TOKEN;

export interface LsTask {
  id: number;
  data: Record<string, unknown>;
  is_labeled: boolean;
  total_annotations: number;
  annotations?: { id: number }[];
}

export interface LsResult {
  from_name: string;
  to_name: string;
  type: string;
  value: Record<string, unknown>;
}

class LabelStudioError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "LabelStudioError";
  }
}

async function ls<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!LS_URL || !LS_TOKEN) {
    throw new LabelStudioError("Label Studio is not configured", 500);
  }

  const res = await fetch(`${LS_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Token ${LS_TOKEN}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    // Body may carry detail useful in our logs — never forwarded to the client.
    const detail = await res.text().catch(() => "");
    throw new LabelStudioError(
      `LS ${init.method ?? "GET"} ${path} → ${res.status} ${detail.slice(0, 300)}`,
      res.status
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface LsProject {
  id: number;
  task_number: number;
  num_tasks_with_annotations: number;
}

/** Project-level counts. Far cheaper than listing tasks just to size a pool. */
export async function getProject(projectId: number): Promise<LsProject> {
  return ls<LsProject>(`/api/projects/${projectId}/`);
}

/** Tasks in a project, newest page first. LS caps this; we page conservatively. */
export async function listTasks(
  projectId: number,
  limit = 200
): Promise<LsTask[]> {
  return ls<LsTask[]>(`/api/projects/${projectId}/tasks/?limit=${limit}`);
}

export async function getTask(taskId: number): Promise<LsTask> {
  return ls<LsTask>(`/api/tasks/${taskId}/`);
}

/**
 * Writes an annotation against the task-based endpoint.
 * Returns the new annotation id so a failed follow-up write can roll it back.
 */
export async function createAnnotation(
  taskId: number,
  result: LsResult[]
): Promise<number> {
  const created = await ls<{ id: number }>(
    `/api/tasks/${taskId}/annotations/`,
    {
      method: "POST",
      body: JSON.stringify({
        result,
        was_cancelled: false,
      }),
    }
  );
  return created.id;
}

/** Compensating rollback: used only when the completion record fails to save. */
export async function deleteAnnotation(annotationId: number): Promise<void> {
  await ls<void>(`/api/annotations/${annotationId}/`, { method: "DELETE" });
}

/**
 * The next task in a project this clinician may work on.
 *
 * Excludes anything they already completed or flagged, anything LS considers
 * finished, and anything that has reached the pool's annotation ceiling.
 */
export function selectNextTask(
  tasks: LsTask[],
  excludeTaskIds: Set<number>,
  maxAnnotations: number | null
): LsTask | null {
  const available = tasks.filter((task) => {
    if (excludeTaskIds.has(task.id)) return false;
    if (task.is_labeled) return false;
    if (maxAnnotations !== null && task.total_annotations >= maxAnnotations) {
      return false;
    }
    return true;
  });

  // Lowest id first, so a pool is worked front-to-back and overlap fills evenly.
  available.sort((a, b) => a.id - b.id);
  return available[0] ?? null;
}

export { LabelStudioError };
