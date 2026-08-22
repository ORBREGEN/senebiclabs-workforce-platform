import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "./Card";

export function StatTile({
  label,
  value,
  delta,
  deltaSuffix = "vs last week",
}: {
  label: string;
  value: string;
  /** Percent change against the prior period. Omit to hide the chip. */
  delta?: number;
  deltaSuffix?: string;
}) {
  const up = (delta ?? 0) >= 0;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="p-5">
      <p className="text-label uppercase text-muted">{label}</p>
      <p className="tnum mt-2 text-[28px] font-semibold leading-none text-ink">
        {value}
      </p>
      {delta !== undefined && (
        <div className="mt-3 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[12px] font-medium ${
              up ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
            }`}
          >
            <Arrow size={12} aria-hidden="true" />
            <span className="tnum">
              {up ? "+" : ""}
              {delta.toFixed(1)}%
            </span>
          </span>
          <span className="text-[12px] text-muted">{deltaSuffix}</span>
        </div>
      )}
    </Card>
  );
}
