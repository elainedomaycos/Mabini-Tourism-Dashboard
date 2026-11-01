import { useMemo } from "react";
import { CreditCard, ChevronRight, Building2, Receipt, Clock } from "lucide-react";

type ActionItem = {
  id: string;
  icon: any;
  title: string;
  count: number;
  color: string;
  bgColor: string;
  borderColor: string;
  section: string;
  tab?: string;
  extraFilters?: Record<string, string>;
};

export function ActionRequiredStrip({
  receipts = [],
  operatorApps = [],
  manifestos = [],
  tourists = [],
  pendingApplications,
  pendingReceipts,
  expiringPasses,
  setFilters,
}: {
  receipts?: Array<{ id: string; status: string }>;
  operatorApps?: Array<{ id: string; status: string }>;
  manifestos?: Array<{ id: string; date: string }>;
  tourists?: Array<{ expires?: string; status: string }>;
  pendingApplications?: number;
  pendingReceipts?: number;
  expiringPasses?: number;
  setFilters: (updates: Record<string, string>) => void;
}) {
  void manifestos;

  const items: ActionItem[] = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const pendingAppsCount =
      pendingApplications ??
      operatorApps.filter(
        (a) => (a.status || "").toLowerCase() === "pending",
      ).length;

    const pendingRecCount =
      pendingReceipts ??
      receipts.filter(
        (r) => (r.status || "").toLowerCase() === "pending",
      ).length;

    const expiring =
      expiringPasses ??
      tourists.filter((t) => {
        if (t.status !== "Active" || !t.expires || t.expires === "—") return false;
        const exp = new Date(t.expires + "T00:00:00");
        if (Number.isNaN(exp.getTime())) return false;
        const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff > 0 && diff <= 30;
      }).length;

    const actionList: ActionItem[] = [];

    if (pendingAppsCount > 0) {
      actionList.push({
        id: "apps",
        icon: Building2,
        title: "Pending Operator Applications",
        count: pendingAppsCount,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
        section: "establishments",
        tab: "applications",
      });
    }

    if (pendingRecCount > 0) {
      actionList.push({
        id: "receipts",
        icon: Receipt,
        title: "Unverified Payment Receipts",
        count: pendingRecCount,
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
        section: "dive-pass",
        tab: "payments",
      });
    }

    if (expiring > 0) {
      actionList.push({
        id: "passes",
        icon: Clock,
        title: "Expiring Tourist Passes (30d)",
        count: expiring,
        color: "text-warning",
        bgColor: "bg-warning/10",
        borderColor: "border-warning/30",
        section: "tourists",
        tab: "",
        extraFilters: { status: "Active" },
      });
    }

    return actionList;
  }, [
    operatorApps,
    receipts,
    tourists,
    pendingApplications,
    pendingReceipts,
    expiringPasses,
  ]);

  if (items.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() =>
              setFilters({
                section: item.section,
                tab: item.tab ?? "",
                ...(item.extraFilters ?? {}),
              })
            }
            className={`flex items-center gap-3 rounded-xl border ${item.borderColor} ${item.bgColor} px-4 py-3 min-w-[220px] hover:shadow-md transition-all group text-left shrink-0`}
          >
            <div
              className={`size-9 rounded-lg ${item.bgColor} ${item.color} flex items-center justify-center`}
            >
              <Icon className="size-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">{item.title}</div>
              <div className="text-lg font-display font-bold">{item.count}</div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        );
      })}
    </div>
  );
}
