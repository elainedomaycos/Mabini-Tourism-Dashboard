import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabase";

export interface StaffSession {
  userId: string;
  email: string;
  fullName: string;
}

type SignInResult =
  | { ok: true; session: StaffSession }
  | { ok: false; error: string };

async function readStaffRow(
  userId: string
): Promise<{ row: StaffSession | null; error?: string }> {
  const { data, error } = await supabase
    .from("to_staff")
    .select("id, email, full_name, is_active")
    .eq("id", userId)
    .maybeSingle();
  if (error) return { row: null, error: error.message };
  if (!data) return { row: null };
  if (!data.is_active) return { row: null, error: "deactivated" };
  return {
    row: { userId: data.id, email: data.email, fullName: data.full_name },
  };
}

/**
 * Staff sign-in against the SINSAY Supabase project. Any authenticated user
 * can attempt login, but only active to_staff rows (migration 030) are
 * admitted. Single-role system: every active row is a superadmin.
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

/**
 * Restores the persisted Supabase session on reload (default persistence:
 * refresh-token rotation) and re-verifies the staff row — a removed or
 * deactivated staffer loses access immediately.
 */
export function useStaffSession() {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { session: s },
        } = await supabase.auth.getSession();
        if (!s?.user) return;
        const { row } = await readStaffRow(s.user.id);
        if (row) {
          setSession(row);
        } else {
          await supabase.auth.signOut().catch(() => {});
        }
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  return { session, checking, setSession };
}
