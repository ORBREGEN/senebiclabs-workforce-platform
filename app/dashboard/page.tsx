"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        {/* Header skeleton */}
        <div className="border-b border-hairline bg-surface p-6">
          <div className="max-w-6xl mx-auto">
            <div className="h-8 w-48 bg-hairline rounded animate-pulse mb-3" />
            <div className="h-5 w-96 bg-hairline rounded animate-pulse" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="p-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-hairline rounded animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-64 bg-hairline rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="border-b border-hairline bg-surface shadow-xs sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-h1 text-ink font-semibold">Senebiclabs</h1>
            <p className="text-small text-slate">Clinical Review</p>
          </div>
          <div className="text-right">
            <p className="text-small text-slate">{email}</p>
            <button
              onClick={() => router.push("/api/auth/logout")}
              className="text-small text-accent hover:text-accent-deep transition mt-1"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-6 max-w-6xl mx-auto">
        {/* Welcome section */}
        <div className="mb-12">
          <h2 className="text-display text-ink font-semibold mb-2">
            Welcome back
          </h2>
          <p className="text-body text-slate">
            Select a project to begin your review work.
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-error/10 border border-error rounded-lg p-6 mb-8">
            <p className="text-body font-semibold text-error mb-3">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-small text-error hover:text-error/80 font-semibold"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {pools.length === 0 && !error && (
          <div className="border border-hairline rounded-lg p-12 text-center bg-surface">
            <p className="text-4xl mb-4">📋</p>
            <h3 className="text-h2 text-ink font-semibold mb-2">
              No projects available
            </h3>
            <p className="text-body text-slate mb-6">
              Complete a calibration assessment to unlock available task projects.
            </p>
            <button
              onClick={() => router.push("/calibration")}
              className="bg-accent-deep text-white font-semibold py-3 px-8 rounded-md hover:bg-accent transition"
            >
              Go to Training
            </button>
          </div>
        )}

        {/* Stats row */}
        {pools.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-12">
              <div className="bg-surface border border-hairline rounded-lg shadow-xs p-6">
                <p className="text-caption font-semibold text-muted uppercase tracking-wide mb-2">
                  Projects
                </p>
                <p className="text-display text-ink font-semibold">
                  {pools.length}
                </p>
              </div>
              <div className="bg-surface border border-hairline rounded-lg shadow-xs p-6">
                <p className="text-caption font-semibold text-muted uppercase tracking-wide mb-2">
                  Total Reviewed
                </p>
                <p className="text-display text-ink font-semibold">
                  {totalReviewed}
                </p>
              </div>
              <div className="bg-surface border border-hairline rounded-lg shadow-xs p-6">
                <p className="text-caption font-semibold text-muted uppercase tracking-wide mb-2">
                  Status
                </p>
                <p className="text-display text-success font-semibold">
                  {totalReviewed > 0 ? "Active" : "Ready"}
                </p>
              </div>
            </div>

            {/* Projects grid */}
            <div>
              <h3 className="text-h2 text-ink font-semibold mb-6">
                Available Projects
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {pools.map((pool) => {
                  const progress = Math.min((pool.tasksCompleted / 10) * 100, 100);

                  return (
                    <Link
                      href={`/tasks?poolId=${pool.id}`}
                      key={pool.id}
                      className="group"
                    >
                      <div className="bg-surface border border-hairline rounded-lg shadow-xs hover:shadow-md hover:border-accent transition h-full p-6 flex flex-col">
                        {/* Title + status */}
                        <div className="mb-4 flex-1">
                          <h4 className="text-h2 text-ink font-semibold group-hover:text-accent transition mb-2">
                            {pool.name}
                          </h4>
                          <p className="text-small text-slate">
                            {pool.tasksCompleted}{" "}
                            {pool.tasksCompleted === 1
                              ? "case reviewed"
                              : "cases reviewed"}
                          </p>
                        </div>

                        {/* Progress */}
                        <div className="mb-6">
                          <div className="flex justify-between text-caption text-muted mb-2">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="h-1.5 bg-hairline rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent-deep transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* CTA */}
                        <button className="w-full bg-accent-deep hover:bg-accent text-white font-semibold py-3 rounded-md transition text-small">
                          Start Reviewing
                        </button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
