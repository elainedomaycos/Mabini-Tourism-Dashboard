import type { ReactNode } from "react";
import { AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface AnalyticsQueryState {
  data: unknown;
  isError: boolean;
  isFetching: boolean;
  isPending: boolean;
  refetch: () => unknown;
}

export function AnalyticsSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Loading ${label}`}
      className="space-y-6"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5 shadow-elegant border-border/60">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-32" />
            <Skeleton className="mt-4 h-3 w-20" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="p-5 shadow-elegant border-border/60">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-4 h-64 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}

export function MetricsError({
  label,
  state,
  compact = false,
}: {
  label: string;
  state: AnalyticsQueryState;
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-3 border border-destructive/25 bg-destructive/5 sm:flex-row sm:items-center",
        compact ? "rounded-lg px-4 py-3" : "rounded-xl p-5",
      )}
    >
      <AlertCircle className="size-5 shrink-0 text-destructive" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Could not load {label} metrics.</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {compact
            ? "Showing the last loaded period."
            : "Check the connection and try again."}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0"
        onClick={() => state.refetch()}
        disabled={state.isFetching}
      >
        {state.isFetching ? (
          <Loader2 className="size-3.5 mr-1.5 animate-spin" />
        ) : (
          <RotateCcw className="size-3.5 mr-1.5" />
        )}
        Retry
      </Button>
    </div>
  );
}

export function AnalyticsState({
  isLive,
  label,
  state,
  children,
}: {
  isLive: boolean;
  label: string;
  state: AnalyticsQueryState;
  children: ReactNode;
}) {
  if (!isLive) return <>{children}</>;

  const hasData = state.data !== undefined;
  if (state.isPending && !hasData) {
    return <AnalyticsSkeleton label={label} />;
  }
  if (state.isError && !hasData) {
    return <MetricsError label={label} state={state} />;
  }

  return (
    <>
      {state.isError && <MetricsError label={label} state={state} compact />}
      {children}
    </>
  );
}
