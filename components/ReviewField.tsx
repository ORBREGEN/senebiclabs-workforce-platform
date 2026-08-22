"use client";

import { Star } from "lucide-react";
import type { ReviewField as Field } from "@/lib/seed-data";

export type Answer = Record<string, string | number>;

interface Props {
  field: Field;
  answer: Answer;
  onChange: (key: string, value: string | number) => void;
  invalid?: boolean;
}

const CONTROL =
  "focusable w-full rounded-card border bg-surface px-3 text-body text-ink transition-colors";

export function ReviewField({ field, answer, onChange, invalid }: Props) {
  const value = answer[field.name];
  const describedBy = field.hint ? `${field.name}-hint` : undefined;
  const border = invalid ? "border-danger" : "border-hairline";

  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-1 text-body font-medium text-ink">
        {field.title}
        {field.required && (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        )}
        {field.required && <span className="sr-only"> (required)</span>}
      </legend>

      {field.hint && (
        <p id={describedBy} className="mb-3 text-[13px] text-muted">
          {field.hint}
        </p>
      )}

      {/* single → radio group */}
      {field.type === "single" && (
        <div className="space-y-2" role="radiogroup" aria-describedby={describedBy}>
          {field.options?.map((option) => {
            const selected = value === option;
            return (
              <label
                key={option}
                className={`flex cursor-pointer items-center gap-3 rounded-card border px-3 py-2.5 transition-colors ${
                  selected
                    ? "border-accent bg-accent-soft"
                    : `${border} hover:bg-canvas`
                }`}
              >
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  checked={selected}
                  onChange={() => onChange(field.name, option)}
                  className="focusable h-4 w-4 shrink-0 accent-accent"
                />
                <span className="text-body text-ink">{option}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* from_classes → dropdown */}
      {field.type === "from_classes" && (
        <select
          value={(value as string) ?? ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={`${CONTROL} ${border} h-10`}
        >
          <option value="">Select one…</option>
          {field.classes?.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      )}

      {/* scale → star rating */}
      {field.type === "scale" && (
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label={field.title}
          aria-describedby={describedBy}
        >
          {Array.from({ length: field.max ?? 5 }, (_, i) => i + 1).map((n) => {
            const active = typeof value === "number" && value >= n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={value === n}
                aria-label={`${n} of ${field.max ?? 5}`}
                onClick={() => onChange(field.name, n)}
                className="focusable rounded-btn p-1 transition-transform duration-150 hover:scale-110"
              >
                <Star
                  size={22}
                  aria-hidden="true"
                  className={
                    active ? "fill-accent text-accent" : "text-hairline"
                  }
                />
              </button>
            );
          })}
          {typeof value === "number" && (
            <span className="tnum ml-2 text-[13px] text-muted">
              {value} of {field.max ?? 5}
            </span>
          )}
        </div>
      )}

      {/* text → textarea */}
      {field.type === "text" && (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(field.name, e.target.value)}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          rows={4}
          placeholder="Type your assessment…"
          className={`${CONTROL} ${border} resize-y py-2.5 placeholder:text-muted`}
        />
      )}

      {/* structured → Yes/No, then a finding picker when Yes */}
      {field.type === "structured" && (
        <div className="space-y-3">
          <div className="flex gap-2" role="radiogroup" aria-describedby={describedBy}>
            {["Yes", "No"].map((option) => {
              const selected = (value ?? "No") === option;
              return (
                <label
                  key={option}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-card border px-3 py-2.5 transition-colors ${
                    selected
                      ? "border-accent bg-accent-soft font-medium"
                      : `${border} hover:bg-canvas`
                  }`}
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={option}
                    checked={selected}
                    onChange={() => onChange(field.name, option)}
                    className="sr-only"
                  />
                  <span className="text-body text-ink">{option}</span>
                </label>
              );
            })}
          </div>

          {value === "Yes" && (
            <div className="border-l-2 border-accent-soft pl-4">
              <label
                htmlFor={`${field.name}_finding`}
                className="mb-1.5 block text-[13px] font-medium text-ink"
              >
                Which finding?
              </label>
              <select
                id={`${field.name}_finding`}
                value={(answer[`${field.name}_finding`] as string) ?? ""}
                onChange={(e) =>
                  onChange(`${field.name}_finding`, e.target.value)
                }
                aria-invalid={invalid || undefined}
                className={`${CONTROL} ${border} h-10`}
              >
                <option value="">Select one…</option>
                {field.classes?.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </fieldset>
  );
}
