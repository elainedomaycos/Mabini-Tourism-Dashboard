import { useState } from "react";
import {
  Anchor,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  Users,
  Fingerprint,
  BarChart3,
  Waves,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { setAuditWho, pushAuditLog } from "@/lib/audit";
import {
  signInStaff,
  type StaffSession,
} from "@/lib/staff-auth";

export function Login({ onLogin }: { onLogin: (s: StaffSession) => void }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pw) {
      setError("Enter your staff email and password.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await signInStaff(email.trim(), pw);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    // Attribute before logging: the Dashboard effect sets the same value on
    // mount, but the entry must carry the sign-in identity even if that
    // effect hasn't run yet.
    setAuditWho(res.session.email);
    pushAuditLog(`Signed in as ${res.session.email}`);
    onLogin(res.session);
  };
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left hero */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 pl-20 gradient-primary text-primary-foreground overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, oklch(1 0 0 / 0.4), transparent 40%), radial-gradient(circle at 80% 80%, oklch(1 0 0 / 0.25), transparent 40%)",
          }}
        />
        <div className="relative flex items-center gap-2 font-display font-bold text-2xl">
          <img
            src="/logo.png"
            alt="Mabini, Batangas logo"
            className="size-10 rounded-xl object-contain"
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
              { v: "Tourists", Icon: Users },
              { v: "Eco-Dive ID", Icon: Fingerprint },
              { v: "Analytics", Icon: BarChart3 },
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
        <form onSubmit={submit} className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-2 font-display font-bold text-xl text-foreground">
            <div className="size-9 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground">
              <Waves className="size-5" />
            </div>
            Mabini, Batangas
          </div>
          <div>
            <Badge
              variant="secondary"
              className="bg-primary-soft text-primary border-0"
            >
              Tourism Office Dashboard
            </Badge>
            <h2 className="mt-3 text-3xl font-display font-bold text-foreground">
              Welcome back
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your account
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw">Password</Label>
              <div className="relative">
                <Input
                  id="pw"
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="pr-10"
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
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                defaultChecked
                className="rounded accent-[var(--color-primary)]"
              />
              Keep me signed in
            </label>
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
                Sign in <ChevronRight className="size-4 ml-1" />
              </>
            )}
          </Button>
          {error && (
            <p className="text-xs text-center text-destructive">{error}</p>
          )}
          {/* Staff addresses don't always back a real mailbox (043), so
              password recovery was moved from an emailed link to a
              superadmin-managed flow in Settings → Manage Users. */}
          <p className="text-xs text-center text-muted-foreground">
            Forgot your password? Ask a Super Admin to set you a temporary one
            (Settings → Manage Users).
          </p>
          <p className="text-xs text-center text-muted-foreground">
            Protected by <ShieldCheck className="inline size-3.5 -mt-0.5" />{" "}
            Mabini, Batangas security
          </p>
        </form>
      </div>
    </div>
  );
}


