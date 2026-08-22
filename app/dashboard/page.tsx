"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

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

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard", { credentials: "include" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "We couldn't load your projects just now.");
        return;
      }

      setPools(data.pools || []);
      setEmail(data.email);
    } catch (err) {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const totalReviewed = pools.reduce((sum, p) => sum + p.tasksCompleted, 0);

  return (
    <AppShell email={email}>
      {/* Greeting */}
      <div className="mb-12">
        <h1 className="text-display font-serif text-ink mb-2">Welcome back</h1>
        <p className="text-body text-slate">
          Choose a project to begin reviewing.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-12">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-lg animate-shimmer"
              />
            ))}
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-56 rounded-lg animate-shimmer" />
            ))}
          </div>
        </>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-surface border border-hairline rounded-lg p-8 text-center">
          <h2 className="text-h2 font-serif text-ink mb-2">
            Something went wrong
          </h2>
          <p className="text-body text-slate mb-6">{error}</p>
          <Button variant="primary" onClick={fetchDashboard}>
            Try again
          </Button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && pools.length === 0 && (
        <div className="bg-surface border border-hairline rounded-lg p-12 text-center">
          <h2 className="text-h2 font-serif text-ink mb-2">
            No projects yet
          </h2>
          <p className="text-body text-slate mb-6 max-w-md mx-auto">
            Once you complete a qualification assessment, your available projects
            will appear here.
          </p>
          <Button variant="primary" onClick={() => router.push("/calibration")}>
            Start qualification
          </Button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && pools.length > 0 && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-12">
            <div className="bg-surface border border-hairline rounded-lg shadow-sm p-6">
              <p className="text-caption text-muted uppercase mb-2">Projects</p>
              <p className="text-display font-serif text-ink">{pools.length}</p>
            </div>
            <div className="bg-surface border border-hairline rounded-lg shadow-sm p-6">
              <p className="text-caption text-muted uppercase mb-2">
                Cases reviewed
              </p>
              <p className="text-display font-serif text-ink">{totalReviewed}</p>
            </div>
            <div className="bg-surface border border-hairline rounded-lg shadow-sm p-6 col-span-2 sm:col-span-1">
              <p className="text-caption text-muted uppercase mb-2">Status</p>
              <p className="text-display font-serif text-teal">
                {totalReviewed > 0 ? "In review" : "Ready"}
              </p>
            </div>
          </div>

          {/* Projects */}
          <h2 className="text-h2 font-serif text-ink mb-6">Your projects</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
            {pools.map((pool) => (
              <Link
                href={`/tasks?poolId=${pool.id}`}
                key={pool.id}
                className="group"
              >
                <div className="bg-surface border border-hairline rounded-lg shadow-sm hover:shadow-md hover:border-teal transition-all duration-160 h-full p-6 flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-h2 font-serif text-ink group-hover:text-teal transition-colors duration-160">
                      {pool.name}
                    </h3>
                    <Badge variant={pool.tasksCompleted > 0 ? "info" : "default"}>
                      {pool.tasksCompleted > 0 ? "In review" : "New"}
                    </Badge>
                  </div>

                  <p className="text-small text-slate mb-6 flex-1">
                    {pool.tasksCompleted}{" "}
                    {pool.tasksCompleted === 1 ? "case" : "cases"} reviewed
                  </p>

                  <Button variant="primary" className="w-full">
                    Start reviewing
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
