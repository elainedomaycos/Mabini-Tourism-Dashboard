import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "./supabase";

/**
 * Live data layer for the TO dashboard (reads-first scope).
 *
 * The dashboard sits behind the staff login gate, so any active session is
 * a verified superadmin (see staff-auth.ts + migration 030 in the sinsay
 * repo). Live mode is therefore just "client configured" (see `useLiveMode()`)
 * — every hook below stays disabled when Supabase isn't configured, and
 * callers fall back to the built-in mock arrays.
 */

/**
 * @deprecated Import-time snapshot — prefer `useLiveMode()` in components so
 * the data-source check is evaluated at render time, not module load.
 */
export const liveMode = isSupabaseConfigured;

/** Render-time data-source check. Re-evaluated on every render. */
export function useLiveMode(): boolean {
  return isSupabaseConfigured;
}

/** Non-hook equivalent for event handlers / async callbacks. */
export const isLiveMode = (): boolean => isSupabaseConfigured;

const shortId = (uuid: string) => uuid.replace(/-/g, "").slice(0, 8).toUpperCase();
const dayOf = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export interface LiveAppRow {
  _dbId: string;
  id: string;
  name: string;
  owner: string;
  submitted: string;
  status: "Pending" | "Approved" | "Rejected";
  rejectReason?: string;
  resort_location: string | null;
  role: string | null;
  contact_number: string | null;
  business_permit_url: string | null;
  pcss_url: string | null;
  tourist_id: string;
}

