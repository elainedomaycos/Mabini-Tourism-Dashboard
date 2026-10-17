import { useState, useMemo } from "react";
import { Waves, TrendingUp, Clock, BarChart3, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  SectionCard,
  StatCard,
  Reveal,
  DrilldownDialog,
} from "@/components/shared";
import {
  DIVING_TYPE_KEYS,
  DIVING_TYPE_LABELS,
  type DivingTypeKey,
} from "@/lib/diveTaxonomy";
import {
  ChartEmptyState,
  isEmptyChartData,
} from "@/components/ChartEmptyState";
import {
  useLiveMode,
  useManifestsLive,
  bucketByMonth,
} from "@/lib/queries";
import { InsightWidget } from "@/components/InsightWidget";
import { buildDiveActivityInsight } from "@/lib/insights";

const diveType = [
  { name: "Scuba", value: 38 },
  { name: "Fun Dive", value: 24 },
  { name: "Training", value: 14 },
  { name: "Intro Dive", value: 14 },
  { name: "Freediver", value: 10 },
];

const depthDistribution = [
  { range: "0–10m", count: 450 },
  { range: "10–20m", count: 680 },
  { range: "20–30m", count: 520 },
  { range: "30–40m", count: 310 },
  { range: "40m+", count: 120 },
];

const hourlyActivity = [
  { hour: "05:00", dives: 4 },
  { hour: "06:00", dives: 12 },
  { hour: "07:00", dives: 28 },
  { hour: "08:00", dives: 64 },
  { hour: "09:00", dives: 78 },
  { hour: "10:00", dives: 82 },
  { hour: "11:00", dives: 56 },
  { hour: "12:00", dives: 34 },
  { hour: "13:00", dives: 22 },
  { hour: "14:00", dives: 18 },
  { hour: "15:00", dives: 14 },
  { hour: "16:00", dives: 10 },
  { hour: "17:00", dives: 6 },
  { hour: "18:00", dives: 3 },
];

const seasonalTrends = [
  { season: "Summer", dives: 1840, tourists: 420 },
  { season: "Autumn", dives: 1120, tourists: 280 },
  { season: "Winter", dives: 760, tourists: 190 },
  { season: "Spring", dives: 1480, tourists: 360 },
];

const siteByType = [
  { site: "Blue Hole", scuba: 42, introDive: 10, funDive: 48, training: 12, freediver: 6 },
  { site: "Coral Gardens", scuba: 30, introDive: 34, funDive: 40, training: 18, freediver: 4 },
  { site: "Shark Point", scuba: 44, introDive: 6, funDive: 36, training: 10, freediver: 8 },
  { site: "Loyzaga Wreck", scuba: 38, introDive: 4, funDive: 22, training: 26, freediver: 6 },
  { site: "Sepoc Point", scuba: 24, introDive: 28, funDive: 30, training: 32, freediver: 5 },
];

const capacityData = [
  { site: "Blue Hole", maxCapacity: 120, actualDives: 90 },
  { site: "Coral Gardens", maxCapacity: 100, actualDives: 92 },
  { site: "Shark Point", maxCapacity: 80, actualDives: 78 },
  { site: "Loyzaga Wreck", maxCapacity: 60, actualDives: 72 },
  { site: "Sepoc Point", maxCapacity: 90, actualDives: 84 },
];

const depthCompliance = [
  { range: "0–10m", safe: 430, overLimit: 20 },
  { range: "10–20m", safe: 650, overLimit: 30 },
  { range: "20–30m", safe: 480, overLimit: 40 },
  { range: "30–40m", safe: 270, overLimit: 40 },
  { range: "40m+", safe: 95, overLimit: 25 },
];

const TYPE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const TYPE_BADGE_MAP: Record<string, string> = {
  Scuba: "bg-success/10 text-success border-success/20",
  "Intro Dive": "bg-info/10 text-info border-info/20",
  "Fun Dive": "bg-warning/15 text-warning-foreground border-warning/30",
  Training: "bg-muted text-muted-foreground border-border",
  Freediver: "bg-primary/10 text-primary border-primary/20",
};

