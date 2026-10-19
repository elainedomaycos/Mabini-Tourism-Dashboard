import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// NOTE on placement: mirrors create-staff-fn.ts — this must NOT live under
// src/server/** (the repo's import-protection bans client imports of that
// path). The SUPABASE_SERVICE_ROLE_KEY is read from process.env inside the
// handler, which only ever executes on the server.
//
// Why this bypasses RLS rather than adding a DELETE policy: to_staff
// deliberately has SELECT + UPDATE only (030:35, 034:45) and no DELETE
// anywhere — the same convention as dive_sites (033:4) and establishments
// (035:5). Keeping deletion in a service-role server function means the
// client never gains a DELETE grant, and every guard below is enforced
// server-side where a tampered client cannot bypass it.

const inputSchema = z.object({
  userId: z.string().uuid("Invalid user id"),
  // Caller's own access token (supabase-js keeps it in localStorage, so it
  // is passed explicitly — server functions don't forward it automatically).
  accessToken: z.string().min(1),
});

export type DeleteStaffInput = z.infer<typeof inputSchema>;

export type DeleteStaffResult =
  | { ok: true; deleted: { id: string; email: string; fullName: string } }
  | {
      ok: false;
      code:
        | "unauthorized"
        | "forbidden"
        | "self_delete"
        | "last_superadmin"
        | "not_found"
        | "misconfigured"
        | "failed";
      message: string;
    };

const fail = (
  code: Extract<DeleteStaffResult, { ok: false }>["code"],
  message: string
): DeleteStaffResult => ({ ok: false, code, message });

/**
 * Permanently removes a staff account — the mistake-correction tool for a
 * bad invite (typo'd address, duplicate person, someone who was never staff).
 *
 * Deliberately restricted to ALREADY-SUSPENDED accounts: the UI only offers
 * it on deactivated rows, and while an auth user is required to be confirmed
 * active staff to reach this, the suspended-only rule is what gives an
 * accidental removal a cooling-off window. Suspend is reversible; delete is
 * not.
 *
 * Deleting the auth user is what does the work — to_staff.id references
 * auth.users(id) ON DELETE CASCADE (030:20), so the staff row disappears with
 * it and no DELETE on to_staff is ever needed.
 *
 * What is NOT recoverable: the auth account, the to_staff row, and the audit
 * FK (audit_logs.staff_id is ON DELETE SET NULL, 038:11 — the denormalized
 * staff_email on those entries survives, so the trail stays readable).
 */
export const deleteStaffAccount = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || "Invalid input.");
    }
    return parsed.data;
  })
  .handler(async ({ data }): Promise<DeleteStaffResult> => {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return fail(
        "misconfigured",
        "Staff deletion isn't configured on the server (service key missing)."
      );
    }
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Verify the caller: a valid JWT belonging to an active superadmin.
    // Never trust a client-asserted role — the tier comes from to_staff.
    const {
      data: { user: caller },
      error: callerError,
    } = await admin.auth.getUser(data.accessToken);
    if (callerError || !caller) {
      return fail("unauthorized", "Your session is invalid. Please sign in again.");
    }
    const { data: callerRow, error: callerRowError } = await admin
      .from("to_staff")
      .select("role, is_active")
      .eq("id", caller.id)
      .maybeSingle();
    if (callerRowError || !callerRow) {
      return fail("forbidden", "Only superadmins can delete staff accounts.");
    }
    const callerRole = (callerRow as { role?: string | null }).role;
    const callerActive = (callerRow as { is_active?: boolean }).is_active !== false;
    if (!callerActive || callerRole !== "superadmin") {
      return fail("forbidden", "Only superadmins can delete staff accounts.");
    }

    // 2. No self-deletion — an admin must never be able to lock the last
    // superadmin out of their own roster.
    if (caller.id === data.userId) {
      return fail("self_delete", "You cannot delete your own account.");
    }

    // 3. Resolve the target. A missing row means it was already deleted;
    // report it rather than silently succeeding.
    const { data: target, error: targetError } = await admin
      .from("to_staff")
      .select("id, email, full_name, role, is_active")
      .eq("id", data.userId)
      .maybeSingle();
    if (targetError) {
      return fail("failed", `Staff lookup failed: ${targetError.message}`);
    }
    if (!target) {
      return fail("not_found", "That account is no longer on the staff roster.");
    }

    // 4. Last-active-superadmin guard: removing the final superadmin would
    // leave the dashboard with nobody who can manage staff or settings.
    const targetRole = (target as { role?: string | null }).role;
    if (targetRole === "superadmin") {
      const { count, error: countError } = await admin
        .from("to_staff")
        .select("id", { count: "exact", head: true })
        .eq("role", "superadmin")
        .eq("is_active", true);
      if (countError) {
        return fail("failed", `Could not verify superadmin count: ${countError.message}`);
      }
      if ((count ?? 0) <= 1) {
        return fail(
          "last_superadmin",
          "This is the last active superadmin. Promote another staff member first."
        );
      }
    }

    // 5. Delete the auth user; the staff row cascades away with it (030:20).
    const { error: deleteError } = await admin.auth.admin.deleteUser(data.userId);
    if (deleteError) {
      return fail("failed", `Could not delete the account: ${deleteError.message}`);
    }
    return {
      ok: true,
      deleted: {
        id: (target as { id: string }).id,
        email: (target as { email: string }).email,
        fullName: (target as { full_name: string }).full_name,
      },
    };
  });