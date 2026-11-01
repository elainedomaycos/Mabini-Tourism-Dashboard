import { useState, useEffect, useMemo } from "react";
import {
  Shield,
  ShieldCheck,
  UserCog,
  Lock,
  Plus,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Check,
  X,
  ChevronRight,
  AlertTriangle,
  Trash2,
  KeyRound,
  Fingerprint,
  Moon,
  Sun,
  Loader2,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  Copy,
  ShieldAlert,
  Ban,
  CheckCircle2,
  FileDown,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
} from "@/components/shared";
import { useFilters } from "@/hooks/useFilters";
import { usePermission, ROLE_META } from "@/hooks/usePermission";
import {
  useLiveAuditLogs,
  AUDIT_TYPES,
  auditActionType,
  pushAuditLog,
} from "@/lib/audit";
import {
  useStaffSessionValue,
  requireLiveSession,
  getAccessToken,
  staffInitials,
  type StaffSession,
  type StaffRole,
} from "@/lib/staff-auth";
import { createStaffAccount } from "@/lib/create-staff-fn";
import { deleteStaffAccount } from "@/lib/delete-staff-fn";
import { resetStaffPassword } from "@/lib/reset-staff-password-fn";
import {
  useLiveMode,
  useStaffLive,
  useInvalidateLive,
  useAuditLogsLive,
  setStaffActive,
  setStaffRole,
  dbErrorMessage,
} from "@/lib/queries";

const SESSION_TIMEOUT_OPTIONS = [
  { label: "30 seconds", value: 30 },
  { label: "1 minute", value: 60 },
  { label: "2 minutes", value: 120 },
  { label: "5 minutes", value: 300 },
  { label: "10 minutes", value: 600 },
  { label: "15 minutes", value: 900 },
  { label: "30 minutes", value: 1800 },
  { label: "Never", value: 0 },
];

