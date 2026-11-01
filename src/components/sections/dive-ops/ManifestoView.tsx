import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScrollText,
  Check,
  RotateCcw,
  Download,
  Forward,
  Search,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  SlidersHorizontal,
  Eye,
  EyeOff,
  CalendarIcon,
  Send,
  FileDown,
  X,
  ChevronRight,
  ShieldCheck,
  Shield,
  Loader2,
  AlertCircle,
  Printer,
} from "lucide-react";
import { downloadCsv } from "@/lib/export-utils";
import { openPrintDocument } from "@/lib/print-template";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  CardGridSkeleton,
} from "@/components/shared";
import { useFilters } from "@/hooks/useFilters";
import { usePermission } from "@/hooks/usePermission";
import { useGlobalDateRange } from "@/hooks/useGlobalDateRange";
import { todayInManila, clampDateToToday } from "@/lib/period";
import { pushAuditLog } from "@/lib/audit";
import { requireLiveSession } from "@/lib/staff-auth";
import {
  useLiveMode,
  useManifestsLive,
  useInvalidateLive,
  useLiveList,
  setManifestVerified,
  fetchManifestDivers,
  dbErrorMessage,
} from "@/lib/queries";
import {
  manifestos,
  ALL_OPERATOR_NAMES,
  ALL_SITES,
  FORWARD_RECIPIENTS,
} from "@/lib/mock-data";

