"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnnotationWidget } from "@/components/AnnotationWidget";

interface EvalConfig {
  schema: {
    fields: any[];
  };
}

interface TaskConfig {
  evalConfig: EvalConfig;
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

  useEffect(() => {
    const pool = searchParams.get("poolId");
    if (!pool) {
      router.push("/dashboard");
      return;
    }
    setPoolId(pool);

    const fetchFirstTask = async () => {
      try {
        const startRes = await fetch("/api/tasks/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ poolId: pool }),
        });

        const startData = await startRes.json();

        if (!startRes.ok) {
          setError(startData.error || "Failed to load task");
          setLoading(false);
          return;
        }

        const configRes = await fetch("/api/tasks/config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            poolId: pool,
            taskId: startData.task.id,
          }),
        });

        const configData = await configRes.json();

        if (!configRes.ok) {
          setError(configData.error || "Failed to load task config");
          setLoading(false);
          return;
        }

        setTaskConfig(configData);
      } catch (err) {
        setError("An error occurred while loading the task");
      } finally {
        setLoading(false);
      }
    };

    fetchFirstTask();
  }, [searchParams, router]);

  const handleAnnotationSubmit = async (annotation: any) => {
    if (!taskConfig) return;

    try {
      const res = await fetch("/api/tasks/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          poolId,
          taskId: taskConfig.taskId,
          annotation,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit task");
      }

      setTasksCompleted((prev) => prev + 1);
      localStorage.removeItem(`task-${taskConfig.taskId}`);

      if (data.nextTask) {
        const configRes = await fetch("/api/tasks/config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            poolId,
            taskId: data.nextTask.id,
          }),
        });

        const configData = await configRes.json();

        if (configRes.ok) {
          setTaskConfig(configData);
          setError("");
        } else {
          setError("Failed to load next task config");
        }
      } else {
        setTaskConfig(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit task");
    }
  };

  const handleFlagTask = async () => {
    if (!taskConfig) return;

    try {
      const res = await fetch("/api/tasks/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ poolId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load next task");
      }

      localStorage.removeItem(`task-${taskConfig.taskId}`);
      setError("");

      if (data.task) {
        const configRes = await fetch("/api/tasks/config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            poolId,
            taskId: data.task.id,
          }),
        });

        const configData = await configRes.json();

        if (configRes.ok) {
          setTaskConfig(configData);
        } else {
          setError("Failed to load next task");
        }
      } else {
        setTaskConfig(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to flag task");
    }
  };

  /* Loading state */
  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="border-b border-hairline bg-surface p-6 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="h-6 w-32 bg-hairline rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-6 grid grid-cols-4 gap-6">
          <div className="col-span-1 space-y-4">
            <div className="h-96 bg-hairline rounded-lg animate-pulse" />
          </div>
          <div className="col-span-3 space-y-4">
            <div className="h-20 bg-hairline rounded animate-pulse" />
            <div className="h-64 bg-hairline rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  /* All tasks completed */
  if (!taskConfig) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="bg-surface border border-hairline rounded-lg shadow-xs p-12 max-w-md w-full text-center">
          <div className="text-6xl mb-6">✓</div>
          <h1 className="text-h1 text-ink font-semibold mb-3">
            All caught up!
          </h1>
          <p className="text-body text-slate mb-8 leading-relaxed">
            You've reviewed all available tasks in this project. Your thorough
            assessment helps improve clinical outcomes.
          </p>

          <div className="bg-accent/10 rounded-lg p-6 mb-8">
            <div className="text-display text-accent-deep font-semibold mb-1">
              {tasksCompleted}
            </div>
            <div className="text-small text-slate">
              {tasksCompleted === 1 ? "case reviewed" : "cases reviewed"}
            </div>
            <p className="text-caption text-muted mt-2">this session</p>
          </div>

          <p className="text-small text-slate mb-6">
            New cases arrive regularly. Check back later to continue your work.
          </p>

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-accent-deep text-white font-semibold py-3 rounded-md hover:bg-accent transition mb-3"
          >
            Back to Dashboard
          </button>

          <p className="text-caption text-muted">
            Questions?{" "}
            <a
              href="mailto:support@senebiclabs.com"
              className="text-accent hover:text-accent-deep font-semibold"
            >
              contact support
            </a>
          </p>
        </div>
      </div>
    );
  }

  /* Task workspace */
  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="border-b border-hairline bg-surface p-6 sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-h2 text-ink font-semibold">
              Case #{taskConfig.taskId}
            </h2>
            <p className="text-small text-slate mt-1">
              {tasksCompleted} reviewed this session
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-body font-semibold text-slate hover:text-ink transition"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-error/10 border-b border-error">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <p className="text-body font-semibold text-error">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6 pb-12">
        <AnnotationWidget
          evalConfig={taskConfig.evalConfig}
          taskData={taskConfig.taskData}
          poolId={poolId}
          taskId={taskConfig.taskId}
          onSubmit={handleAnnotationSubmit}
          onFlag={handleFlagTask}
        />
      </div>
    </div>
  );
}
