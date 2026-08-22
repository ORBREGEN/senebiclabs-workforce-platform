/**
 * eval_config is the whole contract between a client's project and this
 * portal. Adding a client means creating a project with its own config —
 * nothing here or in the UI is per-client.
 *
 * Types are shared with the browser; the translation below is server-only in
 * practice (only submit routes call it) and the client never sees LS shapes.
 */

export type FieldType =
  | "single"
  | "from_classes"
  | "scale"
  | "text"
  | "flag"
  | "structured"
  | "spans";

export interface Field {
  name: string;
  type: FieldType;
  title: string;
  hint?: string;
  options?: string[];
  classes?: string[];
  max?: number;
  rows?: number;
  label?: string;
  required?: boolean;
  /** e.g. "verdict==Has errors" — the field shows only when it holds. */
  visible_when?: string;
}

export interface ContextBlock {
  label: string;
  value: string;
}

export interface NormalizedConfig {
  title: string | null;
  purpose: "evaluate" | "label" | "create";
  instructions: string | null;
  fields: Field[];
  /** Pool-level classes, used by from_classes/structured fields with none of their own. */
  classes: string[];
}

type RawFields = Record<string, Omit<Field, "name">> | (Field & { name: string })[];

interface RawSchema {
  fields?: RawFields;
  field_order?: string[];
  classes?: string[];
  context?: { key?: string; label?: string; content?: string }[];
  case_id_field?: string;
}

export interface RawEvalConfig {
  title?: string;
  purpose?: string;
  instructions?: string;
  schema?: RawSchema;
}

const PURPOSES = new Set(["evaluate", "label", "create"]);

/**
 * Accepts either fields shape.
 *
 * A list is authoritative for order. A dict is not: Postgres does not preserve
 * jsonb key order, so a config that cares about field order should either use a
 * list or supply `schema.field_order`.
 */
