import "server-only";
import {
  normalizeConfig,
  type Field,
  type RawEvalConfig,
} from "./eval-config";

/**
 * Consensus over the reviews collected for a case.
 *
 * Everything here is computed from what clinicians actually submitted. Nothing
 * is imputed: a case with one review is reported as insufficient rather than
 * given that reviewer's answer as if it were agreed.
 */

export type Verdict =
  | "unanimous"
  | "majority"
  | "split"
  | "insufficient"
  /** The field was never put to these reviewers, so there is nothing to agree on. */
  | "not_applicable";

/** One clinician's decoded answers for one case. */
export interface Review {
  /** Stable per report, never a database id. */
  reviewer: string;
  answers: Record<string, unknown>;
  reviewedAt: string;
}

export interface FieldConsensus {
  field: string;
  label: string;
  type: Field["type"];
  /** Agreed value, or null when there is no agreement to report. */
  value: string | number | null;
  verdict: Verdict;
  /** Share of reviewers holding `value`, 0–1. Null when not applicable. */
  agreement: number | null;
  /** Every distinct answer and how many reviewers gave it. */
  distribution: { value: string | number; count: number }[];
  /** Free-text answers, which are collected rather than voted on. */
  responses?: { reviewer: string; text: string }[];
  /**
   * True when the field is only put to reviewers who answered its parent a
   * certain way. Such a field is reported, but does not decide the case
   * verdict — how deep the branch went is already carried by the parent.
   */
  conditional?: boolean;
}

export interface CaseConsensus {
  case_id: string;
  reviewers: number;
  verdict: Verdict;
  /** Mean agreement across the fields that can be voted on. */
  agreement: number | null;
  fields: FieldConsensus[];
  reviewed_at: string;
}

/**
 * Decodes a stored LS result array back into { field: value }.
 *
 * The report is built from the same rows that were written, so what the client
 * receives is derived from the annotations themselves, not a parallel copy.
 */
export function decodeResult(
  result: unknown
): Record<string, unknown> {
  const answers: Record<string, unknown> = {};
  if (!Array.isArray(result)) return answers;

  for (const entry of result) {
    const name = entry?.from_name;
    const value = entry?.value;
    if (!name || !value) continue;

    switch (entry.type) {
      case "choices":
        if (Array.isArray(value.choices) && value.choices.length > 0) {
          answers[name] = value.choices[0];
        }
        break;
      case "rating":
        if (typeof value.rating === "number") answers[name] = value.rating;
        break;
      case "textarea":
        if (Array.isArray(value.text) && value.text.length > 0) {
          answers[name] = value.text[0];
        }
        break;
      case "labels":
        if (Array.isArray(value.labels)) {
          const existing = (answers[name] as unknown[]) ?? [];
          answers[name] = [
            ...existing,
            { start: value.start, end: value.end, text: value.text, label: value.labels[0] },
          ];
        }
        break;
    }
  }

  return answers;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function tally(values: (string | number)[]) {
  const counts = new Map<string | number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || String(a.value).localeCompare(String(b.value)));
}

const MIN_REVIEWERS = 2;

