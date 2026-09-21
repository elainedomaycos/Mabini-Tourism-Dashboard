import { useState, useMemo } from "react";
import {
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle2,
  User,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";
import {
  SectionCard,
  StatusBadge,
  Field,
  ActiveFilterBadges,
  StatCard,
  Reveal,
  EntityLink,
} from "@/components/shared";
import { useFilters } from "@/routes/index";

type DivePass = {
  id: string;
  touristId: string;
  touristName: string;
  type: "Day" | "Weekly" | "Monthly" | "Annual";
  creditsPurchased: number;
  creditsUsed: number;
  issuedDate: string;
  expiryDate: string;
  status: "Active" | "Expiring" | "Expired";
};

const TODAY = new Date("2026-08-17");
function daysUntil(dateStr: string) {
  return Math.ceil(
    (new Date(dateStr).getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24),
  );
}
function PassExpiryBadge({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr);
  if (days <= 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">
        <AlertTriangle className="size-3" />
        Expired
      </span>
    );
  if (days <= 14)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 text-warning-foreground border border-warning/30 px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">
        <AlertTriangle className="size-3" />
        {days}d left
      </span>
    );
  return null;
}
function PassExpiryIndicator({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr);
  if (days <= 0)
    return (
      <span className="inline-flex items-center gap-1 text-destructive text-xs font-medium">
        <AlertTriangle className="size-3.5" />
        Expired
      </span>
    );
  if (days <= 14)
    return (
      <span className="inline-flex items-center gap-1 text-warning text-xs font-medium">
        <AlertTriangle className="size-3.5" />
        {days}d remaining
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-success text-xs font-medium">
      <CheckCircle2 className="size-3.5" />
      {days}d remaining
    </span>
  );
}

