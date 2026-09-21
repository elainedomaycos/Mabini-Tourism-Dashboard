import { useMemo } from "react";
import { CreditCard, ChevronRight } from "lucide-react";

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
};

export function ActionRequiredStrip({
  receipts,
  operatorApps,
  manifestos,
  tourists,
  setFilters,
}: {
  receipts: Array<{ id: string; status: string }>;
  operatorApps: Array<{ id: string; status: string }>;
  manifestos: Array<{ id: string; date: string }>;
  tourists: Array<{ id: string; expires: string; status: string }>;
  setFilters: (updates: Record<string, string>) => void;
}) {
  // keep props for backward compat — only Expiring Dive Passes is shown now
  void receipts;
  void operatorApps;
  void manifestos;
  const items: ActionItem[] = useMemo(() => {
    const expiringPasses = tourists.filter((t) => {
      const exp = new Date(t.expires);
      const now = new Date("2026-07-25");
      const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff > 0 && diff <= 30 && t.status === "Active";
    }).length;

    return [
      {
        id: "passes",
        icon: CreditCard,
        title: "Expiring Dive Passes",
        count: expiringPasses,
        color: "text-warning",
        bgColor: "bg-warning/10",
        borderColor: "border-warning/30",
        section: "dive-pass",
        tab: "overview",
      },
    ].filter((item) => item.count > 0);
  }, [tourists]);

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
              })
            }
            className={`flex items-center gap-3 rounded-xl border ${item.borderColor} ${item.bgColor} px-4 py-3 min-w-[200px] hover:shadow-md transition-all group text-left shrink-0`}
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
