import { Waves, ScrollText, MapPin } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFilters } from "@/routes/index";
import { ManifestoView } from "@/routes/index";
import { DiveSiteMgmt } from "@/routes/index";
import { Reveal, StatCard } from "@/components/shared";

export function DiveOpsPage() {
  const { search, setFilters } = useFilters();
  const currentTab = search.tab || "manifestos";
  const isSitesSection = currentTab === "sites" || currentTab === "analytics";
  const outerTab = isSitesSection ? "sites" : "manifestos";
  const innerTab = currentTab === "analytics" ? "analytics" : "sites";

  return (
    <div className="space-y-4">
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard icon={Waves} label="Active Dives" value="4" delta="+1" />
          <StatCard
            icon={ScrollText}
            label="Manifestos This Month"
            value="25"
            delta="+3"
          />
          <StatCard icon={MapPin} label="Dive Sites" value="10" delta="" />
        </div>
      </Reveal>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <Tabs
          value={outerTab}
          onValueChange={(v) => setFilters({ tab: v })}
        >
          <TabsList className="bg-secondary">
            <TabsTrigger value="manifestos">Dive Manifestos</TabsTrigger>
            <TabsTrigger value="sites">Dive Sites</TabsTrigger>
          </TabsList>
        </Tabs>
        {isSitesSection && (
          <Tabs
            value={innerTab}
            onValueChange={(v) => setFilters({ tab: v })}
          >
            <TabsList className="bg-secondary">
              <TabsTrigger value="sites">Sites</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>
      <div className="mt-4">
        {outerTab === "manifestos" ? (
          <ManifestoView />
        ) : (
          <DiveSiteMgmt hideHeader forcedTab={innerTab} />
        )}
      </div>
    </div>
  );
}