export function normalizeConfig(raw: RawEvalConfig | null): NormalizedConfig {
  const schema = raw?.schema ?? {};
  const rawFields = schema.fields;

  let fields: Field[] = [];

  if (Array.isArray(rawFields)) {
    fields = rawFields.filter((f) => f && f.name);
  } else if (rawFields && typeof rawFields === "object") {
    const entries = Object.entries(rawFields);
    const order = schema.field_order;
    if (Array.isArray(order) && order.length > 0) {
      const byName = new Map(entries);
      fields = order
        .filter((name) => byName.has(name))
        .map((name) => ({ name, ...byName.get(name)! }));
      // Anything the order forgot still gets rendered, after the ordered ones.
      for (const [name, config] of entries) {
        if (!order.includes(name)) fields.push({ name, ...config });
      }
    } else {
      // Postgres does not preserve jsonb key order, so Object.entries here is
      // whatever the server happened to store — not the author's order. Sort by
      // name so the render order is at least deterministic and reproducible.
      // A config that cares about order must supply `field_order` or a list.
      fields = entries
        .map(([name, config]) => ({ name, ...config }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  // A config may omit `title`; fall back to the field name so a label always shows.
  fields = fields.map((f) => ({
    ...f,
    title: f.title || humanize(f.name),
  }));

  const purpose = raw?.purpose;

  return {
    title: raw?.title ?? null,
    purpose: (PURPOSES.has(purpose ?? "") ? purpose : "evaluate") as
      | "evaluate"
      | "label"
      | "create",
    instructions: raw?.instructions?.trim() || null,
    fields,
    classes: Array.isArray(schema.classes) ? schema.classes : [],
  };
}

function humanize(name: string): string {
  const spaced = name.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * The labelled, read-only blocks shown above the fields.
 *
 * Each entry names a key in the LS task payload. Keys the task does not carry
 * are dropped rather than rendered empty.
 */
export function buildContext(
  raw: RawEvalConfig | null,
  taskData: Record<string, unknown>
): ContextBlock[] {
  const declared = raw?.schema?.context;

  if (Array.isArray(declared) && declared.length > 0) {
    return declared
      .map((block) => {
        const key = block.key;
        const value =
          key && taskData[key] !== undefined
            ? String(taskData[key])
            : (block.content ?? "");
        return { label: block.label ?? humanize(key ?? ""), value };
      })
      .filter((b) => b.value !== "");
  }

  // No declared context: show the payload minus internal keys, so a new client
  // is readable before anyone writes a context block for it.
  return Object.entries(taskData)
    .filter(([key, value]) => !key.startsWith("_") && value != null && value !== "")
    .map(([key, value]) => ({ label: humanize(key), value: String(value) }));
}

export function caseIdFor(
  raw: RawEvalConfig | null,
  taskData: Record<string, unknown>
): string | null {
  const key = raw?.schema?.case_id_field ?? "case_id";
  const value = taskData[key];
  return value == null ? null : String(value);
}

/** A field shows unless its `visible_when` says otherwise. */
export function isVisible(
  field: Field,
  answers: Record<string, unknown>
): boolean {
  if (!field.visible_when) return true;
  const match = field.visible_when.match(/^\s*(\w+)\s*(==|!=)\s*(.+?)\s*$/);
  if (!match) return true;
  const [, name, op, expected] = match;
  const actual = answers[name];
  return op === "==" ? actual === expected : actual !== expected;
}

export function optionsFor(field: Field, poolClasses: string[]): string[] {
  if (field.type === "single") return field.options ?? [];
  return field.classes ?? poolClasses;
}

/* ------------------------------------------------------------------ */
/* Answers → Label Studio result. The browser never sees any of this.  */
/* ------------------------------------------------------------------ */

export interface LsResultEntry {
  from_name: string;
  to_name: string;
  type: string;
  value: Record<string, unknown>;
}

const TO_NAME = "image";

export class TranslationError extends Error {}

/**
 * Converts { fieldname: value } into the LS result array.
 *
 * Only visible fields are written, so a field hidden by `visible_when` never
 * lands in the annotation. Required-but-missing is a hard error: the submit
 * fails and the clinician keeps their answers.
 */
export function answersToLsResult(
  config: NormalizedConfig,
  answers: Record<string, unknown>
): LsResultEntry[] {
  const result: LsResultEntry[] = [];

  for (const field of config.fields) {
    if (!isVisible(field, answers)) continue;

    const value = answers[field.name];
    const empty =
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);

    if (empty) {
      if (field.required) {
        throw new TranslationError(`"${field.title}" is required.`);
      }
      // Optional and unanswered: write nothing rather than an empty choice.
      if (field.type !== "structured") continue;
    }

    switch (field.type) {
      case "single":
      case "from_classes":
      case "flag": {
        result.push({
          from_name: field.name,
          to_name: TO_NAME,
          type: "choices",
          value: { choices: [String(value)] },
        });
        break;
      }

      case "scale": {
        const rating = Number(value);
        if (!Number.isFinite(rating)) {
          throw new TranslationError(`"${field.title}" must be a number.`);
        }
        result.push({
          from_name: field.name,
          to_name: TO_NAME,
          type: "rating",
          value: { rating },
        });
        break;
      }

      case "text": {
        result.push({
          from_name: field.name,
          to_name: TO_NAME,
          type: "textarea",
          value: { text: [String(value)] },
        });
        break;
      }

      case "structured": {
        // Always two entries: the Yes/No, then the finding picker.
        const yesNo = value === "Yes" ? "Yes" : "No";
        const finding = answers[`${field.name}_finding`];

        if (yesNo === "Yes" && (finding === undefined || finding === "")) {
          throw new TranslationError(
            `"${field.title}" needs a finding when the answer is Yes.`
          );
        }

        result.push({
          from_name: field.name,
          to_name: TO_NAME,
          type: "choices",
          value: { choices: [yesNo] },
        });
        result.push({
          from_name: `${field.name}_finding`,
          to_name: TO_NAME,
          type: "choices",
          value: { choices: finding ? [String(finding)] : [] },
        });
        break;
      }

      case "spans": {
        const spans = Array.isArray(value) ? value : [];
        for (const span of spans as {
          start: number;
          end: number;
          text: string;
          label: string;
        }[]) {
          result.push({
            from_name: field.name,
            to_name: TO_NAME,
            type: "labels",
            value: {
              start: span.start,
              end: span.end,
              text: span.text,
              labels: [span.label],
            },
          });
        }
        break;
      }
    }
  }

  return result;
}
