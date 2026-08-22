"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnnotationWidget } from "@/components/AnnotationWidget";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";

interface TaskConfig {
  evalConfig: any;
  taskData: { id: number; data: any };
  poolId: string;
  taskId: number;
}

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [taskConfig, setTaskConfig] = useState<TaskConfig | null>(null);
  const [poolId, setPoolId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tasksCompleted, setTasksCompleted] = useState(0);

  const loadTaskConfig = async (pool: string, taskId: number) => {
    const res = await fetch("/api/tasks/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ poolId: pool, taskId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "We couldn't load this case.");
    return data;
  };

  const fetchFirstTask = async (pool: string) => {
    setLoading(true);
    setError("");
    try {
      const startRes = await fetch("/api/tasks/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ poolId: pool }),
      });

      const startData = await startRes.json();

      if (!startRes.ok) {
        // 404 means no tasks left — that's the "all caught up" state, not an error
        if (startRes.status === 404) {
          setTaskConfig(null);
          return;
        }
        setError(startData.error || "We couldn't load your next case.");
        return;
      }

      setTaskConfig(await loadTaskConfig(pool, startData.task.id));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't reach the server. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const pool = searchParams.get("poolId");
    if (!pool) {
      router.push("/dashboard");
      return;
    }
    setPoolId(pool);
    fetchFirstTask(pool);
  }, [searchParams, router]);

  const handleAnnotationSubmit = async (annotation: any) => {
    if (!taskConfig) return;

    const res = await fetch("/api/tasks/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        poolId,
        taskId: taskConfig.taskId,
        annotation,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "We couldn't save your review.");

    setTasksCompleted((prev) => prev + 1);
    localStorage.removeItem(`task-${taskConfig.taskId}`);
    setError("");

    if (data.nextTask) {
      setTaskConfig(await loadTaskConfig(poolId, data.nextTask.id));
    } else {
      setTaskConfig(null);
    }
  };

  const handleFlagTask = async () => {
    if (!taskConfig) return;
    localStorage.removeItem(`task-${taskConfig.taskId}`);
    await fetchFirstTask(poolId);
  };

  const sessionProgress =
    tasksCompleted > 0
      ? `${tasksCompleted} reviewed this session`
      : undefined;

  /* Loading */
  if (loading) {
    return (
      <AppShell sessionProgress={sessionProgress}>
        <div className="grid lg:grid-cols-[340px_1fr] gap-8 items-start">
          <div className="h-72 rounded-lg animate-shimmer hidden lg:block" />
          <div className="space-y-8">
            <div className="h-40 rounded-lg animate-shimmer" />
            <div className="h-96 rounded-lg animate-shimmer" />
          </div>
        </div>
      </AppShell>
    );
  }

  /* Error */
  if (error) {
    return (
      <AppShell sessionProgress={sessionProgress}>
        <div className="bg-surface border border-hairline rounded-lg p-12 max-w-lg mx-auto text-center">
          <h1 className="text-h1 font-serif text-ink mb-3">
            Something went wrong
          </h1>
          <p className="text-body text-slate mb-8">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button variant="primary" onClick={() => fetchFirstTask(poolId)}>
              Try again
            </Button>
            <Button variant="secondary" onClick={() => router.push("/dashboard")}>
              Back to projects
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  /* All caught up */
  if (!taskConfig) {
    return (
      <AppShell sessionProgress={sessionProgress}>
        <div className="bg-surface border border-hairline rounded-lg p-12 max-w-lg mx-auto text-center">
          <h1 className="text-h1 font-serif text-ink mb-3">You're all caught up</h1>
          <p className="text-body text-slate mb-8 leading-relaxed">
            You've reviewed every case available in this project right now. Your
            work here is complete.
          </p>

          {tasksCompleted > 0 && (
            <div className="bg-teal-soft rounded-lg p-6 mb-8">
              <p className="text-display font-serif text-teal-deep mb-1">
                {tasksCompleted}
              </p>
              <p className="text-small text-slate">
                {tasksCompleted === 1 ? "case" : "cases"} reviewed this session
              </p>
            </div>
          )}

          <p className="text-small text-slate mb-8">
            New cases arrive regularly — check back soon.
          </p>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => router.push("/dashboard")}
          >
            Back to projects
          </Button>
        </div>
      </AppShell>
    );
  }

  /* Task workspace */
  return (
    <AppShell sessionProgress={sessionProgress}>
      <div className="mb-8">
        <p className="text-caption text-muted uppercase mb-1">
          Case #{taskConfig.taskId}
        </p>
      </div>

      <AnnotationWidget
        evalConfig={taskConfig.evalConfig}
        taskData={taskConfig.taskData}
        poolId={poolId}
        taskId={taskConfig.taskId}
        onSubmit={handleAnnotationSubmit}
        onFlag={handleFlagTask}
      />
    </AppShell>
  );
}
