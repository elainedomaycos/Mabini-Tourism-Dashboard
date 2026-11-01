import { useMemo, useCallback } from "react";
import { useFilters } from "./useFilters";
import { resolveDateRange, todayInManila, clampDateToToday } from "@/lib/period";

export function useGlobalDateRange() {
  const { search, setFilters } = useFilters();
  const range = (search as any).globalDateRange;
  // Anchor to the real calendar month — a hardcoded month silently hides
  // rows registered in any other month under the default 30d range.
  const rangeData = useMemo(
    () =>
      resolveDateRange(
        range,
        (search as any).globalDateFrom,
        (search as any).globalDateTo,
      ),
    [range, (search as any).globalDateFrom, (search as any).globalDateTo],
  );

  const inRange = useCallback(
    (value: string | null | undefined) => {
      const day = String(value ?? "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return true;
      return day >= rangeData.from && day <= rangeData.to;
    },
    [rangeData.from, rangeData.to],
  );

  const setRange = useCallback(
    (r: string, from?: string, to?: string) => {
      setFilters({
        globalDateRange: r,
        globalDateFrom: from ? clampDateToToday(from) : "",
        globalDateTo: to ? clampDateToToday(to) : "",
      });
    },
    [setFilters],
  );

  return {
    range,
    rangeData,
    from: rangeData.from,
    to: rangeData.to,
    today: todayInManila(),
    grain: rangeData.grain,
    label: rangeData.label,
    invalid: rangeData.invalid,
    inRange,
    setRange,
    globalDateFrom: (search as any).globalDateFrom,
    globalDateTo: (search as any).globalDateTo,
  };
}
