import React from "react";
import { Button } from "./Button";

/**
 * Every list and screen resolves into exactly one of these three. There is no
 * fourth state where a blank page or a raw error reaches a clinician.
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse-soft rounded-card bg-hairline ${className}`}
    />
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-hairline bg-surface px-6 py-12 text-center">
      <h3 className="text-section text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-body text-muted">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-card border border-hairline bg-surface px-6 py-10 text-center"
    >
      <h3 className="text-section text-ink">That did not load</h3>
      <p className="mx-auto mt-2 max-w-sm text-body text-muted">{message}</p>
      <div className="mt-5 flex justify-center">
        <Button onClick={onRetry}>Try again</Button>
      </div>
    </div>
  );
}
