import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  SectionCard,
  StatCard,
  Reveal,
  chartAxisProps,
  chartTooltipStyle,
} from "@/components/shared";
import { AnalyticsState } from "@/components/AnalyticsState";
import {
  ChartEmptyState,
  isEmptyChartData,
} from "@/components/ChartEmptyState";
import { Building2, MapPin, Shield } from "lucide-react";
import { useLiveMode } from "@/lib/queries";
import { InsightWidget } from "@/components/InsightWidget";
import { buildEstablishmentInsight } from "@/lib/insights";
import { useMetrics } from "@/lib/metrics";
import type { DateRange } from "@/lib/period";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "oklch(0.85 0.05 250)",
];

const establishmentsByBarangay = [
  { barangay: "San Teodoro", count: 4 },
  { barangay: "Solo", count: 3 },
  { barangay: "Batas", count: 3 },
  { barangay: "San Joaquin", count: 2 },
];

const permitStatus = [
  { status: "Active", count: 9 },
  { status: "Expired", count: 2 },
  { status: "Suspended", count: 1 },
];

const activityLevels = [
  { name: "Deep Blue", manifestos: 128, credits: 2400 },
  { name: "Reef Riders", manifestos: 98, credits: 1860 },
  { name: "Coral Coast", manifestos: 84, credits: 1620 },
  { name: "Manta Expeditions", manifestos: 71, credits: 1440 },
  { name: "Turtle Divers", manifestos: 56, credits: 1080 },
  { name: "Bluefin", manifestos: 45, credits: 920 },
  { name: "Aqua Ventures", manifestos: 38, credits: 780 },
  { name: "Nautilus", manifestos: 29, credits: 600 },
];

const topEstablishments = [
  {
    name: "Deep Blue Charters",
    manifestos: 128,
    rating: 4.9,
    ecoRating: 4.8,
    status: "Active",
  },
  {
    name: "Reef Riders Co.",
    manifestos: 98,
    rating: 4.7,
    ecoRating: 4.5,
    status: "Active",
  },
  {
    name: "Coral Coast Divers",
    manifestos: 84,
    rating: 4.8,
    ecoRating: 4.7,
    status: "Active",
  },
  {
    name: "Manta Expeditions",
    manifestos: 71,
    rating: 4.6,
    ecoRating: 4.3,
    status: "Active",
  },
  {
    name: "Turtle Bay Dive Shop",
    manifestos: 56,
    rating: 4.5,
    ecoRating: 4.6,
    status: "Active",
  },
  {
    name: "Bluefin Divers",
    manifestos: 45,
    rating: 4.4,
    ecoRating: 4.2,
    status: "Active",
  },
  {
    name: "Aqua Ventures PH",
    manifestos: 38,
    rating: 4.3,
    ecoRating: 4.1,
    status: "Active",
  },
  {
    name: "Nautilus Dive Co.",
    manifestos: 29,
    rating: 4.2,
    ecoRating: 3.9,
    status: "Expired",
  },
];

const TOTAL = establishmentsByBarangay.reduce((a, b) => a + b.count, 0);
const ACTIVE_PERMITS =
  permitStatus.find((p) => p.status === "Active")?.count ?? 0;
const TOP_BARANGAY = establishmentsByBarangay.sort(
  (a, b) => b.count - a.count,
)[0].barangay;

