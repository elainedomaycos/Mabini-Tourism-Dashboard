import { Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFilters } from "@/routes/index";
import { OperatorMgmt } from "@/routes/index";
import { Establishments } from "@/components/sections/Establishments";
import { Reveal, StatCard } from "@/components/shared";
import {
  useLiveMode,
  useOperatorApplicationsLive,
  useEstablishmentsLive,
  bucketByMonth,
} from "@/lib/queries";

export function EstablishmentsPage() {
  const { search, setFilters } = useFilters();
  // OperatorMgmt uses the same `tab` param for "applications" vs "active".
  // If we use the raw tab value for the outer Tabs, setting tab="active"
  // hides the outer <TabsContent value="applications"> that contains
  // OperatorMgmt, resulting in a blank page. Keep the outer Tabs mounted
  // on "applications" whenever the inner tab is "active".
  const rawTab = search.tab || "applications";
  const outerTab = rawTab === "registered" ? "registered" : "applications";

  // Live application + registry counts (React Query cache — no extra fetch).
  const isLive = useLiveMode();
  const liveApps = useOperatorApplicationsLive();
  const liveEst = useEstablishmentsLive();
  const apps = liveApps.data;
  const isLiveData = isLive && !!apps;
  const regCountLive = isLive && !!liveEst.data;
  const regCount = liveEst.data ? liveEst.data.length : 0;
  const pendingCount = apps
    ? apps.filter((a) => a.status === "Pending").length
    : 0;
  const approvedCount = apps
    ? apps.filter((a) => a.status === "Approved").length
    : 0;
  const buckets = apps ? bucketByMonth(apps, (a) => a.submitted) : [];
  const cur = new Date().getMonth();
  const prev = (cur + 11) % 12;
  const monthDiff = buckets.length
    ? buckets[cur].count - buckets[prev].count
    : 0;
  const regBuckets = liveEst.data
    ? bucketByMonth(liveEst.data, (e) => e.createdAt)
    : [];
  const regDiff = regBuckets.length
    ? regBuckets[cur].count - regBuckets[prev].count
    : 0;

  return (
    <div className="space-y-4">
      <Tabs value={outerTab} onValueChange={(v) => setFilters({ tab: v })}>
        <div className="flex justify-end">
          <TabsList className="bg-secondary">
            <TabsTrigger value="applications">
              Operator Applications
            </TabsTrigger>
            <TabsTrigger value="registered">
              Registered Establishments
            </TabsTrigger>
          </TabsList>
        </div>
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <button
              type="button"
              onClick={() => setFilters({ tab: "registered" })}
              className="text-left w-full h-full"
            >
              <StatCard
                icon={Building2}
                label="Registered Establishments"
                value={regCountLive ? String(regCount) : "12"}
                delta={
                  regCountLive
                    ? `${regDiff >= 0 ? "+" : ""}${regDiff}`
                    : "+1"
                }
                up={regCountLive ? regDiff >= 0 : true}
              />
            </button>
            <button
              type="button"
              onClick={() => setFilters({ tab: "applications" })}
              className="text-left w-full h-full"
            >
              <StatCard
                icon={Building2}
                label="Pending Applications"
                value={isLiveData ? String(pendingCount) : "5"}
                delta={
                  isLiveData
                    ? `${monthDiff >= 0 ? "+" : ""}${monthDiff}`
                    : "+2"
                }
                up={isLiveData ? monthDiff >= 0 : true}
              />
            </button>
            <button
              type="button"
              onClick={() => setFilters({ tab: "active" })}
              className="text-left w-full h-full"
            >
              <StatCard
                icon={Building2}
                label="Active Operators"
                value={isLiveData ? String(approvedCount) : "8"}
                delta=""
              />
            </button>
          </div>
        </Reveal>
        <TabsContent value="applications" className="mt-4">
          <OperatorMgmt />
        </TabsContent>
        <TabsContent value="registered" className="mt-4">
          <Establishments />
        </TabsContent>
      </Tabs>
    </div>
  );
}
