import { useState, useMemo, useEffect } from "react";
import {
  Timer,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  User,
  Waves,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/dialog";
import {
  SectionCard,
  StatusBadge,
  Field,
  ActiveFilterBadges,
  Reveal,
  EntityLink,
} from "@/components/shared";
import { useFilters } from "@/routes/index";

type LiveDive = {
  id: string;
  touristId: string;
  touristName: string;
  siteName: string;
  operatorName: string;
  scheduledStart: string;
  actualStart?: string;
  end?: string;
  status: "Scheduled" | "Active" | "Completed" | "Overdue";
  divers: number;
  depth: string;
  notes: string;
};

const LIVE_DIVE_DATA: LiveDive[] = [
  {
    id: "LD-001",
    touristId: "TR-10241",
    touristName: "Emma Larsen",
    siteName: "Blue Hole",
    operatorName: "Deep Blue Charters",
    scheduledStart: "2026-07-25 08:00",
    actualStart: "2026-07-25 08:05",
    status: "Active",
    divers: 8,
    depth: "12–40 m",
    notes: "Advanced group, expect thresher sharks",
  },
  {
    id: "LD-002",
    touristId: "TR-10242",
    touristName: "Kenji Watanabe",
    siteName: "Coral Gardens",
    operatorName: "Reef Riders Co.",
    scheduledStart: "2026-07-25 09:30",
    actualStart: "2026-07-25 09:32",
    status: "Active",
    divers: 6,
    depth: "5–25 m",
    notes: "Beginner-friendly session",
  },
  {
    id: "LD-003",
    touristId: "TR-10244",
    touristName: "Liam O'Connor",
    siteName: "Shark Point",
    operatorName: "Coral Coast Divers",
    scheduledStart: "2026-07-25 07:00",
    actualStart: "2026-07-25 07:02",
    end: "2026-07-25 09:15",
    status: "Completed",
    divers: 10,
    depth: "18–35 m",
    notes: "Whitetip sightings confirmed",
  },
  {
    id: "LD-004",
    touristId: "TR-10246",
    touristName: "Diego Alvarez",
    siteName: "Manta Reef",
    operatorName: "Manta Expeditions",
    scheduledStart: "2026-07-25 10:00",
    status: "Scheduled",
    divers: 12,
    depth: "15–30 m",
    notes: "Seasonal manta cleaning station",
  },
  {
    id: "LD-005",
    touristId: "TR-10248",
    touristName: "James Whitfield",
    siteName: "Turtle Bay",
    operatorName: "Turtle Bay Dive Shop",
    scheduledStart: "2026-07-25 06:30",
    actualStart: "2026-07-25 06:35",
    end: "2026-07-25 08:45",
    status: "Completed",
    divers: 5,
    depth: "8–18 m",
    notes: "Turtle nesting season observation",
  },
  {
    id: "LD-006",
    touristId: "TR-10250",
    touristName: "Olivia Chen",
    siteName: "Loyzaga Wreck",
    operatorName: "Deep Blue Charters",
    scheduledStart: "2026-07-25 13:00",
    status: "Scheduled",
    divers: 7,
    depth: "22–38 m",
    notes: "Wreck penetration for advanced divers",
  },
  {
    id: "LD-007",
    touristId: "TR-10251",
    touristName: "Marco Rossi",
    siteName: "Sombrero Island Wall",
    operatorName: "Bluefin Divers",
    scheduledStart: "2026-07-24 08:00",
    actualStart: "2026-07-24 08:10",
    status: "Overdue",
    divers: 9,
    depth: "10–45 m",
    notes: "Wall dive — check comms",
  },
  {
    id: "LD-008",
    touristId: "TR-10253",
    touristName: "Carlos Mendoza",
    siteName: "Sepoc Point",
    operatorName: "Aqua Ventures PH",
    scheduledStart: "2026-07-25 14:00",
    status: "Scheduled",
    divers: 11,
    depth: "5–20 m",
    notes: "Night dive preparation",
  },
  {
    id: "LD-009",
    touristId: "TR-10254",
    touristName: "Hannah Baker",
    siteName: "Twin Rocks",
    operatorName: "Reef Riders Co.",
    scheduledStart: "2026-07-24 10:00",
    actualStart: "2026-07-24 10:05",
    end: "2026-07-24 12:20",
    status: "Completed",
    divers: 6,
    depth: "12–28 m",
    notes: "Strong current managed",
  },
  {
    id: "LD-010",
    touristId: "TR-10257",
    touristName: "Takashi Yamamoto",
    siteName: "Blue Hole",
    operatorName: "Coral Coast Divers",
    scheduledStart: "2026-07-25 11:00",
    status: "Scheduled",
    divers: 8,
    depth: "12–40 m",
    notes: "Deep dive specialty course",
  },
  {
    id: "LD-011",
    touristId: "TR-10258",
    touristName: "Maria Santos",
    siteName: "Coral Gardens",
    operatorName: "Turtle Bay Dive Shop",
    scheduledStart: "2026-07-25 15:00",
    status: "Scheduled",
    divers: 4,
    depth: "5–25 m",
    notes: "Photography workshop dive",
  },
  {
    id: "LD-012",
    touristId: "TR-10260",
    touristName: "Nadia Al-Rashid",
    siteName: "Shark Point",
    operatorName: "Deep Blue Charters",
    scheduledStart: "2026-07-24 07:30",
    actualStart: "2026-07-24 07:35",
    end: "2026-07-24 09:50",
    status: "Completed",
    divers: 10,
    depth: "18–35 m",
    notes: "Jack schools active",
  },
  {
    id: "LD-013",
    touristId: "TR-10263",
    touristName: "Tom Richards",
    siteName: "Manta Reef",
    operatorName: "Manta Expeditions",
    scheduledStart: "2026-07-25 16:00",
    status: "Scheduled",
    divers: 8,
    depth: "15–30 m",
    notes: "Afternoon manta session",
  },
  {
    id: "LD-014",
    touristId: "TR-10264",
    touristName: "Haruto Suzuki",
    siteName: "Turtle Bay",
    operatorName: "Aqua Ventures PH",
    scheduledStart: "2026-07-24 09:00",
    actualStart: "2026-07-24 09:02",
    end: "2026-07-24 11:10",
    status: "Completed",
    divers: 6,
    depth: "8–18 m",
    notes: "Hawksbill turtle count",
  },
  {
    id: "LD-015",
    touristId: "TR-10266",
    touristName: "Viktor Petrov",
    siteName: "Maricaban Wreck",
    operatorName: "Bluefin Divers",
    scheduledStart: "2026-07-25 09:00",
    status: "Scheduled",
    divers: 4,
    depth: "30–50 m",
    notes: "Technical dive — trimix required",
  },
  {
    id: "LD-016",
    touristId: "TR-10268",
    touristName: "Owen Davies",
    siteName: "Sepoc Point",
    operatorName: "Reef Riders Co.",
    scheduledStart: "2026-07-24 14:00",
    actualStart: "2026-07-24 14:08",
    status: "Overdue",
    divers: 7,
    depth: "5–20 m",
    notes: "Night dive — overdue return",
  },
  {
    id: "LD-017",
    touristId: "TR-10270",
    touristName: "David Kim",
    siteName: "Blue Hole",
    operatorName: "Deep Blue Charters",
    scheduledStart: "2026-07-24 11:30",
    actualStart: "2026-07-24 11:32",
    end: "2026-07-24 13:45",
    status: "Completed",
    divers: 8,
    depth: "12–40 m",
    notes: "Thresher shark spotted",
  },
  {
    id: "LD-018",
    touristId: "TR-10247",
    touristName: "Sophie Müller",
    siteName: "Twin Rocks",
    operatorName: "Coral Coast Divers",
    scheduledStart: "2026-07-25 07:30",
    status: "Scheduled",
    divers: 6,
    depth: "12–28 m",
    notes: "Current-dependent dive",
  },
  {
    id: "LD-019",
    touristId: "TR-10255",
    touristName: "Raj Patel",
    siteName: "Sombrero Island Wall",
    operatorName: "Manta Expeditions",
    scheduledStart: "2026-07-25 12:00",
    status: "Scheduled",
    divers: 9,
    depth: "10–45 m",
    notes: "Nudibranch photography focus",
  },
  {
    id: "LD-020",
    touristId: "TR-10259",
    touristName: "Patrick Kelly",
    siteName: "Loyzaga Wreck",
    operatorName: "Turtle Bay Dive Shop",
    scheduledStart: "2026-07-24 08:30",
    actualStart: "2026-07-24 08:35",
    end: "2026-07-24 10:50",
    status: "Completed",
    divers: 7,
    depth: "22–38 m",
    notes: "Lionfish colony documented",
  },
];

const STATUS_ICON: Record<string, any> = {
  Active: Timer,
  Scheduled: Clock,
  Completed: CheckCircle2,
  Overdue: AlertTriangle,
};

const STATUS_COLOR: Record<string, string> = {
  Active: "text-info",
  Scheduled: "text-muted-foreground",
  Completed: "text-success",
  Overdue: "text-destructive",
};

// Expected dive duration in minutes by depth range
const EXPECTED_DURATION_MINUTES: Record<string, number> = {
  "5–20 m": 60,
  "5–25 m": 60,
  "8–18 m": 60,
  "10–45 m": 90,
  "12–28 m": 75,
  "12–40 m": 90,
  "15–30 m": 75,
  "18–35 m": 90,
  "22–38 m": 90,
  "30–50 m": 60,
};

function SurfaceCountdown({
  actualStart,
  depth,
  status,
}: {
  actualStart: string;
  depth: string;
  status: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const startMs = new Date(actualStart.replace(" ", "T") + ":00").getTime();
  const elapsed = now - startMs;
  const expectedMs = (EXPECTED_DURATION_MINUTES[depth] || 75) * 60 * 1000;
  const remaining = expectedMs - elapsed;

  const isOverdue = remaining < 0;
  const absRemaining = Math.abs(remaining);
  const h = String(Math.floor(absRemaining / 3600000)).padStart(2, "0");
  const m = String(Math.floor((absRemaining % 3600000) / 60000)).padStart(
    2,
    "0",
  );
  const s = String(Math.floor((absRemaining % 60000) / 1000)).padStart(2, "0");

  const urgent = !isOverdue && remaining < 10 * 60 * 1000;

  if (status !== "Active") return null;

  return (
    <div
      className={`font-mono text-xs font-medium px-2 py-1 rounded ${
        isOverdue
          ? "bg-destructive/10 text-destructive"
          : urgent
            ? "bg-destructive/5 text-destructive"
            : "bg-info/10 text-info"
      }`}
    >
      {isOverdue ? `OVERDUE +${h}:${m}:${s}` : `${h}:${m}:${s} left`}
      {urgent && !isOverdue && <span className="ml-1 animate-pulse">!</span>}
    </div>
  );
}

export function LiveDiveActivity() {
  const { setFilters } = useFilters();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedSite, setSelectedSite] = useState("All");
  const [detail, setDetail] = useState<LiveDive | null>(null);

  const filtered = useMemo(() => {
    return LIVE_DIVE_DATA.filter((d) => {
      if (tab !== "all" && d.status !== tab) return false;
      if (
        search &&
        !d.touristName.toLowerCase().includes(search.toLowerCase()) &&
        !d.id.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (selectedSite !== "All" && d.siteName !== selectedSite) return false;
      return true;
    });
  }, [tab, search, selectedSite]);

  const counts = useMemo(
    () => ({
      all: LIVE_DIVE_DATA.length,
      Active: LIVE_DIVE_DATA.filter((d) => d.status === "Active").length,
      Scheduled: LIVE_DIVE_DATA.filter((d) => d.status === "Scheduled").length,
      Completed: LIVE_DIVE_DATA.filter((d) => d.status === "Completed").length,
      Overdue: LIVE_DIVE_DATA.filter((d) => d.status === "Overdue").length,
    }),
    [],
  );

  return (
    <div className="space-y-6">
      {counts.Overdue > 0 && (
        <button
          onClick={() => setTab("Overdue")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors animate-fade-in"
        >
          <AlertCircle className="size-4 shrink-0 animate-pulse" />
          <span>
            {counts.Overdue} dive{counts.Overdue > 1 ? "s" : ""} overdue
          </span>
          <span className="text-destructive/70 font-normal">
            —{" "}
            {LIVE_DIVE_DATA.filter((d) => d.status === "Overdue")
              .map((d) => `${d.siteName} (${d.id})`)
              .join(", ")}
          </span>
        </button>
      )}
      <Reveal>
        <SectionCard
          title="Live Dive Activity"
          action={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="size-2 rounded-full bg-info animate-pulse" />
                {counts.Active} active now
              </div>
            </div>
          }
        >
          <Tabs value={tab} onValueChange={setTab}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <TabsList className="bg-secondary">
                <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
                <TabsTrigger value="Active">
                  Active ({counts.Active})
                </TabsTrigger>
                <TabsTrigger value="Scheduled">
                  Scheduled ({counts.Scheduled})
                </TabsTrigger>
                <TabsTrigger value="Completed">
                  Completed ({counts.Completed})
                </TabsTrigger>
                <TabsTrigger value="Overdue">
                  Overdue ({counts.Overdue})
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search dives…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-[200px] h-8 text-sm"
                />
                <Select value={selectedSite} onValueChange={setSelectedSite}>
                  <SelectTrigger className="w-[160px] h-8 text-sm">
                    <SelectValue placeholder="Site" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Sites</SelectItem>
                    {[
                      "Blue Hole",
                      "Coral Gardens",
                      "Shark Point",
                      "Manta Reef",
                      "Turtle Bay",
                      "Loyzaga Wreck",
                      "Sombrero Island Wall",
                      "Sepoc Point",
                      "Twin Rocks",
                      "Maricaban Wreck",
                    ].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dive ID</TableHead>
                    <TableHead>Tourist</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Divers</TableHead>
                    <TableHead>Depth</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Timer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((dive) => {
                    const StatusIcon = STATUS_ICON[dive.status];
                    const statusColor = STATUS_COLOR[dive.status];
                    return (
                      <TableRow
                        key={dive.id}
                        className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                          dive.status === "Overdue"
                            ? "bg-destructive/5"
                            : ""
                        }`}
                        onClick={() => setDetail(dive)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`size-4 ${statusColor}`} />
                            <span className="font-mono text-sm font-medium">
                              {dive.id}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <User className="size-3 text-muted-foreground" />
                            <span className="font-medium text-sm">
                              {dive.touristName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <EntityLink
                            onClick={() =>
                              setFilters({
                                section: "dive-ops",
                                tab: "sites",
                                q: dive.siteName,
                              })
                            }
                          >
                            {dive.siteName}
                          </EntityLink>
                        </TableCell>
                        <TableCell>
                          <EntityLink
                            onClick={() =>
                              setFilters({
                                section: "establishments",
                                tab: "registered",
                                q: dive.operatorName,
                              })
                            }
                          >
                            {dive.operatorName}
                          </EntityLink>
                        </TableCell>
                        <TableCell className="text-center">
                          {dive.divers}
                        </TableCell>
                        <TableCell>{dive.depth}</TableCell>
                        <TableCell>{dive.scheduledStart.split(" ")[1]}</TableCell>
                        <TableCell>
                          <StatusBadge status={dive.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {dive.actualStart && dive.status === "Active" ? (
                            <SurfaceCountdown
                              actualStart={dive.actualStart}
                              depth={dive.depth}
                              status={dive.status}
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No dives match your filters.
              </div>
            )}
          </Tabs>
        </SectionCard>
      </Reveal>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Dive {detail?.id}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <StatusBadge status={detail.status} />
                <span className="text-sm text-muted-foreground">
                  Scheduled {detail.scheduledStart}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tourist" value={detail.touristName} />
                <Field label="Site" value={detail.siteName} />
                <Field label="Operator" value={detail.operatorName} />
                <Field label="Depth" value={detail.depth} />
                <Field label="Divers" value={String(detail.divers)} />
                <Field label="Tourist ID" value={detail.touristId} />
              </div>
              {detail.actualStart && (
                <Field label="Actual Start" value={detail.actualStart} />
              )}
              {detail.end && <Field label="End Time" value={detail.end} />}
              <Field label="Notes" value={detail.notes} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
