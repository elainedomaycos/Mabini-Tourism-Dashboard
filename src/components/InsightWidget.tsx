import { Sparkles, TrendingUp, Info } from "lucide-react";
import { useFilters } from "@/routes/index";
import { type InsightSeverity, type OverviewInsight } from "@/lib/insights";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const SEVERITY_STYLE: Record<
  InsightSeverity,
  { chip: string; rail: string; Icon: typeof TrendingUp }
> = {
  high: {
    chip: "bg-destructive/15 text-destructive border-destructive/20",
    rail: "bg-destructive",
    Icon: TrendingUp,
  },
  medium: {
    chip: "bg-warning/15 text-warning border-warning/25",
    rail: "bg-warning",
    Icon: TrendingUp,
  },
  low: {
    chip: "bg-primary-soft text-primary border-primary/20",
    rail: "bg-primary",
    Icon: Info,
  },
};

/**
 * Floating insights panel — agent-shaped chrome, strictly one-way content.
 *
 * Takes an ALREADY-BUILT insight so each dashboard surface (Overview, and the
 * analytics tabs) owns its own facts and can pick the builder that matches its
 * data, without this component knowing anything about any of them. It renders,
 * it never computes: no queries, no input, no network call. Because the insight
 * is derived from React Query values by the caller, it re-renders the moment
 * upstream data is invalidated.
 *
 * z-40 keeps it below the z-50 overlay layer, so open dialogs, the ⌘K palette,
 * and toasts stack above it rather than colliding.
 */
export function InsightWidget({
  insight,
  label,
}: {
  insight: OverviewInsight;
  /** Shown as the button tooltip/aria-label; names the current surface. */
  label?: string;
}) {
  const { setFilters } = useFilters();

  const nudgeCount = insight.recommendations.length;
  const highCount = insight.recommendations.filter(
    (r) => r.severity === "high",
  ).length;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            title={label ? `${label} insights` : "Insights"}
            aria-label={[
              label ? `${label} insights` : "Insights",
              nudgeCount > 0
                ? `${nudgeCount} recommendation${nudgeCount === 1 ? "" : "s"}`
                : null,
            ]
              .filter(Boolean)
              .join(", ")}
            className="relative flex size-13 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-glow transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95"
          >
            <Sparkles className="size-6" />
            {nudgeCount > 0 && (
              <span className="absolute -top-1 -right-1 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-sm">
                {nudgeCount > 99 ? "99+" : nudgeCount}
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          side="top"
          sideOffset={12}
          className="w-[min(380px,calc(100vw-2rem))] p-0"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Sparkles className="size-3.5" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-none">
                  {label ? `${label} Insights` : "Insights"}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(insight.generatedAt).toLocaleString("en-PH", {
                    hour: "numeric",
                    minute: "2-digit",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            <p className="px-4 py-3 text-sm leading-relaxed text-foreground/90 border-b border-border/60">
              {insight.description}
            </p>

            {nudgeCount === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-8 text-center text-muted-foreground">
                <div className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success">
                  <TrendingUp className="size-5" />
                </div>
                <span className="text-sm">
                  Nothing needs attention right now.
                </span>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {insight.recommendations.map((r) => {
                  const style = SEVERITY_STYLE[r.severity];
                  const Icon = style.Icon;
                  const clickable = !!r.section;
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        disabled={!clickable}
                        onClick={() => {
                          if (!r.section) return;
                          setFilters({
                            section: r.section as never,
                            q: "",
                            status: "All",
                            nationality: "All",
                            level: "All",
                            site: "All",
                            difficulty: "All",
                            siteType: "All",
                            dateFrom: "",
                            dateTo: "",
                            tab: "",
                          });
                        }}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                          clickable
                            ? "cursor-pointer hover:bg-primary-soft/40"
                            : "cursor-default"
                        }`}
                      >
                        <span
                          className={`mt-1 h-8 w-1 shrink-0 rounded-full ${style.rail}`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">
                              {r.title}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.chip}`}
                            >
                              <Icon className="size-3" />
                              {r.severity}
                            </span>
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {r.detail}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground">
            {highCount > 0
              ? `${highCount} item${highCount === 1 ? "" : "s"} need priority attention.`
              : nudgeCount > 0
                ? "Tap an item to jump to the relevant queue."
                : "Live figures update as data changes."}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
