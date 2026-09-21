import { useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFilters } from "@/routes/index";
import { TouristAnalytics } from "@/components/sections/TouristAnalytics";
import { DiveActivityAnalytics } from "@/components/sections/DiveActivityAnalytics";
import { DivePassAnalytics } from "@/components/sections/DivePassAnalytics";
import { EstablishmentAnalytics } from "@/components/sections/EstablishmentAnalytics";
import { OperatorAnalytics } from "@/routes/index";
import { Reports } from "@/routes/index";

export function AnalyticsPage() {
  const { search, setFilters } = useFilters();
  const currentTab = search.tab || "tourist";

  // Recharts ResponsiveContainer measures parent size on mount. Previously TabsContent
  // kept all tabs mounted hidden (display:none) so it measured 0 and stayed blank.
  // Now we conditionally mount only the active tab, but still dispatch resizes
  // after mount + after Reveal animation (0.4s) to guarantee correct measurement.
  useEffect(() => {
    const timers = [50, 300, 800].map((d) =>
      setTimeout(() => window.dispatchEvent(new Event("resize")), d),
    );
    return () => timers.forEach(clearTimeout);
  }, [currentTab]);

  return (
    <div className="space-y-4">
      <Tabs value={currentTab} onValueChange={(v) => setFilters({ tab: v })}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="tourist">Tourist</TabsTrigger>
          <TabsTrigger value="dive-activity">Dive Activity</TabsTrigger>
          <TabsTrigger value="dive-pass">Dive Pass</TabsTrigger>
          <TabsTrigger value="establishment">Establishment</TabsTrigger>
          <TabsTrigger value="operator">Operator</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="mt-4">
        {currentTab === "tourist" && <TouristAnalytics key="tourist" />}
        {currentTab === "dive-activity" && <DiveActivityAnalytics key="dive-activity" />}
        {currentTab === "dive-pass" && <DivePassAnalytics key="dive-pass" />}
        {currentTab === "establishment" && <EstablishmentAnalytics key="establishment" />}
        {currentTab === "operator" && <OperatorAnalytics key="operator" />}
        {currentTab === "reports" && <Reports key="reports" />}
        {/* Fallback for stray tab values (e.g. leftover ?tab=sites from other sections) */}
        {!["tourist", "dive-activity", "dive-pass", "establishment", "operator", "reports"].includes(currentTab) && (
          <TouristAnalytics key="tourist-fallback" />
        )}
      </div>
    </div>
  );
}
