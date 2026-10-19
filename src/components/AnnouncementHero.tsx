import { CalendarDays, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

/** "Aug 10, 2026", or "Aug 10 – 12, 2026" for a same-month range. */
function formatEventRange(
  start?: string | null,
  end?: string | null,
): string | null {
  if (!start) return null;
  const s = new Date(start);
  if (Number.isNaN(s.getTime())) return null;
  const startLabel = s.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (!end) return startLabel;
  const e = new Date(end);
  if (Number.isNaN(e.getTime())) return startLabel;
  if (e.getTime() === s.getTime()) return startLabel;
  const sameMonth =
    s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const endLabel = e.toLocaleDateString(
    "en-US",
    sameMonth
      ? { day: "numeric", year: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" },
  );
  return `${startLabel} – ${endLabel}`;
}

/**
 * The canonical announcement template. Renders exactly as the mobile app's
 * landscape hero: a fixed 16:9 banner where the photo fills the frame behind a
 * bottom scrim, or — when no photo is attached — the brand gradient fills the
 * frame. Title/body always sit over the banner in white.
 *
 * Used in three places so the dashboard preview can never drift from what
 * tourists see: the New announcement composer, each list card, and the edit
 * dialog.
 */
export function AnnouncementHero({
  title,
  body,
  imageUrl,
  eventStart,
  eventEnd,
  badge,
  compact = false,
  className,
}: {
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  eventStart?: string | null;
  eventEnd?: string | null;
  badge?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  const hasPhoto = Boolean(imageUrl);
  const heading = title.trim() || "Your title will appear here";
  const copy = (body || "").trim();
  const eventLabel = formatEventRange(eventStart, eventEnd);

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-xl border border-border/50",
        !hasPhoto && "gradient-primary",
        className,
      )}
    >
      {hasPhoto ? (
        <img
          src={imageUrl as string}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <Megaphone
          aria-hidden
          className="pointer-events-none absolute -right-4 -bottom-4 size-32 text-white/10"
        />
      )}

      {/* Scrim: strong over a photo for legibility, soft over the gradient. */}
      <div
        className={cn(
          "absolute inset-0",
          hasPhoto
            ? "bg-gradient-to-t from-black/85 via-black/40 to-black/5"
            : "bg-gradient-to-t from-black/25 via-transparent to-transparent",
        )}
      />

      {badge && <div className="absolute right-2.5 top-2.5">{badge}</div>}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col gap-1 text-white",
          compact ? "p-3" : "p-4 sm:p-5",
        )}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
            Announcement
          </span>
          {eventLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              <CalendarDays className="size-3" />
              {eventLabel}
            </span>
          )}
        </div>
        <h4
          className={cn(
            "font-display font-semibold leading-tight drop-shadow-sm",
            compact ? "text-sm line-clamp-1" : "text-base sm:text-lg line-clamp-2",
          )}
        >
          {heading}
        </h4>
        {(copy || !compact) && (
          <p
            className={cn(
              "text-white/85 line-clamp-2",
              compact ? "text-[11px]" : "text-xs sm:text-sm",
            )}
          >
            {copy || "Add a short description to complete the hero."}
          </p>
        )}
      </div>
    </div>
  );
}