const DIVE_PASS_DATA: DivePass[] = [
  {
    id: "DP-4001",
    touristId: "TR-10241",
    touristName: "Emma Larsen",
    type: "Monthly",
    creditsPurchased: 20,
    creditsUsed: 14,
    issuedDate: "2026-07-01",
    expiryDate: "2026-07-31",
    status: "Active",
  },
  {
    id: "DP-4002",
    touristId: "TR-10242",
    touristName: "Kenji Watanabe",
    type: "Annual",
    creditsPurchased: 100,
    creditsUsed: 42,
    issuedDate: "2026-06-01",
    expiryDate: "2027-06-01",
    status: "Active",
  },
  {
    id: "DP-4003",
    touristId: "TR-10244",
    touristName: "Liam O'Connor",
    type: "Weekly",
    creditsPurchased: 10,
    creditsUsed: 8,
    issuedDate: "2026-07-21",
    expiryDate: "2026-07-28",
    status: "Expiring",
  },
  {
    id: "DP-4004",
    touristId: "TR-10246",
    touristName: "Diego Alvarez",
    type: "Monthly",
    creditsPurchased: 20,
    creditsUsed: 20,
    issuedDate: "2026-06-25",
    expiryDate: "2026-07-25",
    status: "Expiring",
  },
  {
    id: "DP-4005",
    touristId: "TR-10248",
    touristName: "James Whitfield",
    type: "Day",
    creditsPurchased: 3,
    creditsUsed: 3,
    issuedDate: "2026-07-22",
    expiryDate: "2026-07-22",
    status: "Expired",
  },
  {
    id: "DP-4006",
    touristId: "TR-10250",
    touristName: "Olivia Chen",
    type: "Monthly",
    creditsPurchased: 20,
    creditsUsed: 11,
    issuedDate: "2026-07-10",
    expiryDate: "2026-08-10",
    status: "Active",
  },
  {
    id: "DP-4007",
    touristId: "TR-10251",
    touristName: "Marco Rossi",
    type: "Annual",
    creditsPurchased: 100,
    creditsUsed: 56,
    issuedDate: "2026-05-15",
    expiryDate: "2027-05-15",
    status: "Active",
  },
  {
    id: "DP-4008",
    touristId: "TR-10253",
    touristName: "Carlos Mendoza",
    type: "Weekly",
    creditsPurchased: 10,
    creditsUsed: 4,
    issuedDate: "2026-07-23",
    expiryDate: "2026-07-30",
    status: "Active",
  },
  {
    id: "DP-4009",
    touristId: "TR-10254",
    touristName: "Hannah Baker",
    type: "Monthly",
    creditsPurchased: 20,
    creditsUsed: 16,
    issuedDate: "2026-07-05",
    expiryDate: "2026-08-05",
    status: "Active",
  },
  {
    id: "DP-4010",
    touristId: "TR-10257",
    touristName: "Takashi Yamamoto",
    type: "Day",
    creditsPurchased: 3,
    creditsUsed: 1,
    issuedDate: "2026-07-25",
    expiryDate: "2026-07-25",
    status: "Active",
  },
  {
    id: "DP-4011",
    touristId: "TR-10258",
    touristName: "Maria Santos",
    type: "Annual",
    creditsPurchased: 100,
    creditsUsed: 28,
    issuedDate: "2026-07-01",
    expiryDate: "2027-07-01",
    status: "Active",
  },
  {
    id: "DP-4012",
    touristId: "TR-10260",
    touristName: "Nadia Al-Rashid",
    type: "Monthly",
    creditsPurchased: 20,
    creditsUsed: 19,
    issuedDate: "2026-06-28",
    expiryDate: "2026-07-28",
    status: "Expiring",
  },
  {
    id: "DP-4013",
    touristId: "TR-10263",
    touristName: "Tom Richards",
    type: "Weekly",
    creditsPurchased: 10,
    creditsUsed: 6,
    issuedDate: "2026-07-20",
    expiryDate: "2026-07-27",
    status: "Active",
  },
  {
    id: "DP-4014",
    touristId: "TR-10264",
    touristName: "Haruto Suzuki",
    type: "Day",
    creditsPurchased: 3,
    creditsUsed: 0,
    issuedDate: "2026-07-25",
    expiryDate: "2026-07-25",
    status: "Active",
  },
  {
    id: "DP-4015",
    touristId: "TR-10266",
    touristName: "Viktor Petrov",
    type: "Annual",
    creditsPurchased: 100,
    creditsUsed: 71,
    issuedDate: "2026-04-10",
    expiryDate: "2027-04-10",
    status: "Active",
  },
  {
    id: "DP-4016",
    touristId: "TR-10268",
    touristName: "Owen Davies",
    type: "Monthly",
    creditsPurchased: 20,
    creditsUsed: 13,
    issuedDate: "2026-07-15",
    expiryDate: "2026-08-15",
    status: "Active",
  },
  {
    id: "DP-4017",
    touristId: "TR-10270",
    touristName: "David Kim",
    type: "Weekly",
    creditsPurchased: 10,
    creditsUsed: 9,
    issuedDate: "2026-07-22",
    expiryDate: "2026-07-29",
    status: "Expiring",
  },
  {
    id: "DP-4018",
    touristId: "TR-10247",
    touristName: "Sophie Müller",
    type: "Monthly",
    creditsPurchased: 20,
    creditsUsed: 7,
    issuedDate: "2026-07-12",
    expiryDate: "2026-08-12",
    status: "Active",
  },
  {
    id: "DP-4019",
    touristId: "TR-10255",
    touristName: "Raj Patel",
    type: "Day",
    creditsPurchased: 3,
    creditsUsed: 2,
    issuedDate: "2026-07-24",
    expiryDate: "2026-07-24",
    status: "Expired",
  },
  {
    id: "DP-4020",
    touristId: "TR-10259",
    touristName: "Patrick Kelly",
    type: "Monthly",
    creditsPurchased: 20,
    creditsUsed: 15,
    issuedDate: "2026-07-08",
    expiryDate: "2026-08-08",
    status: "Active",
  },
  {
    id: "DP-4021",
    touristId: "TR-10265",
    touristName: "Isabella Conti",
    type: "Weekly",
    creditsPurchased: 10,
    creditsUsed: 3,
    issuedDate: "2026-07-24",
    expiryDate: "2026-07-31",
    status: "Active",
  },
  {
    id: "DP-4022",
    touristId: "TR-10267",
    touristName: "Priya Sharma",
    type: "Annual",
    creditsPurchased: 100,
    creditsUsed: 19,
    issuedDate: "2026-07-15",
    expiryDate: "2027-07-15",
    status: "Active",
  },
  {
    id: "DP-4023",
    touristId: "TR-10269",
    touristName: "Sofia Andersen",
    type: "Monthly",
    creditsPurchased: 20,
    creditsUsed: 10,
    issuedDate: "2026-07-03",
    expiryDate: "2026-08-03",
    status: "Active",
  },
  {
    id: "DP-4024",
    touristId: "TR-10243",
    touristName: "Ana Ribeiro",
    type: "Day",
    creditsPurchased: 3,
    creditsUsed: 3,
    issuedDate: "2026-06-15",
    expiryDate: "2026-06-15",
    status: "Expired",
  },
  {
    id: "DP-4025",
    touristId: "TR-10252",
    touristName: "Anya Petrova",
    type: "Monthly",
    creditsPurchased: 20,
    creditsUsed: 5,
    issuedDate: "2026-07-01",
    expiryDate: "2026-08-01",
    status: "Active",
  },
];

