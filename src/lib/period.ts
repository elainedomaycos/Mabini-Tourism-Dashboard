/**
 * Year-aware period helpers.
 *
 * The dashboard previously compared "month numbers" (`(cur + 11) % 12`), so
 * January was compared against December of the same bucket list and multi-year
 * data collapsed into one 12-slot array. Everything here keys on the real
 * calendar month + year, so month-over-month deltas are correct across a year
 * boundary and only the trailing window is shown.
 */

export const REPORT_TIMEZONE = "Asia/Manila";

export const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type RangePreset = "today" | "7d" | "30d" | "custom";
export type RangeGrain = "day" | "week" | "month";

export interface DateRange {
  preset: RangePreset;
  /** Inclusive first calendar day (YYYY-MM-DD, Asia/Manila). */
  from: string;
  /** Inclusive last calendar day (YYYY-MM-DD, Asia/Manila). */
  to: string;
  grain: RangeGrain;
  label: string;
  /** True when a custom range was invalid and the default was used. */
  invalid?: boolean;
}

function dateOnlyUtc(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Asia/Manila calendar date as YYYY-MM-DD, independent of browser timezone. */
export function todayInManila(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Add/subtract calendar days without DST or timezone drift. */
export function addDaysIso(value: string, days: number): string {
  const d = dateOnlyUtc(value);
  if (!d) return value;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Inclusive day count between two YYYY-MM-DD dates. */
export function daysBetween(from: string, to: string): number {
  const a = dateOnlyUtc(from);
  const b = dateOnlyUtc(to);
  if (!a || !b) return 0;
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
}

export function grainForRange(from: string, to: string): RangeGrain {
  const days = daysBetween(from, to);
  if (days <= 31) return "day";
  if (days <= 120) return "week";
  return "month";
}

export function rangeLabel(from: string, to: string): string {
  const a = dateOnlyUtc(from);
  const b = dateOnlyUtc(to);
  if (!a || !b) return "Selected period";
  const short = (d: Date) =>
    `${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  if (from === to) return `${short(a)}, ${a.getUTCFullYear()}`;
  if (a.getUTCFullYear() === b.getUTCFullYear()) {
    return `${short(a)} – ${short(b)}, ${b.getUTCFullYear()}`;
  }
  return `${short(a)}, ${a.getUTCFullYear()} – ${short(b)}, ${b.getUTCFullYear()}`;
}

/**
 * Resolve Today / 7d / 30d / Custom into real inclusive calendar dates.
 * Invalid or reversed custom inputs fall back to the last 30 days.
 */
export function resolveDateRange(
  preset: string | null | undefined,
  customFrom?: string | null,
  customTo?: string | null,
  now = new Date(),
): DateRange {
  const key: RangePreset =
    preset === "today" || preset === "7d" || preset === "custom"
      ? preset
      : "30d";
  const today = todayInManila(now);
  if (key === "today") {
    return {
      preset: key,
      from: today,
      to: today,
      grain: "day",
      label: "Today",
    };
  }
  if (key === "7d") {
    const from = addDaysIso(today, -6);
    return {
      preset: key,
      from,
      to: today,
      grain: "day",
      label: "Last 7 days",
    };
  }
  if (key === "30d") {
    const from = addDaysIso(today, -29);
    return {
      preset: key,
      from,
      to: today,
      grain: "day",
      label: "Last 30 days",
    };
  }
  const fallbackFrom = addDaysIso(today, -29);
  let from = customFrom?.trim() || "";
  let to = customTo?.trim() || "";
  const validFrom = dateOnlyUtc(from);
  const validTo = dateOnlyUtc(to);
  let invalid = false;
  if (!validFrom || !validTo) {
    from = fallbackFrom;
    to = today;
    invalid = true;
  } else if (from > to) {
    [from, to] = [to, from];
    invalid = true;
  }
  return {
    preset: "custom",
    from,
    to,
    grain: grainForRange(from, to),
    label: rangeLabel(from, to),
    invalid,
  };
}

/** Equal-length period immediately before `range`. */
export function previousDateRange(range: DateRange): {
  from: string;
  to: string;
} {
  const count = daysBetween(range.from, range.to);
  const to = addDaysIso(range.from, -1);
  return { from: addDaysIso(to, -(count - 1)), to };
}

export function bucketStart(
  date: string,
  grain: RangeGrain,
): string {
  const d = dateOnlyUtc(date.slice(0, 10));
  if (!d) return date;
  if (grain === "month") {
    d.setUTCDate(1);
  } else if (grain === "week") {
    const day = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
  }
  return d.toISOString().slice(0, 10);
}

export function bucketLabel(start: string, grain: RangeGrain): string {
  const d = dateOnlyUtc(start);
  if (!d) return start;
  if (grain === "month") {
    return `${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }
  return `${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function bucketStarts(
  from: string,
  to: string,
  grain: RangeGrain,
): string[] {
  const out: string[] = [];
  let cur = bucketStart(from, grain);
  const end = bucketStart(to, grain);
  let guard = 0;
  while (cur <= end && guard < 5000) {
    out.push(cur);
    if (grain === "day") cur = addDaysIso(cur, 1);
    else if (grain === "week") cur = addDaysIso(cur, 7);
    else {
      const d = dateOnlyUtc(cur);
      if (!d) break;
      d.setUTCMonth(d.getUTCMonth() + 1);
      d.setUTCDate(1);
      cur = d.toISOString().slice(0, 10);
    }
    guard += 1;
  }
  return out;
}

export interface YearMonth {
  y: number;
  m: number;
}

export interface PeriodBucket extends YearMonth {
  /** Short month label, e.g. "Jan". */
  mShort: string;
  count: number;
  total: number;
}

/**
 * Parse a date-only string ("2026-10-28") or full ISO timestamp without
 * letting the runtime reinterpret a bare date as UTC midnight.
 */
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value || value === "—") return null;
  const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function yearMonthOf(
  value: string | null | undefined,
): YearMonth | null {
  const d = parseDateOnly(value);
  return d ? { y: d.getFullYear(), m: d.getMonth() } : null;
}

/** Local calendar date as `YYYY-MM-DD` (no UTC shift). */
export function isoDateLocal(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Trailing window ending at the current month (oldest first). */
export function trailingMonths(count = 12, now = new Date()): YearMonth[] {
  const out: YearMonth[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ y: d.getFullYear(), m: d.getMonth() });
  }
  return out;
}

export function shortMonthLabel(ym: YearMonth): string {
  return MONTH_LABELS[ym.m];
}

/**
 * Bucket rows into a trailing calendar window. Rows outside the window (or
 * with unparseable dates) are ignored, so `count`/`total` reflect exactly the
 * period the chart shows.
 */
export function bucketTrailingMonths<T>(
  rows: T[],
  getDate: (row: T) => string | null | undefined,
  getValue?: (row: T) => number,
  options: { months?: number; now?: Date } = {},
): PeriodBucket[] {
  const months = options.months ?? 12;
  const now = options.now ?? new Date();
  const window = trailingMonths(months, now);
  const buckets: PeriodBucket[] = window.map((ym) => ({
    ...ym,
    mShort: shortMonthLabel(ym),
    count: 0,
    total: 0,
  }));
  const index = new Map(window.map((ym, i) => [`${ym.y}-${ym.m}`, i] as const));
  for (const row of rows) {
    const ym = yearMonthOf(getDate(row));
    if (!ym) continue;
    const i = index.get(`${ym.y}-${ym.m}`);
    if (i === undefined) continue;
    buckets[i].count += 1;
    if (getValue) buckets[i].total += getValue(row) || 0;
  }
  return buckets;
}

export interface Delta {
  diff: number;
  label: string;
  up: boolean;
}

/**
 * Current trailing bucket minus the one before it. Pass `pick` to compare a
 * value other than row count (revenue, divers, credits…).
 */
export function deltaMoM<T extends { count: number; total: number }>(
  buckets: T[],
  pick: (bucket: T) => number = (b) => b.count,
): Delta {
  const cur = buckets.length >= 1 ? buckets[buckets.length - 1] : undefined;
  const prev = buckets.length >= 2 ? buckets[buckets.length - 2] : undefined;
  const diff = (cur ? pick(cur) : 0) - (prev ? pick(prev) : 0);
  return { diff, label: `${diff >= 0 ? "+" : ""}${diff}`, up: diff >= 0 };
}

/** Current bucket (last entry in a trailing window). */
export function currentBucket<T>(buckets: T[]): T | undefined {
  return buckets.length ? buckets[buckets.length - 1] : undefined;
}

/** Previous bucket (second to last entry in a trailing window). */
export function previousBucket<T>(buckets: T[]): T | undefined {
  return buckets.length >= 2 ? buckets[buckets.length - 2] : undefined;
}
