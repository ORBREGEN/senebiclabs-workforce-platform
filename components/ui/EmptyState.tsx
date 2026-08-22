import React from "react";

/**
 * Every empty grid or table gets one of these: a line telling the clinician
 * what to do next, and the control that does it.
 */
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
