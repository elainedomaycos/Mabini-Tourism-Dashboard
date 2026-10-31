import { Waves, ScrollText, MapPin } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFilters } from "@/routes/index";
import { ManifestoView } from "@/routes/index";
import { DiveSiteMgmt } from "@/routes/index";
import { Reveal, StatCard } from "@/components/shared";
import {
  useLiveMode,
  useManifestsLive,
  useDiveSitesLive,
  bucketByMonth,
} from "@/lib/queries";

export function DiveOpsPage() {
  const { search, setFilters } = useFilters();
  const currentTab = search.tab || "manifestos";
  // Legacy ?tab=analytics URLs land on the sites tab — the heatmap now
  // lives below the sites table, so there is no separate analytics view.
  const outerTab = currentTab === "sites" || currentTab === "analytics" ? "sites" : "manifestos";

  // Live manifestos + dive sites (React Query cache — no extra fetch).
  const isLive = useLiveMode();
  const liveManifests = useManifestsLive();
  const liveSites = useDiveSitesLive();
  const manifests = liveManifests.data;
  const siteCountLive = isLive && !!liveSites.data;
  const siteCount = liveSites.data ? liveSites.data.length : 10;
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
            value={
              isLive && liveManifests.isPending
                ? "—"
                : isLiveData
                  ? String(todayCount)
                  : "4"
            }
            delta={
              isLive && liveManifests.isPending
                ? ""
                : isLiveData
                  ? `${dayDiff >= 0 ? "+" : ""}${dayDiff}`
                  : "+1"
            }
            up={isLiveData ? dayDiff >= 0 : true}
          />
          <StatCard
            icon={ScrollText}
            label="Manifestos This Month"
            value={
              isLive && liveManifests.isPending
                ? "—"
                : isLiveData
                  ? String(mBuckets[cur]?.count ?? 0)
                  : "25"
            }
            delta={
              isLive && liveManifests.isPending
                ? ""
                : isLiveData
                  ? `${monthDiff >= 0 ? "+" : ""}${monthDiff}`
                  : "+3"
            }
            up={isLiveData ? monthDiff >= 0 : true}
          />
          <StatCard
            icon={MapPin}
            label="Dive Sites"
            value={
              isLive && liveSites.isPending
                ? "—"
                : siteCountLive
                  ? String(siteCount)
                  : "10"
            }
            delta=""
          />
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
      </div>
      <div className="mt-4">
        {outerTab === "manifestos" ? (
          <ManifestoView />
        ) : (
          <DiveSiteMgmt />
        )}
      </div>
    </div>
  );
}