async function fetchOperatorApplications(): Promise<LiveAppRow[]> {
  const { data: apps, error } = await supabase
    .from("operator_applications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  const ids = [...new Set((apps || []).map((a: any) => a.tourist_id))];
  let names = new Map<string, string>();
  if (ids.length > 0) {
    const { data: tourists, error: tErr } = await supabase
      .from("tourists")
      .select("id, full_name")
      .in("id", ids);
    if (tErr) throw tErr;
    names = new Map((tourists || []).map((t: any) => [t.id, t.full_name]));
  }
  return (apps || []).map((a: any) => ({
    _dbId: a.id,
    id: shortId(a.id),
    name: a.resort_name,
    owner: names.get(a.tourist_id) || "Unknown",
    submitted: dayOf(a.created_at),
    status: cap(a.status) as LiveAppRow["status"],
    rejectReason: a.rejection_reason || undefined,
    resort_location: a.resort_location ?? null,
    role: a.role ?? null,
    contact_number: a.contact_number ?? null,
    business_permit_url: a.business_permit_url ?? null,
    pcss_url: a.pcss_url ?? null,
    tourist_id: a.tourist_id,
  }));
}

export async function decideApplication(
  dbId: string,
  decision: "approved" | "rejected" | "pending",
  reason?: string
): Promise<void> {
  const { error } = await supabase
    .from("operator_applications")
    .update({
      status: decision,
      rejection_reason: decision === "rejected" ? reason || null : null,
    })
    .eq("id", dbId);
  if (error) throw error;
}

export function useOperatorApplicationsLive() {
  return useQuery({
    queryKey: ["live", "operator_applications"],
    queryFn: fetchOperatorApplications,
    enabled: isSupabaseConfigured,
    staleTime: 30_000,
    retry: 1,
  });
}

export interface LiveReceiptRow {
  _dbId: string;
  id: string;
  operator: string;
  ref: string;
  amount: string;
  amountNum: number;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
  rejectReason?: string;
  receiptPath: string | null;
  passLabel: string;
}

async function fetchReceipts(): Promise<LiveReceiptRow[]> {
  const { data: txs, error } = await supabase
    .from("payment_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  const invIds = [...new Set((txs || []).map((t: any) => t.dive_pass_inventory_id).filter(Boolean))];
  const opIds = [...new Set((txs || []).map((t: any) => t.operator_id).filter(Boolean))];
  let invById = new Map<string, any>();
  let nameById = new Map<string, string>();
  if (invIds.length > 0) {
    const { data: inv, error: iErr } = await supabase
      .from("dive_pass_inventory")
      .select("id, pass_label")
      .in("id", invIds);
    if (iErr) throw iErr;
    invById = new Map((inv || []).map((r: any) => [r.id, r]));
  }
  if (opIds.length > 0) {
    const { data: ops, error: oErr } = await supabase
      .from("tourists")
      .select("id, full_name")
      .in("id", opIds);
    if (oErr) throw oErr;
    nameById = new Map((ops || []).map((t: any) => [t.id, t.full_name]));
  }
  const statusMap: Record<string, LiveReceiptRow["status"]> = {
    pending: "Pending",
    verified: "Approved",
    rejected: "Rejected",
  };
  return (txs || []).map((t: any) => ({
    _dbId: t.id,
    id: shortId(t.id),
    operator: nameById.get(t.operator_id) || "Unknown operator",
    ref: t.reference_number,
    amount: `₱${Number(t.amount).toLocaleString()}`,
    amountNum: Number(t.amount),
    date: dayOf(t.created_at),
    status: statusMap[t.status] || "Pending",
    rejectReason: t.rejection_reason || undefined,
    receiptPath: t.receipt_url ?? null,
    passLabel: invById.get(t.dive_pass_inventory_id)?.pass_label || "Dive Pass",
  }));
}

export async function decideReceipt(
  dbId: string,
  decision: "verified" | "rejected",
  reason?: string
): Promise<void> {
  const { error } = await supabase
    .from("payment_transactions")
    .update({
      status: decision,
      rejection_reason: decision === "rejected" ? reason || null : null,
    })
    .eq("id", dbId);
  if (error) throw error;
}

export function useReceiptsLive() {
  return useQuery({
    queryKey: ["live", "payment_transactions"],
    queryFn: fetchReceipts,
    enabled: isSupabaseConfigured,
    staleTime: 30_000,
    retry: 1,
  });
}

export interface LiveTouristRow {
  _dbId: string;
  id: string;
  name: string;
  nationality: string | null;
  level: string | null;
  status: "Active" | "Expired" | "Suspended";
  registered: string;
  expires: string;
  createdAt: string;
}

async function fetchTourists(): Promise<LiveTouristRow[]> {
  const { data: rows, error } = await supabase
    .from("tourists")
    .select(
      "id, full_name, nationality, certification_level, status, date_accredited, renewal_date, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  // Status overlay: the stored column carries operator intent
  // (Active/Suspended per 031); expiry is derived — a lapsed renewal_date
  // reads Expired even when the stored value is still Active.
  const today = new Date().toISOString().slice(0, 10);
  return (rows || []).map((t: any) => {
    const stored = String(t.status || "Active").toLowerCase();
    const renewal = dayOf(t.renewal_date ?? null);
    const status: LiveTouristRow["status"] =
      stored === "suspended"
        ? "Suspended"
        : renewal !== "—" && renewal < today
          ? "Expired"
          : "Active";
    return {
      _dbId: t.id,
      id: shortId(t.id),
      name: t.full_name,
      nationality: t.nationality ?? null,
      level: t.certification_level ?? null,
      status,
      registered: dayOf(t.date_accredited || t.created_at),
      expires: renewal,
      createdAt: dayOf(t.created_at),
    };
  });
}

export function useTouristsLive() {
  return useQuery({
    queryKey: ["live", "tourists"],
    queryFn: fetchTourists,
    enabled: isSupabaseConfigured,
    staleTime: 30_000,
    retry: 1,
  });
}

/** Suspend or reactivate a tourist. Requires 031 (status + staff UPDATE). */
export async function setTouristStatus(
  dbId: string,
  decision: "suspended" | "active"
): Promise<void> {
  const { error } = await supabase
    .from("tourists")
    .update({ status: decision === "suspended" ? "Suspended" : "Active" })
    .eq("id", dbId);
  if (error) throw error;
}

/** Extend a tourist's ID by one year from today. */
export async function renewTourist(dbId: string): Promise<string> {
  const next = new Date();
  next.setFullYear(next.getFullYear() + 1);
  const renewalDate = next.toISOString().slice(0, 10);
  const { error } = await supabase
    .from("tourists")
    .update({ renewal_date: renewalDate })
    .eq("id", dbId);
  if (error) throw error;
  return renewalDate;
}

export interface LiveManifestRow {
  _dbId: string;
  id: string;
  operator: string;
  site: string;
  divers: number;
  date: string;
  verified: boolean;
  diveType: string | null;
  diveMode: string | null;
  difficulty: string | null;
  boatName: string | null;
  maxDivers: number | null;
}

export interface LiveDiverRow {
  name: string;
  ecoId: string | null;
  isWalkIn: boolean;
}

async function fetchManifests(): Promise<LiveManifestRow[]> {
  const { data: manifests, error } = await supabase
    .from("dive_manifests")
    .select(
      "id, operator_id, location, created_at, verified, dive_type, dive_mode, difficulty, boat_name, max_divers"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  const mIds = [...new Set((manifests || []).map((m: any) => m.id))];
  const opIds = [
    ...new Set((manifests || []).map((m: any) => m.operator_id).filter(Boolean)),
  ];
  let diversByManifest = new Map<string, number>();
  let resortByTourist = new Map<string, string>();
  let nameById = new Map<string, string>();
  if (mIds.length > 0) {
    const { data: divers, error: dErr } = await supabase
      .from("manifest_divers")
      .select("manifest_id")
      .in("manifest_id", mIds);
    if (dErr) throw dErr;
    for (const d of divers || []) {
      diversByManifest.set(
        (d as any).manifest_id,
        (diversByManifest.get((d as any).manifest_id) || 0) + 1
      );
    }
  }
  if (opIds.length > 0) {
    const [{ data: apps }, { data: tourists }] = await Promise.all([
      supabase
        .from("operator_applications")
        .select("tourist_id, resort_name, status")
        .in("tourist_id", opIds),
      supabase.from("tourists").select("id, full_name").in("id", opIds),
    ]);
    // Prefer the approved resort name; fall back to any application name.
    for (const a of apps || []) {
      const key = (a as any).tourist_id as string;
      if ((a as any).status === "approved" || !resortByTourist.has(key)) {
        resortByTourist.set(key, (a as any).resort_name);
      }
    }
    nameById = new Map((tourists || []).map((t: any) => [t.id, t.full_name]));
  }
  return (manifests || []).map((m: any) => ({
    _dbId: m.id,
    id: shortId(m.id),
    operator:
      resortByTourist.get(m.operator_id) ||
      nameById.get(m.operator_id) ||
      "Unknown operator",
    site: m.location,
    divers: diversByManifest.get(m.id) || 0,
    // dive_manifests carries no dive-date column — created day is the date.
    date: dayOf(m.created_at),
    verified: m.verified === true,
    diveType: m.dive_type ?? null,
    diveMode: m.dive_mode ?? null,
    difficulty: m.difficulty ?? null,
    boatName: m.boat_name ?? null,
    maxDivers: m.max_divers ?? null,
  }));
}

export function useManifestsLive() {
  return useQuery({
    queryKey: ["live", "dive_manifests"],
    queryFn: fetchManifests,
    enabled: isSupabaseConfigured,
    staleTime: 30_000,
    retry: 1,
  });
}

/** Staff verify/unverify. Requires 032 (verified + staff UPDATE). */
export async function setManifestVerified(
  dbId: string,
  verified: boolean
): Promise<void> {
  const { error } = await supabase
    .from("dive_manifests")
    .update({
      verified,
      verified_at: verified ? new Date().toISOString() : null,
    })
    .eq("id", dbId);
  if (error) throw error;
}

/** Diver roster for one manifest (lightbox detail). */
export async function fetchManifestDivers(
  manifestId: string
): Promise<LiveDiverRow[]> {
  const { data, error } = await supabase
    .from("manifest_divers")
    .select("name, eco_id, is_walk_in")
    .eq("manifest_id", manifestId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data || []).map((d: any) => ({
    name: d.name,
    ecoId: d.eco_id ?? null,
    isWalkIn: d.is_walk_in === true,
  }));
}

/** Signed (1h) URL for a private-bucket receipt path. Staff-only via 030. */
export async function getReceiptUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("operator_uploads")
    .createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export function useInvalidateLive() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["live"] });
  };
}