function consensusForField(
  field: Field,
  allReviews: Review[],
  /** Set for a companion field: only reviewers who reached it are counted. */
  appliesTo?: (review: Review) => boolean
): FieldConsensus {
  const base = {
    field: field.name,
    label: field.title,
    type: field.type,
    conditional: Boolean(appliesTo),
  };

  const reviews = appliesTo ? allReviews.filter(appliesTo) : allReviews;

  // A conditional field nobody was asked is not a gap in the review.
  if (appliesTo && reviews.length === 0) {
    return {
      ...base,
      value: null,
      verdict: "not_applicable",
      agreement: null,
      distribution: [],
    };
  }

  // Free text is collected, never voted on — two clinicians phrasing the same
  // judgment differently do not disagree.
  if (field.type === "text") {
    const responses = reviews
      .filter((r) => typeof r.answers[field.name] === "string" && r.answers[field.name] !== "")
      .map((r) => ({ reviewer: r.reviewer, text: String(r.answers[field.name]) }));
    return {
      ...base,
      value: null,
      verdict: responses.length >= MIN_REVIEWERS ? "unanimous" : "insufficient",
      agreement: null,
      distribution: [],
      responses,
    };
  }

  if (field.type === "spans") {
    return {
      ...base,
      value: null,
      verdict: "insufficient",
      agreement: null,
      distribution: [],
    };
  }

  const answered = reviews.filter(
    (r) => r.answers[field.name] !== undefined && r.answers[field.name] !== ""
  );

  if (answered.length < MIN_REVIEWERS) {
    return {
      ...base,
      value: answered.length === 1 ? (answered[0].answers[field.name] as string | number) : null,
      verdict: "insufficient",
      agreement: null,
      distribution: tally(answered.map((r) => r.answers[field.name] as string | number)),
    };
  }

  // A rating is ordinal: the median is the defensible central answer, and
  // exact agreement is still reported so a wide spread is visible.
  if (field.type === "scale") {
    const numbers = answered.map((r) => Number(r.answers[field.name]));
    const value = median(numbers);
    const distribution = tally(numbers);
    const top = distribution[0];
    const agreement = top.count / numbers.length;
    return {
      ...base,
      value,
      verdict:
        agreement === 1 ? "unanimous" : agreement > 0.5 ? "majority" : "split",
      agreement,
      distribution,
    };
  }

  const distribution = tally(
    answered.map((r) => r.answers[field.name] as string | number)
  );
  const top = distribution[0];
  const tied = distribution.filter((d) => d.count === top.count).length > 1;
  const agreement = top.count / answered.length;

  return {
    ...base,
    value: tied ? null : top.value,
    verdict: tied ? "split" : agreement === 1 ? "unanimous" : "majority",
    agreement,
    distribution,
  };
}

const RANK: Record<Verdict, number> = {
  insufficient: 0,
  split: 1,
  majority: 2,
  unanimous: 3,
  // Never the worst verdict — it is excluded before the reduce.
  not_applicable: 4,
};

export function consensusForCase(
  caseId: string,
  rawConfig: RawEvalConfig | null,
  reviews: Review[]
): CaseConsensus {
  const config = normalizeConfig(rawConfig);

  // Structured fields carry a companion picker; report it beside its parent,
  // scoped to the reviewers who actually answered "Yes" and so were asked it.
  const planned: { field: Field; appliesTo?: (r: Review) => boolean }[] = [];
  for (const field of config.fields) {
    planned.push({ field });
    if (field.type === "structured") {
      planned.push({
        field: {
          ...field,
          name: `${field.name}_finding`,
          title: `${field.title} — finding`,
          type: "from_classes",
        },
        appliesTo: (r) => r.answers[field.name] === "Yes",
      });
    }
  }

  const fieldResults = planned.map(({ field, appliesTo }) =>
    consensusForField(field, reviews, appliesTo)
  );

  const votable = fieldResults.filter(
    (f) => f.agreement !== null && !f.conditional
  );
  const agreement =
    votable.length > 0
      ? votable.reduce((sum, f) => sum + (f.agreement ?? 0), 0) / votable.length
      : null;

  // The case is only as settled as its least settled field.
  const verdict =
    reviews.length < MIN_REVIEWERS
      ? "insufficient"
      : (fieldResults
          .filter(
            (f) =>
              f.type !== "text" &&
              f.type !== "spans" &&
              !f.conditional &&
              f.verdict !== "not_applicable"
          )
          .reduce<Verdict>(
            (worst, f) => (RANK[f.verdict] < RANK[worst] ? f.verdict : worst),
            "unanimous"
          ) as Verdict);

  return {
    case_id: caseId,
    reviewers: reviews.length,
    verdict,
    agreement,
    fields: fieldResults,
    reviewed_at: reviews
      .map((r) => r.reviewedAt)
      .sort()
      .at(-1)!,
  };
}
