"use client";

import { useRouter } from "next/navigation";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { PurposeBadge } from "./ui/Pill";
import { useAppState } from "./AppState";
import type { Pool } from "@/lib/seed-data";

export function PoolCard({ pool }: { pool: Pool }) {
  const router = useRouter();
  const { available } = useAppState();

  const started = pool.reviewed > 0;
  const complete = pool.reviewed >= pool.items;

  return (
    <Card interactive={available} className="relative flex flex-col p-5">
      <div className="mb-4">
        <PurposeBadge purpose={pool.purpose} />
      </div>

      <h3 className="text-section text-ink">{pool.name}</h3>
      <p className="mt-1.5 text-body text-muted">{pool.description}</p>

      <dl className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[13px]">
        <div>
          <dt className="sr-only">Rate</dt>
          <dd className="font-medium text-ink">Professional rate</dd>
        </div>
        <div>
          <dt className="sr-only">Typical time per review</dt>
          <dd className="tnum text-muted">~{pool.minutesPerReview} min</dd>
        </div>
        <div>
          <dt className="sr-only">Items in pool</dt>
          <dd className="tnum text-muted">{pool.items.toLocaleString()} items</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-hairline pt-4">
        {started && (
          <div
            className="mb-3 h-1 w-full overflow-hidden rounded-full bg-hairline"
            role="progressbar"
            aria-valuenow={pool.reviewed}
            aria-valuemin={0}
            aria-valuemax={pool.items}
            aria-label={`${pool.reviewed} of ${pool.items} reviewed`}
          >
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${(pool.reviewed / pool.items) * 100}%` }}
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <span className="tnum text-[13px] text-muted">
            {pool.reviewed.toLocaleString()} reviewed
          </span>
          <Button
            size="sm"
            disabled={!available || complete}
            onClick={() => router.push(`/workspace?pool=${pool.id}`)}
          >
            {complete
              ? "Fully reviewed"
              : started
                ? "Resume reviewing"
                : "Start reviewing"}
          </Button>
        </div>
      </div>

      {!available && (
        <div className="absolute inset-0 flex items-center justify-center rounded-card bg-surface/80 px-4 text-center">
          <p className="text-[13px] font-medium text-muted">
            Turn on availability to start reviewing.
          </p>
        </div>
      )}
    </Card>
  );
}
