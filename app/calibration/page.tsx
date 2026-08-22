"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pill, PurposeBadge } from "@/components/ui/Pill";
import { useAppState } from "@/components/AppState";
import { formatDate } from "@/lib/design";
import { CALIBRATION_POOLS, type CalibrationPool } from "@/lib/seed-data";

function CalibrationCard({ pool }: { pool: CalibrationPool }) {
  const { showToast } = useAppState();

  return (
    <Card interactive className="flex flex-col p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <PurposeBadge purpose={pool.purpose} />
        {pool.status === "passed" && (
          <Pill tone="success">
            <CheckCircle2 size={12} aria-hidden="true" />
            Eligible
          </Pill>
        )}
      </div>

      <h3 className="text-section text-ink">{pool.name}</h3>
      <p className="mt-1.5 flex-1 text-body text-muted">{pool.description}</p>

      <div className="mt-4 border-t border-hairline pt-4">
        {pool.status === "passed" && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-muted">
              Passed {formatDate(pool.passedOn!)}
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => showToast(`Reviewing your ${pool.name} answers`)}
            >
              Review answers
            </Button>
          </div>
        )}

        {pool.status === "in_progress" && (
          <>
            <div className="mb-3">
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="tnum text-[13px] font-medium text-ink">
                  {pool.answered} of {pool.itemCount} answered
                </span>
              </div>
              <div
                className="h-1 w-full overflow-hidden rounded-full bg-hairline"
                role="progressbar"
                aria-valuenow={pool.answered}
                aria-valuemin={0}
                aria-valuemax={pool.itemCount}
                aria-label={`${pool.answered} of ${pool.itemCount} answered`}
              >
                <div
                  className="h-full rounded-full bg-accent"
                  style={{
                    width: `${((pool.answered ?? 0) / pool.itemCount) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => showToast(`Resuming ${pool.name} calibration`)}
              >
                Resume calibration
              </Button>
            </div>
          </>
        )}

        {pool.status === "not_attempted" && (
          <div className="flex items-center justify-between gap-3">
            <span className="tnum text-[13px] text-muted">
              {pool.itemCount} items
            </span>
            <Button
              size="sm"
              onClick={() => showToast(`Starting ${pool.name} calibration`)}
            >
              Start calibration
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function CalibrationPage() {
  const [tab, setTab] = useState<"available" | "passed">("available");

  const passed = CALIBRATION_POOLS.filter((p) => p.status === "passed");
  const available = CALIBRATION_POOLS.filter((p) => p.status !== "passed");
  const shown = tab === "passed" ? passed : available;

  return (
    <AppLayout title="Calibration">
      <Card className="mb-6 p-5">
        <h2 className="text-section text-ink">How calibration works</h2>
        <p className="mt-1.5 max-w-2xl text-body text-muted">
          Each calibration is a short set of cases with known answers, written by
          the clinical leads for that pool. Pass it and you are eligible to
          review that pool — there is nothing else to unlock. You can retake a
          calibration whenever the rubric is updated.
        </p>
      </Card>

      <div className="mb-4 flex items-center gap-1" role="tablist">
        {(["available", "passed"] as const).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`focusable rounded-btn px-3 py-1.5 text-[13px] font-medium transition-colors ${
              tab === key
                ? "bg-accent-soft text-accent"
                : "text-muted hover:bg-canvas hover:text-ink"
            }`}
          >
            {key === "available" ? "Available" : "Passed"}
            <span className="tnum ml-1.5 text-muted">
              {key === "available" ? available.length : passed.length}
            </span>
          </button>
        ))}
      </div>

      <SectionHeading>
        {tab === "available"
          ? "Calibrations you can take"
          : "Pools you are eligible for"}
      </SectionHeading>

      {shown.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((pool) => (
            <CalibrationCard key={pool.id} pool={pool} />
          ))}
        </div>
      ) : tab === "available" ? (
        <EmptyState
          title="You have taken every calibration"
          body="New pools open regularly. When one matching your specialty opens, its calibration will appear here."
          action={<Button onClick={() => setTab("passed")}>See what you passed</Button>}
        />
      ) : (
        <EmptyState
          title="No calibrations passed yet"
          body="Pass your first calibration to become eligible for a pool. Most take about ten minutes."
          action={
            <Button onClick={() => setTab("available")}>
              Take a calibration
            </Button>
          }
        />
      )}
    </AppLayout>
  );
}
