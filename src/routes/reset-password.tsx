import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MailCheck,
  TriangleAlert,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  signOutStaff,
  updateStaffPassword,
} from "@/lib/staff-auth";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

type LinkState = "checking" | "valid" | "invalid";

function ResetPassword() {
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Supabase's client auto-consumes the recovery token from the URL on load
  // (detectSessionInUrl defaults to true, implicit flow), which establishes a
  // session scoped to changing the password. Our job is only to decide whether
  // that happened — PASSWORD_RECOVERY can fire before this component mounts, so
  // the session is polled rather than assumed from the event alone.
  useEffect(() => {
    let live = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!live) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setLinkState("valid");
      }
    });
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!live) return;
      setLinkState(session ? "valid" : "invalid");
    })();
    // A cold load with no token resolves almost immediately, but the implicit
    // flow can take a beat; don't let a slow token swap read as "invalid".
    const t = setTimeout(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (live) setLinkState(session ? "valid" : "invalid");
    }, 1200);
    return () => {
      live = false;
      clearTimeout(t);
      subscription.unsubscribe();
    };
  }, []);

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
    const res = await updateStaffPassword(pw);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      // A dead session can't be recovered from this screen.
      if (/expired|already used/i.test(res.error)) setLinkState("invalid");
      return;
    }
    setDone(true);
    // Drop the recovery session so the new password is proven on a fresh
    // sign-in rather than inherited from the reset link.
    await signOutStaff();
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen grid lg:grid-cols-2 bg-background">
        {/* Left hero */}
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
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { v: "Tourists", Icon: Waves },
                { v: "Eco-Dive ID", Icon: KeyRound },
                { v: "Analytics", Icon: CheckCircle2 },
              ].map((s) => (
                <div
                  key={s.v}
                  className="rounded-xl bg-white/10 backdrop-blur px-4 py-4 border border-white/15"
                >
                  <s.Icon className="size-6" />
                  <div className="mt-2 text-sm font-medium text-primary-foreground/90">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative text-sm text-primary-foreground/70">
            © 2026 Mabini, Batangas — Tourism Office
          </div>
        </div>

        {/* Right form */}
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-6">
            {!isSupabaseConfigured ? (
              <Card className="p-6 shadow-elegant">
                <div className="flex items-start gap-3">
                  <TriangleAlert className="size-5 shrink-0 text-destructive" />
                  <div>
                    <h2 className="font-semibold">Not connected</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Password reset requires Supabase to be configured. Add
                      VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env and
                      restart.
                    </p>
                  </div>
                </div>
              </Card>
            ) : linkState === "checking" ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Checking your reset link…
                </p>
              </div>
            ) : linkState === "invalid" ? (
              <Card className="p-6 shadow-elegant">
                <div className="flex flex-col items-center text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                    <TriangleAlert className="size-7" />
                  </div>
                  <h2 className="mt-4 font-display text-xl font-semibold">
                    Link expired or already used
                  </h2>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Password reset links are single-use and time-limited. Go
                    back to the sign-in page to request a new one.
                  </p>
                  <Button
                    className="mt-6 w-full h-11 gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
                    onClick={() => {
                      window.location.href = "/";
                    }}
                  >
                    <>
                      <ArrowLeft className="size-4 mr-1" /> Back to sign in
                    </>
                  </Button>
                </div>
              </Card>
            ) : done ? (
              <Card className="p-6 shadow-elegant">
                <div className="flex flex-col items-center text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                    <MailCheck className="size-7" />
                  </div>
                  <h2 className="mt-4 font-display text-xl font-semibold">
                    Password updated
                  </h2>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Your new password is active. Sign in with it to continue to
                    the dashboard.
                  </p>
                  <Button
                    className="mt-6 w-full h-11 gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
                    onClick={() => {
                      window.location.href = "/";
                    }}
                  >
                    <>
                      <ArrowLeft className="size-4 mr-1" /> Back to sign in
                    </>
                  </Button>
                </div>
              </Card>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <KeyRound className="size-5" />
                  </div>
                  <h2 className="mt-4 text-3xl font-display font-bold text-foreground">
                    Set a new password
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose a new password for your Tourism Office account.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-pw">New password</Label>
                  <div className="relative">
                    <Input
                      id="new-pw"
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
                  <Label htmlFor="confirm-pw">Confirm password</Label>
                  <Input
                    id="confirm-pw"
                    type={showPw ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    disabled={busy}
                  />
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
                      Update password <ArrowLeft className="size-4 ml-1 rotate-180" />
                    </>
                  )}
                </Button>
                {error && (
                  <p className="text-xs text-center text-destructive">{error}</p>
                )}
                <p className="text-xs text-center text-muted-foreground">
                  <Link
                    to="/"
                    search={{
                      section: "overview",
                      q: "",
                      status: "All",
                      nationality: "All",
                      level: "All",
                      site: "All",
                      difficulty: "All",
                      siteType: "All",
                      dateFrom: "",
                      dateTo: "",
                      tab: "",
                      globalDateRange: "30d",
                      globalDateFrom: "",
                      globalDateTo: "",
                    }}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <ArrowLeft className="size-3.5" /> Back to sign in
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}