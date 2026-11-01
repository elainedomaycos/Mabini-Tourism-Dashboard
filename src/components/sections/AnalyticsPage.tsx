import { useEffect } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFilters } from "@/hooks/useFilters";
import { TouristAnalytics } from "@/components/sections/TouristAnalytics";
import { DiveActivityAnalytics } from "@/components/sections/DiveActivityAnalytics";
import { DivePassAnalytics } from "@/components/sections/DivePassAnalytics";
import { EstablishmentAnalytics } from "@/components/sections/EstablishmentAnalytics";
import { OperatorAnalytics } from "./analytics/OperatorAnalytics";
import { Reports } from "./analytics/Reports";
import type { DateRange } from "@/lib/period";

export function AnalyticsPage({ range }: { range: DateRange }) {
  const { search, setFilters } = useFilters();
  const currentTab = search.tab || "tourist";
  const fetching = useIsFetching({ queryKey: ["metrics"] });
  const grainLabel =
    range.grain === "day"
      ? "Daily"
      : range.grain === "week"
        ? "Weekly"
        : "Monthly";

  useEffect(() => {
    const timers = [50, 300, 800].map((d) =>
      setTimeout(() => window.dispatchEvent(new Event("resize")), d),
    );
    return () => timers.forEach(clearTimeout);
  }, [currentTab]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{range.label}</span>
          <span className="mx-1.5">&middot;</span>
          {grainLabel}
        </p>
        {fetching > 0 && (
          <div
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
          >
            <Loader2 className="size-3 animate-spin" />
            {"Updating\u2026"}
          </div>
        )}
      </div>
      <Tabs value={currentTab} onValueChange={(v) => setFilters({ tab: v })}>
        <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList
            aria-label="Analytics sections"
            className="w-max min-w-full justify-start bg-secondary"
          >
            <TabsTrigger value="tourist">Tourist</TabsTrigger>
            <TabsTrigger value="dive-activity">Dive Activity</TabsTrigger>
            <TabsTrigger value="dive-pass">Dive Pass</TabsTrigger>
            <TabsTrigger value="establishment">Establishment</TabsTrigger>
            <TabsTrigger value="operator">Operator</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
      <div className="mt-4">
        {currentTab === "tourist" && (
          <TouristAnalytics key="tourist" range={range} />
        )}
        {currentTab === "dive-activity" && (
          <DiveActivityAnalytics key="dive-activity" range={range} />
        )}
        {currentTab === "dive-pass" && (
          <DivePassAnalytics key="dive-pass" range={range} />
        )}
        {currentTab === "establishment" && (
          <EstablishmentAnalytics key="establishment" range={range} />
        )}
        {currentTab === "operator" && (
          <OperatorAnalytics key="operator" range={range} />
        )}
        {currentTab === "reports" && <Reports key="reports" range={range} />}
        {![
          "tourist",
          "dive-activity",
          "dive-pass",
          "establishment",
          "operator",
          "reports",
        ].includes(currentTab) && (
          <TouristAnalytics key="tourist-fallback" range={range} />
        )}
      </div>
    </div>
  );
}