function SessionTimeoutSetting() {
  const [timeout, setTimeout_] = useState(() => {
    try {
      return Number(localStorage.getItem("session-timeout") ?? "600");
    } catch {
      return 600;
    }
  });

  const handleChange = (v: string) => {
    const val = Number(v);
    setTimeout_(val);
    try {
      localStorage.setItem("session-timeout", String(val));
      window.dispatchEvent(new Event("session-timeout-change"));
    } catch {}
    if (val === 0) {
      toast.success("Session timeout disabled");
    } else {
      const opt = SESSION_TIMEOUT_OPTIONS.find((o) => o.value === val);
      toast.success(`Session timeout set to ${opt?.label ?? val + "s"}`);
    }
  };

  return (
    <Select value={String(timeout)} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px] h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SESSION_TIMEOUT_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={String(o.value)}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SettingsPage() {

  const { canAdmin, deny } = usePermission();
  const session = useStaffSessionValue();
  // Real staff roster from to_staff (superadmin-only read via 034). No mock
  // fallback here by design: fake staff rows would be worse than an empty
  // list. Pre-034 databases (no role column) surface as a visible error.
  const staffLive = useStaffLive();
  const invalidateStaff = useInvalidateLive();
  const staffUsers = useMemo(() => staffLive.data ?? [], [staffLive.data]);
  const [userDialog, setUserDialog] = useState<"invite" | null>(null);
  const [rowBusy, setRowBusy] = useState<Record<string, boolean>>({});
  const [inviteForm, setInviteForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "staff" as "staff" | "superadmin",
  });
  const [showInvitePw, setShowInvitePw] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({});

  const openInvite = () => {
    setInviteForm({ fullName: "", email: "", password: "", role: "staff" });
    setInviteErrors({});
    setShowInvitePw(false);
    setUserDialog("invite");
  };

  // 043: admin-managed password reset — the out-of-band recovery path for
  // staff addresses that don't back a real mailbox (the emailed reset link
  // was removed alongside it). The admin types the temp password like in the
  // invite dialog; the server fn revokes the target's other sessions and
  // sets must_change_password so the staffer is forced to choose their own
  // at next login (self-reset clears it instead — the caller is signed in).
  const [pwResetTarget, setPwResetTarget] = useState<{
    id: string;
    email: string;
    fullName: string;
    self: boolean;
  } | null>(null);
  const [pwResetPassword, setPwResetPassword] = useState("");
  const [showPwReset, setShowPwReset] = useState(false);
  const [pwResetError, setPwResetError] = useState("");
  const [pwResetBusy, setPwResetBusy] = useState(false);

  const openPwReset = (u: {
    _dbId: string;
    email: string;
    fullName: string;
  }) => {
    setPwResetPassword("");
    setShowPwReset(false);
    setPwResetError("");
    setPwResetTarget({
      id: u._dbId,
      email: u.email,
      fullName: u.fullName,
      self: isSelf(u._dbId),
    });
  };

  const submitPwReset = async () => {
    const target = pwResetTarget;
    if (!target) return;
    if (!canAdmin) return deny("Only Super Admin can reset staff passwords.");
    if (pwResetPassword.length < 8) {
      setPwResetError("Password must be at least 8 characters.");
      return;
    }
    const accessToken = await getAccessToken();
    if (!accessToken) {
      toast.error("Session expired", {
        description: "Please sign out and sign in again.",
      });
      return;
    }
    setPwResetBusy(true);
    try {
      const res = await resetStaffPassword({
        data: {
          userId: target.id,
          newPassword: pwResetPassword,
          accessToken,
        },
      });
      if (!res.ok) {
        setPwResetError(res.message);
        return;
      }
      invalidateStaff();
      pushAuditLog(
        res.isSelf
          ? `Changed own password (${target.email})`
          : `Reset password of staff account ${target.email} — forced change at next login`,
      );
      toast.success(res.isSelf ? "Password updated" : "Password reset", {
        description: res.isSelf
          ? "You're still signed in."
          : `${target.email} must set their own password at next sign-in. Share the temporary password out-of-band.`,
      });
      setPwResetTarget(null);
    } catch (err) {
      setPwResetError(dbErrorMessage(err));
    } finally {
      setPwResetBusy(false);
    }
  };

  const submitInvite = async () => {
    if (!canAdmin) return deny("Only Super Admin can create staff accounts.");
    const e: Record<string, string> = {};
    if (!inviteForm.fullName.trim()) e.fullName = "Full name is required";
    if (!inviteForm.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(inviteForm.email.trim()))
      e.email = "Invalid email";
    if (!inviteForm.password) e.password = "Temporary password is required";
    else if (inviteForm.password.length < 8)
      e.password = "At least 8 characters";
    setInviteErrors(e);
    if (Object.keys(e).length > 0) return;
    const accessToken = await getAccessToken();
    if (!accessToken) {
      toast.error("Session expired", {
        description: "Please sign out and sign in again.",
      });
      return;
    }
    setInviteBusy(true);
    try {
      const res = await createStaffAccount({
        data: {
          fullName: inviteForm.fullName.trim(),
          email: inviteForm.email.trim(),
          password: inviteForm.password,
          role: inviteForm.role,
          accessToken,
        },
      });
      if (!res.ok) {
        const field =
          res.code === "duplicate" || /email/i.test(res.message)
            ? "email"
            : res.code === "weak_password"
              ? "password"
              : null;
        if (field) {
          setInviteErrors({ [field]: res.message });
        } else {
          toast.error("Could not create staff account", {
            description: res.message,
          });
        }
        return;
      }
      pushAuditLog(
        `Invited staff account ${res.user.email} as ${res.user.role === "superadmin" ? "Super Admin" : "TO Staff"} (${res.status})`,
      );
      invalidateStaff();
      setUserDialog(null);
      if (res.status === "already_staff") {
        toast.info("Already on the roster", {
          description: `${res.user.email} is already staff.`,
        });
      } else {
        toast.success(
          res.status === "linked"
            ? "Staff account linked"
            : "Staff account created",
          {
            description: `${res.user.email} — share the temporary password out-of-band.`,
          },
        );
      }
    } catch (err) {
      toast.error("Could not create staff account", {
        description: dbErrorMessage(err),
      });
    } finally {
      setInviteBusy(false);
    }
  };

  const isSelf = (id: string) => !!session?.userId && id === session.userId;
  const activeSuperadmins = staffUsers.filter(
    (u) => u.role === "superadmin" && u.isActive,
  ).length;
  // Pending suspend/reactivate, awaiting explicit confirmation. Deactivation
  // cuts a staffer off immediately and revokes their session, so it must not
  // fire from a single unconfirmed click.
  const [confirmToggle, setConfirmToggle] = useState<{
    id: string;
    suspend: boolean;
  } | null>(null);

  const toggleUserStatus = async (id: string) => {
    if (!canAdmin) return deny("Only Super Admin can manage staff access.");
    if (!(await requireLiveSession())) return;
    const u = staffUsers.find((x) => x._dbId === id);
    if (!u) return;
    if (isSelf(id) && u.isActive) {
      toast.error("Action not allowed", {
        description: "You cannot deactivate your own account.",
      });
      return;
    }
    setRowBusy((b) => ({ ...b, [id]: true }));
    try {
      await setStaffActive(id, !u.isActive);
      invalidateStaff();
      pushAuditLog(
        `${!u.isActive ? "Reactivated" : "Suspended"} staff account ${u.email}`,
      );
      toast.success(
        `Staff account ${!u.isActive ? "reactivated" : "suspended"}`,
        { description: u.email },
      );
    } catch (e) {
      toast.error("Could not update staff account", {
        description: dbErrorMessage(e),
      });
    } finally {
      setRowBusy((b) => ({ ...b, [id]: false }));
      setConfirmToggle(null);
    }
  };

  const askToggleStatus = (id: string) => {
    if (!canAdmin) return deny("Only Super Admin can manage staff access.");
    const u = staffUsers.find((x) => x._dbId === id);
    if (!u) return;
    if (isSelf(id) && u.isActive) {
      toast.error("Action not allowed", {
        description: "You cannot deactivate your own account.",
      });
      return;
    }
    if (u.isActive && u.role === "superadmin" && activeSuperadmins <= 1) {
      toast.error("Action not allowed", {
        description:
          "This is the last active superadmin. Promote another staff member first.",
      });
      return;
    }
    setConfirmToggle({ id, suspend: u.isActive });
  };

  // Permanent removal, restricted to already-suspended accounts (see
  // delete-staff-fn.ts). Deactivate -> verify -> delete is the cooling-off
  // path: suspend is reversible, this is not.
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    email: string;
    fullName: string;
  } | null>(null);
  const [deleteTyped, setDeleteTyped] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  const submitDelete = async () => {
    const target = confirmDelete;
    if (!target) return;
    if (!canAdmin) return deny("Only Super Admin can delete staff accounts.");
    setDeleteBusy(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        toast.error("Session expired", {
          description: "Please sign out and sign in again.",
        });
        return;
      }
      const res = await deleteStaffAccount({
        data: { userId: target.id, accessToken },
      });
      if (!res.ok) {
        toast.error("Could not delete staff account", {
          description: res.message,
        });
        return;
      }
      invalidateStaff();
      pushAuditLog(
        `Deleted staff account ${res.deleted.email} (${res.deleted.fullName})`,
      );
      toast.success("Staff account deleted", {
        description: res.deleted.email,
      });
      setConfirmDelete(null);
      setDeleteTyped("");
    } catch (err) {
      toast.error("Could not delete staff account", {
        description: dbErrorMessage(err),
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  const setUserRole = async (id: string, role: "staff" | "superadmin") => {
    if (!canAdmin) return deny("Only Super Admin can change user roles.");
    if (!(await requireLiveSession())) return;
    const u = staffUsers.find((x) => x._dbId === id);
    if (!u || u.role === role) return;
    if (
      isSelf(id) &&
      u.role === "superadmin" &&
      role === "staff" &&
      activeSuperadmins <= 1
    ) {
      toast.error("Action not allowed", {
        description: "You are the last active superadmin.",
      });
      return;
    }
    setRowBusy((b) => ({ ...b, [id]: true }));
    try {
      await setStaffRole(id, role);
      invalidateStaff();
      pushAuditLog(
        `Changed role for ${u.email} to ${role === "superadmin" ? "Super Admin" : "TO Staff"}`,
      );
      toast.success("Role updated", {
        description: `${u.fullName} is now ${role === "superadmin" ? "Super Admin" : "TO Staff"}`,
      });
    } catch (e) {
      toast.error("Could not update role", {
        description: dbErrorMessage(e),
      });
    } finally {
      setRowBusy((b) => ({ ...b, [id]: false }));
    }
  };

  const [auditQ, setAuditQ] = useState("");
  const [auditUser, setAuditUser] = useState("All");
  const [auditType, setAuditType] = useState("All");
  const [auditDateFrom, setAuditDateFrom] = useState("");
  const [auditDateTo, setAuditDateTo] = useState("");

  const memLogs = useLiveAuditLogs();
  const dbLogs = useAuditLogsLive();
  // Merged trail: session-memory rows (instant) + persisted DB rows.
  // Dedupe on content — a just-written memory row reappears from the DB
  // after refetch. Sorted newest-first for stable order.
  const logs = useMemo(() => {
    const merged = [...memLogs];
    const seen = new Set(
      memLogs.map((l) => `${l.date}|${l.t}|${l.who}|${l.action}`),
    );
    for (const l of dbLogs.data ?? []) {
      const key = `${l.date}|${l.t}|${l.who}|${l.action}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(l);
      }
    }
    return merged.sort((a, b) =>
      a.date !== b.date
        ? a.date < b.date
          ? 1
          : -1
        : a.t !== b.t
          ? a.t < b.t
            ? 1
            : -1
          : 0,
    );
  }, [memLogs, dbLogs.data]);
  const uniqueAuditUsers = useMemo(
    () => [...new Set(logs.map((l) => l.who))].sort(),
    [logs],
  );

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (auditUser !== "All" && l.who !== auditUser) return false;
      if (auditType !== "All" && auditActionType(l.action) !== auditType)
        return false;
      if (auditDateFrom && l.date < auditDateFrom) return false;
      if (auditDateTo && l.date > auditDateTo) return false;
      if (auditQ) {
        const q = auditQ.toLowerCase();
        if (
          !l.who.toLowerCase().includes(q) &&
          !l.action.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [logs, auditQ, auditUser, auditType, auditDateFrom, auditDateTo]);

  const {
    page: aPage,
    setPage: aSetPage,
    totalPages: aTotalPages,
    paged: aPaged,
  } = usePagination(filteredLogs, 10);

  const exportCsv = () => {
    const header = "Date,Time,User,Action,Type";
    const rows = filteredLogs.map(
      (l) =>
        `${l.date},${l.t},"${l.who}","${l.action.replace(/"/g, '""')}","${auditActionType(l.action)}"`,
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${auditDateFrom || "all"}${auditDateTo ? `-to-${auditDateTo}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit logs exported", {
      description: `${filteredLogs.length} entries saved as CSV.`,
    });
  };

  return (
    <Tabs defaultValue="users">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList className="bg-secondary">
          <TabsTrigger value="users">Manage Users</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Session Timeout</span>
          <SessionTimeoutSetting />
        </div>
      </div>

      <TabsContent value="users" className="mt-4 space-y-4">
        <div className="flex items-center gap-3">
          <Button
            className="gradient-primary text-primary-foreground"
            onClick={openInvite}
          >
            <Plus className="size-4 mr-1.5" /> Invite Staff
          </Button>
          <span className="text-xs text-muted-foreground">
            {staffUsers.length} staff · live from to_staff
          </span>
        </div>
        {staffLive.isError ? (
          <Card className="p-8 shadow-elegant border-destructive/30 text-center">
            <ShieldAlert className="size-8 mx-auto text-destructive" />
            <div className="mt-3 font-medium">Could not load staff roster</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {staffLive.error
                ? dbErrorMessage(staffLive.error)
                : "Check the Supabase connection and that migration 034 (role column) is applied."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => staffLive.refetch()}
            >
              <RotateCcw className="size-3.5 mr-1.5" /> Retry
            </Button>
          </Card>
        ) : (
          <Card className="shadow-elegant overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Staff</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Member Since</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffLive.isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Loading staff roster…
                    </TableCell>
                  </TableRow>
                ) : staffUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No staff rows found.
                    </TableCell>
                  </TableRow>
                ) : (
                  staffUsers.map((u) => {
                    const self = isSelf(u._dbId);
                    const busy = !!rowBusy[u._dbId];
                    return (
                      <TableRow key={u._dbId}>
                        <TableCell className="flex items-center gap-3 py-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {staffInitials(u.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {u.fullName}
                              {self && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-primary/30 text-primary"
                                >
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {u.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {canAdmin ? (
                            <Select
                              value={u.role}
                              disabled={busy}
                              onValueChange={(v) =>
                                setUserRole(
                                  u._dbId,
                                  v as "staff" | "superadmin",
                                )
                              }
                            >
                              <SelectTrigger className="h-7 w-[130px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem
                                  value="superadmin"
                                  className="text-xs"
                                >
                                  Super Admin
                                </SelectItem>
                                <SelectItem value="staff" className="text-xs">
                                  TO Staff
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-primary/30 text-primary"
                            >
                              {u.role === "superadmin"
                                ? "Super Admin"
                                : "TO Staff"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {u.isActive ? (
                            <Badge className="bg-success/15 text-success border-success/20 text-[10px]">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-destructive/15 text-destructive border-destructive/20 text-[10px]">
                              Deactivated
                            </Badge>
                          )}
                          {u.isActive && u.mustChangePassword && (
                            <Badge
                              className="ml-1 bg-amber-500/15 text-amber-600 border-amber-500/20 text-[10px]"
                              title="A temporary password is in effect and hasn't been replaced yet"
                            >
                              Temp password
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {u.createdAt}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {/* 043: admin-managed reset — the no-mailbox
                                fallback for a forgotten password. Available
                                to every active row INCLUDING self, since a
                                superadmin's own address can be dead too. */}
                            {u.isActive && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={busy}
                                title={
                                  self
                                    ? "Set a new password for your own account"
                                    : "Set a temporary password this staff member must replace at next sign-in"
                                }
                                onClick={() => openPwReset(u)}
                              >
                                <KeyRound className="size-4" />{" "}
                                {self ? "Change pw" : "Reset pw"}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy || self}
                              className={
                                u.isActive
                                  ? "text-destructive hover:text-destructive"
                                  : "text-success hover:text-success"
                              }
                              title={
                                self
                                  ? "You cannot change your own access"
                                  : u.isActive
                                    ? "Suspend account"
                                    : "Reactivate account"
                              }
                              onClick={() => askToggleStatus(u._dbId)}
                            >
                              {busy ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : u.isActive ? (
                                <>
                                  <Ban className="size-4" /> Suspend
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="size-4" /> Reactivate
                                </>
                              )}
                            </Button>
                            {/* Delete is a mistake-correction tool for a bad
                                invite, so it only appears once the account is
                                already suspended and its access revoked. */}
                            {!u.isActive && !self && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={busy}
                                className="text-destructive hover:text-destructive"
                                title="Delete this staff account permanently"
                                onClick={() => {
                                  setDeleteTyped("");
                                  setConfirmDelete({
                                    id: u._dbId,
                                    email: u.email,
                                    fullName: u.fullName,
                                  });
                                }}
                              >
                                <Trash2 className="size-4" /> Delete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        <Dialog
          open={!!confirmToggle}
          onOpenChange={(o) => {
            if (!o) setConfirmToggle(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {confirmToggle?.suspend
                  ? "Suspend this account?"
                  : "Reactivate this account?"}
              </DialogTitle>
              <DialogDescription className="pt-1">
                {confirmToggle?.suspend ? (
                  <>
                    <span className="font-medium text-foreground">
                      {
                        staffUsers.find((x) => x._dbId === confirmToggle?.id)
                          ?.fullName
                      }
                    </span>{" "}
                    will be signed out immediately and blocked from signing in
                    again until reactivated. Their audit history is kept. This
                    is recorded in the audit log.
                  </>
                ) : (
                  <>
                    This staff member will regain full access to the dashboard
                    according to their{" "}
                    <span className="font-medium text-foreground">role</span>.
                    This is recorded in the audit log.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => setConfirmToggle(null)}
                disabled={!!confirmToggle && !!rowBusy[confirmToggle.id]}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="h-11 gradient-primary text-primary-foreground"
                onClick={() => {
                  if (confirmToggle) toggleUserStatus(confirmToggle.id);
                }}
                disabled={!!confirmToggle && !!rowBusy[confirmToggle.id]}
              >
                {confirmToggle && rowBusy[confirmToggle.id] ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Confirm"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!confirmDelete}
          onOpenChange={(o) => {
            if (!o && !deleteBusy) {
              setConfirmDelete(null);
              setDeleteTyped("");
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete this staff account?</DialogTitle>
              <DialogDescription className="pt-1">
                This permanently removes{" "}
                <span className="font-medium text-foreground">
                  {confirmDelete?.fullName}
                </span>{" "}
                ({confirmDelete?.email}) and signs them out for good. The
                account can never be recovered — their audit history is kept,
                but the staff record is gone. This is recorded in the audit log.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="confirm-delete-email">
                Type{" "}
                <span className="font-medium text-foreground">
                  {confirmDelete?.email}
                </span>{" "}
                to confirm
              </Label>
              <Input
                id="confirm-delete-email"
                type="email"
                autoComplete="off"
                placeholder={confirmDelete?.email}
                value={deleteTyped}
                onChange={(e) => setDeleteTyped(e.target.value)}
                disabled={deleteBusy}
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => {
                  setConfirmDelete(null);
                  setDeleteTyped("");
                }}
                disabled={deleteBusy}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={submitDelete}
                disabled={
                  deleteBusy ||
                  !confirmDelete ||
                  deleteTyped.trim().toLowerCase() !==
                    confirmDelete.email.toLowerCase()
                }
              >
                {deleteBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="size-4" /> Delete permanently
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 043: admin-managed password reset */}
        <Dialog
          open={!!pwResetTarget}
          onOpenChange={(o) => {
            if (!o && !pwResetBusy) setPwResetTarget(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {pwResetTarget?.self
                  ? "Change your password"
                  : "Set a temporary password"}
              </DialogTitle>
              <DialogDescription className="pt-1">
                {pwResetTarget?.self ? (
                  <>
                    Set a new password for{" "}
                    <span className="font-medium text-foreground">
                      your own account
                    </span>
                    . You stay signed in.
                  </>
                ) : (
                  <>
                    Give{" "}
                    <span className="font-medium text-foreground">
                      {pwResetTarget?.fullName}
                    </span>{" "}
                    a temporary password and hand it over out-of-band. They'll
                    be signed out everywhere and must set their own password
                    before opening the dashboard. This is recorded in the audit
                    log.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitPwReset();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="pw-reset">
                  {pwResetTarget?.self ? "New password" : "Temporary password"}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="pw-reset"
                    type={showPwReset ? "text" : "password"}
                    value={pwResetPassword}
                    onChange={(e) => {
                      setPwResetPassword(e.target.value);
                      if (pwResetError) setPwResetError("");
                    }}
                    autoComplete="new-password"
                    disabled={pwResetBusy}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwReset((v) => !v)}
                    title={showPwReset ? "Hide password" : "Show password"}
                    aria-label={showPwReset ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPwReset ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {pwResetError && (
                  <p className="text-xs text-destructive">{pwResetError}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPwResetTarget(null)}
                  disabled={pwResetBusy}
                  className="h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={pwResetBusy || pwResetPassword.length < 8}
                  className="h-11 gradient-primary text-primary-foreground"
                >
                  {pwResetBusy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : pwResetTarget?.self ? (
                    "Update password"
                  ) : (
                    "Set temporary password"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={userDialog === "invite"}
          onOpenChange={(o) => {
            if (!o) setUserDialog(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite a staff member</DialogTitle>
              <p className="text-sm text-muted-foreground pt-1">
                Creates the auth account (auto-confirmed) and links the staff
                row in one step. Share the temporary password out-of-band — they
                should change it after first sign-in.
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>
                  Full name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={inviteForm.fullName}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, fullName: e.target.value })
                  }
                  placeholder="e.g. Juan Dela Cruz"
                  className={
                    inviteErrors.fullName
                      ? "border-destructive focus-visible:ring-destructive/30"
                      : ""
                  }
                />
                {inviteErrors.fullName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    {inviteErrors.fullName}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, email: e.target.value })
                  }
                  placeholder="staff@reef.gov"
                  className={
                    inviteErrors.email
                      ? "border-destructive focus-visible:ring-destructive/30"
                      : ""
                  }
                />
                {inviteErrors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    {inviteErrors.email}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>
                  Temporary password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showInvitePw ? "text" : "password"}
                    value={inviteForm.password}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, password: e.target.value })
                    }
                    placeholder="At least 8 characters"
                    className={
                      inviteErrors.password
                        ? "border-destructive focus-visible:ring-destructive/30 pr-10"
                        : "pr-10"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowInvitePw((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showInvitePw ? "Hide password" : "Show password"}
                  >
                    <Eye className="size-4" />
                  </button>
                </div>
                {inviteErrors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    {inviteErrors.password}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>
                  Role <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(v) =>
                    setInviteForm({
                      ...inviteForm,
                      role: v as "staff" | "superadmin",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">TO Staff</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  disabled={inviteBusy}
                  onClick={() => setUserDialog(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="gradient-primary text-primary-foreground"
                  disabled={inviteBusy}
                  onClick={submitInvite}
                >
                  {inviteBusy ? (
                    <Loader2 className="size-4 mr-1.5 animate-spin" />
                  ) : (
                    <Plus className="size-4 mr-1.5" />
                  )}
                  {inviteBusy ? "Creating…" : "Create Account"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </TabsContent>

      <TabsContent value="audit" className="mt-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by user or action…"
              value={auditQ}
              onChange={(e) => setAuditQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={auditUser} onValueChange={setAuditUser}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All users</SelectItem>
              {uniqueAuditUsers.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={auditType} onValueChange={setAuditType}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Action type" />
            </SelectTrigger>
            <SelectContent>
              {AUDIT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === "All" ? "All action types" : t}
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
              value={auditDateFrom}
              onChange={(e) => setAuditDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              To
            </Label>
            <Input
              type="date"
              value={auditDateTo}
              onChange={(e) => setAuditDateTo(e.target.value)}
              className="w-40"
            />
          </div>
          <Button variant="outline" onClick={exportCsv} className="ml-auto">
            <FileDown className="size-4 mr-1.5" /> Export CSV
          </Button>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span>
            {filteredLogs.length} of {logs.length} log
            {logs.length !== 1 ? "s" : ""}
          </span>
          {dbLogs.isFetching && (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" /> Syncing…
            </span>
          )}
        </div>
        {dbLogs.isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm flex items-center gap-2">
            <AlertCircle className="size-4 text-destructive shrink-0" />
            <span className="flex-1 text-muted-foreground">
              Could not load persisted entries — showing this session only.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => dbLogs.refetch()}
            >
              Retry
            </Button>
          </div>
        )}
        <Card className="shadow-elegant overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No audit logs match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                aPaged.map((l, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">
                      {l.date}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {l.t}
                    </TableCell>
                    <TableCell>{l.who}</TableCell>
                    <TableCell>{l.action}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px] text-muted-foreground font-normal"
                      >
                        {auditActionType(l.action)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            page={aPage}
            totalPages={aTotalPages}
            onPageChange={aSetPage}
            className="mt-4"
          />
        </Card>
      </TabsContent>
    </Tabs>
  );
}

