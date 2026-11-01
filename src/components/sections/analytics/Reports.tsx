import { useState, useEffect, useMemo } from "react";
import {
  FileBarChart,
  Download,
  CalendarIcon,
  Loader2,
  FileDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { toast } from "sonner";
import { SectionCard, StatCard, chartAxisProps, chartTooltipStyle } from "@/components/shared";
import { isEmptyChartData, ChartEmptyState } from "@/components/ChartEmptyState";
import { MetricsError } from "@/components/AnalyticsState";
import { pushAuditLog } from "@/lib/audit";
import { type DateRange, resolveDateRange } from "@/lib/period";
import { supabase } from "@/lib/supabase";
import { dbErrorMessage, useLiveMode } from "@/lib/queries";
import { useMetrics, aggregateDaily } from "@/lib/metrics";
import { monthlyTrends } from "@/lib/mock-data";

export function Reports({ range: globalRange }: { range: DateRange }) {
  const [range, setRange] = useState("monthly");
  const [dateFrom, setDateFrom] = useState(globalRange.from);
  const [dateTo, setDateTo] = useState(globalRange.to);
  const [generating, setGenerating] = useState(false);
  type ReportRow = {
    period: string;
    tourists: number;
    operators: number;
    manifestos: number;
    dives: number;
    revenue: number;
  };
  const [reportData, setReportData] = useState<ReportRow[] | null>(null);
  const isLive = useLiveMode();

  useEffect(() => {
    setDateFrom(globalRange.from);
    setDateTo(globalRange.to);
    setReportData(null);
  }, [globalRange.from, globalRange.to]);

  const reportRange = useMemo<DateRange>(() => {
    const resolved = resolveDateRange(
      "custom",
      dateFrom || globalRange.from,
      dateTo || globalRange.to,
    );
    const grain = range === "daily" ? "day" : range === "weekly" ? "week" : "month";
    return { ...resolved, grain };
  }, [dateFrom, dateTo, globalRange.from, globalRange.to, range]);

  const metrics = useMetrics("report", reportRange);
  const m = metrics.data;

  const filteredTrends = useMemo(() => {
    if (!m) return isLive ? [] : monthlyTrends;
    return aggregateDaily(
      { ...reportRange, grain: "month" },
      m.daily,
      (row) => row.date,
      () => ({ dives: 0 }),
      (acc, row) => {
        acc.dives += row.divers;
      },
    ).map((bucket) => ({ m: bucket.label, dives: bucket.dives }));
  }, [m, isLive, reportRange]);

  const generateReport = () => {
    setGenerating(true);
    if (isLive) {
      if (!m) {
        setGenerating(false);
        toast.error("Report metrics are still loading");
        return;
      }
      const rows = aggregateDaily(
        reportRange,
        m.daily,
        (row) => row.date,
        () => ({ tourists: 0, operators: 0, manifestos: 0, dives: 0, revenue: 0 }),
        (acc, row) => {
          acc.tourists += row.tourists;
          acc.operators += row.operators;
          acc.manifestos += row.manifestos;
          acc.dives += row.divers;
          acc.revenue += row.revenue;
        },
      ).map((bucket) => ({
        period: bucket.label,
        tourists: bucket.tourists,
        operators: bucket.operators,
        manifestos: bucket.manifestos,
        dives: bucket.dives,
        revenue: bucket.revenue,
      }));
      setReportData(rows);
      setGenerating(false);
      toast.success(`${range} report generated`, {
        description: `${rows.length} periods included.`,
      });
      return;
    }

    const demoRows: Record<string, ReportRow[]> = {
      daily: [
        { period: "Jul 25", tourists: 42, operators: 8, manifestos: 18, dives: 64, revenue: 126400 },
        { period: "Jul 24", tourists: 38, operators: 7, manifestos: 15, dives: 56, revenue: 112200 },
        { period: "Jul 23", tourists: 35, operators: 9, manifestos: 20, dives: 72, revenue: 138800 },
      ],
      weekly: [
        { period: "Week 30", tourists: 280, operators: 12, manifestos: 95, dives: 380, revenue: 892000 },
        { period: "Week 29", tourists: 245, operators: 11, manifestos: 82, dives: 328, revenue: 765000 },
        { period: "Week 28", tourists: 310, operators: 14, manifestos: 104, dives: 416, revenue: 948000 },
      ],
      monthly: [
        { period: "Jul 2026", tourists: 1240, operators: 18, manifestos: 420, dives: 1680, revenue: 3842000 },
        { period: "Jun 2026", tourists: 1180, operators: 17, manifestos: 398, dives: 1592, revenue: 3610000 },
        { period: "May 2026", tourists: 1050, operators: 16, manifestos: 360, dives: 1440, revenue: 3280000 },
      ],
    };
    const data = demoRows[range] ?? demoRows.monthly;
    setReportData(data);
    setGenerating(false);
    toast.success(`${range} sample report generated`, {
      description: "Connect Supabase for live report data.",
    });
  };

  const exportReport = (fmt: string) => {
    if (!reportData) return toast.error("Generate a report first");
    if (fmt !== "CSV") {
      return toast.info("CSV is the only supported export");
    }
    const header = "Period,Tourists,Operators,Manifestos,Dives,Revenue";
    const rows = reportData.map(
      (row) =>
        `${row.period},${row.tourists},${row.operators},${row.manifestos},${row.dives},${row.revenue}`,
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${range}-${dateFrom || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported", { description: "CSV downloaded." });
  };

  return (
    <div className="space-y-6">
      {isLive && metrics.isPending && (
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          Loading report metrics&hellip;
        </p>
      )}
      {isLive && metrics.isError && (
        <MetricsError label="report" state={metrics} compact />
      )}
      <Card className="p-6 shadow-elegant">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-display font-semibold text-lg">
              Generate report
            </h3>
            <p className="text-sm text-muted-foreground">
              Aggregate tourism data across configurable time windows.
            </p>
          </div>
          <Button
            className="gradient-primary text-primary-foreground shrink-0"
            onClick={generateReport}
            disabled={generating || (isLive && metrics.isPending)}
          >
            {generating ? (
              <Loader2 className="size-4 mr-1.5 animate-spin" />
            ) : (
              <FileBarChart className="size-4 mr-1.5" />
            )}
            {generating ? "Generating…" : "Generate"}
          </Button>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-border/60 bg-secondary/40 p-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Tabs value={range} onValueChange={setRange}>
            <TabsList className="bg-secondary">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="hidden sm:block h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              From
            </Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              To
            </Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: FileDown,
            label: "Export as CSV",
            desc: "Raw data for analysis",
            fmt: "CSV",
          },
        ].map((x) => (
          <Card
            key={x.label}
            className="p-5 shadow-elegant border-border/60 hover:border-primary/30 hover:shadow-glow transition-all cursor-pointer group"
            onClick={() => exportReport(x.fmt)}
          >
            <div className="size-11 rounded-xl bg-primary-soft text-primary flex items-center justify-center group-hover:gradient-primary group-hover:text-primary-foreground transition-colors">
              <x.icon className="size-5" />
            </div>
            <div className="mt-4 font-display font-semibold">{x.label}</div>
            <div className="text-sm text-muted-foreground">{x.desc}</div>
          </Card>
        ))}
      </div>

      {reportData && (
        <SectionCard
          title={`Report preview — ${range.charAt(0).toUpperCase() + range.slice(1)}`}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Period</TableHead>
                <TableHead>Tourists</TableHead>
                <TableHead>Operators</TableHead>
                <TableHead>Manifestos</TableHead>
                <TableHead>Dives</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.period}</TableCell>
                  <TableCell>{r.tourists.toLocaleString()}</TableCell>
                  <TableCell>{r.operators}</TableCell>
                  <TableCell>{r.manifestos.toLocaleString()}</TableCell>
                  <TableCell>{r.dives.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">
                    {`\u20B1${r.revenue.toLocaleString()}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      )}

      <SectionCard title="Trend — Monthly dives">
        <div className="h-80">
          {isEmptyChartData(filteredTrends) ? (
            <ChartEmptyState className="h-80" />
          ) : (
            <ResponsiveContainer>
              <AreaChart data={filteredTrends} margin={{ left: -12 }}>
                <defs>
                  <linearGradient id="rpt" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="3 6"
                  vertical={false}
                />
                <XAxis
                  dataKey="m"
                  {...chartAxisProps}
                />
                <YAxis
                  {...chartAxisProps}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                />
                <Area
                  type="monotone"
                  dataKey="dives"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  fill="url(#rpt)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </SectionCard>
    </div>
  );
}


