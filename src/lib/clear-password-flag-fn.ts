import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// NOTE on placement: mirrors create-staff-fn.ts — this must NOT live under
// src/server/** (the repo's import-protection bans client imports of that
// path). The SUPABASE_SERVICE_ROLE_KEY is read from process.env inside the
// handler, which only ever executes on the server.
//
// Why this exists: after a Super Admin reset (reset-staff-password-fn.ts),
// the staffer must set their own password before using the dashboard. The
// password itself they can change with their own session via
// supabase.auth.updateUser — but the to_staff flag cannot be cleared
// client-side, because 034 deliberately gives staff no UPDATE path on
// to_staff. This fn is the staff-side, self-only escape hatch.

const inputSchema = z.object({
  accessToken: z.string().min(1),
});

export type ClearPasswordFlagResult =
  | { ok: true }
  | {
      ok: false;
      code: "unauthorized" | "forbidden" | "misconfigured" | "failed";
      message: string;
    };

const fail = (
  code: Extract<ClearPasswordFlagResult, { ok: false }>["code"],
  message: string,
): ClearPasswordFlagResult => ({ ok: false, code, message });

/**
 * Clears the caller's OWN must_change_password flag (043). The access token
 * proves who is asking: the row written is auth.uid()'s, never a
 * client-chosen id, so a compromised token can at most flip the flag off for
 * the account it belongs to.
 */
export const clearPasswordFlag = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error("Invalid input.");
    }
    return parsed.data;
  })
  .handler(async ({ data }): Promise<ClearPasswordFlagResult> => {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return fail(
        "misconfigured",
        "Password setup isn't configured on the server (service key missing).",
      );
    }
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // The token must decode to a live user; that user is the row we clear.
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(data.accessToken);
    if (userError || !user) {
      return fail(
        "unauthorized",
        "Your session is invalid. Please sign in again.",
      );
    }

    // Active staff only — a suspended row was never holding a dashboard open,
    // and its flag (if any) can wait for reactivation.
    const { error: updateError } = await admin
      .from("to_staff")
      .update({ must_change_password: false })
      .eq("id", user.id)
      .eq("is_active", true);
    if (updateError) {
      return fail(
        "failed",
        `Could not save your new password: ${updateError.message}`,
      );
    }
    return { ok: true };
  });
