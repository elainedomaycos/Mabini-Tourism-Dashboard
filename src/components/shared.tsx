import { useState, useEffect, useRef, type ReactNode } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

export function useCountUp(target: number, duration = 900) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);
  return { ref, val };
}

export function CountUp({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const m = value.match(/[\d,]+/);
  const num = m ? Number(m[0].replace(/,/g, "")) : NaN;
  const prefix = m ? value.slice(0, m.index) : "";
  const suffix = m ? value.slice((m.index ?? 0) + m[0].length) : "";
  const { ref, val } = useCountUp(Number.isNaN(num) ? 0 : num);
  if (Number.isNaN(num)) return <span className={className}>{value}</span>;
  return (
    <span ref={ref} className={className}>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  // Previously used framer-motion whileInView which stays hidden (opacity 0)
  // when inside hidden TabsContent (display:none). This caused all charts
  // (Recharts ResponsiveContainer) to measure 0 and stay blank in Analytics.
  // Fix: render immediately without viewport animation. Keeps layout stable
  // for Recharts measurement.
  void delay;
  return <div className={className}>{children}</div>;
}

export function PageTransition({
  section,
  children,
}: {
  section: string;
  children: ReactNode;
}) {
  const mounted = useMounted();
  if (!mounted) return <div>{children}</div>;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={section}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function StatCard({ icon: Icon, label, value, delta, up = true }: any) {
  return (
    <Card className="p-5 shadow-elegant border-border/60 hover:border-primary/30 hover:shadow-glow-sm transition-all hover-lift h-full flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 text-3xl font-display font-bold tracking-tight">
            <CountUp value={value} />
          </div>
        </div>
        <div className="size-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
          <Icon className="size-5" />
        </div>
      </div>
      {delta ? (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium ${
              up
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {up ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {delta}
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      ) : (
        <div className="mt-3 h-[22px]" aria-hidden />
      )}
    </Card>
  );
}

export function SectionCard({ title, action, children, className = "" }: any) {
  return (
    <Card className={`p-5 shadow-elegant border-border/60 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-success/10 text-success border-success/20",
    Approved: "bg-success/10 text-success border-success/20",
    Completed: "bg-success/10 text-success border-success/20",
    Published: "bg-success/10 text-success border-success/20",
    Pending: "bg-warning/15 text-warning-foreground border-warning/30",
    Scheduled: "bg-warning/15 text-warning-foreground border-warning/30",
    Expiring: "bg-warning/15 text-warning-foreground border-warning/30",
    Draft: "bg-muted text-muted-foreground border-border",
    Expired: "bg-muted text-muted-foreground border-border",
    Archived: "bg-muted text-muted-foreground border-border",
    Rejected: "bg-destructive/10 text-destructive border-destructive/20",
    Suspended: "bg-destructive/10 text-destructive border-destructive/20",
    Overdue: "bg-destructive/10 text-destructive border-destructive/20",
    Active_dives: "bg-info/10 text-info border-info/20",
  };
  return (
    <Badge variant="outline" className={`${map[status] ?? ""} font-medium`}>
      {status}
    </Badge>
  );
}

export function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-secondary/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}

export function ActiveFilterBadges({
  filters,
  onRemove,
}: {
  filters: { key: string; label: string }[];
  onRemove: (key: string) => void;
}) {
  if (filters.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {filters.map((f) => (
        <Badge
          key={f.key}
          variant="secondary"
          className="gap-1 pl-2 pr-1 py-0.5 text-xs"
        >
          {f.label}
          <button
            onClick={() => onRemove(f.key)}
            className="ml-0.5 rounded-full hover:bg-muted p-0.5"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

export function EntityLink({
  onClick,
  children,
  className = "",
}: {
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`text-foreground underline decoration-dotted underline-offset-2 hover:text-primary hover:decoration-solid transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

export function DrilldownDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  stats,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  subtitle?: string;
  stats?: { label: string; value: string | number; icon?: any }[];
  children?: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{title}</DialogTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </DialogHeader>
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.map((s) => (
              <Card key={s.label} className="p-3 shadow-elegant">
                <div className="flex items-center gap-2">
                  {s.icon && (
                    <div className="size-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                      <s.icon className="size-4" />
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </div>
                    <div className="text-lg font-display font-bold">
                      {s.value}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}
