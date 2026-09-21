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
import { Progress } from "@/components/ui/progress";
import { SectionCard, StatCard, Reveal } from "@/components/shared";
import { Building2, MapPin, Shield, Star, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
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

const ecoRatingDistribution = [
  { rating: "4.5-5.0", count: 4 },
  { rating: "4.0-4.4", count: 5 },
  { rating: "3.5-3.9", count: 2 },
  { rating: "3.0-3.4", count: 1 },
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

const revenueFlow = [
  { name: "Deep Blue", manifestos: 128, credits: 2400, revenue: 15360 },
  { name: "Reef Riders", manifestos: 98, credits: 1860, revenue: 11760 },
  { name: "Coral Coast", manifestos: 84, credits: 1620, revenue: 10080 },
  { name: "Manta Exp.", manifestos: 71, credits: 1440, revenue: 8520 },
  { name: "Turtle Divers", manifestos: 56, credits: 1080, revenue: 6720 },
  { name: "Bluefin", manifestos: 45, credits: 920, revenue: 5400 },
];

const ecoMatrix = [
  { name: "Deep Blue", eco: 4.8, manifestos: 128, credits: 2400, status: "Active" },
  { name: "Reef Riders", eco: 4.5, manifestos: 98, credits: 1860, status: "Active" },
  { name: "Coral Coast", eco: 4.7, manifestos: 84, credits: 1620, status: "Active" },
  { name: "Manta Exp.", eco: 4.3, manifestos: 71, credits: 1440, status: "Active" },
  { name: "Turtle Divers", eco: 4.6, manifestos: 56, credits: 1080, status: "Active" },
  { name: "Bluefin", eco: 4.2, manifestos: 45, credits: 920, status: "Active" },
  { name: "Aqua Ventures", eco: 4.1, manifestos: 38, credits: 780, status: "Active" },
  { name: "Nautilus", eco: 3.9, manifestos: 29, credits: 600, status: "Expired" },
];

const TOTAL = establishmentsByBarangay.reduce((a, b) => a + b.count, 0);
const ACTIVE_PERMITS =
  permitStatus.find((p) => p.status === "Active")?.count ?? 0;
const AVG_ECO =
  ecoRatingDistribution.reduce(
    (a, b) => a + parseFloat(b.rating.split("-")[1]) * b.count,
    0,
  ) / ecoRatingDistribution.reduce((a, b) => a + b.count, 0);
const TOP_BARANGAY = establishmentsByBarangay.sort(
  (a, b) => b.count - a.count,
)[0].barangay;

const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
};

function StarRating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${i < Math.round(value) ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="ml-1 text-xs font-medium">{value.toFixed(1)}</span>
    </span>
  );
}

