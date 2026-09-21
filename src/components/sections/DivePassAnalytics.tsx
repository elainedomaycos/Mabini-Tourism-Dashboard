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
  return (
    <div className="space-y-6">
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={CreditCard}
            label="Total Revenue"
            value="$6,740"
            delta="+12%"
          />
          <StatCard
            icon={TrendingUp}
            label="Active Passes"
            value="17"
            delta="+2"
          />
          <StatCard
            icon={Clock}
            label="Avg Credits Used"
            value="68%"
            delta="+5%"
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
            <div className="flex items-center gap-6">
              <div className="w-[200px] h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={passTypeDistribution}
                      dataKey="count"
                      nameKey="type"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      stroke="var(--color-card)"
                      strokeWidth={2}
                    >
                      {passTypeDistribution.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {passTypeDistribution.map((p, i) => (
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
                        ${p.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </Reveal>

        <Reveal delay={120}>
          <SectionCard title="Credits Utilization">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={creditsUtilization}
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
          </SectionCard>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Reveal delay={160}>
          <SectionCard title="Expiry Timeline">
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
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByType} margin={{ left: -12, right: 8 }}>
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
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={revenueVsBurn}
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
          </SectionCard>
        </Reveal>

        <Reveal delay={360}>
          <SectionCard title="Pass Renewal Forecast">
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
          </SectionCard>
        </Reveal>
      </div>
    </div>
  );
}
