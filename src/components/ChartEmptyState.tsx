import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A chart is empty when there are no rows, or when every numeric field in
 * every row is zero/NaN. Zero-filled series otherwise render as a blank plot
 * with axes, which reads as a broken chart rather than "no activity yet".
 */
export function isEmptyChartData(data: unknown): boolean {
  if (!Array.isArray(data) || data.length === 0) return true;
  return !data.some((row) => {
    if (typeof row === "number") return Number.isFinite(row) && row !== 0;
    if (!row || typeof row !== "object") return false;
    return Object.values(row as Record<string, unknown>).some(
      (v) => typeof v === "number" && Number.isFinite(v) && v !== 0,
    );
  });
}

export function ChartEmptyState({
  className,
  message = "Not enough data to display",
}: {
  className?: string;
  message?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 text-center",
        className,
      )}
    >
      <BarChart3 className="size-5 text-muted-foreground/70" aria-hidden />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
