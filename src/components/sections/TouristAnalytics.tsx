import { useState, useMemo } from "react";
import { Users, Globe, Award, TrendingUp, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SectionCard,
  StatCard,
  Reveal,
  DrilldownDialog,
} from "@/components/shared";
import {
  useLiveMode,
  useTouristsLive,
  useManifestsLive,
  bucketByMonth,
} from "@/lib/queries";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadialBarChart,
  RadialBar,
} from "recharts";

const nationality = [
  { name: "USA", value: 38 },
  { name: "Germany", value: 22 },
  { name: "Japan", value: 20 },
  { name: "UK", value: 16 },
  { name: "Mexico", value: 12 },
  { name: "Other", value: 8 },
];

const diveLevel = [
  { name: "Open Water", value: 45 },
  { name: "Advanced", value: 28 },
  { name: "Rescue", value: 12 },
  { name: "Divemaster", value: 9 },
  { name: "Instructor", value: 6 },
];

const monthlyRegistrations = [
  { m: "Jan", count: 32 },
  { m: "Feb", count: 28 },
  { m: "Mar", count: 41 },
  { m: "Apr", count: 55 },
  { m: "May", count: 67 },
  { m: "Jun", count: 84 },
  { m: "Jul", count: 112 },
  { m: "Aug", count: 98 },
  { m: "Sep", count: 73 },
  { m: "Oct", count: 51 },
  { m: "Nov", count: 39 },
  { m: "Dec", count: 35 },
];

const nationalityByLevel = [
  {
    nationality: "USA",
    openWater: 145,
    advanced: 98,
    rescue: 42,
    divemaster: 31,
    instructor: 18,
  },
  {
    nationality: "Germany",
    openWater: 78,
    advanced: 62,
    rescue: 25,
    divemaster: 19,
    instructor: 10,
  },
  {
    nationality: "Japan",
    openWater: 88,
    advanced: 54,
    rescue: 20,
    divemaster: 14,
    instructor: 8,
  },
  {
    nationality: "UK",
    openWater: 56,
    advanced: 38,
    rescue: 18,
    divemaster: 12,
    instructor: 7,
  },
  {
    nationality: "Mexico",
    openWater: 42,
    advanced: 28,
    rescue: 14,
    divemaster: 9,
    instructor: 5,
  },
  {
    nationality: "Other",
    openWater: 30,
    advanced: 18,
    rescue: 8,
    divemaster: 5,
    instructor: 3,
  },
];

const topTourists = [
  { name: "Emma Larsen", nationality: "USA", dives: 187, level: "Instructor" },
  {
    name: "Kenji Watanabe",
    nationality: "Japan",
    dives: 164,
    level: "Divemaster",
  },
  { name: "Marco Rossi", nationality: "Germany", dives: 142, level: "Rescue" },
  {
    name: "Viktor Petrov",
    nationality: "Germany",
    dives: 128,
    level: "Advanced",
  },
  { name: "Olivia Chen", nationality: "USA", dives: 115, level: "Advanced" },
  { name: "Nadia Al-Rashid", nationality: "UK", dives: 103, level: "Rescue" },
  { name: "David Kim", nationality: "USA", dives: 96, level: "Advanced" },
  {
    name: "Diego Alvarez",
    nationality: "Mexico",
    dives: 88,
    level: "Open Water",
  },
];

const revenuePerNationality = [
  { nationality: "USA", revenue: 42000, avgSpend: 1105 },
  { nationality: "Germany", revenue: 28000, avgSpend: 1273 },
  { nationality: "Japan", revenue: 24000, avgSpend: 1200 },
  { nationality: "UK", revenue: 18500, avgSpend: 1156 },
  { nationality: "Mexico", revenue: 12000, avgSpend: 1000 },
  { nationality: "Other", revenue: 9500, avgSpend: 1188 },
];

