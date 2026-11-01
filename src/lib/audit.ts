import { useState, useEffect } from "react";
import { logAuditEvent } from "./queries";
import { auditLogs, type AuditEntry } from "./mock-data";

export type { AuditEntry };

export const liveAuditLogs: AuditEntry[] = [...auditLogs];
// Dual-write audit trail: unshift to memory immediately (UI stays instant)
// and persist to audit_logs (038) in the background, fire-and-forget — a
// failed insert never fails the action. Attributed to the signed-in staffer
// via setAuditWho().
export let currentAuditWho = "staff@local";
export function setAuditWho(email: string) {
  currentAuditWho = email;
}
export const auditLogListeners = new Set<() => void>();
export function pushAuditLog(action: string, entity?: string) {
  const now = new Date();
  liveAuditLogs.unshift({
    date: now.toISOString().slice(0, 10),
    t: now.toTimeString().slice(0, 5),
    who: currentAuditWho,
    action,
  });
  auditLogListeners.forEach((fn) => fn());
  void logAuditEvent(action, entity);
}
export function useLiveAuditLogs() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((x) => x + 1);
    auditLogListeners.add(fn);
    return () => {
      auditLogListeners.delete(fn);
    };
  }, []);
  // Fresh copy each render so downstream useMemo sees new entries (the
  // module array mutates in place and keeps its identity).
  return [...liveAuditLogs];
}

export const AUDIT_TYPES = [
  "All",
  "Approval",
  "Rejection",
  "Verification",
  "Announcement",
  "Forward",
  "Tourist",
  "Dive Site",
  "Report",
  "Config",
  "Revert",
  "Other",
];
export function auditActionType(action: string): string {
  if (action.includes("Approved")) return "Approval";
  if (action.includes("Rejected")) return "Rejection";
  if (action.includes("Verified")) return "Verification";
  if (action.includes("Forwarded") || action.includes("Downloaded"))
    return "Forward";
  if (action.includes("Reverted")) return "Revert";
  if (action.includes("Pushed") || action.includes("announcement"))
    return "Announcement";
  if (action.includes("Suspended") || action.includes("Registered tourist"))
    return "Tourist";
  if (action.includes("Added dive site")) return "Dive Site";
  if (action.includes("Generated")) return "Report";
  if (action.includes("Updated system")) return "Config";
  return "Other";
}