export function EstablishmentAnalytics() {
  return (
    <div className="space-y-6">
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Building2}
            label="Total Establishments"
            value={String(TOTAL)}
            delta="+2"
          />
          <StatCard
            icon={Shield}
            label="Active Permits"
            value={String(ACTIVE_PERMITS)}
            delta="+1"
          />
          <StatCard
            icon={Star}
            label="Avg Eco Rating"
            value={AVG_ECO.toFixed(1)}
            delta="+0.2"
          />
          <StatCard
            icon={MapPin}
            label="Top Barangay"
            value={TOP_BARANGAY}
            delta="+4"
          />
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SectionCard title="Establishments by Barangay">
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
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart
                  data={establishmentsByBarangay}
                  margin={{ left: -20, right: 8 }}
                >
                  <CartesianGrid
                    stroke="var(--color-border)"
                    strokeDasharray="3 6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="barangay"
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {establishmentsByBarangay.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Permit Status">
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={permitStatus}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    stroke="var(--color-card)"
                    strokeWidth={2}
                  >
                    {permitStatus.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {permitStatus.map((p, i) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SectionCard title="Activity Levels">
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
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart
                  data={activityLevels}
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
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={110}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="manifestos"
                    fill="var(--color-primary)"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Eco Rating Distribution">
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
            <div className="h-64">
              <ResponsiveContainer>
                <RadialBarChart
                  innerRadius="30%"
                  outerRadius="100%"
                  data={ecoRatingDistribution.map((d) => ({
                    ...d,
                    value: d.count * 10,
                  }))}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar dataKey="value" background cornerRadius={8}>
                    {ecoRatingDistribution.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i]} />
                    ))}
                  </RadialBar>
                  <Tooltip contentStyle={tooltipStyle} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-1">
              {ecoRatingDistribution.map((d, i) => (
                <div key={d.rating} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2.5 rounded-sm"
                    style={{ background: CHART_COLORS[i] }}
                  />
                  <span className="text-muted-foreground">{d.rating}</span>
                  <span className="ml-auto font-medium">
                    {d.count} establishments
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </Reveal>

      <Reveal delay={240}>
        <SectionCard title="Top Establishments">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Establishment</TableHead>
                <TableHead>Manifestos</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Eco Rating</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topEstablishments.map((e, i) => (
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
                        value={
                          (e.manifestos / topEstablishments[0].manifestos) * 100
                        }
                        className="h-1.5 flex-1"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {e.manifestos}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StarRating value={e.rating} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {e.ecoRating.toFixed(1)}
                    </span>
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
        <SectionCard title="Revenue & Credit Flow by Establishment">
          <div className="h-80">
            <ResponsiveContainer>
              <ComposedChart
                data={revenueFlow}
                margin={{ left: -10, right: 30 }}
              >
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="3 6"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="left"
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: "Manifestos", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 11, fill: "var(--color-muted-foreground)" } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: "Revenue (₱)", angle: 90, position: "insideRight", offset: 10, style: { fontSize: 11, fill: "var(--color-muted-foreground)" } }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => {
                    if (name === "revenue") return [`₱${value.toLocaleString()}`, "Revenue"];
                    if (name === "credits") return [value.toLocaleString(), "Credits"];
                    return [value, "Manifestos"];
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="manifestos"
                  fill="var(--color-chart-1)"
                  radius={[8, 8, 0, 0]}
                  opacity={0.8}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--color-chart-2)" }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm" style={{ background: "var(--color-chart-1)" }} />
              Manifestos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-0.5 rounded" style={{ background: "var(--color-chart-2)" }} />
              Revenue
            </span>
          </div>
        </SectionCard>
      </Reveal>

      <Reveal delay={400}>
        <SectionCard title="Eco-Performance Matrix">
          <div className="h-80">
            <ResponsiveContainer>
              <ScatterChart margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="3 6"
                />
                <XAxis
                  type="number"
                  dataKey="eco"
                  name="Eco Rating"
                  domain={[3.5, 5]}
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: "Eco Rating", position: "insideBottom", offset: -5, style: { fontSize: 11, fill: "var(--color-muted-foreground)" } }}
                />
                <YAxis
                  type="number"
                  dataKey="manifestos"
                  name="Manifestos"
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: "Manifestos", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 11, fill: "var(--color-muted-foreground)" } }}
                />
                <ZAxis type="number" dataKey="credits" range={[80, 400]} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => {
                    if (name === "Eco Rating") return [value.toFixed(1), "Eco Rating"];
                    if (name === "Credits") return [value.toLocaleString(), "Credits"];
                    return [value, name];
                  }}
                  labelFormatter={() => ""}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={tooltipStyle}>
                        <p className="font-medium text-sm mb-1">{d.name}</p>
                        <p className="text-xs text-muted-foreground">Eco Rating: <span className="font-medium text-foreground">{d.eco.toFixed(1)}</span></p>
                        <p className="text-xs text-muted-foreground">Manifestos: <span className="font-medium text-foreground">{d.manifestos}</span></p>
                        <p className="text-xs text-muted-foreground">Credits: <span className="font-medium text-foreground">{d.credits.toLocaleString()}</span></p>
                        <p className="text-xs mt-1">
                          Status: <span className={`font-medium ${d.status === "Active" ? "text-success" : "text-destructive"}`}>{d.status}</span>
                        </p>
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  x={4.2}
                  stroke="var(--color-muted-foreground)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{ value: "Avg Eco (4.2)", position: "top", style: { fontSize: 10, fill: "var(--color-muted-foreground)" } }}
                />
                <ReferenceLine
                  y={73}
                  stroke="var(--color-muted-foreground)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{ value: "Avg Manifestos (73)", position: "right", style: { fontSize: 10, fill: "var(--color-muted-foreground)" } }}
                />
                <Scatter
                  data={ecoMatrix.filter((d) => d.status === "Active")}
                  fill="oklch(0.65 0.15 145)"
                  opacity={0.85}
                />
                <Scatter
                  data={ecoMatrix.filter((d) => d.status === "Expired")}
                  fill="var(--color-destructive)"
                  opacity={0.85}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full" style={{ background: "oklch(0.65 0.15 145)" }} />
              Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full" style={{ background: "var(--color-destructive)" }} />
              Expired
            </span>
            <span className="ml-auto text-muted-foreground/60">Bubble size = Credits</span>
          </div>
        </SectionCard>
      </Reveal>
    </div>
  );
}
