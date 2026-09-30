import { CreditCard, CheckCircle2, Clock } from "lucide-react";
import { ReceiptVerification } from "@/routes/index";
import { Reveal, StatCard } from "@/components/shared";
import {
  useLiveMode,
  useInventoryLive,
  bucketByMonth,
} from "@/lib/queries";

export function DivePassPage() {
  // Live inventory (React Query cache — no extra fetch). Definitions from
  // the columns that exist: Total = Σ total_passes, Active (in use) =
  // Σ (total − remaining). "Expiring Soon" has no expiry source anywhere
  // (dive_pass_inventory carries no dates) — stays mock until the
  // annual_pass_holders probe resolves it.
  const isLive = useLiveMode();
  const liveInventory = useInventoryLive();
  const inv = liveInventory.data;
  const isLiveData = isLive && !!inv;
  const totalPasses = inv
    ? inv.reduce((a, r) => a + r.totalPasses, 0)
    : 0;
  const inUse = inv
    ? inv.reduce((a, r) => a + (r.totalPasses - r.remainingPasses), 0)
    : 0;
  const buckets = inv
    ? bucketByMonth(
        inv,
        (r) => r.createdAt,
        (r) => r.totalPasses
      )
    : [];
  const cur = new Date().getMonth();
  const prev = (cur + 11) % 12;
  const totalDiff = buckets.length
    ? buckets[cur].total - buckets[prev].total
    : 0;
  const useBuckets = inv
    ? bucketByMonth(
        inv,
        (r) => r.createdAt,
        (r) => r.totalPasses - r.remainingPasses
      )
    : [];
  const useDiff = useBuckets.length
    ? useBuckets[cur].total - useBuckets[prev].total
    : 0;

  return (
    <div className="space-y-4">
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            icon={CreditCard}
            label="Total Passes"
            value={isLiveData ? String(totalPasses) : "25"}
            delta={
              isLiveData ? `${totalDiff >= 0 ? "+" : ""}${totalDiff}` : "+3"
            }
            up={isLiveData ? totalDiff >= 0 : true}
          />
          <StatCard
            icon={CheckCircle2}
            label="Active Passes"
            value={isLiveData ? String(inUse) : "17"}
            delta={isLiveData ? `${useDiff >= 0 ? "+" : ""}${useDiff}` : "+1"}
            up={isLiveData ? useDiff >= 0 : true}
          />
          <StatCard
            icon={Clock}
            label="Expiring Soon"
            value="4"
            delta="-1"
            up={false}
          />
        </div>
      </Reveal>
      <ReceiptVerification />
    </div>
  );
}
