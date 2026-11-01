import { useState, useMemo } from "react";
import {
  Building2,
  CreditCard,
  TrendingUp,
  ScrollText,
  Users,
  ChevronRight,
  Waves,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  Cell,
  ComposedChart,
  Line,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { InsightWidget } from "@/components/InsightWidget";
import { AnalyticsState, MetricsError } from "@/components/AnalyticsState";
import {
  SectionCard,
  StatCard,
  DrilldownDialog,
  chartAxisProps,
  chartTooltipStyle,
} from "@/components/shared";
import { isEmptyChartData, ChartEmptyState } from "@/components/ChartEmptyState";
import { useMetrics } from "@/lib/metrics";
import { type DateRange } from "@/lib/period";
import { useLiveMode } from "@/lib/queries";
import { buildOperatorInsight } from "@/lib/insights";
import { operatorActivity, CHART_COLORS } from "@/lib/mock-data";
import { useFilters } from "@/hooks/useFilters";

export function OperatorAnalytics({ range }: { range: DateRange }) {
  const { setFilters } = useFilters();
  const isLive = useLiveMode();
  const [drillOperator, setDrillOperator] = useState<any>(null);
  const metrics = useMetrics("operator", range);
  const m = metrics.data;
  const scaledOperatorActivity = useMemo(() => {
    if (m) return m.rows;
    if (isLive) return [];
    return operatorActivity.map((operator) => {
      const credits = operator.credits;
      return {
        ...operator,
        divers: Math.round(operator.manifestos * 7.2),
        purchased: Math.round(credits / 0.7),
        remaining: 0,
        revenue: operator.manifestos * 4200,
        recent: [],
      };
    });
  }, [m, isLive]);


  const operatorInsight = useMemo(() => {
    const rows = m?.rows ?? [];
    const withManifests = rows.filter((row) => row.manifestos > 0);
    const totalManifestos = rows.reduce((sum, row) => sum + row.manifestos, 0);
    const top = withManifests[0];
    return buildOperatorInsight({
      live: isLive,
      operatorsWithManifests: m?.active ?? withManifests.length,
      idleOperators: m ? Math.max(0, m.operators - m.active) : 0,
      topOperator: top?.name ?? null,
      topOperatorShare:
        top && totalManifestos > 0
          ? (top.manifestos / totalManifestos) * 100
          : 0,
      exhaustedOperators: rows.filter(
        (row) => row.purchased > 0 && row.remaining <= 0,
      ).length,
      seed: new Date().getDate(),
    });
  }, [isLive, m]);

  const opKpis = useMemo(() => {
    if (m) {
      return {
        live: true,
        active: m.active,
        manifestos: m.manifestos,
        divers: m.divers,
        revenue: m.revenue,
        mDelta: m.manifestos - m.manifestosPrev,
        dDelta: m.divers - m.diversPrev,
        rDelta: m.revenue - m.revenuePrev,
      };
    }
    if (isLive) {
      return {
        live: true,
        active: 0,
        manifestos: 0,
        divers: 0,
        revenue: 0,
        mDelta: 0,
        dDelta: 0,
        rDelta: 0,
      };
    }
    const totalManifestos = operatorActivity.reduce(
      (sum, operator) => sum + operator.manifestos,
      0,
    );
    return {
      live: false,
      active: operatorActivity.length,
      manifestos: totalManifestos,
      divers: Math.round(totalManifestos * 7.2),
      revenue: totalManifestos * 4200,
      mDelta: 0,
      dDelta: 0,
      rDelta: 0,
    };
  }, [m, isLive]);

  const kpiDelta = (delta: number) =>
    delta === 0 && !opKpis.live ? "" : `${delta >= 0 ? "+" : ""}${delta}`;

  return (
    <AnalyticsState isLive={isLive} label="operator" state={metrics}>
      <div className="relative">
        <InsightWidget insight={operatorInsight} label="Operators" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Users}
          label="Active Operators"
          value={String(opKpis.active)}
          delta=""
        />
        <StatCard
          icon={ScrollText}
          label="Manifestos Filed"
          value={opKpis.manifestos.toLocaleString()}
          delta={opKpis.live ? kpiDelta(opKpis.mDelta) : ""}
          deltaLabel="vs previous period"
          up={opKpis.mDelta >= 0}
        />
        <StatCard
          icon={Waves}
          label="Divers Logged"
          value={opKpis.divers.toLocaleString()}
          delta={opKpis.live ? kpiDelta(opKpis.dDelta) : ""}
          deltaLabel="vs previous period"
          up={opKpis.dDelta >= 0}
        />
        <StatCard
          icon={CreditCard}
          label="Revenue Generated"
          value={`\u20B1${Math.round(opKpis.revenue).toLocaleString()}`}
          delta={
            opKpis.live && opKpis.rDelta !== 0
              ? `${opKpis.rDelta >= 0 ? "+" : "-"}\u20B1${Math.round(
                  Math.abs(opKpis.rDelta),
                ).toLocaleString()}`
              : ""
          }
          deltaLabel="vs previous period"
          up={opKpis.rDelta >= 0}
        />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard title="Most Active Operators">
          <div className="h-80">
            {isEmptyChartData(scaledOperatorActivity) ? (
              <ChartEmptyState className="h-80" />
            ) : (
              <ResponsiveContainer>
                <BarChart
                  data={scaledOperatorActivity}
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
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                  />
                  <Bar
                    dataKey="manifestos"
                    fill="var(--color-primary)"
                    radius={[0, 8, 8, 0]}
                    onClick={(data: any) => data && setDrillOperator(data)}
                    className="cursor-pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Manifestos & Credits by Operator" sample={!isLive}>
          <div className="h-80">
            {isEmptyChartData(scaledOperatorActivity) ? (
              <ChartEmptyState className="h-80" />
            ) : (
              <ResponsiveContainer>
                <ComposedChart
                  data={scaledOperatorActivity}
                  margin={{ left: -12, right: 4 }}
                  onClick={(e) =>
                    e?.activePayload?.[0]?.payload &&
                    setDrillOperator(e.activePayload[0].payload)
                  }
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
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    {...chartAxisProps}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(value: number, name: string) => [
                      value.toLocaleString(),
                      name,
                    ]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="manifestos"
                    name="Manifestos"
                    fill="var(--color-primary)"
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="credits"
                    name="Credits used"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "var(--color-chart-2)" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Operator Leaderboard"
          className="xl:col-span-2"
          sample={!isLive}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Operator</TableHead>
                <TableHead>Manifestos</TableHead>
                <TableHead>Credits Used</TableHead>
                <TableHead>Credit Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scaledOperatorActivity.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No operator activity for the selected period.
                  </TableCell>
                </TableRow>
              )}
              {scaledOperatorActivity.map((o) => {
                const util =
                  o.purchased > 0
                    ? Math.round((o.credits / o.purchased) * 100)
                    : 0;
                return (
                  <TableRow
                    key={o.name}
                    className="cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => setDrillOperator(o)}
                  >
                    <TableCell className="font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilters({
                            section: "establishments",
                            tab: "registered",
                            q: o.name,
                          });
                        }}
                        className="flex items-center gap-2 underline decoration-dotted underline-offset-2 hover:text-primary hover:decoration-solid transition-colors"
                      >
                        <Building2 className="size-4 text-primary" /> {o.name}
                      </button>
                    </TableCell>
                    <TableCell>{o.manifestos}</TableCell>
                    <TableCell>{o.credits.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full gradient-primary"
                            style={{ width: `${Math.min(100, util)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {o.purchased > 0 ? `${util}%` : "—"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </SectionCard>

        <DrilldownDialog
          open={!!drillOperator}
          onOpenChange={(o) => !o && setDrillOperator(null)}
          title={drillOperator?.name ?? ""}
          subtitle="Operator performance detail"
          stats={
            drillOperator
              ? [
                  {
                    label: "Manifestos",
                    value: drillOperator.manifestos,
                    icon: ScrollText,
                  },
                  {
                    label: "Credits used",
                    value: drillOperator.credits.toLocaleString(),
                    icon: CreditCard,
                  },
                  {
                    label: "Credit Utilization",
                    value: drillOperator.purchased
                      ? `${Math.round((drillOperator.credits / drillOperator.purchased) * 100)}%`
                      : "—",
                    icon: TrendingUp,
                  },
                ]
              : undefined
          }
        >
          {drillOperator && (
            <div className="space-y-4 mt-2">
              <Card className="p-4 shadow-elegant">
                <h4 className="font-display font-semibold text-sm mb-3">
                  Operator summary
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-muted-foreground">
                        Total manifestos filed
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {drillOperator.manifestos}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground">
                        Credits used
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(drillOperator.credits ?? 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground">
                        Credits remaining
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(drillOperator.remaining ?? 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground">
                        Avg divers per manifest
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {drillOperator.manifestos > 0
                          ? (
                              (drillOperator.divers ?? 0) /
                              drillOperator.manifestos
                            ).toFixed(1)
                          : "0.0"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground">
                        Revenue generated
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {`\u20B1${Math.round(drillOperator.revenue ?? 0).toLocaleString()}`}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Card>
              <Card className="p-4 shadow-elegant">
                <h4 className="font-display font-semibold text-sm mb-3">
                  Recent manifestos
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>ID</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Divers</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(drillOperator.recent ?? []).map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-xs">
                          {row.id}
                        </TableCell>
                        <TableCell className="font-medium">{row.site}</TableCell>
                        <TableCell>{row.divers}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.date}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}
        </DrilldownDialog>
      </div>
      </div>
    </AnalyticsState>
  );
}


