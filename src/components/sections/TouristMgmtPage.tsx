import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Check,
  RotateCcw,
  Download,
  Search,
  Sparkles,
  Clock,
  Send,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  SlidersHorizontal,
  X,
  ChevronRight,
  ShieldAlert,
  AlertCircle,
  Ban,
  ShieldCheck,
  Shield,
  Loader2,
  CalendarIcon,
  FileDown,
  UserCheck,
  Waves,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Pagination, usePagination } from "@/components/ui/pagination";
import {
  StatCard,
  SectionCard,
  DataSourceBadge,
  useMounted,
  Field,
  ActiveFilterBadges,
  TableSkeletonRows,
  StatusBadge,
  DrilldownDialog,
} from "@/components/shared";
import { useFilters } from "@/hooks/useFilters";
import { usePermission } from "@/hooks/usePermission";
import { useGlobalDateRange } from "@/hooks/useGlobalDateRange";
import { pushAuditLog } from "@/lib/audit";
import { requireLiveSession, type StaffSession } from "@/lib/staff-auth";
import { displayNationality } from "@/lib/metrics";
import {
  useLiveMode,
  useTouristsLive,
  useInvalidateLive,
  useLiveList,
  setTouristStatus,
  renewTourist,
  dbErrorMessage,
} from "@/lib/queries";
import {
  tourists,
  ALL_NATIONALITIES,
  ALL_LEVELS,
} from "@/lib/mock-data";

