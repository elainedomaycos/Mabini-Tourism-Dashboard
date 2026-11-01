import { useState, useMemo, useRef, useEffect } from "react";
import {
  Megaphone,
  Plus,
  Search,
  Sparkles,
  Clock,
  Send,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  CalendarClock,
  Image as ImageIcon,
  ImagePlus,
  Loader2,
  RotateCcw,
  Check,
  X,
  ChevronRight,
  ShieldAlert,
  AlertCircle,
  SlidersHorizontal,
  CalendarIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { AnnouncementHero } from "@/components/AnnouncementHero";
import {
  StatCard,
  SectionCard,
  DataSourceBadge,
  useMounted,
  Field,
  ActiveFilterBadges,
  TableSkeletonRows,
} from "@/components/shared";
import { useFilters } from "@/hooks/useFilters";
import { usePermission } from "@/hooks/usePermission";
import { pushAuditLog } from "@/lib/audit";
import { requireLiveSession } from "@/lib/staff-auth";
import {
  useLiveMode,
  useAnnouncementsLive,
  useInvalidateLive,
  useLiveList,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  uploadAnnouncementPhoto,
  statusOf,
  type LiveAnnouncementRow,
  type AnnouncementStatus,
  dbErrorMessage,
} from "@/lib/queries";

function announcementWhen(a: LiveAnnouncementRow): string {
  const st = statusOf(a);
  if (st === "Scheduled" && a.startDate) {
    const d = new Date(a.startDate);
    return `Sends ${d.toLocaleString("en", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }
  if (a.createdAt) {
    const d = new Date(a.createdAt);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString("en", { month: "short", day: "numeric" });
    }
  }
  return "—";
}

/** "yyyy-mm-dd" for a date input, from an ISO timestamp or date string. */
function toDateInput(v?: string | null): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** Validates an optional event range; returns an error message or null. */
function eventRangeError(start: string, end: string): string | null {
  if (!start || !end) return null;
  if (new Date(end).getTime() < new Date(start).getTime()) {
    return "Event end must be on or after the start date";
  }
  return null;
}

export function AnnouncementsPage() {

  const { canAct, deny } = usePermission();
  type Announcement = {
    id: number | string;
    dbId?: string;
    title: string;
    body: string;
    when: string;
    status: AnnouncementStatus;
    imageUrl?: string | null;
    eventStart?: string | null;
    eventEnd?: string | null;
  };
  const [items, setItems] = useState<Announcement[]>([
    {
      id: 1,
      title: "New safety guidelines for night dives",
      body: "All operators must brief divers on updated protocols before departure.",
      when: "Today · 10:24",
      status: "Published",
    },
    {
      id: 2,
      title: "Blue Hole temporary closure Aug 3–5",
      body: "Site closed for reef restoration. Please redirect scheduled dives.",
      when: "Yesterday",
      status: "Published",
    },
    {
      id: 3,
      title: "Seasonal jellyfish advisory",
      body: "Increased jellyfish activity near the coral garden area. Proceed with caution and carry sting kits.",
      when: "Jul 22",
      status: "Draft",
    },
    {
      id: 4,
      title: "New dive shop licensing fees effective Aug 1",
      body: "Updated fee schedule published. All operators must renew under the new rates before end of August.",
      when: "Jul 20",
      status: "Published",
    },
    {
      id: 5,
      title: "Emergency drill scheduled Aug 10",
      body: "All operators in Barangays San Teodoro and Solo are required to participate in the annual safety drill.",
      when: "Jul 18",
      status: "Archived",
    },
  ]);
  const [draft, setDraft] = useState({
    title: "",
    body: "",
    schedule: "",
    scheduleTime: "",
    eventStart: "",
    eventEnd: "",
    imageUrl: "" as string,
    photoFile: null as File | null,
  });
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editDraft, setEditDraft] = useState({
    title: "",
    body: "",
    eventStart: "",
    eventEnd: "",
    imageUrl: "" as string,
    photoFile: null as File | null,
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("All");
  const draftFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const live = useLiveMode();
  const invalidate = useInvalidateLive();
  const { data: liveRows, isLoading: liveLoading } = useAnnouncementsLive();

  // Live rows (Date-window status) when connected, mock seed in demo mode.
  const liveItems = useMemo<Announcement[]>(() => {
    if (!liveRows) return [];
    return liveRows.map((r) => ({
      id: r._dbId,
      dbId: r._dbId,
      title: r.title,
      body: r.body ?? "",
      when: announcementWhen(r),
      status: statusOf(r),
      imageUrl: r.imageUrl,
      eventStart: r.eventStartDate,
      eventEnd: r.eventEndDate,
    }));
  }, [liveRows]);

  const source: Announcement[] = live ? liveItems : items;

  const filtered = useMemo(() => {
    if (filter === "All") return source;
    return source.filter((i) => i.status === filter);
  }, [source, filter]);

  // Announcements are staff-operable (both tiers); the guard keeps locked
  // users out consistently across edit/publish/delete entry points.
  const guardAct = () => {
    if (!canAct) {
      deny();
      return false;
    }
    return true;
  };

  const emptyDraft = {
    title: "",
    body: "",
    schedule: "",
    scheduleTime: "",
    eventStart: "",
    eventEnd: "",
    imageUrl: "",
    photoFile: null as File | null,
  };

  const pickDraftPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setDraft((d) => ({ ...d, photoFile: f, imageUrl: URL.createObjectURL(f) }));
  };

  const pickEditPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setEditDraft((d) => ({
      ...d,
      photoFile: f,
      imageUrl: URL.createObjectURL(f),
    }));
  };

  const openEdit = (item: Announcement) => {
    if (!guardAct()) return;
    setEditItem(item);
    setEditDraft({
      title: item.title,
      body: item.body,
      eventStart: toDateInput(item.eventStart),
      eventEnd: toDateInput(item.eventEnd),
      imageUrl: item.imageUrl ?? "",
      photoFile: null,
    });
    setEditErrors({});
  };

  // Uploads a newly picked file (returns the public URL); otherwise keeps the
  // existing URL. Demo mode never uploads — the local object URL previews.
  const resolveImage = async (
    url: string,
    file: File | null,
  ): Promise<string | null> => {
    if (file && live) return uploadAnnouncementPhoto(file);
    return url.trim() ? url : null;
  };

  const saveEdit = async () => {
    if (!guardAct()) return;
    const e: Record<string, string> = {};
    if (!editDraft.title.trim()) e.title = "Title is required";
    if (!editDraft.body.trim()) e.body = "Body is required";
    const rangeErr = eventRangeError(editDraft.eventStart, editDraft.eventEnd);
    if (rangeErr) e.eventRange = rangeErr;
    setEditErrors(e);
    if (Object.keys(e).length > 0) return;

    if (!live) {
      setItems(
        items.map((i) =>
          i.id === editItem.id
            ? {
                ...i,
                title: editDraft.title.trim(),
                body: editDraft.body.trim(),
                imageUrl: editDraft.imageUrl || null,
                eventStart: editDraft.eventStart || null,
                eventEnd: editDraft.eventEnd || null,
              }
            : i,
        ),
      );
      setEditItem(null);
      toast.success("Announcement updated");
      return;
    }

    setSaving(true);
    try {
      const imageUrl = await resolveImage(
        editDraft.imageUrl,
        editDraft.photoFile,
      );
      // Content-only update — status/schedule stay untouched.
      await updateAnnouncement(editItem.dbId, {
        title: editDraft.title.trim(),
        body: editDraft.body.trim(),
        imageUrl,
        eventStartDate: editDraft.eventStart || null,
        eventEndDate: editDraft.eventEnd || null,
      });
      invalidate();
      setEditItem(null);
      toast.success("Announcement updated");
      pushAuditLog(`Updated announcement #A-${editItem.id}`);
    } catch (err) {
      toast.error("Could not update announcement", {
        description: dbErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const publishDraft = async () => {
    if (!canAct) return deny();
    const e: Record<string, string> = {};
    if (!draft.title.trim()) e.title = "Title is required";
    if (!draft.body.trim()) e.body = "Body is required";
    if (draft.schedule && !draft.scheduleTime)
      e.scheduleTime = "Set a time to send";
    const rangeErr = eventRangeError(draft.eventStart, draft.eventEnd);
    if (rangeErr) e.eventRange = rangeErr;
    setDraftErrors(e);
    if (Object.keys(e).length > 0) return;
    const scheduled = draft.schedule !== "";
    const startAt = scheduled
      ? `${draft.schedule}T${draft.scheduleTime || "00:00"}:00`
      : null;
    const status: AnnouncementStatus = scheduled ? "Scheduled" : "Published";
    const successToast = () =>
      toast.success(
        scheduled ? "Announcement scheduled" : "Announcement published",
        {
          description: scheduled
            ? `Queued to send on ${draft.schedule} at ${draft.scheduleTime}.`
            : undefined,
        },
      );
    const audit = () =>
      pushAuditLog(
        scheduled
          ? `Scheduled announcement #A-${Date.now() % 1000}`
          : `Pushed announcement #A-${Date.now() % 1000}`,
      );

    if (!live) {
      setItems([
        {
          id: Date.now(),
          title: draft.title.trim(),
          body: draft.body.trim(),
          when: scheduled
            ? `${draft.schedule} · ${draft.scheduleTime}`
            : "Just now",
          status,
          imageUrl: draft.imageUrl || null,
          eventStart: draft.eventStart || null,
          eventEnd: draft.eventEnd || null,
        },
        ...items,
      ]);
      setDraft(emptyDraft);
      setDraftErrors({});
      successToast();
      audit();
      return;
    }

    setSaving(true);
    try {
      const imageUrl = await resolveImage(draft.imageUrl, draft.photoFile);
      await createAnnouncement({
        title: draft.title.trim(),
        body: draft.body.trim(),
        imageUrl,
        status,
        startAt,
        eventStartDate: draft.eventStart || null,
        eventEndDate: draft.eventEnd || null,
      });
      invalidate();
      setDraft(emptyDraft);
      setDraftErrors({});
      successToast();
      audit();
    } catch (err) {
      toast.error("Could not publish announcement", {
        description: dbErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  // Card-action status transitions (publish draft, send scheduled now, cancel
  // schedule, archive). Content is preserved; only the window columns change.
  const changeStatus = async (
    item: Announcement,
    status: AnnouncementStatus,
  ) => {
    if (!guardAct()) return;
    if (!live) {
      setItems(
        items.map((x) =>
          x.id === item.id
            ? {
                ...x,
                status,
                when: status === "Published" ? "Just now" : x.when,
              }
            : x,
        ),
      );
      return;
    }
    try {
      await updateAnnouncement(item.dbId as string, { status });
      invalidate();
    } catch (err) {
      toast.error("Could not update announcement", {
        description: dbErrorMessage(err),
      });
    }
  };

  const removeItem = async (item: Announcement) => {
    if (!guardAct()) return;
    if (!live) {
      setItems(items.filter((x) => x.id !== item.id));
      toast.success("Announcement deleted");
      return;
    }
    try {
      await deleteAnnouncement(item.dbId as string);
      invalidate();
      toast.success("Announcement deleted");
    } catch (err) {
      toast.error("Could not delete announcement", {
        description: dbErrorMessage(err),
      });
    }
  };

  const statusBadge = (s: string) => {
    if (s === "Published")
      return (
        <Badge className="bg-success/15 text-success border-success/20 text-[10px]">
          Published
        </Badge>
      );
    if (s === "Scheduled")
      return (
        <Badge className="bg-primary/15 text-primary border-primary/20 text-[10px] flex items-center gap-1">
          <Clock className="size-3" />
          Scheduled
        </Badge>
      );
    if (s === "Draft")
      return (
        <Badge className="bg-warning/15 text-warning border-warning/20 text-[10px]">
          Draft
        </Badge>
      );
    return (
      <Badge variant="outline" className="text-[10px] text-muted-foreground">
        Archived
      </Badge>
    );
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search announcements…"
              value={filter === "All" ? "" : ""}
              onChange={() => {}}
              className="pl-9"
              disabled
            />
          </div>
          <div className="flex gap-2">
            {["All", "Published", "Scheduled", "Draft", "Archived"].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={filter === s ? "default" : "outline"}
                className={
                  filter === s ? "gradient-primary text-primary-foreground" : ""
                }
                onClick={() => setFilter(s)}
              >
                {s}{" "}
                {s !== "All" && (
                  <span className="ml-1 text-[10px] opacity-70">
                    (
                    {source.filter((i) => s === "All" || i.status === s).length}
                    )
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground shadow-elegant">
            <Megaphone className="size-10 mx-auto mb-3 opacity-40" />
            {live && liveLoading
              ? "Loading announcements…"
              : live
                ? "No announcements yet. Publish one to send it to the app."
                : "No announcements match this filter."}
          </Card>
        ) : (
          filtered.map((i) => (
            <Card
              key={i.id}
              className="p-4 shadow-elegant border-border/60 transition-all hover:shadow-glow"
            >
              <div className="mb-3">
                <AnnouncementHero
                  compact
                  title={i.title}
                  body={i.body}
                  imageUrl={i.imageUrl}
                  eventStart={i.eventStart}
                  eventEnd={i.eventEnd}
                />
              </div>
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <Megaphone className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-display font-semibold">{i.title}</h4>
                    {statusBadge(i.status)}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {i.status === "Scheduled" && (
                        <CalendarClock className="size-3 text-primary" />
                      )}
                      {i.when}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{i.body}</p>
                  <div className="mt-3 flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(i)}
                    >
                      <Edit3 className="size-4 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive/30 text-destructive"
                      onClick={() => removeItem(i)}
                    >
                      <Trash2 className="size-4 mr-1" /> Delete
                    </Button>
                    {i.status === "Draft" && (
                      <Button
                        size="sm"
                        className="ml-auto gradient-primary text-primary-foreground"
                        onClick={() => {
                          changeStatus(i, "Published");
                          toast.success("Announcement published");
                          pushAuditLog(`Pushed announcement #A-${i.id}`);
                        }}
                      >
                        <Send className="size-4 mr-1" /> Publish
                      </Button>
                    )}
                    {i.status === "Scheduled" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-auto"
                          onClick={() => {
                            changeStatus(i, "Draft");
                            toast.info("Schedule cancelled", {
                              description: "Moved back to drafts.",
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="gradient-primary text-primary-foreground"
                          onClick={() => {
                            changeStatus(i, "Published");
                            toast.success("Sent now", { description: i.title });
                            pushAuditLog(`Pushed announcement #A-${i.id}`);
                          }}
                        >
                          <Send className="size-4 mr-1" /> Send now
                        </Button>
                      </>
                    )}
                    {i.status === "Archived" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-auto"
                        onClick={() => changeStatus(i, "Published")}
                      >
                        <RotateCcw className="size-4 mr-1" /> Republish
                      </Button>
                    )}
                    {i.status === "Published" && (
                      <Button
                        size="sm"
                        className="ml-auto gradient-primary text-primary-foreground"
                        onClick={() => {
                          toast.success("Already live for tourists", {
                            description: i.title,
                          });
                        }}
                      >
                        <Send className="size-4 mr-1" /> Live
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-4">
        <Card className="p-5 shadow-elegant h-fit sticky top-24">
          <h3 className="font-display font-semibold mb-3">New announcement</h3>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Manta season update"
                className={
                  draftErrors.title
                    ? "border-destructive focus-visible:ring-destructive/30"
                    : ""
                }
              />
              {draftErrors.title && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {draftErrors.title}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>
                Body <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                placeholder="Write your message…"
                rows={4}
                className={
                  draftErrors.body
                    ? "border-destructive focus-visible:ring-destructive/30"
                    : ""
                }
              />
              {draftErrors.body && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {draftErrors.body}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <ImagePlus className="size-3.5 text-primary" /> Hero photo
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <input
                ref={draftFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={pickDraftPhoto}
              />
              <AnnouncementHero
                title={draft.title}
                body={draft.body}
                imageUrl={draft.imageUrl || null}
                eventStart={draft.eventStart || null}
                eventEnd={draft.eventEnd || null}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => draftFileRef.current?.click()}
                >
                  <ImagePlus className="size-4 mr-1.5" />
                  {draft.imageUrl ? "Change photo" : "Add photo"}
                </Button>
                {draft.imageUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => {
                      setDraft((d) => ({
                        ...d,
                        imageUrl: "",
                        photoFile: null,
                      }));
                      if (draftFileRef.current) draftFileRef.current.value = "";
                    }}
                  >
                    <X className="size-4 mr-1" /> Remove
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                No photo? The blue gradient fills the hero automatically so it
                stays clean in the app.
              </p>
            </div>

            <div className="rounded-lg border border-border/70 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Send later</Label>
                <Switch
                  checked={draft.schedule !== ""}
                  onCheckedChange={(v) =>
                    setDraft({
                      ...draft,
                      schedule: v ? "2026-07-26" : "",
                      scheduleTime: v ? "08:00" : "",
                    })
                  }
                />
              </div>
              {draft.schedule !== "" && (
                <div className="grid grid-cols-2 gap-2 animate-fade-in">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">
                      Date
                    </Label>
                    <Input
                      type="date"
                      value={draft.schedule}
                      onChange={(e) =>
                        setDraft({ ...draft, schedule: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">
                      Time
                    </Label>
                    <Input
                      type="time"
                      value={draft.scheduleTime}
                      onChange={(e) =>
                        setDraft({ ...draft, scheduleTime: e.target.value })
                      }
                      className={
                        draftErrors.scheduleTime
                          ? "border-destructive focus-visible:ring-destructive/30"
                          : ""
                      }
                    />
                  </div>
                </div>
              )}
              {draftErrors.scheduleTime && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {draftErrors.scheduleTime}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border/70 p-3 space-y-2.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <CalendarIcon className="size-3.5 text-primary" /> Event date
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <p className="text-[10px] text-muted-foreground">
                Set this if the announcement is about a dated event. Leave blank
                for a general notice.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    From
                  </Label>
                  <Input
                    type="date"
                    value={draft.eventStart}
                    onChange={(e) =>
                      setDraft({ ...draft, eventStart: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    To
                  </Label>
                  <Input
                    type="date"
                    value={draft.eventEnd}
                    onChange={(e) =>
                      setDraft({ ...draft, eventEnd: e.target.value })
                    }
                  />
                </div>
              </div>
              {draftErrors.eventRange && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {draftErrors.eventRange}
                </p>
              )}
            </div>

            <Button
              className="w-full gradient-primary text-primary-foreground"
              onClick={publishDraft}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              ) : draft.schedule !== "" ? (
                <CalendarClock className="size-4 mr-1.5" />
              ) : (
                <Plus className="size-4 mr-1.5" />
              )}
              {saving
                ? "Saving…"
                : draft.schedule !== ""
                  ? "Schedule"
                  : "Publish"}
            </Button>
          </div>
        </Card>
        <Card className="p-5 shadow-elegant">
          <h3 className="font-display font-semibold mb-3 text-sm">Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Published</span>
              <span className="font-medium">
                {source.filter((i) => i.status === "Published").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Scheduled</span>
              <span className="font-medium">
                {source.filter((i) => i.status === "Scheduled").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Drafts</span>
              <span className="font-medium">
                {source.filter((i) => i.status === "Draft").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Archived</span>
              <span className="font-medium">
                {source.filter((i) => i.status === "Archived").length}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                value={editDraft.title}
                onChange={(e) =>
                  setEditDraft({ ...editDraft, title: e.target.value })
                }
                className={
                  editErrors.title
                    ? "border-destructive focus-visible:ring-destructive/30"
                    : ""
                }
              />
              {editErrors.title && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {editErrors.title}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>
                Body <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={editDraft.body}
                onChange={(e) =>
                  setEditDraft({ ...editDraft, body: e.target.value })
                }
                rows={5}
                className={
                  editErrors.body
                    ? "border-destructive focus-visible:ring-destructive/30"
                    : ""
                }
              />
              {editErrors.body && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {editErrors.body}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <ImagePlus className="size-3.5 text-primary" /> Hero photo
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <input
                ref={editFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={pickEditPhoto}
              />
              <AnnouncementHero
                title={editDraft.title}
                body={editDraft.body}
                imageUrl={editDraft.imageUrl || null}
                eventStart={editDraft.eventStart || null}
                eventEnd={editDraft.eventEnd || null}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => editFileRef.current?.click()}
                >
                  <ImagePlus className="size-4 mr-1.5" />
                  {editDraft.imageUrl ? "Change photo" : "Add photo"}
                </Button>
                {editDraft.imageUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => {
                      setEditDraft((d) => ({
                        ...d,
                        imageUrl: "",
                        photoFile: null,
                      }));
                      if (editFileRef.current) editFileRef.current.value = "";
                    }}
                  >
                    <X className="size-4 mr-1" /> Remove
                  </Button>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-border/70 p-3 space-y-2.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <CalendarIcon className="size-3.5 text-primary" /> Event date
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    From
                  </Label>
                  <Input
                    type="date"
                    value={editDraft.eventStart}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, eventStart: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    To
                  </Label>
                  <Input
                    type="date"
                    value={editDraft.eventEnd}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, eventEnd: e.target.value })
                    }
                  />
                </div>
              </div>
              {editErrors.eventRange && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {editErrors.eventRange}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditItem(null)}>
                Cancel
              </Button>
              <Button
                className="gradient-primary text-primary-foreground"
                onClick={saveEdit}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                ) : null}
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------ SETTINGS ------------------------------ */
const SESSION_TIMEOUT_OPTIONS = [
  { label: "30 seconds", value: 30 },
  { label: "1 minute", value: 60 },
  { label: "2 minutes", value: 120 },
  { label: "5 minutes", value: 300 },
  { label: "10 minutes", value: 600 },
  { label: "15 minutes", value: 900 },
  { label: "30 minutes", value: 1800 },
  { label: "Never", value: 0 },
];