export function DivePassOverview() {
  const { setFilters } = useFilters();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [detail, setDetail] = useState<DivePass | null>(null);

  const filtered = useMemo(() => {
    return DIVE_PASS_DATA.filter((p) => {
      if (statusFilter !== "All" && p.status !== statusFilter) return false;
      if (typeFilter !== "All" && p.type !== typeFilter) return false;
      if (
        search &&
        !p.touristName.toLowerCase().includes(search.toLowerCase()) &&
        !p.id.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [search, statusFilter, typeFilter]);

  const stats = useMemo(
    () => ({
      total: DIVE_PASS_DATA.length,
      active: DIVE_PASS_DATA.filter((p) => p.status === "Active").length,
      expiring: DIVE_PASS_DATA.filter((p) => p.status === "Expiring").length,
      expired: DIVE_PASS_DATA.filter((p) => p.status === "Expired").length,
      totalCredits: DIVE_PASS_DATA.reduce((a, p) => a + p.creditsPurchased, 0),
      usedCredits: DIVE_PASS_DATA.reduce((a, p) => a + p.creditsUsed, 0),
    }),
    [],
  );

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={CreditCard}
            label="Total Passes"
            value={String(stats.total)}
            delta="+3"
          />
          <StatCard
            icon={CheckCircle2}
            label="Active"
            value={String(stats.active)}
            delta="+1"
          />
          <StatCard
            icon={Clock}
            label="Expiring Soon"
            value={String(stats.expiring)}
            delta="-1"
            up={false}
          />
          <StatCard
            icon={AlertTriangle}
            label="Expired"
            value={String(stats.expired)}
            delta="+2"
            up={false}
          />
        </div>
      </Reveal>

      <Reveal delay={80}>
        <SectionCard
          title="Dive Pass Registry"
          action={
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search passes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[200px] h-8 text-sm"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-8 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Expiring">Expiring</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px] h-8 text-sm">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="Day">Day</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pass ID</TableHead>
                <TableHead>Tourist</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((pass) => {
                const pct = Math.round(
                  (pass.creditsUsed / pass.creditsPurchased) * 100,
                );
                const remaining = pass.creditsPurchased - pass.creditsUsed;
                return (
                  <TableRow
                    key={pass.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setDetail(pass)}
                  >
                    <TableCell className="font-mono text-sm">
                      {pass.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      <EntityLink
                        onClick={() =>
                          setFilters({
                            section: "tourists",
                            q: pass.touristName,
                          })
                        }
                      >
                        {pass.touristName}
                      </EntityLink>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          pass.type === "Day"
                            ? "bg-success/10 text-success border-success/20"
                            : pass.type === "Weekly"
                              ? "bg-info/10 text-info border-info/20"
                              : pass.type === "Monthly"
                                ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                                : "bg-warning/15 text-warning-foreground border-warning/30"
                        }`}
                      >
                        {pass.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {pass.creditsUsed}/{pass.creditsPurchased}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-medium text-sm ${remaining === 0 ? "text-destructive" : ""}`}
                      >
                        {remaining}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5">
                        {pass.expiryDate}
                        <PassExpiryBadge dateStr={pass.expiryDate} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={pass.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No passes match your filters.
            </div>
          )}
        </SectionCard>
      </Reveal>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Pass {detail?.id}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <StatusBadge status={detail.status} />
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    detail.type === "Day"
                      ? "bg-success/10 text-success border-success/20"
                      : detail.type === "Weekly"
                        ? "bg-info/10 text-info border-info/20"
                        : detail.type === "Monthly"
                          ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                          : "bg-warning/15 text-warning-foreground border-warning/30"
                  }`}
                >
                  {detail.type}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tourist" value={detail.touristName} />
                <Field label="Tourist ID" value={detail.touristId} />
                <Field
                  label="Credits Used"
                  value={`${detail.creditsUsed} / ${detail.creditsPurchased}`}
                />
                <Field
                  label="Remaining Dives"
                  value={String(detail.creditsPurchased - detail.creditsUsed)}
                />
                <Field label="Issued" value={detail.issuedDate} />
                <div className="rounded-lg bg-secondary/60 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Expires
                  </div>
                  <div className="font-medium mt-0.5 flex items-center gap-2">
                    {detail.expiryDate}
                    <PassExpiryIndicator dateStr={detail.expiryDate} />
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  Credit Utilization
                </div>
                <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full transition-all"
                    style={{
                      width: `${Math.round((detail.creditsUsed / detail.creditsPurchased) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>{detail.creditsUsed} used</span>
                  <span>
                    {detail.creditsPurchased - detail.creditsUsed} remaining
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
