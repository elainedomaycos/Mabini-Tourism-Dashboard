import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "./supabase";

export type StaffRole = "staff" | "superadmin";

export interface StaffSession {
  userId: string;
  email: string;
  fullName: string;
  role: StaffRole;
}

/** Session available to the whole dashboard shell (drives useRole). */
export const StaffSessionContext = createContext<StaffSession | null>(null);

export function useStaffSessionValue(): StaffSession | null {
  return useContext(StaffSessionContext);
}

type SignInResult =
  | { ok: true; session: StaffSession }
  | { ok: false; error: string };

function toSession(data: {
  id: string;
  email: string;
  full_name: string;
  role?: string | null;
}): StaffSession {
  // Unknown role values fail closed to staff; superadmin is only ever
  // assigned explicitly (034 backfill or superadmin promotion).
  const role: StaffRole = data.role === "superadmin" ? "superadmin" : "staff";
  return { userId: data.id, email: data.email, fullName: data.full_name, role };
}

async function readStaffRow(
  userId: string
): Promise<{ row: StaffSession | null; error?: string }> {
  const { data, error } = await supabase
    .from("to_staff")
    .select("id, email, full_name, is_active, role")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    // Pre-034 database (no role column yet): fall back to the legacy select
    // and treat the row as superadmin — exactly matching 034's backfill, so
    // login keeps working across the migration window.
    if (/column .*role|role.*column|42703/i.test(error.message)) {
      const legacy = await supabase
        .from("to_staff")
        .select("id, email, full_name, is_active")
        .eq("id", userId)
        .maybeSingle();
      if (legacy.error) return { row: null, error: legacy.error.message };
      if (!legacy.data) return { row: null };
      if (!legacy.data.is_active) return { row: null, error: "deactivated" };
      return {
        row: { ...toSession(legacy.data), role: "superadmin" },
      };
    }
    return { row: null, error: error.message };
  }
  if (!data) return { row: null };
  if (!data.is_active) return { row: null, error: "deactivated" };
  return { row: toSession(data) };
}

/**
 * Staff sign-in against the SINSAY Supabase project. Any authenticated user
 * can attempt login, but only active to_staff rows (migration 030) are
 * admitted. Two tiers (034): staff (operations) vs superadmin (full access,
 * incl. users/roles/settings). Enforcement lives in RLS — the role here
 * only drives UI gating.
 */
export async function signInStaff(
  email: string,
  password: string
): Promise<SignInResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "Dashboard is not connected to Supabase yet." };
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    await supabase.auth.signOut().catch(() => {});
    return { ok: false, error: error?.message || "Sign-in failed." };
  }
  const { row, error: rowError } = await readStaffRow(data.user.id);
  if (!row) {
    await supabase.auth.signOut().catch(() => {});
    return {
      ok: false,
      error:
        rowError === "deactivated"
          ? "This staff account has been deactivated."
          : "This account is not registered as Tourism Office staff.",
    };
  }
  return { ok: true, session: row };
}

export async function signOutStaff(): Promise<void> {
  await supabase.auth.signOut().catch(() => {});
}

/** Current access token for authenticated server-function calls. */
export async function getAccessToken(): Promise<string | null> {
  const {
    data: { session: s },
  } = await supabase.auth.getSession();
  return s?.access_token ?? null;
}

export type SessionCheck =
  | { ok: true; session: StaffSession }
  | { ok: false; title: string; message: string };

/**
 * Pre-write gate for every live mutation. Confirms a live, verified staff
 * session exists BEFORE touching the database. Why: an expired/invalid JWT
 * alongside a valid anon key degrades to the anon context server-side, and
 * every staff RLS policy then rejects the write with a confusing
 * row-security error. Catching it here turns that into "sign in again".
 * A single refresh attempt is made before giving up.
 */
export async function requireStaffSession(): Promise<SessionCheck> {
  const verify = async (userId: string): Promise<SessionCheck> => {
    const { row, error } = await readStaffRow(userId);
    if (row) return { ok: true, session: row };
    if (error === "deactivated") {
      return {
        ok: false,
        title: "Account deactivated",
        message: "This staff account has been deactivated. Please sign in again.",
      };
    }
    return {
      ok: false,
      title: "Not staff",
      message: "This account is not registered as Tourism Office staff.",
    };
  };
  try {
    const {
      data: { session: s },
    } = await supabase.auth.getSession();
    if (s?.user) {
      const checked = await verify(s.user.id);
      if (checked.ok) return checked;
      // Verified-missing row (removed/deactivated mid-session): sign out so
      // the gate drops back to login instead of failing writes opaquely.
      if (checked.title !== "Not staff") {
        await supabase.auth.signOut().catch(() => {});
      }
      return checked;
    }
  } catch {
    /* fall through to refresh attempt */
  }
  try {
    const { data: ref, error: refError } = await supabase.auth.refreshSession();
    if (!refError && ref.session?.user) {
      return verify(ref.session.user.id);
    }
  } catch {
    /* fall through to expired */
  }
  return {
    ok: false,
    title: "Session expired",
    message: "Your session expired. Please sign out and sign in again.",
  };
}

/**
 * Write-gate shorthand: confirms a live staff session (refreshing once if
 * needed), otherwise signs out — dropping back to login via the auth
 * listener below — and explains why. Returns false when the caller must
 * abort the write. Call it inside the live branch only, so demo-mode mock
 * writes keep working with no session at all.
 */
export async function requireLiveSession(): Promise<boolean> {
  const staff = await requireStaffSession();
  if (staff.ok) return true;
  await signOutStaff();
  toast.error(staff.title, { description: staff.message });
  return false;
}

/**
 * Restores the persisted Supabase session on reload (default persistence:
 * refresh-token rotation) and re-verifies the staff row — a removed or
 * deactivated staffer loses access immediately. Also subscribes to auth
 * changes so sign-out (including the write-gate sign-out above) drops back
 * to login, and fresh sign-ins re-verify without a reload.
 */
export function useStaffSession() {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let live = true;
    const verifyUser = async (userId: string | undefined) => {
      if (!userId) {
        if (live) setChecking(false);
        return;
      }
      try {
        const { row } = await readStaffRow(userId);
        if (!live) return;
        if (row) {
          setSession(row);
        } else {
          await supabase.auth.signOut().catch(() => {});
          setSession(null);
        }
      } finally {
        if (live) setChecking(false);
      }
    };
    (async () => {
      try {
        const {
          data: { session: s },
        } = await supabase.auth.getSession();
        await verifyUser(s?.user?.id);
      } catch {
        if (live) setChecking(false);
      }
    })();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
        setChecking(false);
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void verifyUser(s?.user?.id);
      }
    });
    return () => {
      live = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, checking, setSession };
}
