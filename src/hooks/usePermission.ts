import { useMemo, useCallback } from "react";
import { toast } from "sonner";
import { ShieldCheck, Shield } from "lucide-react";
import { useStaffSessionValue, type StaffRole } from "@/lib/staff-auth";

export type Role = StaffRole;

export const ROLE_META: Record<
  Role,
  { label: string; desc: string; className: string; icon: any }
> = {
  superadmin: {
    label: "Super Admin",
    desc: "Full access — manage users, config & content",
    className: "bg-primary/15 text-primary border-primary/30",
    icon: ShieldCheck,
  },
  staff: {
    label: "TO Staff",
    desc: "Operations — queues, registries & announcements",
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30",
    icon: Shield,
  },
};

export function useRole() {
  const session = useStaffSessionValue();
  return useMemo(() => {
    // No session (shouldn't happen behind the gate): fail closed on admin,
    // stay permissive on operations (writes are still RLS-enforced).
    const role: Role = session?.role === "superadmin" ? "superadmin" : "staff";
    return { role, canAct: true, canAdmin: role === "superadmin" };
  }, [session?.role]);
}

export function usePermission() {
  const { canAct, canAdmin } = useRole();
  const deny = useCallback(
    (msg = "Read-only view — this action is locked.") => {
      toast.error("Action locked", { description: msg });
    },
    [],
  );
  return { canAct, canAdmin, deny };
}
