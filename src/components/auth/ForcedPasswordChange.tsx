import { useState } from "react";
import { KeyRound, Eye, EyeOff, Loader2, ShieldCheck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { pushAuditLog } from "@/lib/audit";
import {
  updateStaffPassword,
  signOutStaff,
  getAccessToken,
  type StaffSession,
} from "@/lib/staff-auth";
import { clearPasswordFlag } from "@/lib/clear-password-flag-fn";

export function ForcedPasswordChange({
  session,
  onDone,
}: {
  session: StaffSession;
  onDone: (s: StaffSession) => void;
}) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (pw !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const res = await updateStaffPassword(pw);
      if (!res.ok) {
        // A dead handover session can't recover here — fall back to sign-in.
        setError(res.error);
        if (/session|token|auth/i.test(res.error)) await signOutStaff();
        return;
      }
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setError("Your session expired. Sign in again with the new password.");
        await signOutStaff().catch(() => {});
        return;
      }
      const flag = await clearPasswordFlag({ data: { accessToken } }).catch(
        () => ({ ok: false as const }),
      );
      if (!flag.ok) {
        // Password changed but the dashboard is still gated: sign out and
        // let the next sign-in land on a clean, unflagged session.
        toast.error("Almost done", {
          description:
            "Your password was updated. Sign in again to continue to the dashboard.",
        });
        await signOutStaff().catch(() => {});
        return;
      }
      pushAuditLog(`Completed forced password change (${session.email})`);
      onDone({ ...session, mustChangePassword: false });
      toast.success("Password set", {
        description: "You're signed in with your own password from now on.",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update password.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left hero — reuses reset screen layout */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 gradient-primary text-primary-foreground overflow-hidden">
        <div className="relative flex items-center gap-2 font-display font-bold text-xl">
          <img
            src="/logo.png"
            alt="Mabini, Batangas logo"
            className="size-9 rounded-xl object-contain"
          />
          Mabini, Batangas
        </div>
        <div className="relative space-y-6 max-w-md">
          <h1 className="text-5xl font-display font-bold leading-[1.05]">
            Smarter tourism. Sustainable seas.
          </h1>
          <p className="text-primary-foreground/85 text-lg">
            A unified platform for managing dive tourism, identifying visitors,
            and supporting sustainable coastal development.
          </p>
        </div>
        <div className="relative text-sm text-primary-foreground/70">
          © 2026 Mabini, Batangas — Tourism Office
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-md space-y-6">
          <div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <h2 className="mt-4 text-3xl font-display font-bold text-foreground">
              Set your new password
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You're signed in with a temporary password set by a Super Admin.
              Choose your own password to open the dashboard — all previous
              sessions were already ended.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forced-new-pw">New password</Label>
              <div className="relative">
                <Input
                  id="forced-new-pw"
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  autoComplete="new-password"
                  className="pr-10"
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  title={showPw ? "Hide password" : "Show password"}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPw ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="forced-confirm-pw">Confirm password</Label>
              <Input
                id="forced-confirm-pw"
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                disabled={busy}
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="w-full h-11 gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                Save password <ChevronRight className="size-4 ml-1" />
              </>
            )}
          </Button>
          {error && (
            <p className="text-xs text-center text-destructive">{error}</p>
          )}
          <p className="text-xs text-center text-muted-foreground">
            Signed in as {session.email}
          </p>
        </form>
      </div>
    </div>
  );
}


