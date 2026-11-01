import { useState, useEffect, useMemo } from "react";
import {
  Building2,
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
  CheckCircle,
  XCircle,
  Ban,
} from "lucide-react";
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
import { RejectReasonDialog } from "@/components/RejectReasonDialog";
import {
  StatCard,
  SectionCard,
  DataSourceBadge,
  useMounted,
  Field,
  ActiveFilterBadges,
  TableSkeletonRows,
  StatusBadge,
} from "@/components/shared";
import { useFilters } from "@/hooks/useFilters";
import { usePermission } from "@/hooks/usePermission";
import { useGlobalDateRange } from "@/hooks/useGlobalDateRange";
import { pushAuditLog } from "@/lib/audit";
import { requireLiveSession } from "@/lib/staff-auth";
import {
  useLiveMode,
  useOperatorApplicationsLive,
  useInvalidateLive,
  useLiveList,
  decideApplication,
  createEstablishmentFromApplication,
  getTouristContact,
  type LiveAppRow,
  dbErrorMessage,
} from "@/lib/queries";
import {
  operatorApps,
  ALL_OPERATOR_BIZ,
  FORWARD_RECIPIENTS,
} from "@/lib/mock-data";

export function OperatorMgmt({
  subTab = "applications",
}: {
  subTab?: "applications" | "active";
} = {}) {
  const { canAct, deny } = usePermission();
  const { search, setFilters } = useFilters();
  const { inRange } = useGlobalDateRange();
  const [mockApps, setMockApps] = useState(operatorApps);
  // Live mode (Supabase configured): the queue comes from
  // operator_applications; mocks are the offline fallback.
  const isLive = useLiveMode();
  const liveApps = useOperatorApplicationsLive();
  const invalidateLive = useInvalidateLive();
  const appsSource = useLiveList(isLive, liveApps, mockApps);
  const apps = appsSource.rows;
  useEffect(() => {
    if (liveApps.isError) {
      toast.error("Could not load live applications", {
        description: "Showing demo data. Check the Supabase connection.",
      });
    }
  }, [liveApps.isError]);
  const [busy, setBusy] = useState<Record<string, "approve" | "reject" | null>>(
    {},
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<{
    ids: string[];
    single: string | null;
  } | null>(null);

  const filteredApps = useMemo(() => {
    return apps.filter((o) => {
      if (search.status !== "All" && o.status !== search.status) return false;
      if (!inRange(o.submitted)) return false;
      if (search.q) {
        const q = search.q.toLowerCase();
        if (
          !o.name.toLowerCase().includes(q) &&
          !o.owner.toLowerCase().includes(q) &&
          !o.id.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [apps, search.q, search.status, inRange]);

  // Review queue: approved applications graduate to the registry (and reappear
  // under Active Operators), so they are dropped from the Applications table to
  // keep "needs review" unambiguous. Rejected rows stay for the record/reopen.
  const queueApps = useMemo(
    () => filteredApps.filter((a) => a.status !== "Approved"),
    [filteredApps],
  );

  const {
    page: oPage,
    setPage: oSetPage,
    totalPages: oTotalPages,
    paged: oPaged,
  } = usePagination(queueApps, 10);

  const activeFilters: { key: string; label: string }[] = [];
  if (search.status !== "All")
    activeFilters.push({ key: "status", label: `Status: ${search.status}` });
  if (search.q)
    activeFilters.push({ key: "q", label: `Search: "${search.q}"` });

  const handleRemoveFilter = (key: string) => {
    if (key === "q") setFilters({ q: "" });
    else if (key === "status") setFilters({ status: "All" });
  };

  // Graduation: approving an application creates its establishment row.
  // The approval stands even if graduation fails — failures report with a
  // retry action instead of rolling back (no silent half-states).
  const graduate = async (row: LiveAppRow): Promise<void> => {
    const contact = await getTouristContact(row.tourist_id);
    await createEstablishmentFromApplication({
      resortName: row.name,
      resortLocation: row.resort_location,
      contactNumber: row.contact_number,
      touristEmail: contact.email,
      website: row.website,
    });
  };

  const runGraduations = async (rows: LiveAppRow[], quiet: boolean) => {
    const outcomes = await Promise.allSettled(rows.map((r) => graduate(r)));
    const failedRows = rows.filter((_, i) => outcomes[i].status === "rejected");
    outcomes.forEach((o, i) => {
      if (o.status === "fulfilled") {
        pushAuditLog(
          `Registered establishment for ${rows[i].id} (${rows[i].name})`,
        );
        if (!quiet) {
          toast.success("Establishment registered", {
            description: `${rows[i].name} is now in the registry.`,
          });
        }
      } else {
        pushAuditLog(
          `Establishment creation failed for ${rows[i].id} — ${dbErrorMessage((o as PromiseRejectedResult).reason)}`,
        );
      }
    });
    invalidateLive();
    if (failedRows.length > 0) {
      toast.error("Application approved — establishment not created", {
        description: `Failed: ${failedRows.map((r) => r.id).join(", ")}`,
        action: {
          label: "Retry",
          onClick: () => {
            void runGraduations(failedRows, quiet);
          },
        },
      });
    }
  };

  const decide = async (
    id: string,
    decision: "Approved" | "Rejected",
    reason?: string,
  ) => {
    if (!canAct) return deny();
    if (isLive && !(await requireLiveSession())) return;
    const key = decision === "Approved" ? "approve" : "reject";
    setBusy((b) => ({ ...b, [id]: key }));
    // Live mode: persist the decision to Supabase (030 staff policies).
    // The operator's app picks it up over realtime + refreshes its JWT.
    const liveRow = liveApps.data?.find((a) => a.id === id);
    if (isLive && liveRow) {
      try {
        await decideApplication(
          liveRow._dbId,
          decision === "Approved" ? "approved" : "rejected",
          reason,
        );
        invalidateLive();
        const t = decision === "Approved" ? toast.success : toast.error;
        t(`Application ${decision.toLowerCase()}`, {
          description: `${id} — the operator has been notified.`,
        });
        pushAuditLog(
          decision === "Approved"
            ? `Approved operator ${id}`
            : `Rejected operator ${id} — ${reason}`,
        );
        if (decision === "Approved") {
          void runGraduations([liveRow], false);
        }
      } catch (e) {
        toast.error("Could not save decision", {
          description: dbErrorMessage(e),
        });
      }
      setBusy((b) => ({ ...b, [id]: null }));
      return;
    }
    const prev = apps.find((a) => a.id === id)?.status ?? "Pending";
    await new Promise((r) => setTimeout(r, 500));
    setMockApps((prevApps) =>
      prevApps.map((a) =>
        a.id === id
          ? {
              ...a,
              status: decision,
              ...(decision === "Rejected" ? { rejectReason: reason } : {}),
            }
          : a,
      ),
    );
    setBusy((b) => ({ ...b, [id]: null }));
    const t = decision === "Approved" ? toast.success : toast.error;
    t(`Application ${decision.toLowerCase()}`, {
      description: `${id} — the operator has been notified by email.`,
      action: {
        label: "Undo",
        onClick: () => {
          setMockApps((prevApps) =>
            prevApps.map((a) =>
              a.id === id ? { ...a, status: prev, rejectReason: undefined } : a,
            ),
          );
          toast.info(`Reverted ${id}`, {
            description: `Status restored to ${prev}.`,
          });
        },
      },
    });
    pushAuditLog(
      decision === "Approved"
        ? `Approved operator ${id}`
        : `Rejected operator ${id} — ${reason}`,
    );
  };

  const selectablePending = filteredApps.filter((a) => a.status === "Pending");
  // Unfiltered pending count — distinguishes "nothing to review" from
  // "filters hid everything".
  const pendingTotal = apps.filter((a) => a.status === "Pending").length;
  const allSelected =
    selectablePending.length > 0 &&
    selectablePending.every((a) => selected.has(a.id));

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
      setSelected(new Set(selectablePending.map((a) => a.id)));
    }
  };

  const bulkDecide = async (
    decision: "Approved" | "Rejected",
    reason?: string,
  ) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!canAct) return deny();
    setBulkBusy(true);
    const key = decision === "Approved" ? "approve" : "reject";
    setBusy((b) => {
      const n = { ...b };
      ids.forEach((id) => {
        n[id] = key as any;
      });
      return n;
    });
    await new Promise((r) => setTimeout(r, 800));
    // Live mode: persist each decision, then refetch once. Per-row results
    // via allSettled — a single row failure must not report the batch as fully saved.
    let succeeded: string[] = [];
    const failed: { id: string; message: string }[] = [];
    if (isLive && liveApps.data) {
      if (!(await requireLiveSession())) {
        setBusy((b) => {
          const n = { ...b };
          ids.forEach((id) => {
            n[id] = null;
          });
          return n;
        });
        setBulkBusy(false);
        return;
      }
      const byId = new Map(liveApps.data.map((a) => [a.id, a._dbId]));
      const results = await Promise.allSettled(
        ids.map((id) => {
          const dbId = byId.get(id);
          if (!dbId)
            return Promise.reject(new Error(`No live record for ${id}`));
          return decideApplication(
            dbId,
            decision === "Approved" ? "approved" : "rejected",
            reason,
          );
        }),
      );
      results.forEach((res, i) => {
        if (res.status === "fulfilled") succeeded.push(ids[i]);
        else
          failed.push({
            id: ids[i],
            message: dbErrorMessage(res.reason),
          });
      });
      invalidateLive();
    } else {
      setMockApps((prev) =>
        prev.map((a) =>
          ids.includes(a.id)
            ? {
                ...a,
                status: decision,
                ...(decision === "Rejected" ? { rejectReason: reason } : {}),
              }
            : a,
        ),
      );
      succeeded = ids;
    }
    setBusy((b) => {
      const n = { ...b };
      ids.forEach((id) => {
        n[id] = null;
      });
      return n;
    });
    setBulkBusy(false);
    if (failed.length === 0) {
      setSelected(new Set());
      toast.success(
        `${succeeded.length} application${succeeded.length !== 1 ? "s" : ""} ${decision.toLowerCase()}`,
        {
          description: `Bulk action completed. Operators have been notified.`,
          icon:
            decision === "Approved" ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <XCircle className="size-4" />
            ),
        },
      );
    } else if (succeeded.length === 0) {
      // Keep the selection so the batch can be retried.
      toast.error("Could not save bulk decision", {
        description: `${failed.length} of ${ids.length} failed. First error: ${failed[0].message}`,
      });
      return;
    } else {
      setSelected(new Set(failed.map((f) => f.id)));
      toast.error(
        `${succeeded.length} of ${ids.length} applications ${decision.toLowerCase()}`,
        {
          description: `Failed: ${failed.map((f) => f.id).join(", ")}. First error: ${failed[0].message}`,
        },
      );
    }
    if (decision === "Rejected") {
      succeeded.forEach((id) =>
        pushAuditLog(`Rejected operator ${id} — ${reason}`),
      );
    } else {
      succeeded.forEach((id) => pushAuditLog(`Approved operator ${id}`));
      if (isLive && liveApps.data) {
        const snapshot = liveApps.data;
        const rows = succeeded
          .map((id) => snapshot.find((a) => a.id === id))
          .filter((r): r is LiveAppRow => !!r);
        if (rows.length > 0) await runGraduations(rows, true);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <DataSourceBadge
          live={isLive}
          isError={liveApps.isError}
          isLoading={appsSource.isLoading}
        />
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, owner, or ID…"
              value={search.q}
              onChange={(e) => setFilters({ q: e.target.value })}
              className="pl-9 h-8 w-[320px] text-sm"
            />
          </div>
          <Select
            value={search.status}
            onValueChange={(v) => setFilters({ status: v })}
          >
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {["All", "Pending", "Rejected"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ q: "", status: "All" })}
              className="text-muted-foreground"
            >
              <X className="size-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>
      {subTab === "applications" && (
        <>
          <div className="space-y-3">
            <ActiveFilterBadges
              filters={activeFilters}
              onRemove={handleRemoveFilter}
            />
            <div className="text-xs text-muted-foreground">
              {appsSource.isLoading
                ? "Loading applications…"
                : `${queueApps.length} of ${apps.length} application${
                    apps.length !== 1 ? "s" : ""
                  }`}
            </div>
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
                  variant="ghost"
                  className="h-7 px-2.5 text-success hover:bg-success/10"
                  disabled={bulkBusy}
                  onClick={() => bulkDecide("Approved")}
                >
                  {bulkBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2.5 text-destructive hover:bg-destructive/10"
                  disabled={bulkBusy}
                  onClick={() =>
                    setRejectDialog({ ids: [...selected], single: null })
                  }
                >
                  {bulkBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <X className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )}
          <Card className="shadow-elegant overflow-hidden mt-3">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appsSource.isLoading ? (
                  <TableSkeletonRows rows={6} cols={8} />
                ) : queueApps.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {pendingTotal === 0 ? (
                        <div className="flex flex-col items-center gap-1">
                          <CheckCircle2 className="size-6 text-success" />
                          <span className="font-medium text-foreground">
                            No pending applications
                          </span>
                          <span className="text-xs">
                            Every operator application has been reviewed.
                          </span>
                        </div>
                      ) : (
                        "No applications match the current filters."
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  oPaged.map((o) => {
                    const settled = o.status !== "Pending";
                    const b = busy[o.id];
                    return (
                      <TableRow
                        key={o.id}
                        className={`transition-colors ${
                          o.status === "Approved"
                            ? "bg-success/5"
                            : o.status === "Rejected"
                              ? "bg-destructive/5"
                              : selected.has(o.id)
                                ? "bg-primary-soft/30"
                                : "hover:bg-primary-soft/40"
                        }`}
                      >
                        <TableCell className="w-10">
                          <Checkbox
                            checked={selected.has(o.id)}
                            onCheckedChange={() => toggleSelect(o.id)}
                            disabled={o.status !== "Pending"}
                            aria-label={`Select ${o.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {o.id}
                        </TableCell>
                        <TableCell className="font-medium">{o.name}</TableCell>
                        <TableCell>{o.owner}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {o.submitted}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={o.status} />
                        </TableCell>
                        <TableCell className="text-right space-x-1.5">
                          {settled ? (
                            <div className="inline-flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-medium ${
                                  o.status === "Approved"
                                    ? "text-success"
                                    : "text-destructive"
                                }`}
                                title={o.rejectReason}
                              >
                                {o.status === "Approved" ? (
                                  <CheckCircle2 className="size-4" />
                                ) : (
                                  <XCircle className="size-4" />
                                )}
                                {o.status === "Approved"
                                  ? "Approved"
                                  : "Rejected"}
                              </span>
                              {o.status === "Rejected" && o.rejectReason && (
                                <div
                                  className="mt-1 max-w-[180px] text-[10px] text-destructive/80 line-clamp-2"
                                  title={o.rejectReason}
                                >
                                  {o.rejectReason}
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  const liveRow = liveApps.data?.find(
                                    (a) => a.id === o.id,
                                  );
                                  if (isLive && liveRow) {
                                    if (!(await requireLiveSession())) return;
                                    try {
                                      // Reopen writes the same lowercase status convention as
                                      // approve/reject ("pending" → "Pending" via cap() on refetch).
                                      // Requires operator_applications.status to accept 'pending' (030).
                                      await decideApplication(
                                        liveRow._dbId,
                                        "pending",
                                      );
                                      invalidateLive();
                                      toast.info("Marked as pending again", {
                                        description: o.id,
                                      });
                                    } catch (e) {
                                      toast.error("Could not reopen", {
                                        description: dbErrorMessage(e),
                                      });
                                    }
                                    return;
                                  }
                                  setMockApps((prev) =>
                                    prev.map((a) =>
                                      a.id === o.id
                                        ? { ...a, status: "Pending" }
                                        : a,
                                    ),
                                  );
                                  toast.info("Marked as pending again", {
                                    description: o.id,
                                  });
                                }}
                              >
                                <RotateCcw className="size-3.5 mr-1" /> Reopen
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!!b}
                                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  setRejectDialog({ ids: [o.id], single: o.id })
                                }
                              >
                                {b === "reject" ? (
                                  <Loader2 className="size-4 mr-1 animate-spin" />
                                ) : (
                                  <X className="size-4 mr-1" />
                                )}
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                disabled={!!b}
                                className="bg-success text-success-foreground hover:opacity-90"
                                onClick={() => decide(o.id, "Approved")}
                              >
                                {b === "approve" ? (
                                  <Loader2 className="size-4 mr-1 animate-spin" />
                                ) : (
                                  <Check className="size-4 mr-1" />
                                )}
                                Approve
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <Pagination
              page={oPage}
              totalPages={oTotalPages}
              onPageChange={oSetPage}
              className="mt-4 px-4"
            />
          </Card>
        </>
      )}
      {subTab === "active" && (
        <>
          {(() => {
            const activeOps = apps.filter((a) => a.status === "Approved");
            return appsSource.isLoading ? (
              <Card className="p-8 text-center text-muted-foreground shadow-elegant">
                Loading active operators…
              </Card>
            ) : activeOps.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground shadow-elegant">
                No active operators found.
              </Card>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operator ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Approved</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeOps.map((o) => (
                      <TableRow
                        key={o.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() =>
                          setFilters({
                            section: "establishments",
                            tab: "registered",
                            q: o.name,
                          })
                        }
                      >
                        <TableCell>
                          <span className="font-mono text-xs">{o.id}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{o.name}</span>
                        </TableCell>
                        <TableCell>{o.owner}</TableCell>
                        <TableCell>{o.submitted}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setRejectDialog({
                                ids: [o.id],
                                single: o.id,
                              });
                            }}
                          >
                            <Ban className="size-3 mr-1" />
                            Deactivate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          })()}
        </>
      )}

      <RejectReasonDialog
        open={!!rejectDialog}
        onOpenChange={(o) => !o && setRejectDialog(null)}
        title="Reject application"
        itemLabel="application"
        count={rejectDialog?.ids.length}
        onConfirm={(reason) => {
          const d = rejectDialog!;
          setRejectDialog(null);
          if (d.single) decide(d.single, "Rejected", reason);
          else bulkDecide("Rejected", reason);
        }}
      />
    </div>
  );
}


