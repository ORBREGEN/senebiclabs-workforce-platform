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

// Get available tasks (limit to first 50 for performance)
export async function getAvailableTasks(
  projectId: number,
  completedTaskIds: number[],
  maxAnnotations?: number
): Promise<any[]> {
  // Add limit parameter to LS API
  const tasks = await lsRequest(`/api/projects/${projectId}/tasks/?limit=100`);

  // Filter out:
  // 1. Tasks this clinician already completed
  // 2. Tasks already at overlap (is_labeled true or annotation count >= maxAnnotations)
  const available = tasks.filter((task: any) => {
    // Skip if already done by this clinician
    if (completedTaskIds.includes(task.id)) return false;

    // Skip if already labeled (reached overlap)
    if (task.is_labeled) return false;

    // Skip if at max annotations (only if maxAnnotations is specified)
    if (maxAnnotations && task.total_annotations >= maxAnnotations) {
      return false;
    }

    return true;
  });

  return available.slice(0, 10); // Return up to 10 available tasks
}

// Get a specific task by ID
export async function getTask(projectId: number, taskId: number): Promise<any> {
  const endpoint = `/api/projects/${projectId}/tasks/${taskId}/`;
  try {
    return await lsRequest(endpoint);
  } catch (error) {
    console.error(`Failed to fetch task ${taskId}:`, error);
    throw error;
  }
}

// Submit an annotation to Label Studio (task-based endpoint)
export async function submitAnnotation(
  taskId: number,
  annotationData: any
): Promise<any> {
  const payload = {
    result: annotationData.result || [],
    completed_by: 1,
    was_cancelled: false,
  };

  const response = await fetch(`${LS_API_URL}/api/tasks/${taskId}/annotations/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${LS_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`Label Studio annotation error ${response.status}:`, text);
    throw new Error(
      `Failed to save annotation: ${response.status} ${response.statusText}`
    );
  }

  const result = await response.json();
  console.log(`[LS] Annotation ${result.id} recorded on task ${taskId}`);
  return result;
}

// Get project details
export async function getProject(projectId: number): Promise<any> {
  return lsRequest(`/api/projects/${projectId}/`);
}