export function EstablishmentAnalytics({ range }: { range: DateRange }) {
  const isLive = useLiveMode();
  const isDemo = !isLive;
  const metrics = useMetrics("establishment", range);
  const m = metrics.data;
  const isLiveData = m !== undefined;
  const rows = useMemo(() => m?.establishments ?? [], [m]);

  const byBarangayData = useMemo(() => {
    if (!m) return isDemo ? establishmentsByBarangay : [];
    const map = new Map<string, number>();
    for (const row of rows) {
      const location = row.location.trim() || "Unspecified";
      map.set(location, (map.get(location) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([barangay, count]) => ({ barangay, count }))
      .sort((a, b) => b.count - a.count);
  }, [m, isDemo, rows]);

  const permitStatusData = useMemo(() => {
    if (!m) return isDemo ? permitStatus : [];
    const map = new Map<string, number>();
    for (const row of rows) {
      const status = row.status || "Unknown";
      map.set(status, (map.get(status) ?? 0) + 1);
    }
    return [...map.entries()].map(([status, count]) => ({ status, count }));
  }, [m, isDemo, rows]);

  const activityData = useMemo(() => {
    if (!m) return isDemo ? activityLevels : [];
    return [...rows]
      .sort((a, b) => b.manifestos - a.manifestos)
      .slice(0, 8)
      .map((row) => ({
        name: row.name,
        manifestos: row.manifestos,
        credits: row.creditBalance,
      }));
  }, [m, isDemo, rows]);

  const topEstData = useMemo<
    Array<{
      name: string;
      manifestos: number;
      status: string;
    }>
  >(() => {
    if (!m) return isDemo ? topEstablishments : [];
    return [...rows]
      .sort((a, b) => b.manifestos - a.manifestos)
      .slice(0, 8)
      .map((row) => ({
        name: row.name,
        manifestos: row.manifestos,
        status: row.status,
      }));
  }, [m, isDemo, rows]);

  const totalEstablishments = m ? m.total : TOTAL;
  const activePermits = m ? m.active : ACTIVE_PERMITS;
  const topBarangay =
    m && byBarangayData.length ? byBarangayData[0].barangay : m ? "-" : TOP_BARANGAY;
  const topMaxManifestos = topEstData[0]?.manifestos || 1;


  const pendingApplications = m?.pendingApplications ?? 0;

  const establishmentInsight = useMemo(() => {
    const total = m?.total ?? TOTAL;
    const active = m?.active ?? ACTIVE_PERMITS;
    const suspended = m?.suspended ?? 0;
    const topShare =
      total > 0 && byBarangayData[0]
        ? (byBarangayData[0].count / total) * 100
        : 0;

    return buildEstablishmentInsight({
      live: isLive,
      total,
      active,
      suspended,
      barangays: byBarangayData.length,
      topBarangay:
        m && byBarangayData.length
          ? byBarangayData[0].barangay
          : m
            ? null
            : TOP_BARANGAY,
      topBarangayShare: topShare,
      idleEstablishments: rows.filter((row) => row.manifestos === 0).length,
      totalCredits: rows.reduce(
        (sum, row) => sum + (row.creditBalance || 0),
        0,
      ),
      pendingApplications,
      seed: new Date().getDate(),
    });
  }, [m, isLive, rows, byBarangayData, pendingApplications]);

  return (
    <AnalyticsState isLive={isLive} label="establishment" state={metrics}>
      <div className="space-y-6">
        <InsightWidget
          insight={establishmentInsight}
          label="Establishments"
        />

        <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            icon={Building2}
            label="Total Establishments"
            value={String(totalEstablishments)}
            sample={isDemo}
          />
          <StatCard
            icon={Shield}
            label="Active Permits"
            value={isLive ? (isLiveData ? String(activePermits) : "—") : String(activePermits)}
            sample={isDemo}
          />
          <StatCard
            icon={MapPin}
            label="Top Barangay"
            value={topBarangay}
            sample={isDemo}
          />
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SectionCard title="Establishments by Location" sample={isDemo}>
            {isEmptyChartData(byBarangayData) ? (
              <ChartEmptyState className="h-64" />
            ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart
                  data={byBarangayData}
                  margin={{ left: -20, right: 8 }}
                >
                  <CartesianGrid
                    stroke="var(--color-border)"
                    strokeDasharray="3 6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="barangay"
                    {...chartAxisProps}
                  />
                  <YAxis
                    {...chartAxisProps}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {byBarangayData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            )}
          </SectionCard>

          <SectionCard title="Permit Status" sample={isDemo}>
            {isEmptyChartData(permitStatusData) ? (
              <ChartEmptyState className="h-64" />
            ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={permitStatusData}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    stroke="var(--color-card)"
                    strokeWidth={2}
                  >
                    {permitStatusData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            )}
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {permitStatusData.map((p, i) => (
                <div key={p.status} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2.5 rounded-sm"
                    style={{
                      background: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                  <span className="text-muted-foreground">{p.status}</span>
                  <span className="ml-auto font-medium">{p.count}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </Reveal>

      <Reveal delay={160}>
        <div className="grid grid-cols-1 gap-6">
          <SectionCard title="Activity Levels" sample={isDemo}>
            {isEmptyChartData(activityData) ? (
              <ChartEmptyState className="h-80" />
            ) : (
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart
                  data={activityData}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid
                    stroke="var(--color-border)"
                    strokeDasharray="3 6"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    {...chartAxisProps}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    {...chartAxisProps}
                    width={110}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar
                    dataKey="manifestos"
                    fill="var(--color-primary)"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            )}
          </SectionCard>

        </div>
      </Reveal>

      <Reveal delay={240}>
        <SectionCard title="Top Establishments" sample={isDemo}>
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Establishment</TableHead>
                <TableHead>Manifestos</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topEstData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No establishments on record.
                  </TableCell>
                </TableRow>
              )}
              {topEstData.map((e, i) => (
                <TableRow
                  key={e.name}
                  className="hover:bg-secondary/50 transition-colors"
                >
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Building2 className="size-4 text-primary" /> {e.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <Progress
                        value={(e.manifestos / topMaxManifestos) * 100}
                        className="h-1.5 flex-1"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {e.manifestos}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        e.status === "Active"
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-muted text-muted-foreground border-border"
                      }
                    >
                      {e.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      </Reveal>

      <Reveal delay={360}>
        <SectionCard
          title="Manifests & Credits by Establishment"
          sample={isDemo}
        >
          {isEmptyChartData(activityData) ? (
            <ChartEmptyState className="h-80" />
          ) : (
          <div className="h-80">
            <ResponsiveContainer>
              <ComposedChart
                data={activityData}
                margin={{ left: -10, right: 30 }}
              >
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="3 6"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  {...chartAxisProps}
                />
                <YAxis
                  yAxisId="left"
                  {...chartAxisProps}
                  label={{ value: "Manifestos", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 11, fill: "var(--color-muted-foreground)" } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  {...chartAxisProps}
                  label={{ value: "Credits remaining", angle: 90, position: "insideRight", offset: 10, style: { fontSize: 11, fill: "var(--color-muted-foreground)" } }}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value: number, name: string) => {
                    if (name === "Credits remaining")
                      return [value.toLocaleString(), "Credits remaining"];
                    return [value.toLocaleString(), "Manifestos"];
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="manifestos"
                  name="Manifestos"
                  fill="var(--color-chart-1)"
                  radius={[8, 8, 0, 0]}
                  opacity={0.8}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="credits"
                  name="Credits remaining"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--color-chart-2)" }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          )}
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm" style={{ background: "var(--color-chart-1)" }} />
              Manifestos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-0.5 rounded" style={{ background: "var(--color-chart-2)" }} />
              Credits remaining
            </span>
          </div>
        </SectionCard>
      </Reveal>
      </div>
    </AnalyticsState>
  );
}
