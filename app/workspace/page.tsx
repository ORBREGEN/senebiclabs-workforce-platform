"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Flag } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useAppState } from "@/components/AppState";
import { ReviewField, type Answer } from "@/components/ReviewField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PurposeBadge } from "@/components/ui/Pill";
import { POOLS, poolById, tasksForPool } from "@/lib/seed-data";

/** In-progress answers survive a refresh. Nothing sensitive is stored. */
const draftKey = (taskId: number) => `senebiclabs:draft:${taskId}`;

function Guidelines({
  sections,
}: {
  sections: { heading: string; body: string }[];
}) {
  const [open, setOpen] = useState(false);

  const body = (
    <div className="space-y-5">
      {sections.map((s) => (
        <div key={s.heading}>
          <h3 className="text-[13px] font-semibold text-ink">{s.heading}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{s.body}</p>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Desktop: always-visible sidebar */}
      <aside className="hidden lg:block">
        <Card className="sticky top-24 p-5">
          <h2 className="mb-4 text-label uppercase text-muted">
            Review guidelines
          </h2>
          {body}
        </Card>
      </aside>

      {/* Mobile: accordion above the work */}
      <div className="lg:hidden">
        <Card className="overflow-hidden">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="focusable flex w-full items-center justify-between px-5 py-3.5 text-left"
          >
            <span className="text-label uppercase text-muted">
              Review guidelines
            </span>
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={`text-muted transition-transform duration-150 ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
          {open && (
            <div className="border-t border-hairline px-5 py-4">{body}</div>
          )}
        </Card>
      </div>
    </>
  );
}

function Workspace() {
  const router = useRouter();
  const params = useSearchParams();
  const { countReview, showToast } = useAppState();

  const poolId = params.get("pool") ?? POOLS[0].id;
  const pool = poolById(poolId);
  const tasks = useMemo(() => tasksForPool(poolId), [poolId]);

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer>({});
  const [missing, setMissing] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const task = tasks[index];

  // Restore any draft for this task.
  useEffect(() => {
    if (!task) return;
    setMissing([]);
    try {
      const saved = window.localStorage.getItem(draftKey(task.id));
      setAnswer(saved ? (JSON.parse(saved) as Answer) : {});
    } catch {
      setAnswer({});
    }
  }, [task]);

  // Keep the draft current as they type.
  useEffect(() => {
    if (!task) return;
    try {
      window.localStorage.setItem(draftKey(task.id), JSON.stringify(answer));
    } catch {
      /* storage unavailable — the in-memory answer still stands */
    }
  }, [answer, task]);

  const update = useCallback((key: string, value: string | number) => {
    setAnswer((prev) => ({ ...prev, [key]: value }));
    setMissing((prev) => prev.filter((m) => m !== key));
  }, []);

  const advance = useCallback(() => {
    if (task) {
      try {
        window.localStorage.removeItem(draftKey(task.id));
      } catch {
        /* nothing to clean up */
      }
    }
    setIndex((i) => i + 1);
  }, [task]);

  const submit = useCallback(() => {
    if (!task || submitting) return;

    const gaps = task.fields
      .filter((f) => f.required && !answer[f.name])
      .map((f) => f.name);

    // A structured field answered "Yes" needs its finding named.
    task.fields.forEach((f) => {
      if (f.type === "structured" && answer[f.name] === "Yes") {
        if (!answer[`${f.name}_finding`]) gaps.push(`${f.name}_finding`);
      }
    });

    if (gaps.length > 0) {
      setMissing(gaps);
      const el = document.getElementById(`field-${gaps[0].split("_")[0]}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      countReview();
      showToast(`Review submitted — case ${task.caseId}`);
      advance();
      setSubmitting(false);
    }, 260);
  }, [task, answer, submitting, countReview, showToast, advance]);

  const flag = useCallback(() => {
    if (!task) return;
    showToast(`Flagged case ${task.caseId} for a second clinician`);
    advance();
  }, [task, showToast, advance]);

  // Cmd/Ctrl+Enter submits.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submit]);

  if (!pool) {
    return (
      <EmptyState
        title="That pool is not on your list"
        body="It may have closed, or you may not be eligible for it yet. Your review queue has everything currently open to you."
        action={
          <Button onClick={() => router.push("/queue")}>
            Go to review queue
          </Button>
        }
      />
    );
  }

  if (!task) {
    return (
      <EmptyState
        title="You've reviewed every case in this pool"
        body="More cases are added most weekdays. Your queue has other pools open right now."
        action={
          <Button onClick={() => router.push("/queue")}>
            Go to review queue
          </Button>
        }
      />
    );
  }

  return (
    <>
      {/* Case header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <PurposeBadge purpose={pool.purpose} />
          <span className="text-body font-medium text-ink">{pool.name}</span>
        </div>
        <span className="tnum text-[13px] text-muted">
          Case {task.caseId} · {index + 1} of {tasks.length} this batch
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main column */}
        <div className="min-w-0 space-y-5">
          <div className="lg:hidden">
            <Guidelines sections={task.guidelines} />
          </div>

          {/* Context */}
          {task.context.map((block) => (
            <Card
              key={block.label}
              className={`p-5 ${
                block.emphasis ? "border-l-[3px] border-l-accent" : ""
              }`}
            >
              <h2 className="mb-2 text-label uppercase text-muted">
                {block.label}
              </h2>
              <p
                className={`whitespace-pre-wrap text-body leading-relaxed ${
                  block.emphasis ? "text-ink" : "text-muted"
                }`}
              >
                {block.content}
              </p>
            </Card>
          ))}

          {/* Fields */}
          <Card className="p-5">
            <h2 className="text-section text-ink">Your assessment</h2>
            <p className="mt-1 text-body text-muted">
              {task.fields.length} fields. Your answers are kept if you step
              away.
            </p>

            {missing.length > 0 && (
              <div
                role="alert"
                className="mt-4 rounded-card border border-danger bg-danger-soft px-4 py-3"
              >
                <p className="text-[13px] font-medium text-danger">
                  {missing.length === 1
                    ? "One required field is still empty."
                    : `${missing.length} required fields are still empty.`}{" "}
                  Complete them to submit this review.
                </p>
              </div>
            )}

            <div className="mt-6 space-y-8">
              {task.fields.map((field) => (
                <div key={field.name} id={`field-${field.name}`}>
                  <ReviewField
                    field={field}
                    answer={answer}
                    onChange={update}
                    invalid={
                      missing.includes(field.name) ||
                      missing.includes(`${field.name}_finding`)
                    }
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Guidelines sidebar */}
        <div className="hidden lg:block">
          <Guidelines sections={task.guidelines} />
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 z-10 -mx-5 mt-6 border-t border-hairline bg-surface/95 px-5 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-muted">
            Press{" "}
            <kbd className="rounded border border-hairline bg-canvas px-1.5 py-0.5 font-sans text-[11px] text-ink">
              ⌘
            </kbd>{" "}
            +{" "}
            <kbd className="rounded border border-hairline bg-canvas px-1.5 py-0.5 font-sans text-[11px] text-ink">
              Enter
            </kbd>{" "}
            to submit
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={flag}>
              <Flag size={14} aria-hidden="true" />
              Flag — unclear
            </Button>
            <Button onClick={submit} loading={submitting}>
              Submit review
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function WorkspacePage() {
  return (
    <AppLayout title="Task workspace">
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="h-32 animate-pulse-soft rounded-card bg-hairline" />
              <div className="h-64 animate-pulse-soft rounded-card bg-hairline" />
            </div>
            <div className="hidden h-80 animate-pulse-soft rounded-card bg-hairline lg:block" />
          </div>
        }
      >
        <Workspace />
      </Suspense>
    </AppLayout>
  );
}
