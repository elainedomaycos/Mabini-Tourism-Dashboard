import { useMemo } from "react";
import {
  CreditCard,
  TrendingUp,
  Clock,
  AlertTriangle,
  Download,
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { SectionCard, StatCard, Reveal } from "@/components/shared";
import {
  ChartEmptyState,
  isEmptyChartData,
} from "@/components/ChartEmptyState";
import {
  useLiveMode,
  useReceiptsLive,
  useInventoryLive,
  bucketByMonth,
} from "@/lib/queries";
import { InsightWidget } from "@/components/InsightWidget";
import { buildDivePassInsight } from "@/lib/insights";
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
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const MONTH_LABELS = [
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
];

function monthIdx(dateStr: string | null | undefined): number {
  if (!dateStr || dateStr === "—") return -1;
  const d = new Date(dateStr.length <= 10 ? dateStr + "T00:00:00" : dateStr);
  return Number.isNaN(d.getTime()) ? -1 : d.getMonth();
}

function periodKeyOf(t: string): "day" | "weekly" | "monthly" | "annual" | null {
  const s = t.toLowerCase();
  if (s.includes("day")) return "day";
  if (s.includes("week")) return "weekly";
  if (s.includes("month")) return "monthly";
  if (s.includes("annual") || s.includes("year")) return "annual";
  return null;
}

const passTypeDistribution = [
  { type: "Day", count: 8, revenue: 240 },
  { type: "Weekly", count: 5, revenue: 500 },
  { type: "Monthly", count: 10, revenue: 2000 },
  { type: "Annual", count: 4, revenue: 4000 },
];

const creditsUtilization = [
  { type: "Day", purchased: 24, used: 18 },
  { type: "Weekly", purchased: 50, used: 34 },
  { type: "Monthly", purchased: 200, used: 132 },
  { type: "Annual", purchased: 400, used: 198 },
];

const expiryTimeline = [
  { month: "Aug", expiring: 4 },
  { month: "Sep", expiring: 3 },
  { month: "Oct", expiring: 5 },
  { month: "Nov", expiring: 2 },
  { month: "Dec", expiring: 4 },
  { month: "Jan", expiring: 6 },
];

const revenueByType = [
  { month: "Mar", day: 120, weekly: 300, monthly: 1400, annual: 3200 },
  { month: "Apr", day: 180, weekly: 400, monthly: 1600, annual: 3600 },
  { month: "May", day: 150, weekly: 350, monthly: 1800, annual: 3800 },
  { month: "Jun", day: 210, weekly: 500, monthly: 2000, annual: 4000 },
  { month: "Jul", day: 240, weekly: 500, monthly: 2200, annual: 4000 },
  { month: "Aug", day: 190, weekly: 450, monthly: 1900, annual: 3600 },
];

const passLifecycle = [
  { stage: "Active", count: 17 },
  { stage: "Expiring", count: 4 },
  { stage: "Expired", count: 4 },
];

const LIFECYCLE_COLORS: Record<string, string> = {
  Active: "bg-success",
  Expiring: "bg-warning",
  Expired: "bg-muted-foreground",
};

const revenueVsBurn = [
  { month: "Mar", revenue: 4820, burnRate: 58 },
  { month: "Apr", revenue: 5560, burnRate: 62 },
  { month: "May", revenue: 6100, burnRate: 65 },
  { month: "Jun", revenue: 6710, burnRate: 71 },
  { month: "Jul", revenue: 7140, burnRate: 74 },
  { month: "Aug", revenue: 6140, burnRate: 68 },
];

const renewalForecast = [
  { month: "Sep", renew: 3, expire: 2, new: 4 },
  { month: "Oct", renew: 5, expire: 3, new: 3 },
  { month: "Nov", renew: 4, expire: 5, new: 5 },
  { month: "Dec", renew: 6, expire: 4, new: 6 },
  { month: "Jan", renew: 8, expire: 6, new: 4 },
  { month: "Feb", renew: 5, expire: 8, new: 7 },
];

export function DivePassAnalytics() {
  // Live KPIs for revenue + active passes (verified payment sums and
  // inventory in-use). Credits-used % and expiring count stay mock: no
  // ledger/expiry source exists until the annual_pass_holders probe lands.
  const isLive = useLiveMode();
  const liveReceipts = useReceiptsLive();
  const liveInventory = useInventoryLive();
  const receipts = liveReceipts.data;
  const inv = liveInventory.data;
  const isLiveData = isLive && !!receipts && !!inv;
  const revenueTotal = receipts
    ? receipts.reduce((a, r) => a + (r.amountNum || 0), 0)
    : 0;
  const inUse = inv
    ? inv.reduce((a, r) => a + (r.totalPasses - r.remainingPasses), 0)
    : 0;
  const revBuckets = receipts
    ? bucketByMonth(
        receipts,
        (r) => r.date,
        (r) => r.amountNum || 0
      )
    : [];
  const useBuckets = inv
    ? bucketByMonth(
        inv,
        (r) => r.createdAt,
        (r) => r.totalPasses - r.remainingPasses
      )
    : [];
  const curMonth = new Date().getMonth();
  const prevMonth = (curMonth + 11) % 12;
  const revDiff = revBuckets.length
    ? (revBuckets[curMonth]?.total ?? 0) - (revBuckets[prevMonth]?.total ?? 0)
    : 0;
  const useDiff = useBuckets.length
    ? (useBuckets[curMonth]?.total ?? 0) - (useBuckets[prevMonth]?.total ?? 0)
    : 0;

  // --- Derived datasets: live rows when available, mock otherwise --------
  const passTypeData = useMemo(() => {
    if (!isLiveData || !inv) return passTypeDistribution;
    const m = new Map<string, { count: number; revenue: number }>();
    for (const r of inv) {
      const t = r.passType || "Other";
      const row = m.get(t) ?? { count: 0, revenue: 0 };
      row.count += r.totalPasses || 0;
      row.revenue += r.amount || 0;
      m.set(t, row);
    }
    return [...m.entries()].map(([type, v]) => ({ type, ...v }));
  }, [isLiveData, inv]);

  const creditsData = useMemo(() => {
    if (!isLiveData || !inv) return creditsUtilization;
    const m = new Map<string, { purchased: number; used: number }>();
    for (const r of inv) {
      const t = r.passType || "Other";
      const row = m.get(t) ?? { purchased: 0, used: 0 };
      row.purchased += r.totalPasses || 0;
      row.used += r.totalPasses - r.remainingPasses || 0;
      m.set(t, row);
    }
    return [...m.entries()].map(([type, v]) => ({ type, ...v }));
  }, [isLiveData, inv]);

  const avgCreditsUsed = useMemo(() => {
    if (!isLiveData || !inv) return null;
    const purchased = inv.reduce((a, r) => a + (r.totalPasses || 0), 0);
    const used = inv.reduce(
      (a, r) => a + (r.totalPasses - r.remainingPasses || 0),
      0
    );
    return purchased > 0 ? Math.round((used / purchased) * 100) : 0;
  }, [isLiveData, inv]);

  const revenueByTypeData = useMemo(() => {
    if (!isLiveData || !inv) return revenueByType;
    const m = new Map<
      number,
      {
        month: string;
        day: number;
        weekly: number;
        monthly: number;
        annual: number;
      }
    >();
    for (const r of inv) {
      const k = periodKeyOf(r.passType || "");
      const mi = monthIdx(r.createdAt);
      if (!k || mi < 0) continue;
      const row =
        m.get(mi) ?? {
          month: MONTH_LABELS[mi],
          day: 0,
          weekly: 0,
          monthly: 0,
          annual: 0,
        };
      row[k] += r.amount || 0;
      m.set(mi, row);
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
  }, [isLiveData, inv]);

  const revenueVsBurnData = useMemo(() => {
    if (!isLiveData || !inv || !receipts) return revenueVsBurn;
    const purchased = new Array(12).fill(0);
    const used = new Array(12).fill(0);
    for (const r of inv) {
      const mi = monthIdx(r.createdAt);
      if (mi < 0) continue;
      purchased[mi] += r.totalPasses || 0;
      used[mi] += r.totalPasses - r.remainingPasses || 0;
    }
    return MONTH_LABELS.map((month, i) => ({
      month,
      revenue: revBuckets[i]?.total ?? 0,
      burnRate: purchased[i] > 0 ? Math.round((used[i] / purchased[i]) * 100) : 0,
    })).filter((_, i) => purchased[i] > 0 || (revBuckets[i]?.total ?? 0) > 0);
  }, [isLiveData, inv, receipts, revBuckets]);

  // Facts for the floating insights widget — same live values as the cards.
  const passInsight = useMemo(() => {
    const rows = receipts ?? [];
    const inventory = inv ?? [];
    const remaining = inventory.reduce((a, r) => a + (r.remainingPasses || 0), 0);
    const pending = rows.filter((r) => r.status === "Pending");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const oldest = pending.reduce((max, r) => {
      const d = new Date((r.date || "") + "T00:00:00");
      if (Number.isNaN(d.getTime())) return max;
      return Math.max(max, (now.getTime() - d.getTime()) / 86400000);
    }, 0);

    return buildDivePassInsight({
      live: isLiveData,
      revenue: revenueTotal,
      revenueDelta: revDiff,
      passesSold: inUse,
      passesRemaining: remaining,
      pendingReceipts: pending.length,
      oldestPendingDays: Math.round(oldest),
      seed: now.getDate(),
    });
  }, [receipts, inv, isLiveData, revenueTotal, inUse, revDiff]);

  return (
    <div className="space-y-6">
      <InsightWidget insight={passInsight} label="Dive Pass" />
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={CreditCard}
            label="Total Revenue"
            value={
              isLiveData
                ? `₱${Math.round(revenueTotal).toLocaleString()}`
                : "$6,740"
            }
            delta={
              isLiveData
                ? `${revDiff >= 0 ? "+" : "-"}₱${Math.round(Math.abs(revDiff)).toLocaleString()}`
                : "+12%"
            }
            up={isLiveData ? revDiff >= 0 : true}
          />
          <StatCard
            icon={TrendingUp}
            label="Active Passes"
            value={isLiveData ? String(inUse) : "17"}
            delta={isLiveData ? `${useDiff >= 0 ? "+" : ""}${useDiff}` : "+2"}
            up={isLiveData ? useDiff >= 0 : true}
          />
          <StatCard
            icon={Clock}
            label="Avg Credits Used"
            value={avgCreditsUsed != null ? `${avgCreditsUsed}%` : "68%"}
            delta={avgCreditsUsed != null ? "" : "+5%"}
          />
          <StatCard
            icon={AlertTriangle}
            label="Expiring This Month"
            value="4"
            delta="-1"
            up={false}
          />
        </div>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Reveal delay={80}>
          <SectionCard title="Pass Type Distribution">
            {isEmptyChartData(passTypeData) ? (
              <ChartEmptyState className="h-[200px]" />
            ) : (
            <div className="flex items-center gap-6">
              <div className="w-[200px] h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={passTypeData}
                      dataKey="count"
                      nameKey="type"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      stroke="var(--color-card)"
                      strokeWidth={2}
                    >
                      {passTypeData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {passTypeData.map((p, i) => (
                  <div
                    key={p.type}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-sm"
                        style={{ background: CHART_COLORS[i] }}
                      />
                      <span>{p.type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        {p.count} passes
                      </span>
                      <span className="font-medium">
                        ₱{p.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </SectionCard>
        </Reveal>

        <Reveal delay={120}>
          <SectionCard title="Credits Utilization">
            {isEmptyChartData(creditsData) ? (
              <ChartEmptyState className="h-[200px]" />
            ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={creditsData}
                  margin={{ left: -12, right: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="type"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="purchased"
                    fill="var(--color-chart-1)"
                    radius={[6, 6, 0, 0]}
                    name="Purchased"
                  />
                  <Bar
                    dataKey="used"
                    fill="var(--color-chart-2)"
                    radius={[6, 6, 0, 0]}
                    name="Used"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            )}
          </SectionCard>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Reveal delay={160}>
          <SectionCard title="Expiry Timeline">
            {isEmptyChartData(expiryTimeline) ? (
              <ChartEmptyState className="h-[200px]" />
            ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={expiryTimeline}
                  margin={{ left: -12, right: 8 }}
                >
                  <defs>
                    <linearGradient id="expiryFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-chart-3)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-chart-3)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="expiring"
                    stroke="var(--color-chart-3)"
                    strokeWidth={2}
                    fill="url(#expiryFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            )}
          </SectionCard>
        </Reveal>

        <Reveal delay={200}>
          <SectionCard title="Revenue by Type">
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
            {isEmptyChartData(revenueByTypeData) ? (
              <ChartEmptyState className="h-[200px]" />
            ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByTypeData} margin={{ left: -12, right: 8 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="day"
                    stackId="revenue"
                    fill="var(--color-chart-1)"
                    name="Day"
                  />
                  <Bar
                    dataKey="weekly"
                    stackId="revenue"
                    fill="var(--color-chart-2)"
                    name="Weekly"
                  />
                  <Bar
                    dataKey="monthly"
                    stackId="revenue"
                    fill="var(--color-chart-3)"
                    name="Monthly"
                  />
                  <Bar
                    dataKey="annual"
                    stackId="revenue"
                    fill="var(--color-chart-4)"
                    radius={[4, 4, 0, 0]}
                    name="Annual"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            )}
          </SectionCard>
        </Reveal>
      </div>

      <Reveal delay={240}>
        <SectionCard title="Pass Lifecycle">
          <div className="grid grid-cols-3 gap-4">
            {passLifecycle.map((item) => (
              <Card
                key={item.stage}
                className="p-4 shadow-elegant border-border/60 hover-lift transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`size-2.5 rounded-full ${LIFECYCLE_COLORS[item.stage]}`}
                  />
                  <span className="text-sm font-medium">{item.stage}</span>
                </div>
                <div className="text-3xl font-display font-bold tracking-tight">
                  {item.count}
                </div>
                <Progress
                  value={(item.count / 25) * 100}
                  className="h-1.5 mt-3"
                />
              </Card>
            ))}
          </div>
        </SectionCard>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Reveal delay={320}>
          <SectionCard title="Revenue vs Credit Burn Rate">
            {isEmptyChartData(revenueVsBurnData) ? (
              <ChartEmptyState className="h-[200px]" />
            ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={revenueVsBurnData}
                  margin={{ left: -12, right: 8 }}
                >
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-chart-1)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-chart-1)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="burnFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-chart-4)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-chart-4)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    fill="url(#revenueFill)"
                    name="Revenue ($)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="burnRate"
                    stroke="var(--color-chart-4)"
                    strokeWidth={2}
                    fill="url(#burnFill)"
                    name="Burn Rate (%)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            )}
          </SectionCard>
        </Reveal>

        <Reveal delay={360}>
          <SectionCard title="Pass Renewal Forecast">
            {isEmptyChartData(renewalForecast) ? (
              <ChartEmptyState className="h-[200px]" />
            ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={renewalForecast}
                  margin={{ left: -12, right: 8 }}
                >
                  <defs>
                    <linearGradient id="renewFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-chart-2)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-chart-2)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="expireFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-warning)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-warning)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="newFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-chart-1)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-chart-1)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="new"
                    stackId="forecast"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    fill="url(#newFill)"
                    name="New Purchases"
                  />
                  <Area
                    type="monotone"
                    dataKey="renew"
                    stackId="forecast"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2}
                    fill="url(#renewFill)"
                    name="Renewals"
                  />
                  <Area
                    type="monotone"
                    dataKey="expire"
                    stackId="forecast"
                    stroke="var(--color-warning)"
                    strokeWidth={2}
                    fill="url(#expireFill)"
                    name="Expiring"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            )}
          </SectionCard>
        </Reveal>
      </div>
    </div>
  );
}
