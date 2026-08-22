/**
 * Design system constants.
 *
 * The Tailwind theme in app/globals.css is the source of truth for anything
 * expressible as a utility class. These mirrors exist for the places that need
 * real JS values — recharts fills, inline SVG strokes.
 */

export const COLOR = {
  surface: "#FFFFFF",
  canvas: "#F6F8F8",
  ink: "#10312E",
  muted: "#5B6A68",
  hairline: "#E3ECE9",
  accent: "#0E7C74",
  accentHover: "#0A5A54",
  accentSoft: "#E7F2F0",
  warning: "#B4780C",
  danger: "#D64545",
  info: "#3B7CE8",
  success: "#0F7B52",
  rail: "#0C2422",
} as const;

export const RADIUS = {
  button: 6,
  card: 8,
  pill: 999,
} as const;

/** Base spacing unit, in px. Card padding is 5 units, grid gap is 4. */
export const SPACE = 4;

export const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Whole-dollar currency, for axis ticks and large headline figures. */
export const CURRENCY_COMPACT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
