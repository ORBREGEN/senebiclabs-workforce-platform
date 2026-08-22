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
      localStorage.removeItem(`task-${taskConfig.taskId}`); // Clear saved form

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
      // Flag the task by skipping it without submitting an annotation
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

      localStorage.removeItem(`task-${taskConfig.taskId}`); // Clear saved form
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="border-b border-gray-200 sticky top-0 z-10 bg-white">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left column skeleton */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-gray-200 rounded-lg h-32 animate-pulse"></div>
            </div>
            {/* Right column skeleton */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gray-200 rounded-lg h-20 animate-pulse"></div>
              <div className="bg-gray-200 rounded-lg h-40 animate-pulse"></div>
              <div className="bg-gray-200 rounded-lg h-12 animate-pulse"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!taskConfig) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <span className="text-6xl">✓</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            All caught up!
          </h1>
          <p className="text-gray-600 mb-8">
            You've reviewed all available tasks. Great work — your feedback helps improve clinical care.
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-8">
            <div className="text-4xl font-bold text-blue-600 mb-1">
              {tasksCompleted}
            </div>
            <div className="text-gray-700 font-medium">
              {tasksCompleted === 1 ? "case reviewed" : "cases reviewed"}
            </div>
            <p className="text-sm text-gray-600 mt-2">this session</p>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            New tasks arrive regularly. Check back later to continue earning.
          </p>

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 mb-4"
          >
            Back to Dashboard
          </button>

          <p className="text-xs text-gray-500">
            Questions?{" "}
            <a
              href="mailto:support@senebiclabs.com"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              support@senebiclabs.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200 sticky top-0 z-10 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Task #{taskConfig.taskId}
            </h2>
            <p className="text-sm text-gray-500">
              {tasksCompleted} completed this session
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
          >
            Stop
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <AnnotationWidget
          evalConfig={taskConfig.evalConfig}
          taskData={taskConfig.taskData}
          poolId={poolId}
          taskId={taskConfig.taskId}
          onSubmit={handleAnnotationSubmit}
          onFlag={handleFlagTask}
        />
      </main>
    </div>
  );
}