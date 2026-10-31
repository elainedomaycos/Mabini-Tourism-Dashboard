import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  bucketStarts,
  bucketLabel,
  type DateRange,
  type RangeGrain,
} from "@/lib/period";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/* ------------------------------ SHARED SHAPES ------------------------------ */

export interface CountRow {
  name: string;
  count: number;
}

export interface DailyTourists {
  date: string;
  tourists: number;
  divers: number;
  revenue: number;
}

export interface DailyDiveActivity {
  date: string;
  manifests: number;
  divers: number;
}

export interface DailyTourist {
  date: string;
  all: number;
  domestic: number;
  international: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
}

export interface DailyInventory {
  date: string;
  passType: string;
  purchased: number;
  remaining: number;
  amount: number;
}

export interface SiteMetric {
  id: string;
  name: string;
  barangay: string;
  types: string[];
  status: string;
  dives: number;
  description: string;
  depth: string;
  difficulty: string;
}

export interface OverviewMetrics {
  tourists: number;
  touristsPrev: number;
  activeIds: number;
  todayDivers: number;
  yesterdayDivers: number;
  approvedOperators: number;
  activeSites: number;
  revenue: number;
  revenuePrev: number;
  pendingReceipts: number;
  oldestPendingReceiptDays: number;
  pendingApplications: number;
  oldestPendingAppDays: number;
  expiringPasses: number;
  series: DailyTourists[];
  nationality: CountRow[];
  level: CountRow[];
  diveTypes: CountRow[];
  topSites: Array<{ name: string; divers: number; manifests: number }>;
  sites: SiteMetric[];
}

export interface TouristMetrics {
  total: number;
  totalPrev: number;
  divers: number;
  diversPrev: number;
  newNationalities: number;
  totals: {
    all: number;
    domestic: number;
    international: number;
    prevAll: number;
    prevDomestic: number;
    prevInternational: number;
  };
  nationalities: Array<CountRow & { domestic: boolean }>;
  levels: Array<CountRow & { domestic: boolean }>;
  nationalityLevels: Array<{
    nationality: string;
    level: string;
    domestic: boolean;
    count: number;
  }>;
  daily: DailyTourist[];
}

export interface DiveActivityMetrics {
  divers: number;
  diversPrev: number;
  manifests: number;
  manifestsPrev: number;
  sitesUsed: number;
  unverified: number;
  daily: DailyDiveActivity[];
  types: CountRow[];
  siteTypes: Array<{ site: string; type: string; divers: number }>;
  seasonal: Array<{ season: string; divers: number; trips: number }>;
  capacity: Array<{
    site: string;
    maxCapacity: number;
    actualDives: number;
  }>;
}

export interface DivePassMetrics {
  revenue: number;
  revenuePrev: number;
  creditsUsed: number;
  purchased: number;
  remaining: number;
  pendingReceipts: number;
  oldestPendingReceiptDays: number;
  dailyRevenue: DailyRevenue[];
  inventory: DailyInventory[];
  passTypes: Array<{
    type: string;
    purchased: number;
    used: number;
    amount: number;
  }>;
}

export interface EstablishmentMetricRow {
  name: string;
  owner: string;
  location: string;
  status: string;
  manifestos: number;
  creditBalance: number;
  createdAt: string;
}

export interface EstablishmentMetrics {
  total: number;
  active: number;
  suspended: number;
  pendingApplications: number;
  establishments: EstablishmentMetricRow[];
}

export interface OperatorMetricRow {
  name: string;
  manifestos: number;
  divers: number;
  credits: number;
  purchased: number;
  remaining: number;
  revenue: number;
  recent: Array<{
    id: string;
    site: string;
    divers: number;
    date: string;
  }>;
}

export interface OperatorMetrics {
  active: number;
  operators: number;
  manifestos: number;
  manifestosPrev: number;
  divers: number;
  diversPrev: number;
  revenue: number;
  revenuePrev: number;
  rows: OperatorMetricRow[];
}

