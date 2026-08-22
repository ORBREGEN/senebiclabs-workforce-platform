"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PurposeBadge, StatusPill } from "@/components/ui/Pill";
import { useAppState } from "@/components/AppState";
import { CURRENCY } from "@/lib/design";
import { POOLS, type PoolStatus, type Purpose } from "@/lib/seed-data";

type PurposeFilter = Purpose | "all";
type StatusFilter = PoolStatus | "all";
type SortKey = "name" | "items" | "rate" | "remaining";

const SORT_LABEL: Record<SortKey, string> = {
  remaining: "Most remaining",
  rate: "Highest rate",
  items: "Largest pool",
  name: "Name (A–Z)",
};

const SELECT_CLASS =
  "focusable h-9 rounded-btn border border-hairline bg-surface px-3 text-[13px] text-ink transition-colors hover:bg-canvas";

export default function QueuePage() {
  const router = useRouter();
  const { available } = useAppState();

  const [purpose, setPurpose] = useState<PurposeFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("remaining");

  const rows = useMemo(() => {
    const filtered = POOLS.filter(
      (p) =>
        (purpose === "all" || p.purpose === purpose) &&
        (status === "all" || p.status === status)
    );

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "items":
          return b.items - a.items;
        case "rate":
          return b.hourlyRate - a.hourlyRate;
        case "remaining":
          return b.items - b.reviewed - (a.items - a.reviewed);
      }
    });
  }, [purpose, status, sort]);

  const filtersActive = purpose !== "all" || status !== "all";

  const clearFilters = () => {
    setPurpose("all");
    setStatus("all");
  };

  return (
    <AppLayout title="Review queue">
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="purpose-filter">
          Filter by purpose
        </label>
        <select
          id="purpose-filter"
          className={SELECT_CLASS}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value as PurposeFilter)}
        >
          <option value="all">All purposes</option>
          <option value="evaluate">Evaluate</option>
          <option value="label">Label</option>
          <option value="create">Create</option>
        </select>

        <label className="sr-only" htmlFor="status-filter">
          Filter by status
        </label>
        <select
          id="status-filter"
          className={SELECT_CLASS}
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="in_progress">In progress</option>
          <option value="delivered">Delivered</option>
          <option value="awaiting_review">Awaiting review</option>
        </select>

        <label className="sr-only" htmlFor="sort-order">
          Sort by
        </label>
        <select
          id="sort-order"
          className={`${SELECT_CLASS} ml-auto`}
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => (
            <option key={key} value={key}>
              Sort: {SORT_LABEL[key]}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No pools match these filters"
          body="Nothing in the queue fits that combination right now. Clear the filters to see everything you're eligible for."
          action={<Button onClick={clearFilters}>Clear filters</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse text-left">
              <caption className="sr-only">
                Pools you are eligible to review
              </caption>
              <thead>
                <tr className="border-b border-hairline bg-canvas">
                  <th scope="col" className="px-5 py-3 text-label uppercase text-muted">
                    Pool
                  </th>
                  <th scope="col" className="px-4 py-3 text-label uppercase text-muted">
                    Purpose
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-label uppercase text-muted">
                    Items
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-label uppercase text-muted">
                    Pay rate
                  </th>
                  <th scope="col" className="px-4 py-3 text-label uppercase text-muted">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((pool) => {
                  const complete = pool.reviewed >= pool.items;
                  return (
                    <tr
                      key={pool.id}
                      className="border-b border-hairline last:border-b-0 transition-colors hover:bg-canvas"
                    >
                      <th scope="row" className="max-w-[320px] px-5 py-4 font-normal">
                        <span className="block text-body font-medium text-ink">
                          {pool.name}
                        </span>
                        <span className="tnum mt-0.5 block text-[12px] text-muted">
                          {pool.reviewed.toLocaleString()} of{" "}
                          {pool.items.toLocaleString()} reviewed
                        </span>
                      </th>
                      <td className="px-4 py-4">
                        <PurposeBadge purpose={pool.purpose} />
                      </td>
                      <td className="tnum px-4 py-4 text-right text-body text-ink">
                        {pool.items.toLocaleString()}
                      </td>
                      <td className="tnum px-4 py-4 text-right text-body text-ink">
                        {CURRENCY.format(pool.hourlyRate)}
                        <span className="text-muted"> / hr</span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusPill status={pool.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={!available || complete}
                          onClick={() =>
                            router.push(`/workspace?pool=${pool.id}`)
                          }
                        >
                          {complete
                            ? "Fully reviewed"
                            : pool.reviewed > 0
                              ? "Resume reviewing"
                              : "Start reviewing"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!available && rows.length > 0 && (
        <p className="mt-4 text-[13px] text-muted">
          Turn on availability to start reviewing.
        </p>
      )}

      {filtersActive && rows.length > 0 && (
        <p className="tnum mt-4 text-[13px] text-muted">
          Showing {rows.length} of {POOLS.length} pools.{" "}
          <button
            onClick={clearFilters}
            className="focusable rounded-btn font-medium text-accent underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        </p>
      )}
    </AppLayout>
  );
}