/* ------------------------------ DIVE PASS INVENTORY ------------------------------ */

export interface LiveInventoryRow {
  _dbId: string;
  operatorId: string;
  operator: string;
  passType: string;
  passLabel: string;
  totalPasses: number;
  remainingPasses: number;
  amount: number;
  createdAt: string;
}

async function fetchInventory(): Promise<LiveInventoryRow[]> {
  const { data: rows, error } = await supabase
    .from("dive_pass_inventory")
    .select(
      "id, operator_id, pass_type, pass_label, total_passes, remaining_passes, amount, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  const opIds = [
    ...new Set((rows || []).map((r: any) => r.operator_id).filter(Boolean)),
  ];
  let resortByTourist = new Map<string, string>();
  let nameById = new Map<string, string>();
  if (opIds.length > 0) {
    const [{ data: apps }, { data: tourists }] = await Promise.all([
      supabase
        .from("operator_applications")
        .select("tourist_id, resort_name, status")
        .in("tourist_id", opIds),
      supabase.from("tourists").select("id, full_name").in("id", opIds),
    ]);
    for (const a of apps || []) {
      const key = (a as any).tourist_id as string;
      if ((a as any).status === "approved" || !resortByTourist.has(key)) {
        resortByTourist.set(key, (a as any).resort_name);
      }
    }
    nameById = new Map((tourists || []).map((t: any) => [t.id, t.full_name]));
  }
  return (rows || []).map((r: any) => ({
    _dbId: r.id,
    operatorId: r.operator_id,
    operator:
      resortByTourist.get(r.operator_id) ||
      nameById.get(r.operator_id) ||
      "Unknown operator",
    passType: r.pass_type,
    passLabel: r.pass_label,
    totalPasses: Number(r.total_passes) || 0,
    remainingPasses: Number(r.remaining_passes) || 0,
    amount: Number(r.amount) || 0,
    createdAt: dayOf(r.created_at),
  }));
}