export interface DailyReport {
  date: string;
  tourists: number;
  operators: number;
  manifestos: number;
  divers: number;
  revenue: number;
}

export interface ReportMetrics {
  daily: DailyReport[];
}

export interface TouristSampleRow {
  name: string;
  nationality: string;
  level: string;
  status: string;
}

export interface MetricsBySection {
  overview: OverviewMetrics;
  tourist: TouristMetrics;
  dive_activity: DiveActivityMetrics;
  dive_pass: DivePassMetrics;
  establishment: EstablishmentMetrics;
  operator: OperatorMetrics;
  report: ReportMetrics;
}

export type MetricsSection = keyof MetricsBySection;

/* ------------------------------ DATA ACCESS ------------------------------ */

export const metricsQueryKey = (section: string, range: DateRange) =>
  ["metrics", section, range.from, range.to] as const;

async function fetchMetrics<S extends MetricsSection>(
  section: S,
  range: DateRange,
): Promise<MetricsBySection[S]> {
  const { data, error } = await supabase.rpc("to_metrics", {
    p_section: section,
    p_from: range.from,
    p_to: range.to,
  });
  if (error) throw error;
  if (!data || typeof data !== "object") {
    throw new Error("Metrics backend returned an empty response.");
  }
  return normalizeMetrics(section, data as MetricsBySection[S]);
}

export function useMetrics<S extends MetricsSection>(
  section: S,
  range: DateRange,
) {
  return useQuery({
    queryKey: metricsQueryKey(section, range),
    queryFn: () => fetchMetrics(section, range),
    enabled: isSupabaseConfigured,
    staleTime: 30_000,
    retry: 1,
    placeholderData: keepPreviousData,
  });
}

export interface TouristSampleFilter {
  nationality?: string | null;
  level?: string | null;
  excludeNationalities?: string[];
}

export function useTouristSample(
  range: DateRange,
  filter: TouristSampleFilter,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "metrics",
      "tourist_sample",
      range.from,
      range.to,
      filter.nationality ?? "",
      filter.level ?? "",
      filter.excludeNationalities?.join("|") ?? "",
    ],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("to_tourist_sample", {
        p_from: range.from,
        p_to: range.to,
        p_nationality: filter.nationality || null,
        p_level: filter.level || null,
        p_exclude_nationalities: filter.excludeNationalities ?? [],
      });
      if (error) throw error;
      const rows = (data as { rows?: TouristSampleRow[] } | null)?.rows;
      return Array.isArray(rows)
        ? rows.map((row) => ({
            ...row,
            nationality: displayNationality(row.nationality) || "Unknown",
          }))
        : [];
    },
    enabled: isSupabaseConfigured && enabled,
    staleTime: 30_000,
    retry: 1,
  });
}

/* ------------------------------ NORMALISERS ------------------------------ */

export function displayNationality(value: string | null | undefined): string {
  const text = String(value ?? "").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function normalizeMetrics<S extends MetricsSection>(
  section: S,
  metrics: MetricsBySection[S],
): MetricsBySection[S] {
  if (section === "overview") {
    const overview = metrics as OverviewMetrics;
    return {
      ...overview,
      nationality: overview.nationality.map((row) => ({
        ...row,
        name: displayNationality(row.name) || "Unknown",
      })),
    } as MetricsBySection[S];
  }
  if (section === "tourist") {
    const tourist = metrics as TouristMetrics;
    return {
      ...tourist,
      nationalities: tourist.nationalities.map((row) => ({
        ...row,
        name: displayNationality(row.name) || "Unknown",
      })),
      nationalityLevels: tourist.nationalityLevels.map((row) => ({
        ...row,
        nationality: displayNationality(row.nationality) || "Unknown",
      })),
    } as MetricsBySection[S];
  }
  return metrics;
}

export const DOMESTIC_NATIONALITIES = new Set([
  "philippines",
  "ph",
  "pilipinas",
  "filipino",
  "filipina",
]);

export function isDomesticNationality(
  value: string | null | undefined,
): boolean {
  return DOMESTIC_NATIONALITIES.has(
    String(value ?? "")
      .trim()
      .toLowerCase(),
  );
}

export const LEVEL_ORDER = [
  "Intro",
  "Open Water",
  "Advanced",
  "Rescue",
  "Divemaster",
  "Instructor",
] as const;

/** Map free-text certification levels to the dashboard's canonical buckets. */
export function normalizeLevel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s.includes("intro")) return "Intro";
  if (s.includes("open")) return "Open Water";
  if (s.includes("advanced")) return "Advanced";
  if (s.includes("rescue")) return "Rescue";
  if (s.includes("master")) return "Divemaster";
  if (s.includes("instructor")) return "Instructor";
  return null;
}