export function TouristMgmtPage({ session }: { session?: StaffSession | null }) {
  const { search, setFilters, resetFilters } = useFilters();
  const { inRange } = useGlobalDateRange();
  const { canAct, deny } = usePermission();
  const [mockTourists, setMockTourists] = useState(tourists);
  // Live mode (Supabase configured): the registry comes from tourists;
  // mocks are the offline fallback. Register stays mock-only (creating
  // auth.users rows needs a server function — impossible client-side).
  const isLive = useLiveMode();
  const liveTourists = useTouristsLive();
  const invalidateTourists = useInvalidateLive();
  const isLiveData = isLive && !!liveTourists.data;
  const touristsSource = useLiveList(isLive, liveTourists, mockTourists);
  const touristList = touristsSource.rows;
  // Hide the signed-in staffer's own tourists row: Sinsay auto-creates a
  // tourists profile for every auth user, including staff logins. Server-side
  // exclusion can't do better (to_staff RLS is own-row-only), so filter the
  // session UID client-side. Mock rows carry no _dbId — demo mode untouched.
  const visibleTourists = useMemo(
    () =>
      session?.userId
        ? touristList.filter((t) => (t as any)._dbId !== session.userId)
        : touristList,
    [touristList, session?.userId],
  );
  useEffect(() => {
    if (liveTourists.isError) {
      toast.error("Could not load live tourists", {
        description: "Showing demo data. Check the Supabase connection.",
      });
    }
  }, [liveTourists.isError]);
  const [viewing, setViewing] = useState<any>(null);
  const [rowBusy, setRowBusy] = useState<"suspend" | "renew" | null>(null);
  const [touristDrilldown, setTouristDrilldown] = useState<any>(null);

  const touristDiveHistory: Record<
    string,
    {
      date: string;
      site: string;
      depth: string;
      divemaster: string;
      operator: string;
    }[]
  > = {
    "TR-10241": [
      {
        date: "2026-07-20",
        site: "Blue Hole",
        depth: "32 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-22",
        site: "Coral Gardens",
        depth: "18 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-25",
        site: "Manta Reef",
        depth: "28 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-01",
        site: "Turtle Bay",
        depth: "12 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-05",
        site: "Shark Point",
        depth: "30 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-10",
        site: "Loyzaga Wreck",
        depth: "35 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-14",
        site: "Blue Hole",
        depth: "38 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
    ],
    "TR-10242": [
      {
        date: "2026-06-30",
        site: "Shark Point",
        depth: "33 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-05",
        site: "Manta Reef",
        depth: "27 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-12",
        site: "Blue Hole",
        depth: "40 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-18",
        site: "Loyzaga Wreck",
        depth: "36 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-24",
        site: "Coral Gardens",
        depth: "20 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-02",
        site: "Shark Point",
        depth: "34 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-08",
        site: "Manta Reef",
        depth: "29 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-12",
        site: "Blue Hole",
        depth: "39 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
    ],
    "TR-10243": [
      {
        date: "2026-06-18",
        site: "Coral Gardens",
        depth: "15 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-06-20",
        site: "Turtle Bay",
        depth: "10 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-06-22",
        site: "Coral Gardens",
        depth: "18 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
    ],
    "TR-10244": [
      {
        date: "2026-07-08",
        site: "Shark Point",
        depth: "30 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-14",
        site: "Manta Reef",
        depth: "26 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-20",
        site: "Blue Hole",
        depth: "37 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-28",
        site: "Loyzaga Wreck",
        depth: "34 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-04",
        site: "Turtle Bay",
        depth: "14 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-11",
        site: "Shark Point",
        depth: "32 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
    ],
    "TR-10245": [
      {
        date: "2026-06-25",
        site: "Coral Gardens",
        depth: "16 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-02",
        site: "Turtle Bay",
        depth: "12 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-10",
        site: "Manta Reef",
        depth: "24 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-18",
        site: "Coral Gardens",
        depth: "19 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
    ],
    "TR-10246": [
      {
        date: "2026-07-20",
        site: "Blue Hole",
        depth: "40 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-25",
        site: "Shark Point",
        depth: "35 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-30",
        site: "Manta Reef",
        depth: "30 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-03",
        site: "Loyzaga Wreck",
        depth: "38 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-08",
        site: "Coral Gardens",
        depth: "22 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-13",
        site: "Blue Hole",
        depth: "40 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
    ],
    "TR-10247": [
      {
        date: "2026-06-10",
        site: "Turtle Bay",
        depth: "14 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-06-18",
        site: "Coral Gardens",
        depth: "20 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-06-26",
        site: "Manta Reef",
        depth: "28 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-04",
        site: "Blue Hole",
        depth: "36 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-15",
        site: "Shark Point",
        depth: "31 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-01",
        site: "Turtle Bay",
        depth: "12 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
    ],
    "TR-10248": [
      {
        date: "2026-07-26",
        site: "Coral Gardens",
        depth: "12 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-30",
        site: "Turtle Bay",
        depth: "10 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-04",
        site: "Coral Gardens",
        depth: "16 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-10",
        site: "Turtle Bay",
        depth: "14 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
    ],
    "TR-10249": [
      {
        date: "2026-06-14",
        site: "Manta Reef",
        depth: "28 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-06-18",
        site: "Blue Hole",
        depth: "34 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-06-22",
        site: "Shark Point",
        depth: "30 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-06-28",
        site: "Loyzaga Wreck",
        depth: "32 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
    ],
    "TR-10250": [
      {
        date: "2026-07-12",
        site: "Blue Hole",
        depth: "30 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-18",
        site: "Coral Gardens",
        depth: "22 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-25",
        site: "Turtle Bay",
        depth: "14 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-02",
        site: "Manta Reef",
        depth: "26 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-09",
        site: "Shark Point",
        depth: "32 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
    ],
    "TR-10251": [
      {
        date: "2026-06-28",
        site: "Blue Hole",
        depth: "40 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-04",
        site: "Shark Point",
        depth: "35 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-10",
        site: "Loyzaga Wreck",
        depth: "38 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-18",
        site: "Manta Reef",
        depth: "30 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-26",
        site: "Coral Gardens",
        depth: "20 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-03",
        site: "Blue Hole",
        depth: "39 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-10",
        site: "Shark Point",
        depth: "33 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-15",
        site: "Loyzaga Wreck",
        depth: "36 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
    ],
    "TR-10252": [
      {
        date: "2026-07-05",
        site: "Coral Gardens",
        depth: "14 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-12",
        site: "Turtle Bay",
        depth: "10 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
    ],
    "TR-10253": [
      {
        date: "2026-07-04",
        site: "Shark Point",
        depth: "34 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-12",
        site: "Manta Reef",
        depth: "28 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-20",
        site: "Blue Hole",
        depth: "38 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-28",
        site: "Loyzaga Wreck",
        depth: "35 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-05",
        site: "Coral Gardens",
        depth: "20 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
    ],
    "TR-10254": [
      {
        date: "2026-07-18",
        site: "Blue Hole",
        depth: "30 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-24",
        site: "Coral Gardens",
        depth: "18 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-01",
        site: "Turtle Bay",
        depth: "12 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-08",
        site: "Manta Reef",
        depth: "26 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
    ],
    "TR-10255": [
      {
        date: "2026-06-22",
        site: "Coral Gardens",
        depth: "12 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-06-28",
        site: "Turtle Bay",
        depth: "8 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-06",
        site: "Coral Gardens",
        depth: "16 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-15",
        site: "Turtle Bay",
        depth: "12 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-02",
        site: "Coral Gardens",
        depth: "18 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
    ],
    "TR-10256": [
      {
        date: "2026-07-24",
        site: "Manta Reef",
        depth: "28 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-30",
        site: "Shark Point",
        depth: "32 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-06",
        site: "Blue Hole",
        depth: "36 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-12",
        site: "Loyzaga Wreck",
        depth: "34 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
    ],
    "TR-10257": [
      {
        date: "2026-06-26",
        site: "Blue Hole",
        depth: "35 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-03",
        site: "Coral Gardens",
        depth: "20 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-10",
        site: "Manta Reef",
        depth: "28 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-18",
        site: "Shark Point",
        depth: "30 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-28",
        site: "Loyzaga Wreck",
        depth: "33 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-06",
        site: "Blue Hole",
        depth: "38 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-14",
        site: "Turtle Bay",
        depth: "14 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
    ],
    "TR-10258": [
      {
        date: "2026-07-08",
        site: "Blue Hole",
        depth: "40 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-14",
        site: "Shark Point",
        depth: "35 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-22",
        site: "Loyzaga Wreck",
        depth: "38 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-30",
        site: "Manta Reef",
        depth: "30 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-07",
        site: "Coral Gardens",
        depth: "22 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-14",
        site: "Blue Hole",
        depth: "40 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
    ],
    "TR-10259": [
      {
        date: "2026-06-14",
        site: "Coral Gardens",
        depth: "10 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-06-20",
        site: "Turtle Bay",
        depth: "8 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-06-28",
        site: "Coral Gardens",
        depth: "14 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
    ],
    "TR-10260": [
      {
        date: "2026-07-16",
        site: "Shark Point",
        depth: "32 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-22",
        site: "Blue Hole",
        depth: "36 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-28",
        site: "Manta Reef",
        depth: "28 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-04",
        site: "Coral Gardens",
        depth: "20 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-11",
        site: "Turtle Bay",
        depth: "14 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
    ],
  };

  const filtered = useMemo(() => {
    return visibleTourists.filter((t) => {
      if (search.status !== "All" && t.status !== search.status) return false;
      if (
        search.nationality !== "All" &&
        String(t.nationality ?? "").toLowerCase() !==
          search.nationality.toLowerCase()
      )
        return false;
      if (search.level !== "All" && t.level !== search.level) return false;
      // Unknown dates stay visible under every range filter.
      if (!inRange(t.registered)) return false;
      if (search.q) {
        const q = search.q.toLowerCase();
        if (
          !t.name.toLowerCase().includes(q) &&
          !t.id.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [
    visibleTourists,
    search.q,
    search.status,
    search.nationality,
    search.level,
    inRange,
  ]);

  // Filter options follow the visible rows: live distinct values when live,
  // mock constants otherwise (certification_level values are data-driven).
  // Derived from visibleTourists so the hidden staff row can't pollute them.
  const nationalityOptions = useMemo(
    () =>
      isLiveData
        ? [
            ...new Set(
              visibleTourists
                .map((t) => t.nationality)
                .filter((n): n is string => !!n),
            ),
          ].sort()
        : ALL_NATIONALITIES,
    [isLiveData, visibleTourists],
  );
  const levelOptions = useMemo(
    () =>
      isLiveData
        ? [
            ...new Set(
              visibleTourists
                .map((t) => t.level)
                .filter((l): l is string => !!l),
            ),
          ].sort()
        : ALL_LEVELS,
    [isLiveData, visibleTourists],
  );

  const {
    page: tPage,
    setPage: tSetPage,
    totalPages: tTotalPages,
    paged: tPaged,
  } = usePagination(filtered, 10);

  const activeFilters: { key: string; label: string }[] = [];
  if (search.status !== "All")
    activeFilters.push({ key: "status", label: `Status: ${search.status}` });
  if (search.nationality !== "All")
    activeFilters.push({
      key: "nationality",
      label: `Nationality: ${displayNationality(search.nationality)}`,
    });
  if (search.level !== "All")
    activeFilters.push({ key: "level", label: `Level: ${search.level}` });
  if (search.q)
    activeFilters.push({ key: "q", label: `Search: "${search.q}"` });

  const handleRemoveFilter = (key: string) => {
    if (key === "q") setFilters({ q: "" });
    else if (key === "status") setFilters({ status: "All" });
    else if (key === "nationality") setFilters({ nationality: "All" });
    else if (key === "level") setFilters({ level: "All" });
  };

  const suspendViewing = async () => {
    if (!viewing) return;
    if (!canAct) return deny();
    if (isLive && !(await requireLiveSession())) return;
    if (!!session?.userId && (viewing as any)._dbId === session.userId) {
      toast.error("Action not allowed", {
        description: "This is your own staff account.",
      });
      return;
    }
    const dbId = (viewing as any)._dbId as string | undefined;
    const toSuspended = viewing.status !== "Suspended";
    const nextStatus = toSuspended ? "Suspended" : "Active";
    // Live mode: persist to tourists (031 status + staff UPDATE).
    if (isLive && dbId) {
      setRowBusy("suspend");
      try {
        await setTouristStatus(dbId, toSuspended ? "suspended" : "active");
        invalidateTourists();
        setViewing({ ...viewing, status: nextStatus });
        pushAuditLog(
          `${toSuspended ? "Suspended" : "Reactivated"} tourist ${viewing.id}`,
        );
        toast.success(
          toSuspended ? "Tourist suspended" : "Tourist reactivated",
          { description: `${viewing.name} (${viewing.id})` },
        );
      } catch (e) {
        toast.error("Could not update tourist", {
          description: dbErrorMessage(e),
        });
      } finally {
        setRowBusy(null);
      }
      return;
    }
    setMockTourists((prev) =>
      prev.map((t) => (t.id === viewing.id ? { ...t, status: nextStatus } : t)),
    );
    setViewing({ ...viewing, status: nextStatus });
    pushAuditLog(
      `${toSuspended ? "Suspended" : "Reactivated"} tourist ${viewing.id}`,
    );
    toast.success(toSuspended ? "Tourist suspended" : "Tourist reactivated", {
      description: `${viewing.name} (${viewing.id})`,
    });
  };

  const renewViewing = async () => {
    if (!viewing) return;
    if (!canAct) return deny();
    if (isLive && !(await requireLiveSession())) return;
    if (!!session?.userId && (viewing as any)._dbId === session.userId) {
      toast.error("Action not allowed", {
        description: "This is your own staff account.",
      });
      return;
    }
    const dbId = (viewing as any)._dbId as string | undefined;
    // Live mode: extend renewal_date by one year from today.
    if (isLive && dbId) {
      setRowBusy("renew");
      try {
        const renewalDate = await renewTourist(dbId);
        invalidateTourists();
        setViewing({ ...viewing, expires: renewalDate, status: "Active" });
        pushAuditLog(
          `Renewed tourist ${viewing.id} — extends to ${renewalDate}`,
        );
        toast.success("Tourist ID renewed", {
          description: `${viewing.name} (${viewing.id}) — valid to ${renewalDate}`,
        });
      } catch (e) {
        toast.error("Could not renew tourist", {
          description: dbErrorMessage(e),
        });
      } finally {
        setRowBusy(null);
      }
      return;
    }
    const next = new Date();
    next.setFullYear(next.getFullYear() + 1);
    const renewalDate = next.toISOString().slice(0, 10);
    setMockTourists((prev) =>
      prev.map((t) =>
        t.id === viewing.id
          ? { ...t, expires: renewalDate, status: "Active" }
          : t,
      ),
    );
    setViewing({ ...viewing, expires: renewalDate, status: "Active" });
    pushAuditLog(`Renewed tourist ${viewing.id} — extends to ${renewalDate}`);
    toast.success("Tourist ID renewed", {
      description: `${viewing.name} (${viewing.id}) — valid to ${renewalDate}`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <DataSourceBadge
            live={isLive}
            isError={liveTourists.isError}
            isLoading={touristsSource.isLoading}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID…"
              value={search.q}
              onChange={(e) => setFilters({ q: e.target.value })}
              className="pl-9"
            />
          </div>
          <Select
            value={search.status}
            onValueChange={(v) => setFilters({ status: v })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {["All", "Active", "Expired", "Suspended"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={search.nationality}
            onValueChange={(v) => setFilters({ nationality: v })}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Nationality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All nationalities</SelectItem>
              {nationalityOptions.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={search.level}
            onValueChange={(v) => setFilters({ level: v })}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Dive Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All levels</SelectItem>
              {levelOptions.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground"
            >
              <X className="size-3.5 mr-1" /> Clear all
            </Button>
          )}
        </div>
        <ActiveFilterBadges
          filters={activeFilters}
          onRemove={handleRemoveFilter}
        />
      </div>

      <div className="text-xs text-muted-foreground">
        {touristsSource.isLoading
          ? "Loading tourists…"
          : `${filtered.length} of ${visibleTourists.length} tourist${
              visibleTourists.length !== 1 ? "s" : ""
            }`}
      </div>

      <Card className="shadow-elegant overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead>Tourist ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Nationality</TableHead>
              <TableHead>Dive Level</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {touristsSource.isLoading ? (
              <TableSkeletonRows rows={6} cols={7} />
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No tourists match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              tPaged.map((t) => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setTouristDrilldown(t)}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {t.id}
                  </TableCell>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.nationality ?? "—"}</TableCell>
                  <TableCell>{t.level ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.registered}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.expires}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={t.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewing(t);
                      }}
                    >
                      <Eye className="size-4 mr-1" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Pagination
          page={tPage}
          totalPages={tTotalPages}
          onPageChange={tSetPage}
          className="mt-4"
        />
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tourist Profile</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="size-14">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {viewing.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-display text-lg font-semibold">
                    {viewing.name}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {viewing.id}
                  </div>
                </div>
                <StatusBadge status={viewing.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Nationality" value={viewing.nationality ?? "—"} />
                <Field label="Dive Level" value={viewing.level ?? "—"} />
                <Field label="Registered" value={viewing.registered} />
                <Field label="ID Expires" value={viewing.expires} />
                <Field label="Total Dives" value="47" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={
                    rowBusy !== null ||
                    (!!session?.userId &&
                      (viewing as any)._dbId === session.userId)
                  }
                  title={
                    !!session?.userId &&
                    (viewing as any)._dbId === session.userId
                      ? "This is your own staff account — status writes don't apply"
                      : undefined
                  }
                  onClick={suspendViewing}
                >
                  {rowBusy === "suspend" ? (
                    <Loader2 className="size-4 mr-1 animate-spin" />
                  ) : null}
                  {viewing.status === "Suspended" ? "Reactivate" : "Suspend"}
                </Button>
                <Button
                  className="flex-1 gradient-primary text-primary-foreground"
                  disabled={
                    rowBusy !== null ||
                    (!!session?.userId &&
                      (viewing as any)._dbId === session.userId)
                  }
                  title={
                    !!session?.userId &&
                    (viewing as any)._dbId === session.userId
                      ? "This is your own staff account — renewal doesn't apply"
                      : undefined
                  }
                  onClick={renewViewing}
                >
                  {rowBusy === "renew" ? (
                    <Loader2 className="size-4 mr-1 animate-spin" />
                  ) : null}
                  Renew ID
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DrilldownDialog
        open={!!touristDrilldown}
        onOpenChange={(o) => !o && setTouristDrilldown(null)}
        title={`${touristDrilldown?.name ?? ""} — Dive History`}
        subtitle={`${touristDrilldown?.nationality ?? "—"} · ${touristDrilldown?.level ?? "—"}`}
        stats={
          touristDrilldown
            ? [
                {
                  label: "Total Dives",
                  value: touristDiveHistory[touristDrilldown.id]?.length ?? 0,
                  icon: Waves,
                },
                {
                  label: "Tourist ID",
                  value: touristDrilldown.id,
                  icon: Users,
                },
                {
                  label: "Status",
                  value: touristDrilldown.status,
                  icon: ShieldCheck,
                },
              ]
            : undefined
        }
      >
        {touristDrilldown && (
          <Card className="shadow-elegant overflow-hidden mt-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Depth</TableHead>
                  <TableHead>Divemaster</TableHead>
                  <TableHead>Operator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(touristDiveHistory[touristDrilldown.id] ?? []).length ===
                0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No dive history recorded for this tourist.
                    </TableCell>
                  </TableRow>
                ) : (
                  (touristDiveHistory[touristDrilldown.id] ?? []).map(
                    (dive, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">
                          {dive.date}
                        </TableCell>
                        <TableCell className="font-medium">
                          {dive.site}
                        </TableCell>
                        <TableCell>{dive.depth}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {dive.divemaster}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {dive.operator}
                        </TableCell>
                      </TableRow>
                    ),
                  )
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </DrilldownDialog>
    </div>
  );
}


