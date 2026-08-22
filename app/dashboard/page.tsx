"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard, EmptyState } from "@/components/ui/States";

interface Pool {
  id: string;
  name: string;
  lsProjectId: number;
  tasksCompleted: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/dashboard", {
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load dashboard");
          return;
        }

        setPools(data.pools || []);
        setEmail(data.email);
      } catch (err) {
        setError("An error occurred while loading the dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  const totalReviewed = pools.reduce((sum, p) => sum + p.tasksCompleted, 0);

  return (
    <AppShell showHeader email={email}>
      {loading && (
        <div className="space-y-8">
          <SkeletonCard count={3} />
        </div>
      )}

      {!loading && (
        <div className="max-w-6xl mx-auto">
          {/* Header — Remotasks style */}
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-base text-slate">
              Select a project to start tasking and earning
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {pools.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No projects available"
              description="Complete a calibration assessment to unlock available task projects."
              action={{
                label: "Go to Training",
                onClick: () => router.push("/calibration"),
              }}
            />
          ) : (
            <>
              {/* Stats Row — mirrors Remotasks earnings / progress summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Available Projects
                  </p>
                  <p className="text-3xl font-semibold text-ink">{pools.length}</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Total Reviewed
                  </p>
                  <p className="text-3xl font-semibold text-ink">{totalReviewed}</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm col-span-2 sm:col-span-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Active Status
                  </p>
                  <p className="text-3xl font-semibold text-emerald-600">
                    {pools.filter((p) => p.tasksCompleted > 0).length > 0
                      ? "Tasking"
                      : "Ready"}
                  </p>
                </div>
              </div>

              {/* Active Projects section */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">
                  Active Projects
                </h2>
                <span className="text-sm text-gray-500">
                  {pools.length} project{pools.length !== 1 ? "s" : ""} enabled
                </span>
              </div>

              {/* Project Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {pools.map((pool) => {
                  const progress = Math.min((pool.tasksCompleted / 10) * 100, 100);
                  const isActive = pool.tasksCompleted > 0;

                  return (
                    <Link
                      href={`/tasks?poolId=${pool.id}`}
                      key={pool.id}
                      className="group"
                    >
                      <Card className="h-full border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all duration-200 cursor-pointer bg-white">
                        <CardContent className="p-6 flex flex-col h-full">
                          {/* Title + Badge */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base font-semibold text-ink group-hover:text-emerald-700 transition-colors truncate">
                                {pool.name}
                              </CardTitle>
                              <CardDescription className="mt-1 text-sm text-gray-500">
                                {pool.tasksCompleted} task
                                {pool.tasksCompleted !== 1 ? "s" : ""} reviewed
                              </CardDescription>
                            </div>
                            {isActive ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 shrink-0">
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-50 text-gray-600 border-gray-100 shrink-0">
                                New
                              </Badge>
                            )}
                          </div>

                          {/* Progress */}
                          <div className="mb-6 mt-auto">
                            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                              <span>Progress</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          {/* CTA — Remotasks language */}
                          <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium">
                            Start tasking
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}