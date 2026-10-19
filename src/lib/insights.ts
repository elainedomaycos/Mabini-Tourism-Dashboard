/**
 * Insight engine for the Overview widget.
 *
 * Pure functions: metrics in, sentences out. No hooks, no queries, no AI —
 * every claim is interpolated from a value the dashboard already computed, so
 * the text cannot drift from the numbers beside it and needs no API key,
 * network call, or fallback path. Reactivity is inherited: callers feed it
 * React Query-derived values, so an invalidation re-derives the prose exactly
 * when the KPIs change.
 *
 * Vary templates per clause with a deterministic `seed` (e.g. day of month) so
 * the copy is not identical every render while staying reproducible.
 */

export type InsightSeverity = "high" | "medium" | "low";

export interface OverviewFactsInput {
  live: boolean;
  /** Registered tourists in the active window. */
  tourists: number;
  activeIds: number;
  /** Month-over-month change in tourist registrations. */
  touristDelta: number;
  /** Dives logged today, and the change vs yesterday. */
  todayDives: number;
  dayDelta: number;
  /** Revenue in the current month, and the change vs last month. */
  monthRevenue: number;
  revenueDelta: number;
  pendingReceipts: number;
  /** Age in days of the oldest pending receipt, 0 when none. */
  oldestPendingReceiptDays: number;
  pendingApplications: number;
  /** Age in days of the oldest pending application, 0 when none. */
  oldestPendingAppDays: number;
  /** Active dive passes expiring within 30 days. */
  expiringPasses: number;
  /** Most-visited site and its share of divers (0-100), or null if unknown. */
  topSite: string | null;
  topSiteShare: number;
  /** Most common dive type and its share (0-100), or null if unknown. */
  topDiveType: string | null;
  topDiveTypeShare: number;
  activeSites: number;
  seed: number;
}

export interface InsightRecommendation {
  id: string;
  title: string;
  detail: string;
  severity: InsightSeverity;
  /** Dashboard section to open on click (null = informational only). */
  section: string | null;
}

export interface OverviewInsight {
  description: string;
  recommendations: InsightRecommendation[];
  generatedAt: number;
}

const clamp = (n: number) => (Number.isFinite(n) ? n : 0);

/** Pick a template variant without randomness, so output is reproducible. */
function pick<T>(options: T[], seed: number): T {
  return options[Math.abs(Math.trunc(seed)) % options.length];
}

/** +2 and +40 should not read the same. */
function magnitude(delta: number): "surge" | "rise" | "edged" | "flat" {
  if (delta <= 0) return "flat";
  if (delta >= 25) return "surge";
  if (delta >= 8) return "rise";
  return "edged";
}