export const DIVING_TYPE_KEYS = [
  "scuba",
  "introDive",
  "funDive",
  "training",
  "freediver",
] as const;

export type DivingTypeKey = (typeof DIVING_TYPE_KEYS)[number];

export const DIVING_TYPE_LABELS: Record<DivingTypeKey, string> = {
  scuba: "Scuba",
  introDive: "Intro Dive",
  funDive: "Fun Dive",
  training: "Training",
  freediver: "Freediver",
};

export function normalizeDiveType(
  raw: string | null | undefined,
): DivingTypeKey | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s.includes("scuba")) return "scuba";
  if (s.includes("intro")) return "introDive";
  if (s.includes("fun")) return "funDive";
  if (s.includes("train")) return "training";
  if (s.includes("free")) return "freediver";
  return null;
}

export function normalizeSeason(raw: string | null | undefined): string {
  const s = String(raw ?? "").toLowerCase();
  if (s.startsWith("sum")) return "Summer";
  if (s.startsWith("aut")) return "Autumn";
  if (s.startsWith("win")) return "Winter";
  if (s.startsWith("spr")) return "Spring";
  return raw || "Unknown";
}

export function percent(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

/** Collapse a count list into top-N rows plus an "Other" bucket. */
export function topWithOther(
  rows: CountRow[],
  topN = 5,
): Array<CountRow & { value: number }> {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const sorted = [...rows].sort((a, b) => b.count - a.count);
  const head = sorted.slice(0, topN).map((row) => ({
    ...row,
    value: percent(row.count, total),
  }));
  const rest = sorted.slice(topN).reduce((sum, row) => sum + row.count, 0);
  if (rest > 0) {
    head.push({ name: "Other", count: rest, value: percent(rest, total) });
  }
  return head;
}

/* ------------------------------ BUCKET HELPERS ------------------------------ */

export interface BucketBase {
  start: string;
  label: string;
}

/**
 * Zero-fill the selected range and fold daily RPC rows into its display grain.
 * Keeping aggregation in SQL and only bucketing labels client-side avoids two
 * different date-window implementations.
 */
export function aggregateDaily<Row, Acc extends object>(
  range: DateRange,
  rows: Row[],
  getDate: (row: Row) => string,
  create: () => Acc,
  add: (acc: Acc, row: Row) => void,
): Array<Acc & BucketBase> {
  const starts = bucketStarts(range.from, range.to, range.grain);
  const buckets = new Map<string, Acc & BucketBase>();
  for (const start of starts) {
    buckets.set(start, {
      start,
      label: bucketLabel(start, range.grain),
      ...create(),
    });
  }
  for (const row of rows) {
    const start = bucketStartOf(getDate(row), range.grain);
    const bucket = buckets.get(start);
    if (bucket) add(bucket, row);
  }
  return [...buckets.values()];
}

function bucketStartOf(date: string, grain: RangeGrain): string {
  const d = new Date(`${String(date).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  if (grain === "month") d.setUTCDate(1);
  else if (grain === "week") {
    const day = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
  }
  return d.toISOString().slice(0, 10);
}

export function sumBy<T>(rows: T[], getValue: (row: T) => number): number {
  return rows.reduce((sum, row) => sum + (getValue(row) || 0), 0);
}
