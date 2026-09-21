import { useState } from "react";
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

const diveType = [
  { name: "Reef", value: 62 },
  { name: "Wreck", value: 18 },
  { name: "Drift", value: 12 },
  { name: "Night", value: 8 },
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
  { site: "Blue Hole", reef: 48, wreck: 8, drift: 22, night: 12 },
  { site: "Coral Gardens", reef: 72, wreck: 4, drift: 10, night: 6 },
  { site: "Shark Point", reef: 36, wreck: 6, drift: 28, night: 8 },
  { site: "Loyzaga Wreck", reef: 14, wreck: 42, drift: 6, night: 10 },
  { site: "Sepoc Point", reef: 40, wreck: 10, drift: 16, night: 18 },
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
];

const TYPE_BADGE_MAP: Record<string, string> = {
  Reef: "bg-success/10 text-success border-success/20",
  Wreck: "bg-info/10 text-info border-info/20",
  Drift: "bg-warning/15 text-warning-foreground border-warning/30",
  Night: "bg-muted text-muted-foreground border-border",
};

export function DiveActivityAnalytics() {
  const [drilldown, setDrilldown] = useState<string | null>(null);

  const totalDives = diveType.reduce((a, t) => a + t.value, 0);
  const peakHourEntry = hourlyActivity.reduce((a, b) =>
    b.dives > a.dives ? b : a,
  );

  const selectedType = drilldown
    ? diveType.find((t) => t.name === drilldown)
    : null;
  const typeSites = selectedType
    ? siteByType
        .map((s) => ({
          site: s.site,
          dives: (s as any)[drilldown!.toLowerCase()],
        }))
        .filter((s) => s.dives > 0)
        .sort((a, b) => b.dives - a.dives)
    : [];

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Waves}
            label="Total Dives"
            value="2,082"
            delta="+14%"
          />
          <StatCard
            icon={BarChart3}
            label="Most Popular Type"
            value="Reef"
            delta="62%"
          />
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
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diveType}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    onClick={(_, index) => setDrilldown(diveType[index].name)}
                    className="cursor-pointer"
                  >
                    {diveType.map((_, i) => (
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
            <div className="flex items-center justify-center gap-4 mt-2">
              {diveType.map((t, i) => (
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
        </SectionCard>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Reveal delay={200}>
          <SectionCard title="Site × Dive Type">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead className="text-center">Reef</TableHead>
                  <TableHead className="text-center">Wreck</TableHead>
                  <TableHead className="text-center">Drift</TableHead>
                  <TableHead className="text-center">Night</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {siteByType.map((row) => (
                  <TableRow key={row.site}>
                    <TableCell className="font-medium text-sm">
                      {row.site}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {row.reef}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {row.wreck}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {row.drift}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {row.night}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </Reveal>

        <Reveal delay={240}>
          <SectionCard title="Seasonal Trends">
            <div className="grid grid-cols-2 gap-3">
              {seasonalTrends.map((s) => (
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
                        style={{ width: `${(s.dives / 1840) * 100}%` }}
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
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={capacityData}
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
                    {capacityData.map((entry, i) => (
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
          </SectionCard>
        </Reveal>

        <Reveal delay={320}>
          <SectionCard title="Depth Compliance Analysis">
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