function peso(value: number): string {
  const v = clamp(value);
  if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₱${Math.round(v / 1_000)}k`;
  return `₱${Math.round(v)}`;
}

function signed(n: number): string {
  const v = Math.trunc(clamp(n));
  return v >= 0 ? `+${v}` : `${v}`;
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/**
 * Derives the narrative and the nudge list. Every branch guards against
 * empty/zero data so a fresh database yields a calm "nothing needs attention"
 * message rather than sentences about nothing.
 */
export function buildOverviewInsight(
  input: OverviewFactsInput,
): OverviewInsight {
  const f: OverviewFactsInput = {
    ...input,
    tourists: clamp(input.tourists),
    activeIds: clamp(input.activeIds),
    touristDelta: clamp(input.touristDelta),
    todayDives: clamp(input.todayDives),
    dayDelta: clamp(input.dayDelta),
    monthRevenue: clamp(input.monthRevenue),
    revenueDelta: clamp(input.revenueDelta),
    pendingReceipts: clamp(input.pendingReceipts),
    oldestPendingReceiptDays: clamp(input.oldestPendingReceiptDays),
    pendingApplications: clamp(input.pendingApplications),
    oldestPendingAppDays: clamp(input.oldestPendingAppDays),
    expiringPasses: clamp(input.expiringPasses),
    topSiteShare: clamp(input.topSiteShare),
    topDiveTypeShare: clamp(input.topDiveTypeShare),
    activeSites: clamp(input.activeSites),
  };

  const recommendations: InsightRecommendation[] = [];
  const seed = f.seed;

  // ---- Description -------------------------------------------------------
  // "held steady by 0 versus last month" reads wrong — zero delta gets no
  // magnitude clause at all.
  const arrivalClause =
    f.touristDelta === 0
      ? "steady"
      : f.touristDelta > 0
        ? `up ${Math.abs(Math.trunc(f.touristDelta))}`
        : `down ${Math.abs(Math.trunc(f.touristDelta))}`;
  const dayDeltaSuffix =
    f.dayDelta === 0 ? "" : ` (${signed(f.dayDelta)} day-over-day)`;

  const clauses: string[] = [];
  const arrivalVerb =
    f.touristDelta > 0
      ? magnitude(f.touristDelta) === "surge"
        ? "surged"
        : magnitude(f.touristDelta) === "rise"
          ? "climbed"
          : "edged up"
      : f.touristDelta < 0
        ? "fell"
        : "held steady";

  if (f.live) {
    clauses.push(
      pick(
        [
          `Tourist registrations ${arrivalVerb} ${signed(f.touristDelta)} month-over-month to ${f.tourists.toLocaleString("en-PH")}.`,
          `Across the current window, ${f.tourists.toLocaleString("en-PH")} tourists are registered — ${arrivalClause} versus last month.`,
          `${f.tourists.toLocaleString("en-PH")} tourists on record, with registrations ${arrivalVerb} ${signed(f.touristDelta)} month-over-month.`,
        ],
        seed,
      ),
    );
    clauses.push(
      f.todayDives > 0
        ? pick(
            [
              `${f.todayDives} ${plural(f.todayDives, "dive is", "dives are")} logged today, ${f.dayDelta >= 0 ? "ahead" : "behind"} of the same point yesterday.`,
              `Today has ${f.todayDives} logged ${plural(f.todayDives, "dive", "dives")}, ${f.dayDelta >= 0 ? "tracking above" : "trailing"} yesterday.`,
              `${f.todayDives} ${plural(f.todayDives, "dive", "dives")} on the water today${dayDeltaSuffix}.`,
            ],
            seed + 1,
          )
        : "No dives have been logged yet today.",
    );
    if (f.monthRevenue > 0) {
      clauses.push(
        pick(
          [
            `Revenue is tracking at ${peso(f.monthRevenue)} this month, ${f.revenueDelta >= 0 ? "up" : "down"} ${peso(Math.abs(f.revenueDelta))}.`,
            `${peso(f.monthRevenue)} collected this month — ${f.revenueDelta >= 0 ? "an increase" : "a decline"} of ${peso(Math.abs(f.revenueDelta))}.`,
            `Month-to-date revenue sits at ${peso(f.monthRevenue)}, ${f.revenueDelta >= 0 ? "ahead by" : "behind by"} ${peso(Math.abs(f.revenueDelta))}.`,
          ],
          seed + 2,
        ),
      );
    }
    if (f.topDiveType && f.topDiveTypeShare > 0) {
      clauses.push(
        `${f.topDiveType} accounts for ${Math.round(f.topDiveTypeShare)}% of recorded dive types.`,
      );
    }
  } else {
    clauses.push(
      "Demo mode — connect Supabase to replace sample figures with live metrics.",
    );
  }

  const description = clauses.join(" ");

  // ---- Recommendations ---------------------------------------------------
  // Ordered by severity, then by how actionable each nudge is.
  if (f.pendingReceipts > 0 && f.oldestPendingReceiptDays >= 3) {
    recommendations.push({
      id: "receipts-aging",
      title:
        f.pendingReceipts === 1
          ? "1 receipt awaits verification"
          : `${f.pendingReceipts} receipts await verification`,
      detail: `The oldest has been pending ${Math.round(f.oldestPendingReceiptDays)} days. Review the queue to keep payouts moving.`,
      severity: f.oldestPendingReceiptDays >= 7 ? "high" : "medium",
      section: "dive-pass",
    });
  }
  if (f.pendingApplications > 0 && f.oldestPendingAppDays >= 3) {
    recommendations.push({
      id: "applications-aging",
      title:
        f.pendingApplications === 1
          ? "1 operator application sits undecided"
          : `${f.pendingApplications} operator applications sit undecided`,
      detail: `Oldest submitted ${Math.round(f.oldestPendingAppDays)} days ago. Approve or decline so operators hear back.`,
      severity: f.oldestPendingAppDays >= 7 ? "high" : "medium",
      section: "establishments",
    });
  }
  if (f.expiringPasses > 0) {
    recommendations.push({
      id: "expiring-passes",
      title:
        f.expiringPasses === 1
          ? "1 dive pass expires within 30 days"
          : `${f.expiringPasses} dive passes expire within 30 days`,
      detail:
        "Reach out before renewal windows close to avoid a drop in repeat visitors.",
      severity: f.expiringPasses >= 20 ? "high" : "low",
      section: "dive-pass",
    });
  }
  if (
    f.topSite &&
    f.topSiteShare >= 60 &&
    f.activeSites > 2 &&
    f.todayDives > 0
  ) {
    recommendations.push({
      id: "site-concentration",
      title: `${Math.round(f.topSiteShare)}% of dives are concentrated at ${f.topSite}`,
      detail: `With ${f.activeSites} active sites, spreading arrivals would reduce pressure on this one.`,
      severity: "low",
      section: null,
    });
  }
  if (
    f.live &&
    f.monthRevenue > 0 &&
    f.revenueDelta < 0 &&
    f.touristDelta >= 0
  ) {
    recommendations.push({
      id: "revenue-softness",
      title: "Revenue is down while arrivals hold steady",
      detail: `Worth reviewing pass pricing and uncollected receipts — ${peso(Math.abs(f.revenueDelta))} behind last month.`,
      severity: "medium",
      section: "dive-pass",
    });
  }

  return {
    description,
    recommendations: rankBySeverity(recommendations),
    generatedAt: Date.now(),
  };
}

/* ========================================================================== */
/* ANALYTICS TABS                                                             */
/* ========================================================================== */
/* Same contract as buildOverviewInsight: metrics in, sentences out. Each tab */
/* below is fed by values that component already computes — no extra queries. */

const SEVERITY_RANK: Record<InsightSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function rankBySeverity(
  list: InsightRecommendation[],
): InsightRecommendation[] {
  return [...list].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      a.title.localeCompare(b.title),
  );
}

function trendWord(delta: number): string {
  if (delta > 0) return magnitude(delta) === "surge" ? "surged" : "rose";
  if (delta < 0) return "fell";
  return "held steady";
}

/**
 * Magnitude phrase paired with trendWord. The sign is already carried by the
 * verb ("fell 12"), so this must stay unsigned — "fell -12" is a double
 * negative.
 */
function trendAmount(delta: number): string {
  if (delta === 0) return "";
  return String(Math.abs(Math.trunc(delta)));
}

function shareSentence(label: string, share: number): string | null {
  if (share <= 0) return null;
  return `${label} makes up ${Math.round(share)}% of activity.`;
}

export interface TouristInsightInput {
  live: boolean;
  tourists: number;
  /** Month-over-month change in registrations. */
  registrationsDelta: number;
  nationalities: number;
  /** Share of the single most common nationality (0-100), 0 when unknown. */
  topNationalityShare: number;
  topNationality: string | null;
  /** Share of divers holding the most common certification level (0-100). */
  topLevelShare: number;
  topLevel: string | null;
  expiringPasses: number;
  pendingApplications: number;
  seed: number;
}

export function buildTouristInsight(
  input: TouristInsightInput,
): OverviewInsight {
  const t: TouristInsightInput = {
    ...input,
    tourists: clamp(input.tourists),
    registrationsDelta: clamp(input.registrationsDelta),
    nationalities: clamp(input.nationalities),
    topNationalityShare: clamp(input.topNationalityShare),
    topLevelShare: clamp(input.topLevelShare),
    expiringPasses: clamp(input.expiringPasses),
    pendingApplications: clamp(input.pendingApplications),
  };
  const recs: InsightRecommendation[] = [];

  const clauses: string[] = [];
  if (t.live) {
    clauses.push(
      pick(
        [
          `${t.tourists.toLocaleString("en-PH")} tourists across ${t.nationalities} ${plural(t.nationalities, "nationality", "nationalities")}; registrations ${trendWord(t.registrationsDelta)} ${trendAmount(t.registrationsDelta)} month-over-month.`,
          `Registrations ${trendWord(t.registrationsDelta)} ${trendAmount(t.registrationsDelta)} this month, with ${t.tourists.toLocaleString("en-PH")} tourists spanning ${t.nationalities} ${plural(t.nationalities, "nationality", "nationalities")}.`,
          `The tourist base stands at ${t.tourists.toLocaleString("en-PH")} across ${t.nationalities} ${plural(t.nationalities, "nationality", "nationalities")}, ${trendWord(t.registrationsDelta)} ${trendAmount(t.registrationsDelta)} versus last month.`,
        ],
        t.seed,
      ),
    );
    const nat = t.topNationality
      ? shareSentence(t.topNationality, t.topNationalityShare)
      : null;
    if (nat) clauses.push(nat);
  } else {
    clauses.push("Demo mode — connect Supabase for live tourist figures.");
  }

  if (t.expiringPasses > 0) {
    recs.push({
      id: "expiring-passes",
      title:
        t.expiringPasses === 1
          ? "1 dive pass expires within 30 days"
          : `${t.expiringPasses} dive passes expire within 30 days`,
      detail:
        "Renewal windows are closing — early outreach protects repeat visits.",
      severity: t.expiringPasses >= 20 ? "high" : "low",
      section: "dive-pass",
    });
  }
  if (t.pendingApplications >= 5) {
    recs.push({
      id: "applications-backlog",
      title: `${t.pendingApplications} operator ${plural(
        t.pendingApplications,
        "application is",
        "applications are",
      )} awaiting review`,
      detail: "A growing queue delays operators from selling dives.",
      severity: t.pendingApplications >= 15 ? "high" : "medium",
      section: "establishments",
    });
  }
  if (t.topNationality && t.topNationalityShare >= 50 && t.nationalities > 2) {
    recs.push({
      id: "nationality-concentration",
      title: `${Math.round(t.topNationalityShare)}% of tourists are ${t.topNationality}`,
      detail:
        "A concentrated mix is worth diversifying with targeted foreign-market outreach.",
      severity: "low",
      section: null,
    });
  }

  return {
    description: clauses.join(" "),
    recommendations: rankBySeverity(recs),
    generatedAt: Date.now(),
  };
}

export interface DiveActivityInsightInput {
  live: boolean;
  totalDives: number;
  /** Month-over-month change in divers. */
  divesDelta: number;
  topType: string | null;
  topTypeShare: number;
  /** Manifests recorded in the last 30 days that staff have not verified. */
  unverifiedManifests: number;
  sitesUsed: number;
  seed: number;
}

export function buildDiveActivityInsight(
  input: DiveActivityInsightInput,
): OverviewInsight {
  const d: DiveActivityInsightInput = {
    ...input,
    totalDives: clamp(input.totalDives),
    divesDelta: clamp(input.divesDelta),
    topTypeShare: clamp(input.topTypeShare),
    unverifiedManifests: clamp(input.unverifiedManifests),
    sitesUsed: clamp(input.sitesUsed),
  };
  const recs: InsightRecommendation[] = [];

  const clauses: string[] = [];
  if (d.live) {
    clauses.push(
      pick(
        [
          `${d.totalDives.toLocaleString("en-PH")} ${plural(d.totalDives, "diver", "divers")} logged across ${d.sitesUsed} ${plural(d.sitesUsed, "site", "sites")}, ${trendWord(d.divesDelta)} ${trendAmount(d.divesDelta)} month-over-month.`,
          `Dive activity ${trendWord(d.divesDelta)} ${trendAmount(d.divesDelta)} this month, totalling ${d.totalDives.toLocaleString("en-PH")} ${plural(d.totalDives, "diver", "divers")}.`,
          `${d.totalDives.toLocaleString("en-PH")} ${plural(d.totalDives, "diver", "divers")} recorded across ${d.sitesUsed} ${plural(d.sitesUsed, "site", "sites")}, ${trendWord(d.divesDelta)} ${trendAmount(d.divesDelta)} versus last month.`,
        ],
        d.seed,
      ),
    );
    const type = d.topType ? shareSentence(d.topType, d.topTypeShare) : null;
    if (type) clauses.push(type);
  } else {
    clauses.push("Demo mode — connect Supabase for live dive activity.");
  }

  if (d.unverifiedManifests > 0) {
    recs.push({
      id: "unverified-manifests",
      title:
        d.unverifiedManifests === 1
          ? "1 manifest awaits verification"
          : `${d.unverifiedManifests} manifests await verification`,
      detail:
        "Unverified manifests leave operator records incomplete and unverified for compliance.",
      severity: d.unverifiedManifests >= 5 ? "high" : "medium",
      section: "dive-ops",
    });
  }
  if (d.topType && d.topTypeShare >= 65 && d.sitesUsed > 2) {
    recs.push({
      id: "type-concentration",
      title: `${Math.round(d.topTypeShare)}% of dives are ${d.topType}`,
      detail: `Only ${d.sitesUsed} sites are in use — nudging groups toward other ${plural(
        d.sitesUsed,
        "site",
        "sites",
      )} spreads pressure.`,
      severity: "low",
      section: "dive-ops",
    });
  }

  return {
    description: clauses.join(" "),
    recommendations: rankBySeverity(recs),
    generatedAt: Date.now(),
  };
}

export interface DivePassInsightInput {
  live: boolean;
  revenue: number;
  /** Month-over-month revenue change. */
  revenueDelta: number;
  /** Passes sold and still available. */
  passesSold: number;
  passesRemaining: number;
  pendingReceipts: number;
  oldestPendingDays: number;
  seed: number;
}

export function buildDivePassInsight(
  input: DivePassInsightInput,
): OverviewInsight {
  const p: DivePassInsightInput = {
    ...input,
    revenue: clamp(input.revenue),
    revenueDelta: clamp(input.revenueDelta),
    passesSold: clamp(input.passesSold),
    passesRemaining: clamp(input.passesRemaining),
    pendingReceipts: clamp(input.pendingReceipts),
    oldestPendingDays: clamp(input.oldestPendingDays),
  };
  const recs: InsightRecommendation[] = [];
  const soldTotal = p.passesSold + p.passesRemaining;
  const usedShare = soldTotal > 0 ? (p.passesSold / soldTotal) * 100 : 0;

  const clauses: string[] = [];
  if (p.live) {
    clauses.push(
      pick(
        [
          `Revenue stands at ${peso(p.revenue)} this month, ${trendWord(p.revenueDelta)} ${peso(Math.abs(p.revenueDelta))} — ${Math.round(usedShare)}% of issued passes are in use.`,
          `${peso(p.revenue)} collected month-to-date (${signed(p.revenueDelta)}), with ${Math.round(usedShare)}% of passes consumed.`,
          `Pass utilisation is at ${Math.round(usedShare)}% on ${peso(p.revenue)} in revenue, ${trendWord(p.revenueDelta)} ${peso(Math.abs(p.revenueDelta))} month-over-month.`,
        ],
        p.seed,
      ),
    );
  } else {
    clauses.push("Demo mode — connect Supabase for live pass revenue.");
  }

  if (p.pendingReceipts > 0 && p.oldestPendingDays >= 3) {
    recs.push({
      id: "receipts-aging",
      title:
        p.pendingReceipts === 1
          ? "1 receipt awaits verification"
          : `${p.pendingReceipts} receipts await verification`,
      detail: `Oldest pending ${Math.round(
        p.oldestPendingDays,
      )} days — clearing this releases payout.`,
      severity: p.oldestPendingDays >= 7 ? "high" : "medium",
      section: "dive-pass",
    });
  }
  if (p.passesRemaining > 0 && p.revenueDelta < 0) {
    recs.push({
      id: "revenue-softness",
      title: `Revenue is down ${peso(Math.abs(p.revenueDelta))}`,
      detail:
        "With passes still unsold, revisit pricing or run a mid-season promotion.",
      severity: "medium",
      section: "dive-pass",
    });
  }
  if (soldTotal > 0 && usedShare >= 90) {
    recs.push({
      id: "near-capacity",
      title: `${Math.round(usedShare)}% of issued passes are already used`,
      detail:
        "Stock is nearly exhausted — restock before the next booking window.",
      severity: "high",
      section: "dive-pass",
    });
  }

  return {
    description: clauses.join(" "),
    recommendations: rankBySeverity(recs),
    generatedAt: Date.now(),
  };
}

export interface EstablishmentInsightInput {
  live: boolean;
  total: number;
  active: number;
  suspended: number;
  /** Distinct barangays represented. */
  barangays: number;
  topBarangay: string | null;
  /** Share of establishments in the top barangay (0-100). */
  topBarangayShare: number;
  /** Establishments with no manifests filed. */
  idleEstablishments: number;
  totalCredits: number;
  pendingApplications: number;
  seed: number;
}

export function buildEstablishmentInsight(
  input: EstablishmentInsightInput,
): OverviewInsight {
  const e: EstablishmentInsightInput = {
    ...input,
    total: clamp(input.total),
    active: clamp(input.active),
    suspended: clamp(input.suspended),
    barangays: clamp(input.barangays),
    topBarangayShare: clamp(input.topBarangayShare),
    idleEstablishments: clamp(input.idleEstablishments),
    totalCredits: clamp(input.totalCredits),
    pendingApplications: clamp(input.pendingApplications),
  };
  const recs: InsightRecommendation[] = [];

  const clauses: string[] = [];
  if (e.live) {
    clauses.push(
      pick(
        [
          `${e.total} ${plural(e.total, "establishment", "establishments")} across ${e.barangays} ${plural(e.barangays, "barangay", "barangays")}, ${e.active} active.`,
          `${e.active} of ${e.total} ${plural(e.total, "establishment is", "establishments are")} active, spread over ${e.barangays} ${plural(e.barangays, "barangay", "barangays")}.`,
          `${e.total} accredited ${plural(e.total, "establishment", "establishments")} on record across ${e.barangays} ${plural(e.barangays, "barangay", "barangays")}.`,
        ],
        e.seed,
      ),
    );
    const barangay =
      e.topBarangay && e.topBarangayShare > 0
        ? `${e.topBarangay} concentrates ${Math.round(e.topBarangayShare)}% of them.`
        : null;
    if (barangay) clauses.push(barangay);
  } else {
    clauses.push("Demo mode — connect Supabase for live establishment figures.");
  }

  if (e.suspended > 0) {
    recs.push({
      id: "suspended-establishments",
      title:
        e.suspended === 1
          ? "1 establishment is suspended"
          : `${e.suspended} establishments are suspended`,
      detail:
        "Suspended accreditation hides these from public listings — review and reinstate if resolved.",
      severity: e.suspended >= 5 ? "high" : "medium",
      section: "establishments",
    });
  }
  if (e.idleEstablishments > 0) {
    recs.push({
      id: "idle-establishments",
      title:
        e.idleEstablishments === 1
          ? "1 establishment has filed no manifests"
          : `${e.idleEstablishments} establishments have filed no manifests`,
      detail: `Of ${e.total} accredited, these have zero recorded activity — check whether they are operating.`,
      severity: e.idleEstablishments >= 5 ? "medium" : "low",
      section: "establishments",
    });
  }
  if (e.pendingApplications >= 5) {
    recs.push({
      id: "applications-backlog",
      title: `${e.pendingApplications} operator ${plural(
        e.pendingApplications,
        "application is",
        "applications are",
      )} awaiting review`,
      detail:
        "A growing queue delays operators from selling dives — clear it to keep accreditation moving.",
      severity: e.pendingApplications >= 15 ? "high" : "medium",
      section: "establishments",
    });
  }
  if (
    e.topBarangay &&
    e.topBarangayShare >= 50 &&
    e.barangays > 2
  ) {
    recs.push({
      id: "barangay-concentration",
      title: `${Math.round(e.topBarangayShare)}% of establishments are in ${e.topBarangay}`,
      detail:
        "A concentrated footprint is worth watching for congestion — encouraging other barangays spreads load.",
      severity: "low",
      section: null,
    });
  }

  return {
    description: clauses.join(" "),
    recommendations: rankBySeverity(recs),
    generatedAt: Date.now(),
  };
}

export interface OperatorInsightInput {
  live: boolean;
  operatorsWithManifests: number;
  /** Operators in the dataset with no manifests at all. */
  idleOperators: number;
  topOperator: string | null;
  /** Share of all manifests held by the single most active operator (0-100). */
  topOperatorShare: number;
  /** Operators holding credits fully consumed. */
  exhaustedOperators: number;
  seed: number;
}

export function buildOperatorInsight(
  input: OperatorInsightInput,
): OverviewInsight {
  const o: OperatorInsightInput = {
    ...input,
    operatorsWithManifests: clamp(input.operatorsWithManifests),
    idleOperators: clamp(input.idleOperators),
    topOperatorShare: clamp(input.topOperatorShare),
    exhaustedOperators: clamp(input.exhaustedOperators),
  };
  const recs: InsightRecommendation[] = [];

  const clauses: string[] = [];
  if (o.live) {
    clauses.push(
      pick(
        [
          `${o.operatorsWithManifests} ${plural(
            o.operatorsWithManifests,
            "operator has",
            "operators have",
          )} filed manifests this period${o.topOperator ? `, led by ${o.topOperator}` : ""}.`,
          `${o.operatorsWithManifests} active ${plural(
            o.operatorsWithManifests,
            "operator",
            "operators",
          )} on record${o.topOperator ? ` — ${o.topOperator} leads activity` : ""}.`,
          `Manifest activity spans ${o.operatorsWithManifests} ${plural(
            o.operatorsWithManifests,
            "operator",
            "operators",
          )}${o.topOperator ? `, with ${o.topOperator} the most active` : ""}.`,
        ],
        o.seed,
      ),
    );
  } else {
    clauses.push("Demo mode — connect Supabase for live operator activity.");
  }

  if (o.idleOperators > 0) {
    recs.push({
      id: "idle-operators",
      title:
        o.idleOperators === 1
          ? "1 accredited operator has filed no manifests"
          : `${o.idleOperators} accredited operators have filed no manifests`,
      detail:
        "Either they have not started selling dives or their records need checking.",
      severity: o.idleOperators >= 5 ? "medium" : "low",
      section: "establishments",
    });
  }
  if (o.exhaustedOperators > 0) {
    recs.push({
      id: "credits-exhausted",
      title:
        o.exhaustedOperators === 1
          ? "1 operator has fully used their credits"
          : `${o.exhaustedOperators} operators have fully used their credits`,
      detail:
        "These operators cannot sell passes until new inventory is issued.",
      severity: "high",
      section: "dive-pass",
    });
  }
  if (
    o.topOperator &&
    o.topOperatorShare >= 60 &&
    o.operatorsWithManifests > 2
  ) {
    recs.push({
      id: "operator-concentration",
      title: `${Math.round(o.topOperatorShare)}% of manifests come from ${o.topOperator}`,
      detail:
        "Heavy reliance on one operator — supporting smaller operators would spread risk.",
      severity: "low",
      section: null,
    });
  }

  return {
    description: clauses.join(" "),
    recommendations: rankBySeverity(recs),
    generatedAt: Date.now(),
  };
}
