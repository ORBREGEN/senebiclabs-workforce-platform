import React from "react";
import type { Purpose, PoolStatus } from "@/lib/seed-data";
import { PURPOSE_LABEL, STATUS_LABEL } from "@/lib/seed-data";

type Tone = "accent" | "success" | "info" | "warning" | "neutral";

const TONE: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
  neutral: "bg-canvas text-muted",
};

export function Pill({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label uppercase ${TONE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const PURPOSE_TONE: Record<Purpose, Tone> = {
  evaluate: "accent",
  label: "info",
  create: "warning",
};

export function PurposeBadge({ purpose }: { purpose: Purpose }) {
  return <Pill tone={PURPOSE_TONE[purpose]}>{PURPOSE_LABEL[purpose]}</Pill>;
}

const STATUS_TONE: Record<PoolStatus, Tone> = {
  in_progress: "accent",
  delivered: "success",
  awaiting_review: "info",
};

export function StatusPill({ status }: { status: PoolStatus }) {
  return <Pill tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Pill>;
}
