import { Waves, ScrollText, MapPin } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFilters } from "@/routes/index";
import { ManifestoView } from "@/routes/index";
import { DiveSiteMgmt } from "@/routes/index";
import { Reveal, StatCard } from "@/components/shared";
import {
  useLiveMode,
  useManifestsLive,
  bucketByMonth,
} from "@/lib/queries";

export function DiveOpsPage() {
  const { search, setFilters } = useFilters();
  const currentTab = search.tab || "manifestos";
  const isSitesSection = currentTab === "sites" || currentTab === "analytics";
  const outerTab = isSitesSection ? "sites" : "manifestos";
  const innerTab = currentTab === "analytics" ? "analytics" : "sites";

  // Live manifestos (React Query cache — no extra fetch). Dive-site count
  // stays mock: no dive-sites table exists yet.
  const isLive = useLiveMode();
  const liveManifests = useManifestsLive();
  const manifests = liveManifests.data;
  const isLiveData = isLive && !!manifests;
  const todayISO = new Date().toISOString().slice(0, 10);
  const yesterdayISO = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const todayCount = manifests
    ? manifests.filter((m) => m.date === todayISO).length
    : 0;
  const yesterdayCount = manifests
    ? manifests.filter((m) => m.date === yesterdayISO).length
    : 0;
  const dayDiff = todayCount - yesterdayCount;
  const mBuckets = manifests ? bucketByMonth(manifests, (m) => m.date) : [];
  const cur = new Date().getMonth();
  const prev = (cur + 11) % 12;
  const monthDiff = mBuckets.length
    ? mBuckets[cur].count - mBuckets[prev].count
    : 0;

  return (
    <div className="space-y-4">
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            icon={Waves}
            label="Active Dives"
            value={isLiveData ? String(todayCount) : "4"}
            delta={isLiveData ? `${dayDiff >= 0 ? "+" : ""}${dayDiff}` : "+1"}
            up={isLiveData ? dayDiff >= 0 : true}
          />
          <StatCard
            icon={ScrollText}
            label="Manifestos This Month"
            value={isLiveData ? String(mBuckets[cur]?.count ?? 0) : "25"}
            delta={
              isLiveData ? `${monthDiff >= 0 ? "+" : ""}${monthDiff}` : "+3"
            }
            up={isLiveData ? monthDiff >= 0 : true}
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