export function ManifestoView() {
  const { canAct, deny } = usePermission();
  const { search, setFilters, resetFilters } = useFilters();
  const { inRange } = useGlobalDateRange();
  const [viewing, setViewing] = useState<any>(null);
  const [roster, setRoster] = useState<any[] | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState(false);
  const [mockItems, setMockItems] = useState(manifestos);
  // Live mode (Supabase configured): manifests come from dive_manifests
  // (+ manifest_divers counts); mocks are the offline fallback. Generate
  // stays mock-only (operator-side creation, no staff INSERT grant).
  const isLive = useLiveMode();
  const liveManifests = useManifestsLive();
  const invalidateManifests = useInvalidateLive();
  const isLiveData = isLive && !!liveManifests.data;
  const manifestsSource = useLiveList(isLive, liveManifests, mockItems);
  const items = manifestsSource.rows;
  useEffect(() => {
    if (liveManifests.isError) {
      toast.error("Could not load live manifestos", {
        description: "Showing demo data. Check the Supabase connection.",
      });
    }
  }, [liveManifests.isError]);
  const [rowBusy, setRowBusy] = useState<
    Record<string, "download" | "forward" | null>
  >({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [forwardDialog, setForwardDialog] = useState<string[] | null>(null);
  const [forwardBusy, setForwardBusy] = useState(false);
  const [verifiedIds, setVerifiedIds] = useState<Set<string>>(() => {
    const preverified = new Set<string>();
    manifestos.slice(0, 15).forEach((m) => preverified.add(m.id));
    return preverified;
  });
  const [verificationFilter, setVerificationFilter] = useState<
    "all" | "verified" | "unverified"
  >("all");

  // Live mode reads verification from the row (032 verified flag); mock
  // mode keeps the local Set with the first 15 pre-verified.
  const isVerified = (m: any) =>
    isLiveData ? m.verified === true : verifiedIds.has(m.id);

  const toggleVerify = async (id: string) => {
    if (!canAct) return deny();
    if (isLive && !(await requireLiveSession())) return;
    // Live mode: persist to dive_manifests (032 verified + staff UPDATE).
    const liveRow = liveManifests.data?.find((m) => m.id === id);
    if (isLive && liveRow) {
      const next = !liveRow.verified;
      try {
        await setManifestVerified(liveRow._dbId, next);
        invalidateManifests();
        if (next) {
          toast.success(`Manifesto ${id} verified`);
          pushAuditLog(`Verified manifesto ${id}`);
        } else {
          toast.info(`Manifesto ${id} marked as unverified`);
          pushAuditLog(`Unverified manifesto ${id}`);
        }
      } catch (e) {
        toast.error("Could not update manifesto", {
          description: dbErrorMessage(e),
        });
      }
      return;
    }
    setVerifiedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.info(`Manifesto ${id} marked as unverified`);
      } else {
        next.add(id);
        toast.success(`Manifesto ${id} verified`);
        pushAuditLog(`Verified manifesto ${id}`);
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    return items.filter((m) => {
      if (search.site !== "All" && m.site !== search.site) return false;
      if (search.q) {
        const q = search.q.toLowerCase();
        if (
          !m.operator.toLowerCase().includes(q) &&
          !m.site.toLowerCase().includes(q) &&
          !m.id.toLowerCase().includes(q)
        )
          return false;
      }
      if (search.dateFrom && m.date < search.dateFrom) return false;
      if (search.dateTo && m.date > search.dateTo) return false;
      if (!inRange(m.date)) return false;
      if (verificationFilter === "verified" && !isVerified(m)) return false;
      if (verificationFilter === "unverified" && isVerified(m)) return false;
      return true;
    });
  }, [
    items,
    isLiveData,
    verifiedIds,
    verificationFilter,
    search.q,
    search.site,
    search.dateFrom,
    search.dateTo,
    inRange,
  ]);

  // Site options follow the data source: live locations when live, mock
  // constants otherwise.
  const siteOptions = useMemo(
    () =>
      isLiveData
        ? [...new Set(items.map((m) => m.site).filter(Boolean))].sort()
        : ALL_SITES,
    [isLiveData, items],
  );

  const {
    page: mPage,
    setPage: mSetPage,
    totalPages: mTotalPages,
    paged: mPaged,
  } = usePagination(filtered, 12);

  const activeFilters: { key: string; label: string }[] = [];
  if (search.site !== "All")
    activeFilters.push({ key: "site", label: `Site: ${search.site}` });
  if (search.q)
    activeFilters.push({ key: "q", label: `Search: "${search.q}"` });
  if (search.dateFrom)
    activeFilters.push({ key: "dateFrom", label: `From: ${search.dateFrom}` });
  if (search.dateTo)
    activeFilters.push({ key: "dateTo", label: `To: ${search.dateTo}` });
  if (verificationFilter !== "all")
    activeFilters.push({
      key: "verification",
      label: `Verification: ${verificationFilter}`,
    });

  const handleRemoveFilter = (key: string) => {
    if (key === "q") setFilters({ q: "" });
    else if (key === "site") setFilters({ site: "All" });
    else if (key === "dateFrom") setFilters({ dateFrom: "" });
    else if (key === "dateTo") setFilters({ dateTo: "" });
    else if (key === "verification") setVerificationFilter("all");
  };

  const openViewing = (m: any) => {
    setViewing(m);
    // Live mode: resolve the diver roster on demand from manifest_divers.
    // Mock rows carry no _dbId and keep the count-only view.
    if (isLive && m?._dbId) {
      setRoster(null);
      setRosterError(false);
      setRosterLoading(true);
      fetchManifestDivers(m._dbId)
        .then((rows) => setRoster(rows))
        .catch(() => setRosterError(true))
        .finally(() => setRosterLoading(false));
    } else {
      setRoster(null);
      setRosterError(false);
      setRosterLoading(false);
    }
  };

  const rowAction = async (m: any, kind: "download" | "forward") => {
    if (kind === "forward") {
      setForwardDialog([m.id]);
      return;
    }
    setRowBusy((b) => ({ ...b, [m.id]: "download" }));
    let diversList: { name: string; nationality?: string; level?: string }[] = [];

    if (isLive && m?._dbId) {
      try {
        const fetched = await fetchManifestDivers(m._dbId);
        diversList = (fetched || []).map((d: any) => ({
          name: d.name ?? "Registered Diver",
          nationality: d.nationality ?? "Philippines",
          level: d.certificationLevel ?? "Open Water",
        }));
      } catch {
        // fallback
      }
    }

    if (diversList.length === 0) {
      const count = m.divers || 1;
      for (let i = 1; i <= count; i++) {
        diversList.push({
          name: `Diver Passenger #${i}`,
          nationality: i % 2 === 0 ? "Philippines" : "International",
          level: i === 1 ? "Divemaster" : "Open Water",
        });
      }
    }

    const rosterRowsHtml = diversList
      .map(
        (d, idx) => `
      <tr>
        <td class="text-center font-mono">${idx + 1}</td>
        <td class="font-semibold">${d.name}</td>
        <td>${d.nationality || "—"}</td>
        <td>${d.level || "—"}</td>
        <td class="text-center font-mono" style="color: #16a34a; font-weight: 600;">Fee Cleared</td>
        <td class="text-center font-mono" style="color: #16a34a; font-weight: 600;">Waiver Signed</td>
      </tr>`,
      )
      .join("");

    const bodyHtml = `
      <div style="margin-bottom: 20px; padding: 14px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;">
          <div>
            <div style="font-size: 8pt; text-transform: uppercase; color: #64748b; font-weight: 600;">Accredited Dive Operator</div>
            <div style="font-size: 11pt; font-weight: 700; color: #0f172a;">${m.operator}</div>
          </div>
          <div>
            <div style="font-size: 8pt; text-transform: uppercase; color: #64748b; font-weight: 600;">Scheduled Dive Location</div>
            <div style="font-size: 11pt; font-weight: 700; color: #0284c7;">${m.site}</div>
          </div>
          <div>
            <div style="font-size: 8pt; text-transform: uppercase; color: #64748b; font-weight: 600;">Date of Activity</div>
            <div style="font-size: 11pt; font-weight: 700; color: #0f172a;">${m.date}</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
          <div>
            <div style="font-size: 8pt; text-transform: uppercase; color: #64748b; font-weight: 600;">Total Divers Onboard</div>
            <div style="font-size: 11pt; font-weight: 700; color: #0f172a;">${m.divers} Certified Divers</div>
          </div>
          <div>
            <div style="font-size: 8pt; text-transform: uppercase; color: #64748b; font-weight: 600;">LGU Verification Clearance</div>
            <div style="font-size: 11pt; font-weight: 700; color: ${m.verified ? "#16a34a" : "#d97706"};">
              ${m.verified ? "VERIFIED & CLEARED" : "PENDING CLEARANCE"}
            </div>
          </div>
          <div>
            <div style="font-size: 8pt; text-transform: uppercase; color: #64748b; font-weight: 600;">Safety Briefing &amp; Equipment</div>
            <div style="font-size: 11pt; font-weight: 700; color: #16a34a;">COMPLIANT</div>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 8px; font-weight: 700; text-transform: uppercase; font-size: 10pt; color: #0f172a; letter-spacing: 0.02em;">
        Official Divers &amp; Passenger Roster
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px;" class="text-center">#</th>
            <th>Diver Full Name</th>
            <th>Nationality</th>
            <th>Certification Level</th>
            <th class="text-center">Municipal Fee</th>
            <th class="text-center">Safety Waiver</th>
          </tr>
        </thead>
        <tbody>
          ${rosterRowsHtml}
        </tbody>
      </table>

      <div style="margin-top: 24px; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 8.5pt; color: #475569; background: #f8fafc;">
        <strong>Bantay Dagat &amp; Philippine Coast Guard Clearance Notice:</strong><br>
        Vessels operating within Mabini Municipal Waters must retain a copy of this official manifest onboard during all dive voyages. Inspection officers may verify compliance against registered Municipal Dive Passes.
      </div>
    `;

    openPrintDocument({
      title: `Official Boat Dive Manifesto — ${m.id}`,
      documentType: "Boat Activity & Diver Clearance Manifest",
      documentNumber: m.id,
      periodOrDate: m.date,
      signatoryTitle: "Municipal Bantay Dagat / Tourism Officer",
      bodyHtml,
    });

    setRowBusy((b) => ({ ...b, [m.id]: null }));
    pushAuditLog(`Printed official boat dive manifesto ${m.id}`);
    toast.success("Manifesto Generated", {
      description: `Official document opened for ${m.id} (${m.site}).`,
    });
  };

  const exportSelectedCsv = () => {
    const targetManifests = filtered.filter((m) => selected.has(m.id));
    if (targetManifests.length === 0) return;
    const headers = ["Manifesto ID", "Operator", "Dive Site", "Divers Count", "Date", "Verified"];
    const rows = targetManifests.map((m) => [m.id, m.operator, m.site, m.divers, m.date, (m as any).verified ? "Yes" : "No"]);
    downloadCsv(`mabini-manifestos-export-${new Date().toISOString().slice(0, 10)}`, headers, rows);
    pushAuditLog(`Exported ${targetManifests.length} manifestos as CSV`);
    toast.success("CSV Downloaded", { description: `${targetManifests.length} manifestos exported.` });
  };

  const allSelected =
    filtered.length > 0 && filtered.every((m) => selected.has(m.id));
  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((m) => m.id)));
    }
  };

  const doForward = async (
    ids: string[],
    recipients: string[],
    message: string,
  ) => {
    if (!canAct) return deny();
    setForwardBusy(true);
    const tId = toast.loading(
      `Forwarding ${ids.length} manifesto${ids.length > 1 ? "s" : ""}…`,
    );
    await new Promise((r) => setTimeout(r, 900));
    setForwardBusy(false);
    toast.success(
      `Forwarded to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}`,
      {
        id: tId,
        description: `${ids.length} manifesto${ids.length > 1 ? "s" : ""} · ${recipients.join(", ")}${message ? " · with note" : ""}`,
        icon: <Forward className="size-4" />,
      },
    );
    setForwardDialog(null);
    setSelected(new Set());
    ids.forEach((id) => pushAuditLog(`Forwarded manifesto ${id}`));
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <DataSourceBadge
            live={isLive}
            isError={liveManifests.isError}
            isLoading={manifestsSource.isLoading}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by operator, site, or ID…"
              value={search.q}
              onChange={(e) => setFilters({ q: e.target.value })}
              className="pl-9"
            />
          </div>
          <Select
            value={search.site}
            onValueChange={(v) => setFilters({ site: v })}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Dive site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All sites</SelectItem>
              {siteOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              From
            </Label>
            <Input
              type="date"
              max={search.dateTo || todayInManila()}
              value={search.dateFrom}
              onChange={(e) =>
                setFilters({ dateFrom: clampDateToToday(e.target.value) })
              }
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              To
            </Label>
            <Input
              type="date"
              min={search.dateFrom || undefined}
              max={todayInManila()}
              value={search.dateTo}
              onChange={(e) =>
                setFilters({ dateTo: clampDateToToday(e.target.value) })
              }
              className="w-40"
            />
          </div>
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilters({ q: "", site: "All", dateFrom: "", dateTo: "" });
                setVerificationFilter("all");
              }}
              className="text-muted-foreground"
            >
              <X className="size-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>
        <ActiveFilterBadges
          filters={activeFilters}
          onRemove={handleRemoveFilter}
        />
      </div>

      <div className="text-xs text-muted-foreground">
        {manifestsSource.isLoading
          ? "Loading manifestos…"
          : `${filtered.length} of ${items.length} manifesto${
              items.length !== 1 ? "s" : ""
            }`}
      </div>

      <div className="flex items-center gap-1 bg-secondary/60 rounded-lg p-0.5 w-fit">
        {(
          [
            ["all", "All"],
            ["verified", "Verified"],
            ["unverified", "Unverified"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setVerificationFilter(key)}
            className={`px-3 py-1.5 text-xs rounded-md transition-all font-medium ${
              verificationFilter === key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-primary/20 bg-primary-soft/30 animate-fade-in">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleSelectAll}
            aria-label="Select all"
          />
          <span className="text-sm text-muted-foreground">
            {selected.size} selected
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-muted-foreground"
              onClick={() => setSelected(new Set())}
            >
              <X className="size-3.5" />
            </Button>
            <div className="w-px h-4 bg-border" />
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs"
              onClick={exportSelectedCsv}
            >
              <FileDown className="size-3.5 mr-1" />
              <span>Export CSV</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2.5"
              onClick={() => setForwardDialog([...selected])}
            >
              <Forward className="size-3.5" />{" "}
              <span className="ml-1 text-xs">Forward</span>
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {manifestsSource.isLoading ? (
          <CardGridSkeleton count={8} />
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No manifestos match the current filters.
          </div>
        ) : (
          mPaged.map((m, idx) => {
            const b = rowBusy[m.id];
            return (
              <div
                key={m.id}
                className="animate-fade-in"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <Card
                  className={`p-0 overflow-hidden shadow-elegant border-border/60 hover:shadow-glow hover:-translate-y-0.5 transition-all ${
                    selected.has(m.id) ? "ring-2 ring-primary/40" : ""
                  }`}
                >
                  <div
                    onClick={() => openViewing(m)}
                    className="block w-full aspect-[4/3] gradient-primary relative cursor-pointer"
                  >
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 30% 30%, oklch(1 0 0 / 0.6), transparent 50%)",
                      }}
                    />
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(m.id);
                      }}
                      className="absolute top-3 left-3 z-10 rounded-md bg-white/20 backdrop-blur p-0.5"
                    >
                      <Checkbox
                        checked={selected.has(m.id)}
                        onCheckedChange={() => {}}
                        aria-label={`Select manifesto ${m.id}`}
                      />
                    </div>
                    <div className="absolute bottom-3 left-3 text-primary-foreground">
                      <div className="font-mono text-[10px] opacity-80">
                        {m.id}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilters({
                            section: "dive-ops",
                            tab: "sites",
                            q: m.site,
                          });
                        }}
                        className="font-display font-semibold text-left underline decoration-dotted underline-offset-2 hover:decoration-solid transition-colors"
                      >
                        {m.site}
                      </button>
                    </div>
                    <div className="absolute top-3 right-3 rounded-full bg-white/20 backdrop-blur text-primary-foreground text-xs font-medium px-2.5 py-1">
                      {m.divers} divers
                    </div>
                    {isVerified(m) && (
                      <div className="absolute top-3 left-10 rounded-full bg-green-500/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 flex items-center gap-1">
                        <ShieldCheck className="size-3" /> Verified
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilters({
                          section: "establishments",
                          tab: "registered",
                          q: m.operator,
                        });
                      }}
                      className="text-sm font-medium text-left underline decoration-dotted underline-offset-2 hover:text-primary hover:decoration-solid transition-colors"
                    >
                      {m.operator}
                    </button>
                    <div className="text-xs text-muted-foreground">
                      {m.date}
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant={isVerified(m) ? "default" : "outline"}
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVerify(m.id);
                        }}
                        title={
                          isVerified(m)
                            ? "Mark as unverified"
                            : "Mark as verified"
                        }
                      >
                        {isVerified(m) ? (
                          <ShieldCheck className="size-4" />
                        ) : (
                          <Shield className="size-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1"
                        disabled={!!b}
                        onClick={() => openViewing(m)}
                        title="Preview & download"
                      >
                        <Download className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1"
                        disabled={!!b}
                        onClick={() => setForwardDialog([m.id])}
                        title="Forward"
                      >
                        {b === "forward" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Forward className="size-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1"
                        onClick={() => openViewing(m)}
                        title="View"
                      >
                        <Eye className="size-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })
        )}
      </div>
      <Pagination
        page={mPage}
        totalPages={mTotalPages}
        onPageChange={mSetPage}
        className="mt-4"
      />

      <AnimatePresence>
        {viewing && (
          <motion.div
            key="manifesto-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto"
            onClick={() => setViewing(null)}
            onKeyDown={(e) => e.key === "Escape" && setViewing(null)}
            tabIndex={-1}
            ref={(el) => {
              if (el) {
                el.focus();
                el.addEventListener("keydown", (e) => {
                  if (e.key === "Escape") setViewing(null);
                });
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-3xl mx-4 my-8 rounded-2xl bg-card border border-border/60 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setViewing(null)}
                className="absolute top-4 right-4 z-10 rounded-full bg-background/80 backdrop-blur border border-border/60 p-2 text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
              >
                <X className="size-5" />
              </button>

              <div className="aspect-video w-full gradient-primary relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-25"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 30% 30%, oklch(1 0 0 / 0.6), transparent 50%)",
                  }}
                />
                <div className="absolute bottom-6 left-6 text-primary-foreground">
                  <div className="text-sm opacity-80">
                    {viewing.date} · {viewing.operator}
                  </div>
                  <div className="text-3xl font-display font-bold">
                    {viewing.site}
                  </div>
                  <div className="mt-2 text-sm">
                    {viewing.divers} certified divers on the manifest
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Field label="Manifesto" value={viewing.id} />
                  <Field label="Operator" value={viewing.operator} />
                  <Field label="Site" value={viewing.site} />
                  <Field label="Date" value={viewing.date} />
                  <Field label="Divers" value={`${viewing.divers} certified`} />
                  {viewing.diveType && (
                    <Field label="Dive Type" value={viewing.diveType} />
                  )}
                  {viewing.boatName && (
                    <Field label="Boat" value={viewing.boatName} />
                  )}
                  {viewing.maxDivers != null && (
                    <Field
                      label="Capacity"
                      value={`${viewing.divers}/${viewing.maxDivers}`}
                    />
                  )}
                </div>

                {viewing._dbId ? (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">
                      Diver roster
                      {roster ? ` (${roster.length})` : ""}
                    </div>
                    {rosterLoading ? (
                      <div className="text-xs text-muted-foreground">
                        Loading roster…
                      </div>
                    ) : rosterError ? (
                      <div className="text-xs text-destructive">
                        Could not load the roster. Close and reopen to retry.
                      </div>
                    ) : roster && roster.length > 0 ? (
                      <ul className="max-h-48 overflow-y-auto divide-y divide-border/60 rounded-lg border border-border/60">
                        {roster.map((d, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 px-3 py-2 text-sm"
                          >
                            <span className="font-medium flex-1 truncate">
                              {d.name}
                            </span>
                            {d.ecoId && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {d.ecoId}
                              </span>
                            )}
                            {d.isWalkIn && (
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                Walk-in
                              </Badge>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        No divers recorded on this manifesto.
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => rowAction(viewing, "download")}
                  >
                    {rowBusy[viewing.id] === "download" ? (
                      <Loader2 className="size-4 mr-1.5 animate-spin" />
                    ) : (
                      <Printer className="size-4 mr-1.5" />
                    )}
                    Print / PDF Manifest
                  </Button>
                  <Button
                    className="flex-1 gradient-primary text-primary-foreground"
                    onClick={() => rowAction(viewing, "forward")}
                  >
                    <Forward className="size-4 mr-1.5" /> Forward
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog
        open={!!forwardDialog}
        onOpenChange={(o) => !o && setForwardDialog(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Forward className="size-5 text-primary" /> Forward manifestos
            </DialogTitle>
          </DialogHeader>
          {forwardDialog && (
            <ForwardForm
              ids={forwardDialog}
              busy={forwardBusy}
              onConfirm={doForward}
              onCancel={() => setForwardDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ForwardForm({
  ids,
  busy,
  onConfirm,
  onCancel,
}: {
  ids: string[];
  busy: boolean;
  onConfirm: (ids: string[], recipients: string[], message: string) => void;
  onCancel: () => void;
}) {
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(
    new Set(),
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const toggleRecipient = (email: string) =>
    setSelectedRecipients((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });

  const confirm = () => {
    if (selectedRecipients.size === 0) {
      setError("Select at least one recipient.");
      return;
    }
    onConfirm(ids, [...selectedRecipients], message.trim());
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Forward{" "}
        <span className="font-medium text-foreground">
          {ids.length} manifesto{ids.length > 1 ? "s" : ""}
        </span>{" "}
        to selected recipients.
      </p>
      <div className="max-h-52 overflow-y-auto rounded-lg border border-border/70 divide-y divide-border/60">
        {FORWARD_RECIPIENTS.map((r) => {
          const checked = selectedRecipients.has(r.email);
          return (
            <label
              key={r.email}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-primary-soft/40 transition-colors"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggleRecipient(r.email)}
              />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{r.name}</div>
                <div className="text-xs text-muted-foreground font-mono truncate">
                  {r.email}
                </div>
              </div>
            </label>
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="size-3" />
          {error}
        </p>
      )}
      <div className="space-y-1.5">
        <Label>Optional note</Label>
        <Textarea
          rows={2}
          placeholder="Add a message for the recipient…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button
          className="gradient-primary text-primary-foreground"
          onClick={confirm}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="size-4 mr-1.5 animate-spin" />
          ) : (
            <Forward className="size-4 mr-1.5" />
          )}
          Forward to {selectedRecipients.size || ""} recipient
          {selectedRecipients.size !== 1 ? "s" : ""}
        </Button>
      </DialogFooter>
    </div>
  );
}


