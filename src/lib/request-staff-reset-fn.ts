import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// NOTE on placement: mirrors create-staff-fn.ts — this must NOT live under
// src/server/** (the repo's import-protection bans client imports of that
// path). The service-role key is read from process.env inside the handler,
// which only ever executes on the server.

const inputSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email").max(320),
});

export type StaffResetRequestResult =
  | { ok: true }
  | {
      ok: false;
      code: "misconfigured" | "failed" | "rate_limited";
      message: string;
    };

const fail = (
  code: Extract<StaffResetRequestResult, { ok: false }>["code"],
  message: string
): StaffResetRequestResult => ({ ok: false, code, message });

/**
 * Absolute origin the recovery link returns to. This is deliberately NOT
 * accepted from the client: a caller-supplied redirect would turn this
 * endpoint into an open redirect that mails the recovery token to an
 * attacker's domain. Falls back to the Vite dev port (vite.config.ts).
 */
function siteOrigin(): string {
  const configured = (
    process.env.VITE_SITE_URL ||
    process.env.SITE_URL ||
    ""
  ).trim();
  if (configured) return configured.replace(/\/+$/, "");
  return "http://localhost:8080";
}

/**
 * Emails a password-recovery link, but ONLY to an address that is already an
 * active row in to_staff.
 *
 * This gate exists because the dashboard and the tourist-facing app share one
 * Supabase project, so "Allow users to sign up" must stay ON for the app. That
 * setting also makes Supabase's /recover endpoint mint an auth.users row for
 * any address submitted to it — letting strangers create unlimited accounts
 * and burn the project's email rate limit, which would in turn block genuine
 * staff resets. Checking to_staff first means /recover is only ever reached
 * for accounts that already exist, so it never creates anything.
 *
 * Every non-staff path returns the same success as a real send: an
 * unauthenticated caller must not be able to probe which addresses belong to
 * staff. Only a project-wide rate limit is surfaced, which is identical for
 * every address.
 */
export const requestStaffPasswordReset = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || "Invalid input.");
    }
    return parsed.data;
  })
  .handler(async ({ data }): Promise<StaffResetRequestResult> => {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !serviceKey || !anonKey) {
      return fail(
        "misconfigured",
        "Password reset isn't configured on the server (service key missing)."
      );
    }

    // Service role: to_staff is unreadable to logged-out callers (RLS pins
    // select to auth.uid() = id), so this check cannot run on the client.
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: staff, error: lookupError } = await admin
      .from("to_staff")
      .select("id")
      .ilike("email", data.email)
      .eq("is_active", true)
      .maybeSingle();

    if (lookupError) {
      // Fail closed on SENDING, but stay silent to the caller: a lookup
      // failure must not become an oracle for which addresses are staff.
      console.warn("reset staff lookup failed:", lookupError.message);
      return { ok: true };
    }
    if (!staff) return { ok: true };

    // Anon client for the send itself, matching the normal client-side path
    // (and any recovery-token auditing Supabase does on that endpoint).
    const anon = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: sendError } = await anon.auth.resetPasswordForEmail(
      data.email,
      { redirectTo: `${siteOrigin()}/reset-password` }
    );
    if (sendError) {
      // Rate limiting is per-project, not per-account, so surfacing it
      // reveals nothing about this particular address.
      if (/rate limit|too many|security purposes/i.test(sendError.message)) {
        return fail(
          "rate_limited",
          "Too many reset requests. Please wait a few minutes and try again."
        );
      }
      console.warn("reset email send failed:", sendError.message);
      return fail(
        "failed",
        "We couldn't send the reset email. Please try again shortly."
      );
    }
    return { ok: true };
  });