/** Map a free-text dive_type to a canonical taxonomy key. */
function typeKeyOf(raw: string | null | undefined): DivingTypeKey | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s.includes("scuba")) return "scuba";
  if (s.includes("intro")) return "introDive";
  if (s.includes("fun")) return "funDive";
  if (s.includes("train")) return "training";
  if (s.includes("free")) return "freediver";
  return null;
}

const SEASON_BY_MONTH = [
  "Winter",
  "Winter",
  "Spring",
  "Spring",
  "Spring",
  "Summer",
  "Summer",
  "Summer",
  "Autumn",
  "Autumn",
  "Autumn",
  "Winter",
];
const SEASON_ORDER = ["Summer", "Autumn", "Winter", "Spring"];

function monthIndexRaw(dateStr: string | null | undefined): number {
  if (!dateStr || dateStr === "—") return -1;
  const d = new Date(dateStr.length <= 10 ? dateStr + "T00:00:00" : dateStr);
  return Number.isNaN(d.getTime()) ? -1 : d.getMonth();
}

export function DiveActivityAnalytics() {
  const [drilldown, setDrilldown] = useState<string | null>(null);

  // Live KPIs for Total + Most Popular Type (real diver counts and dive-type
  // mix). Peak Hour and Avg Depth stay mock: no hour/depth columns exist.
  const isLive = useLiveMode();
  const liveManifests = useManifestsLive();
  const manifests = liveManifests.data;
  const isLiveData = isLive && !!manifests;
  const totalDivers = manifests
    ? manifests.reduce((a, m) => a + (m.divers || 0), 0)
    : 0;
  const diversBuckets = manifests
    ? bucketByMonth(
        manifests,
        (m) => m.date,
        (m) => m.divers || 0
      )
    : [];
  const curMonth = new Date().getMonth();
  const prevMonth = (curMonth + 11) % 12;
  const diversDiff = diversBuckets.length
    ? (diversBuckets[curMonth]?.total ?? 0) -
      (diversBuckets[prevMonth]?.total ?? 0)
    : 0;
  const topType = (() => {
    if (!manifests) return null;
    const counts = new Map<string, number>();
    for (const m of manifests) {
      if (m.diveType) counts.set(m.diveType, (counts.get(m.diveType) || 0) + 1);
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    const total = sorted.reduce((a, [, c]) => a + c, 0);
    return {
      name: sorted[0][0],
      share: Math.round((sorted[0][1] / total) * 100),
    };
  })();

  const totalDives = diveType.reduce((a, t) => a + t.value, 0);

  // --- Derived datasets: live rows when available, mock otherwise --------
  const diveTypeData = useMemo(() => {
    if (!isLiveData || !manifests) return diveType;
    const counts = new Map<DivingTypeKey, number>();
    for (const m of manifests) {
      const k = typeKeyOf(m.diveType);
      if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const total = [...counts.values()].reduce((a, c) => a + c, 0) || 1;
    return DIVING_TYPE_KEYS.filter((k) => counts.has(k)).map((k) => ({
      name: DIVING_TYPE_LABELS[k],
      value: Math.round((counts.get(k)! / total) * 100),
    }));
  }, [isLiveData, manifests]);

  const siteByTypeData = useMemo(() => {
    if (!isLiveData || !manifests) return siteByType;
    type Row = Record<DivingTypeKey, number> & { site: string };
    const m = new Map<string, Row>();
    for (const man of manifests) {
      const k = typeKeyOf(man.diveType);
      if (!k || !man.site) continue;
      const row =
        m.get(man.site) ??
        ({
          site: man.site,
          scuba: 0,
          introDive: 0,
          funDive: 0,
          training: 0,
          freediver: 0,
        } as Row);
      row[k] += man.divers || 1;
      m.set(man.site, row);
    }
    const sum = (r: Row) => DIVING_TYPE_KEYS.reduce((a, k) => a + r[k], 0);
    return [...m.values()].sort((a, b) => sum(b) - sum(a));
  }, [isLiveData, manifests]);

  const seasonalData = useMemo(() => {
    if (!isLiveData || !manifests) return seasonalTrends;
    const acc = new Map<string, { dives: number; trips: number }>();
    for (const man of manifests) {
      const mi = monthIndexRaw(man.date);
      if (mi < 0) continue;
      const season = SEASON_BY_MONTH[mi];
      const row = acc.get(season) ?? { dives: 0, trips: 0 };
      row.dives += man.divers || 0;
      row.trips += 1;
      acc.set(season, row);
    }
    return SEASON_ORDER.filter((s) => acc.has(s)).map((season) => ({
      season,
      dives: acc.get(season)!.dives,
      tourists: acc.get(season)!.trips,
    }));
  }, [isLiveData, manifests]);

  const capacityDataLive = useMemo(() => {
    if (!isLiveData || !manifests) return capacityData;
    const m = new Map<
      string,
      { site: string; maxCapacity: number; actualDives: number }
    >();
    for (const man of manifests) {
      if (!man.site) continue;
      const row =
        m.get(man.site) ?? { site: man.site, maxCapacity: 0, actualDives: 0 };
      row.maxCapacity += man.maxDivers || 0;
      row.actualDives += man.divers || 0;
      m.set(man.site, row);
    }
    return [...m.values()].sort((a, b) => b.actualDives - a.actualDives);
  }, [isLiveData, manifests]);

  const maxSeasonDives = Math.max(1, ...seasonalData.map((s) => s.dives));
  const peakHourEntry = hourlyActivity.reduce((a, b) =>
    b.dives > a.dives ? b : a,
  );

  const selectedType = drilldown
    ? diveTypeData.find((t) => t.name === drilldown)
    : null;
  const drillKey = (drilldown
    ? (Object.keys(DIVING_TYPE_LABELS) as DivingTypeKey[]).find(
        (k) => DIVING_TYPE_LABELS[k] === drilldown,
      )
    : undefined) as DivingTypeKey | undefined;
  const typeSites =
    selectedType && drillKey
      ? siteByTypeData
          .map((s) => ({
            site: s.site,
            dives: s[drillKey],
          }))
          .filter((s) => s.dives > 0)
          .sort((a, b) => b.dives - a.dives)
      : [];

  const activityInsight = useMemo(() => {
    const rows = manifests ?? [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    // Unverified in the trailing 30 days — recent and unverified is the case
    // that actually matters for compliance.
    const cutoff = now.getTime() - 30 * 86400000;
    const unverified = rows.filter((m) => {
      if (m.verified) return false;
      const d = new Date((m.date || "") + "T00:00:00");
      if (Number.isNaN(d.getTime())) return false;
      return d.getTime() >= cutoff;
    }).length;
    const sites = new Set(rows.map((m) => m.site).filter(Boolean));

    return buildDiveActivityInsight({
      live: isLiveData,
      totalDives: totalDivers,
      divesDelta: diversDiff,
      topType: topType?.name ?? null,
      topTypeShare: topType?.share ?? 0,
      unverifiedManifests: unverified,
      sitesUsed: sites.size,
      seed: now.getDate(),
    });
  }, [manifests, isLiveData, totalDivers, diversDiff, topType]);

  return (
    <div className="space-y-6">
      <InsightWidget insight={activityInsight} label="Dive Activity" />
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Waves}
              label="Total Dives"
              value={isLiveData ? totalDivers.toLocaleString() : "2,082"}
              delta={
                isLiveData
                  ? `${diversDiff >= 0 ? "+" : ""}${diversDiff}`
                  : "+14%"
              }
              up={isLiveData ? diversDiff >= 0 : true}
            />
            <StatCard
              icon={BarChart3}
              label="Most Popular Type"
              value={isLiveData && topType ? topType.name : "Scuba"}
              delta={isLiveData && topType ? `${topType.share}%` : "38%"}
            />
            {/* No hour/depth columns exist — stays mock until dive logging adds them. */}
            <StatCard
              icon={Clock}
              label="Peak Hour"
              value="10:00"
              delta="82 dives"
            />
            <StatCard
              icon={TrendingUp}
              label="Avg Depth Range"
              value="10–20m"
              delta="680 dives"
            />
        </div>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Reveal delay={80}>
          <SectionCard title="Dive Type Breakdown">
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toast.info("Export coming soon…")}
              >
                <Download className="size-4 mr-1.5" />
                Export CSV
              </Button>
            </div>
            {isEmptyChartData(diveTypeData) ? (
              <ChartEmptyState className="h-[300px]" />
            ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diveTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    onClick={(_, index) => setDrilldown(diveTypeData[index].name)}
                    className="cursor-pointer"
                  >
                    {diveTypeData.map((_, i) => (
                      <Cell key={i} fill={TYPE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Share"]}
                    contentStyle={{
                      borderRadius: "0.5rem",
                      border: "1px solid var(--border)",
                      background: "var(--background)",
                      fontSize: "0.75rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            )}
            <div className="flex items-center justify-center gap-4 mt-2">
              {diveTypeData.map((t, i) => (
                <button
                  key={t.name}
                  onClick={() => setDrilldown(t.name)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span
                    className="size-2.5 rounded-sm"
                    style={{ background: TYPE_COLORS[i] }}
                  />
                  {t.name} ({t.value}%)
                </button>
              ))}
            </div>
          </SectionCard>
        </Reveal>

        <Reveal delay={120}>
          <SectionCard title="Depth Distribution">
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toast.info("Export coming soon…")}
              >
                <Download className="size-4 mr-1.5" />
                Export CSV
              </Button>
            </div>
            {isEmptyChartData(depthDistribution) ? (
              <ChartEmptyState className="h-[300px]" />
            ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={depthDistribution}
                  layout="vertical"
                  margin={{ left: 10, right: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis
                    dataKey="range"
                    type="category"
                    tick={{ fontSize: 11 }}
                    stroke="var(--muted-foreground)"
                    width={55}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} dives`, "Count"]}
                    contentStyle={{
                      borderRadius: "0.5rem",
                      border: "1px solid var(--border)",
                      background: "var(--background)",
                      fontSize: "0.75rem",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--color-chart-2)"
                    radius={[0, 4, 4, 0]}
                    barSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            )}
          </SectionCard>
        </Reveal>
      </div>

      <Reveal delay={160}>
        <SectionCard title="Hourly Activity Pattern">
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.info("Export coming soon…")}
            >
              <Download className="size-4 mr-1.5" />
              Export CSV
            </Button>
          </div>
          {isEmptyChartData(hourlyActivity) ? (
            <ChartEmptyState className="h-[260px]" />
          ) : (
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={hourlyActivity}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="diveArea" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-chart-1)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-chart-1)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip
                  formatter={(value: number) => [`${value} dives`, "Dives"]}
                  contentStyle={{
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border)",
                    background: "var(--background)",
                    fontSize: "0.75rem",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="dives"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  fill="url(#diveArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          )}
        </SectionCard>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Reveal delay={200}>
          <SectionCard title="Site × Dive Type">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  {DIVING_TYPE_KEYS.map((k) => (
                    <TableHead key={k} className="text-center">
                      {DIVING_TYPE_LABELS[k]}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {siteByTypeData.map((row) => (
                  <TableRow key={row.site}>
                    <TableCell className="font-medium text-sm">
                      {row.site}
                    </TableCell>
                    {DIVING_TYPE_KEYS.map((k) => (
                      <TableCell key={k} className="text-center">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {row[k]}
                        </Badge>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </Reveal>

        <Reveal delay={240}>
          <SectionCard title="Seasonal Trends">
            <div className="grid grid-cols-2 gap-3">
              {seasonalData.map((s) => (
                <Card
                  key={s.season}
                  className="p-4 shadow-elegant border-border/60 hover:border-primary/30 hover:shadow-glow-sm transition-all"
                >
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    {s.season}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Dives</span>
                      <span className="font-display font-semibold">
                        {s.dives.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tourists</span>
                      <span className="font-display font-semibold">
                        {s.tourists.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(s.dives / maxSeasonDives) * 100}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </SectionCard>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Reveal delay={280}>
          <SectionCard title="Dive Site Capacity Utilization">
            {isEmptyChartData(capacityDataLive) ? (
              <ChartEmptyState className="h-[300px]" />
            ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={capacityDataLive}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="site"
                    tick={{ fontSize: 11 }}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="var(--muted-foreground)"
                  />
                  <ReferenceLine
                    y={90}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="3 3"
                    label={{ value: "Avg Capacity", position: "right", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.5rem",
                      border: "1px solid var(--border)",
                      background: "var(--background)",
                      fontSize: "0.75rem",
                    }}
                    formatter={(value: number, name: string, entry: any) => {
                      if (name === "Max Capacity")
                        return [`${value} dives`, "Max Capacity"];
                      const util = Math.round(
                        (entry.payload.actualDives / entry.payload.maxCapacity) * 100,
                      );
                      return [`${value} dives (${util}%)`, "Actual Dives"];
                    }}
                  />
                  <Bar
                    dataKey="maxCapacity"
                    name="Max Capacity"
                    fill="var(--color-chart-3)"
                    fillOpacity={0.25}
                    radius={[4, 4, 0, 0]}
                    barSize={22}
                  />
                  <Bar
                    dataKey="actualDives"
                    name="Actual Dives"
                    radius={[4, 4, 0, 0]}
                    barSize={22}
                  >
                    {capacityDataLive.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.actualDives > entry.maxCapacity
                            ? "oklch(0.634 0.171 25.331)"
                            : "var(--color-chart-1)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            )}
          </SectionCard>
        </Reveal>

        <Reveal delay={320}>
          <SectionCard title="Depth Compliance Analysis">
            {isEmptyChartData(depthCompliance) ? (
              <ChartEmptyState className="h-[300px]" />
            ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={depthCompliance}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 11 }}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="var(--muted-foreground)"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.5rem",
                      border: "1px solid var(--border)",
                      background: "var(--background)",
                      fontSize: "0.75rem",
                    }}
                    formatter={(value: number, name: string, entry: any) => {
                      const total =
                        entry.payload.safe + entry.payload.overLimit;
                      const pct = Math.round((value / total) * 100);
                      if (name === "safe")
                        return [`${value} dives (${pct}%)`, "Within Limits"];
                      return [`${value} dives (${pct}%)`, "Over Limit"];
                    }}
                  />
                  <Bar
                    dataKey="safe"
                    name="safe"
                    stackId="depth"
                    fill="oklch(0.723 0.191 149.579)"
                    barSize={28}
                  />
                  <Bar
                    dataKey="overLimit"
                    name="overLimit"
                    stackId="depth"
                    fill="oklch(0.634 0.171 25.331)"
                    radius={[4, 4, 0, 0]}
                    barSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            )}
          </SectionCard>
        </Reveal>
      </div>

      <DrilldownDialog
        open={!!drilldown}
        onOpenChange={(o) => {
          if (!o) setDrilldown(null);
        }}
        title={`${drilldown ?? ""} Dives`}
        subtitle={`${selectedType?.value ?? 0}% of all recorded dives`}
        stats={
          selectedType
            ? [
                {
                  label: "Share",
                  value: `${selectedType.value}%`,
                  icon: Waves,
                },
                { label: "Sites", value: typeSites.length, icon: BarChart3 },
                {
                  label: "Top Site",
                  value: typeSites[0]?.site ?? "—",
                  icon: TrendingUp,
                },
              ]
            : undefined
        }
      >
        {typeSites.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Dive Count by Site</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead className="text-right">Dives</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typeSites.map((s) => (
                  <TableRow key={s.site}>
                    <TableCell className="font-medium text-sm">
                      {s.site}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {s.dives}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DrilldownDialog>
    </div>
  );
}
