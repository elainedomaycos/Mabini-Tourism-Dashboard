import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Receipt,
  Building2,
  FileImage,
  Megaphone,
  BellOff,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useFilters } from "@/hooks/useFilters";
import {
  isLiveMode,
  useNotificationsLive,
  markNotificationsRead,
  markAllNotificationsRead,
  dbErrorMessage,
  type LiveNotificationRow,
} from "@/lib/queries";

type NotifKind =
  | "receipt"
  | "application"
  | "manifesto"
  | "announcement"
  | "generic";

type Notif = {
  id: string;
  kind: NotifKind;
  title: string;
  detail: string;
  section: string;
  at: string | null;
  read: boolean;
  touristId: string | null;
  ids: string[];
  recipients: number;
};

const NOTIF_ICONS: Record<NotifKind, any> = {
  receipt: Receipt,
  application: Building2,
  manifesto: FileImage,
  announcement: Megaphone,
  generic: Bell,
};

function notifKindFromType(type: string | null): NotifKind {
  const t = (type || "").toLowerCase();
  switch (t) {
    case "receipt":
    case "payment":
      return "receipt";
    case "application":
    case "operator_application":
      return "application";
    case "manifesto":
    case "manifest":
    case "dive_manifest":
      return "manifesto";
    default:
      if (t.startsWith("announcement") || t.startsWith("notice")) {
        return "announcement";
      }
      return "generic";
  }
}

export function useNotifications() {
  const qc = useQueryClient();
  const query = useNotificationsLive();
  const rows = query.data;

  const notifs: Notif[] = useMemo(() => {
    const groups = new Map<string, Notif>();
    const order: string[] = [];
    for (const n of rows ?? []) {
      const key = `${n.type ?? ""}|${n.title}|${n.body ?? ""}|${n.createdAt}`;
      const existing = groups.get(key);
      if (existing) {
        existing.ids.push(n._dbId);
        existing.recipients += 1;
        existing.read = existing.read && n.isRead;
      } else {
        groups.set(key, {
          id: n._dbId,
          kind: notifKindFromType(n.type),
          title: n.title,
          detail: n.body ?? "",
          section: "",
          at: n.createdAt,
          read: n.isRead,
          touristId: n.touristId,
          ids: [n._dbId],
          recipients: 1,
        });
        order.push(key);
      }
    }
    return order.map((k) => {
      const g = groups.get(k)!;
      if (g.recipients > 1) g.touristId = null;
      return g;
    });
  }, [rows]);

  const unread = notifs.filter((n) => !n.read).length;

  const markNotifRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const previous = qc.getQueryData<LiveNotificationRow[]>([
      "live",
      "notifications",
    ]);
    qc.setQueryData<LiveNotificationRow[]>(["live", "notifications"], (old) =>
      (old ?? []).map((n) => (idSet.has(n._dbId) ? { ...n, isRead: true } : n)),
    );
    try {
      await markNotificationsRead(ids);
    } catch (e) {
      qc.setQueryData(["live", "notifications"], previous);
      toast.error("Could not mark as read", { description: dbErrorMessage(e) });
    }
  };

  const markAllNotifsRead = async () => {
    const previous = qc.getQueryData<LiveNotificationRow[]>([
      "live",
      "notifications",
    ]);
    qc.setQueryData<LiveNotificationRow[]>(["live", "notifications"], (old) =>
      (old ?? []).map((n) => ({ ...n, isRead: true })),
    );
    try {
      await markAllNotificationsRead();
    } catch (e) {
      qc.setQueryData(["live", "notifications"], previous);
      toast.error("Could not mark all as read", {
        description: dbErrorMessage(e),
      });
    }
  };

  return {
    notifs,
    unread,
    loading: query.isLoading,
    error: query.isError,
    live: isLiveMode(),
    markNotifRead,
    markAllNotifsRead,
  };
}

export function NotificationsBell() {
  const {
    notifs,
    unread,
    loading,
    error,
    live,
    markNotifRead,
    markAllNotifsRead,
  } = useNotifications();
  const { setFilters } = useFilters();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          title="Notifications"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 shadow-sm">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <div className="text-sm font-semibold">Notifications</div>
            <div className="text-xs text-muted-foreground">
              {loading
                ? "Loading…"
                : `${unread} unread · ${notifs.length} total`}
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => void markAllNotifsRead()}
            disabled={unread === 0}
          >
            Mark all read
          </Button>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
          {!live ? (
            <div className="py-10 text-center text-muted-foreground flex flex-col items-center gap-2">
              <BellOff className="size-6 opacity-40" />
              <span className="text-sm">Connect Supabase to see alerts.</span>
            </div>
          ) : loading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="py-10 px-6 text-center text-muted-foreground flex flex-col items-center gap-2">
              <TriangleAlert className="size-6 text-destructive" />
              <span className="text-sm">Could not load notifications.</span>
            </div>
          ) : notifs.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground flex flex-col items-center gap-2">
              <BellOff className="size-6 opacity-40" />
              <span className="text-sm">You're all caught up.</span>
            </div>
          ) : (
            notifs.map((n) => {
              const Icon = NOTIF_ICONS[n.kind];
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    void markNotifRead(n.ids);
                    if (n.touristId) {
                      setFilters({
                        section: "tourists",
                        q: n.touristId,
                        status: "All",
                        nationality: "All",
                        level: "All",
                        site: "All",
                        difficulty: "All",
                        siteType: "All",
                        dateFrom: "",
                        dateTo: "",
                        tab: "",
                      });
                    }
                  }}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-primary-soft/40 ${n.read ? "opacity-60" : ""}`}
                >
                  <div
                    className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${n.read ? "bg-secondary text-muted-foreground" : "bg-primary-soft text-primary"}`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="size-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    {n.detail && (
                      <div className="text-xs text-muted-foreground truncate">
                        {n.detail}
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground/70 mt-0.5 flex items-center gap-1.5">
                      <span>{n.at ? n.at : "Just now"}</span>
                      {n.recipients > 1 && (
                        <span className="rounded-full bg-secondary px-1.5 py-px font-medium text-muted-foreground">
                          {n.recipients} tourists
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
        <div className="px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground">
          {!live
            ? "Notifications sync from the shared database."
            : unread > 0
              ? `${unread} item${unread > 1 ? "s" : ""} need${unread === 1 ? "s" : ""} your attention.`
              : "All notifications are up to date."}
        </div>
      </PopoverContent>
    </Popover>
  );
}