export function useInventoryLive() {
  return useQuery({
    queryKey: ["live", "dive_pass_inventory"],
    queryFn: fetchInventory,
    enabled: isSupabaseConfigured,
    staleTime: 30_000,
    retry: 1,
  });
}

/* ------------------------------ KPI HELPERS ------------------------------ */

const KPI_MONTHS = [
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

function monthIndexOf(dateStr: string | null | undefined): number {
  if (!dateStr || dateStr === "—") return -1;
  const d = new Date(
    dateStr.length <= 10 ? dateStr + "T00:00:00" : dateStr
  );
  if (Number.isNaN(d.getTime())) return -1;
  return d.getMonth();
}

export interface MonthBucket {
  m: string;
  count: number;
  total: number;
}

/**
 * Real 12-month buckets over live rows. Replaces the old `scale * 3`
 * multiplier that faked responsiveness on mock series. Rows with unknown
 * dates are skipped (they still render in tables via pass-through filters).
 */
export function bucketByMonth<T>(
  rows: T[],
  getDate: (r: T) => string,
  getValue?: (r: T) => number
): MonthBucket[] {
  const buckets: MonthBucket[] = KPI_MONTHS.map((m) => ({
    m,
    count: 0,
    total: 0,
  }));
  for (const r of rows) {
    const idx = monthIndexOf(getDate(r));
    if (idx < 0) continue;
    buckets[idx].count += 1;
    if (getValue) buckets[idx].total += getValue(r) || 0;
  }
  return buckets;
}

/** Rows whose date falls in the real current calendar month. */
export function thisMonth<T>(rows: T[], getDate: (r: T) => string): T[] {
  const cur = new Date().getMonth();
  return rows.filter((r) => monthIndexOf(getDate(r)) === cur);
}

export interface PeriodBucket {
  label: string;
  start: string;
  end: string;
  count: number;
  total: number;
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const shortDay = (d: Date) =>
  d.toLocaleString("en", { month: "short", day: "numeric" });

function sumInto<T>(
  rows: T[],
  getDate: (r: T) => string,
  getValue: ((r: T) => number) | undefined,
  fromISO: string,
  toISO: string
): { count: number; total: number } {
  let count = 0;
  let total = 0;
  for (const r of rows) {
    const d = getDate(r);
    if (!d || d === "—" || d < fromISO || d > toISO) continue;
    count += 1;
    if (getValue) total += getValue(r) || 0;
  }
  return { count, total };
}

/** Last N days (day-level buckets ending today) for daily reports. */
export function bucketByDay<T>(
  rows: T[],
  getDate: (r: T) => string,
  getValue?: (r: T) => number,
  days = 3
): PeriodBucket[] {
  const out: PeriodBucket[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    const iso = isoDay(d);
    const { count, total } = sumInto(rows, getDate, getValue, iso, iso);
    out.push({ label: shortDay(d), start: iso, end: iso, count, total });
  }
  return out;
}

/** Last N 7-day windows ending today for weekly reports. */
export function bucketByWeek<T>(
  rows: T[],
  getDate: (r: T) => string,
  getValue?: (r: T) => number,
  weeks = 3
): PeriodBucket[] {
  const out: PeriodBucket[] = [];
  const now = new Date();
  for (let w = 0; w < weeks; w++) {
    const end = new Date(now.getTime() - w * 7 * 86400000);
    const start = new Date(end.getTime() - 6 * 86400000);
    const sISO = isoDay(start);
    const eISO = isoDay(end);
    const { count, total } = sumInto(rows, getDate, getValue, sISO, eISO);
    out.push({
      label: `${shortDay(start)}–${shortDay(end)}`,
      start: sISO,
      end: eISO,
      count,
      total,
    });
  }
  return out;
}

/**
 * Realtime refresh for the live tables. Subscribes to postgres_changes on
 * operator_applications + payment_transactions + tourists + dive_manifests
 * (+ manifest_divers, which rolls up into the manifest list) +
 * dive_pass_inventory and invalidates the matching live query so counts,
 * badges and rows update without a manual refetch.
 *
 * No-op when Supabase isn't configured. Requires each table to be in the
 * `supabase_realtime` publication with staff SELECT (030) — otherwise the
 * channel connects but no events arrive, and the dashboard keeps working via
 * polling-by-invalidate (staleTime 30s + refetch after each write).
 */
export function useLiveRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel("to-dashboard-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "operator_applications" },
        () => {
          qc.invalidateQueries({ queryKey: ["live", "operator_applications"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payment_transactions" },
        () => {
          qc.invalidateQueries({ queryKey: ["live", "payment_transactions"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tourists" },
        () => {
          qc.invalidateQueries({ queryKey: ["live", "tourists"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dive_manifests" },
        () => {
          qc.invalidateQueries({ queryKey: ["live", "dive_manifests"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "manifest_divers" },
        () => {
          qc.invalidateQueries({ queryKey: ["live", "dive_manifests"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dive_pass_inventory" },
        () => {
          qc.invalidateQueries({ queryKey: ["live", "dive_pass_inventory"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