const levelFunnel = [
  { level: "Open Water", tourists: 365, pct: 100 },
  { level: "Advanced", tourists: 227, pct: 62 },
  { level: "Rescue", tourists: 97, pct: 27 },
  { level: "Divemaster", tourists: 73, pct: 20 },
  { level: "Instructor", tourists: 49, pct: 13 },
];

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const RADIAL_DATA = diveLevel.map((d, i) => ({
  ...d,
  fill: CHART_COLORS[i % CHART_COLORS.length],
}));

const DOMESTIC_NATIONALITIES = new Set(["Philippines"]);

export function TouristAnalytics() {
  const [natDrilldown, setNatDrilldown] = useState<string | null>(null);
  const [levelDrilldown, setLevelDrilldown] = useState<string | null>(null);
  const [marketFilter, setMarketFilter] = useState<
    "all" | "domestic" | "international"
  >("all");

  const filteredNationality = useMemo(() => {
    if (marketFilter === "all") return nationality;
    return nationality.filter((n) =>
      marketFilter === "domestic"
        ? DOMESTIC_NATIONALITIES.has(n.name)
        : !DOMESTIC_NATIONALITIES.has(n.name),
    );
  }, [marketFilter]);

  const filteredNatByLevel = useMemo(() => {
    if (marketFilter === "all") return nationalityByLevel;
    return nationalityByLevel.filter((n) =>
      marketFilter === "domestic"
        ? DOMESTIC_NATIONALITIES.has(n.nationality)
        : !DOMESTIC_NATIONALITIES.has(n.nationality),
    );
  }, [marketFilter]);

  const filteredTopTourists = useMemo(() => {
    if (marketFilter === "all") return topTourists;
    return topTourists.filter((t) =>
      marketFilter === "domestic"
        ? DOMESTIC_NATIONALITIES.has(t.nationality)
        : !DOMESTIC_NATIONALITIES.has(t.nationality),
    );
  }, [marketFilter]);

  const stats = useMemo(() => {
    const total = filteredNatByLevel.reduce(
      (a, r) =>
        a + r.openWater + r.advanced + r.rescue + r.divemaster + r.instructor,
      0,
    );
    return {
      total,
      nationalities: filteredNationality.length,
      avgDives: total > 0 ? Math.round(total / filteredNatByLevel.length) : 0,
      mostCommon: "Open Water",
    };
  }, [filteredNationality, filteredNatByLevel]);

  // Live KPIs (React Query cache — no extra fetch). Charts below stay mock;
  // only the four cards go live here. Deltas are real month-over-month new
  // counts. Avg Dives is the global divers-per-tourist average (manifest
  // divers carry no nationality, so it ignores marketFilter by necessity).
  const isLive = useLiveMode();
  const liveTourists = useTouristsLive();
  const liveManifests = useManifestsLive();
  const liveRows = liveTourists.data;
  const isLiveData = isLive && !!liveRows;
  const inMarket = (nat: string | null | undefined) =>
    marketFilter === "all"
      ? true
      : marketFilter === "domestic"
        ? nat != null && DOMESTIC_NATIONALITIES.has(nat)
        : nat == null || !DOMESTIC_NATIONALITIES.has(nat);
  const liveFiltered = useMemo(
    () => (liveRows ?? []).filter((t) => inMarket(t.nationality)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [liveRows, marketFilter]
  );
  const liveTotalDivers = liveManifests.data
    ? liveManifests.data.reduce((a, m) => a + (m.divers || 0), 0)
    : 0;
  const liveBuckets = useMemo(
    () =>
      bucketByMonth(liveFiltered, (t: any) => t.createdAt ?? t.registered ?? ""),
    [liveFiltered]
  );
  const curMonth = new Date().getMonth();
  const prevMonth = (curMonth + 11) % 12;
  const mom = (cur: number, prev: number) => ({
    label: `${cur - prev >= 0 ? "+" : ""}${cur - prev}`,
    up: cur - prev >= 0,
  });
  const liveCards = useMemo(() => {
    if (!isLiveData || !liveRows) return null;
    const levelCounts = new Map<string, number>();
    const natSet = new Set<string>();
    const firstSeen = new Map<string, number>();
    for (const t of liveFiltered) {
      if (t.level) levelCounts.set(t.level, (levelCounts.get(t.level) || 0) + 1);
      if (t.nationality) {
        natSet.add(t.nationality);
        const d = (t as any).createdAt ?? (t as any).registered ?? "";
        const m = d && d !== "—" ? new Date(d.length <= 10 ? d + "T00:00:00" : d).getMonth() : -1;
        if (m >= 0 && (!firstSeen.has(t.nationality) || m < firstSeen.get(t.nationality)!)) {
          firstSeen.set(t.nationality, m);
        }
      }
    }
    const mostCommon =
      [...levelCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "—";
    const newNats = [...firstSeen.values()].filter((m) => m === curMonth).length;
    const newTotal = mom(
      liveBuckets[curMonth]?.count ?? 0,
      liveBuckets[prevMonth]?.count ?? 0
    );
    const avg =
      liveRows.length > 0 && liveManifests.data
        ? Math.round(liveTotalDivers / liveRows.length)
        : 0;
    const diversBuckets = liveManifests.data
      ? bucketByMonth(
          liveManifests.data,
          (m) => m.date,
          (m) => m.divers || 0
        )
      : [];
    const avgDelta = mom(
      diversBuckets[curMonth]?.total ?? 0,
      diversBuckets[prevMonth]?.total ?? 0
    );
    return { mostCommon, newNats, newTotal, avg, avgDelta };
  }, [
    isLiveData,
    liveRows,
    liveFiltered,
    liveBuckets,
    liveTotalDivers,
    liveManifests.data,
    curMonth,
    prevMonth,
  ]);

  const selectedNat = natDrilldown
    ? nationalityByLevel.find((n) => n.nationality === natDrilldown)
    : null;

  const selectedLevel = levelDrilldown
    ? filteredNatByLevel.map((n) => ({
        nationality: n.nationality,
        count: (n as any)[
          levelDrilldown.toLowerCase().replace(/\s/g, "")
        ] as number,
      }))
    : [];

  const levelTotal = selectedLevel.reduce((a, r) => a + r.count, 0);

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
            <StatCard
              icon={Users}
              label="Total Tourists"
              value={
                liveCards ? String(liveFiltered.length) : String(stats.total)
              }
              delta={liveCards ? liveCards.newTotal.label : "+47"}
              up={liveCards ? liveCards.newTotal.up : true}
            />
            <StatCard
              icon={Globe}
              label="Nationalities Represented"
              value={
                liveCards
                  ? String(
                      new Set(
                        liveFiltered
                          .map((t) => t.nationality)
                          .filter((n): n is string => !!n)
                      ).size
                    )
                  : String(stats.nationalities)
              }
              delta={liveCards ? `+${liveCards.newNats}` : "+2"}
            />
            <StatCard
              icon={TrendingUp}
              label="Avg Dives / Tourist"
              value={
                liveCards ? String(liveCards.avg) : String(stats.avgDives)
              }
              delta={liveCards ? liveCards.avgDelta.label : "+3"}
              up={liveCards ? liveCards.avgDelta.up : true}
            />
            <StatCard
              icon={Award}
              label="Most Common Level"
              value={liveCards ? liveCards.mostCommon : stats.mostCommon}
              delta=""
            />
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="flex items-center gap-1 bg-secondary/60 rounded-lg p-0.5 w-fit">
          {(
            [
              ["all", "All Tourists"],
              ["domestic", "Domestic (PH)"],
              ["international", "International"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMarketFilter(key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all font-medium ${
                marketFilter === key
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <Reveal delay={80} className="h-full">
          <SectionCard title="Nationality Distribution" className="h-full flex flex-col">
            {filteredNationality.length === 0 ? (
              <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
                No data matches the selected filter.
              </div>
            ) : (
              <div className="flex items-center gap-6 h-[240px]">
                <div className="w-[200px] h-[200px] cursor-pointer shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredNationality}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                        onClick={(_, index) => {
                          setNatDrilldown(filteredNationality[index].name);
                        }}
                      >
                        {filteredNationality.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value}%`, "Share"]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid var(--border)",
                          background: "var(--background)",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {filteredNationality.map((n, i) => {
                    const natTotal = filteredNationality.reduce(
                      (a, x) => a + x.value,
                      0,
                    );
                    return (
                      <button
                        key={n.name}
                        onClick={() => setNatDrilldown(n.name)}
                        className="flex items-center gap-2 w-full text-left text-sm rounded-md px-2 py-1.5 hover:bg-muted/60 transition-colors"
                      >
                        <div
                          className="size-3 rounded-sm shrink-0"
                          style={{
                            background: CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                        <span className="flex-1">{n.name}</span>
                        <span className="text-muted-foreground">
                          {n.value}%
                        </span>
                        <span className="text-muted-foreground text-xs">
                          ({Math.round((n.value / natTotal) * stats.total)})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </SectionCard>
        </Reveal>

        <Reveal delay={120} className="h-full">
          <SectionCard title="Dive Level Distribution" className="h-full flex flex-col">
            <div
              className="h-[240px] cursor-pointer"
              onClick={() => setLevelDrilldown("Open Water")}
            >
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="20%"
                  outerRadius="90%"
                  data={RADIAL_DATA}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={4}
                    onClick={(data: any) => {
                      if (data?.name) setLevelDrilldown(data.name);
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Share"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--background)",
                      fontSize: "12px",
                    }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {diveLevel.map((d, i) => (
                <button
                  key={d.name}
                  onClick={() => setLevelDrilldown(d.name)}
                  className="flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 hover:bg-muted/60 transition-colors"
                >
                  <div
                    className="size-2 rounded-full"
                    style={{
                      background: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                  <span>{d.name}</span>
                  <span className="text-muted-foreground">{d.value}%</span>
                </button>
              ))}
            </div>
          </SectionCard>
        </Reveal>
      </div>

      <Reveal delay={160}>
        <SectionCard title="Monthly Registration Trends">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyRegistrations}
                margin={{ top: 4, right: 4, left: -12, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="m"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--background)",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-chart-1)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </Reveal>

      <Reveal delay={200}>
        <SectionCard title="Nationality × Dive Level Cross-Tab">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nationality</TableHead>
                  <TableHead className="text-center">Open Water</TableHead>
                  <TableHead className="text-center">Advanced</TableHead>
                  <TableHead className="text-center">Rescue</TableHead>
                  <TableHead className="text-center">Divemaster</TableHead>
                  <TableHead className="text-center">Instructor</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNatByLevel.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No data matches the selected filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNatByLevel.map((row) => {
                    const total =
                      row.openWater +
                      row.advanced +
                      row.rescue +
                      row.divemaster +
                      row.instructor;
                    return (
                      <TableRow key={row.nationality}>
                        <TableCell className="font-medium">
                          {row.nationality}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.openWater}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.advanced}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.rescue}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.divemaster}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.instructor}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {total}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      </Reveal>

      <Reveal delay={240}>
        <SectionCard title="Top Tourists Leaderboard">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead className="text-right">Dives</TableHead>
                <TableHead className="text-right">Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTopTourists.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No data matches the selected filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTopTourists.map((t, i) => (
                  <TableRow key={t.name}>
                    <TableCell className="font-display font-bold text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Globe className="size-3" />
                        {t.nationality}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {t.dives}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{t.level}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </SectionCard>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Reveal delay={280}>
          <SectionCard title="Revenue Potential by Nationality">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenuePerNationality}
                  margin={{ top: 4, right: 4, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="nationality"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "revenue") return [`$${value.toLocaleString()}`, "Total Revenue"];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Nationality: ${label}`}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--background)",
                      fontSize: "12px",
                    }}
                    itemStyle={{ textTransform: "capitalize" }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="url(#revenueGrad)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {revenuePerNationality.map((r) => (
                <div key={r.nationality} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{r.nationality}</span>
                  <span>${r.avgSpend}/tourist</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </Reveal>

        <Reveal delay={320}>
          <SectionCard title="Dive Certification Funnel">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={levelFunnel}
                  layout="vertical"
                  margin={{ top: 4, right: 40, left: 12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="funnelGrad0" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.9} />
                    </linearGradient>
                    <linearGradient id="funnelGrad1" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="funnelGrad2" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="funnelGrad3" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="funnelGrad4" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="level"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} tourists`, "Count"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--background)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="tourists"
                    radius={[0, 4, 4, 0]}
                    label={{ position: "right", fontSize: 11, fill: "var(--muted-foreground)", formatter: (v: number) => `${v}` }}
                  >
                    {levelFunnel.map((_, i) => (
                      <Cell
                        key={i}
                        fill={`url(#funnelGrad${i})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {levelFunnel.map((l, i) => (
                <div key={l.level} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="size-2 rounded-full"
                    style={{
                      background: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                  <span className="font-medium">{l.level}</span>
                  <span className="text-muted-foreground">{l.pct}%</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </Reveal>
      </div>

      <DrilldownDialog
        open={!!natDrilldown}
        onOpenChange={() => setNatDrilldown(null)}
        title={`${natDrilldown ?? ""} — Tourist Breakdown`}
        subtitle={`Detailed dive level distribution for tourists from ${natDrilldown}`}
        stats={
          selectedNat
            ? [
                {
                  label: "Total Tourists",
                  value: Math.round(
                    ((filteredNationality.find((n) => n.name === natDrilldown)
                      ?.value ?? 0) /
                      100) *
                      stats.total,
                  ),
                  icon: Users,
                },
                {
                  label: "Open Water",
                  value: selectedNat.openWater,
                  icon: TrendingUp,
                },
                {
                  label: "Advanced",
                  value: selectedNat.advanced,
                  icon: TrendingUp,
                },
              ]
            : undefined
        }
      >
        {selectedNat && (
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Dive Level</TableHead>
                <TableHead className="text-right">Tourists</TableHead>
                <TableHead className="text-right">% of Nationality</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(
                [
                  ["Open Water", selectedNat.openWater],
                  ["Advanced", selectedNat.advanced],
                  ["Rescue", selectedNat.rescue],
                  ["Divemaster", selectedNat.divemaster],
                  ["Instructor", selectedNat.instructor],
                ] as const
              ).map(([label, count]) => {
                const total =
                  selectedNat.openWater +
                  selectedNat.advanced +
                  selectedNat.rescue +
                  selectedNat.divemaster +
                  selectedNat.instructor;
                return (
                  <TableRow key={label}>
                    <TableCell className="font-medium">{label}</TableCell>
                    <TableCell className="text-right">{count}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {Math.round((count / total) * 100)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DrilldownDialog>

      <DrilldownDialog
        open={!!levelDrilldown}
        onOpenChange={() => setLevelDrilldown(null)}
        title={`${levelDrilldown ?? ""} — Nationality Breakdown`}
        subtitle={`Distribution of ${levelDrilldown} certified tourists across nationalities`}
        stats={
          selectedLevel.length > 0
            ? [
                { label: "Total Tourists", value: levelTotal, icon: Award },
                {
                  label: "Top Nationality",
                  value:
                    selectedLevel.sort((a, b) => b.count - a.count)[0]
                      ?.nationality ?? "—",
                  icon: Globe,
                },
              ]
            : undefined
        }
      >
        {selectedLevel.length > 0 && (
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Nationality</TableHead>
                <TableHead className="text-right">Tourists</TableHead>
                <TableHead className="text-right">% of Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedLevel.map((row) => (
                <TableRow key={row.nationality}>
                  <TableCell className="font-medium">
                    {row.nationality}
                  </TableCell>
                  <TableCell className="text-right">{row.count}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {levelTotal > 0
                      ? Math.round((row.count / levelTotal) * 100)
                      : 0}
                    %
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DrilldownDialog>
    </div>
  );
}
