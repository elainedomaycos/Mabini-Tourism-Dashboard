import { cn } from "@/lib/utils";

export function isEmptyChartData(data: unknown): boolean {
  return !Array.isArray(data) || data.length === 0;
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
        "flex items-center justify-center text-center text-sm text-muted-foreground px-4",
        className,
      )}
    >
      {message}
    </div>
  );
}
