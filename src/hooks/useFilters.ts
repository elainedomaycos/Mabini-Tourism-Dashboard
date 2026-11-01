import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";

export function useFilters() {
  const navigate = useNavigate({ from: "/" });
  const search = useSearch({ from: "/" });

  const setFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      navigate({
        search: (prev: any) => ({ ...prev, ...updates }),
        replace: true,
      });
    },
    [navigate],
  );

  const resetFilters = useCallback(() => {
    navigate({
      search: {
        section: (search as any).section,
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
        globalDateRange: "30d",
        globalDateFrom: "",
        globalDateTo: "",
      },
      replace: true,
    });
  }, [navigate, (search as any).section]);

  return { search, setFilters, resetFilters };
}
