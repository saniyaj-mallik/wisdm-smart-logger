"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { LogTimeModal } from "@/components/modals/LogTimeModal";
import { EditLogModal } from "@/components/modals/EditLogModal";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import { cn } from "@/lib/utils";

interface LogEntry {
  _id: string;
  hours: number | null;
  loggedAt: string;
  isBillable: boolean;
  aiUsed: boolean;
  notes: string | null;
  startTime: string | null;
  endTime: string | null;
  projectId: { _id: string; name: string; color: string | null };
  taskId: { _id: string; name: string };
  userId: { _id: string; name: string; email: string };
}

// ── constants ──────────────────────────────────────────────────────────────
const PX_PER_HOUR = 110;
const MIN_BLOCK_H  = 70;

const DAY_ABBR = ["MON", "TUE", "WED", "THU", "FRI"];
const MONTHS   = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// Vivid block colours — one per project (stable hash)
const BLOCK_COLORS = [
  "bg-blue-600   hover:bg-blue-700",
  "bg-violet-600 hover:bg-violet-700",
  "bg-indigo-600 hover:bg-indigo-700",
  "bg-purple-600 hover:bg-purple-700",
  "bg-sky-600    hover:bg-sky-700",
  "bg-teal-600   hover:bg-teal-700",
  "bg-cyan-600   hover:bg-cyan-700",
  "bg-blue-500   hover:bg-blue-600",
];

function projectColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return BLOCK_COLORS[h % BLOCK_COLORS.length];
}

// ── date helpers ───────────────────────────────────────────────────────────
function getMondayOfWeek(date: Date): Date {
  const d   = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(offset: number): Date[] {
  const monday = getMondayOfWeek(new Date());
  monday.setDate(monday.getDate() + offset * 7);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ── formatting helpers ─────────────────────────────────────────────────────
function fmtDuration(hours: number): string {
  const mins = Math.round(hours * 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}:${String(m).padStart(2, "0")}` : `${h}h`;
}

function fmtTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${period}`;
}

function fmtCircle(hours: number): string {
  if (hours === 0) return "0";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}:${String(m).padStart(2, "0")}` : `${h}h`;
}

// ── component ──────────────────────────────────────────────────────────────
export function LogsClient({
  entries,
  currentUserId,
  isManagerOrAdmin,
}: {
  entries: LogEntry[];
  currentUserId: string;
  isManagerOrAdmin: boolean;
}) {
  const router = useRouter();
  const [weekOffset,    setWeekOffset]    = useState(0);
  const [logOpen,       setLogOpen]       = useState(false);
  const [defaultDate,   setDefaultDate]   = useState("");
  const [editing,       setEditing]       = useState<LogEntry | null>(null);
  const [deleting,      setDeleting]      = useState<string | null>(null);

  function onMutated() { router.refresh(); }

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const entriesByDate = useMemo(() => {
    const map: Record<string, LogEntry[]> = {};
    for (const e of entries) {
      const k = e.loggedAt.slice(0, 10);
      (map[k] ??= []).push(e);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
    }
    return map;
  }, [entries]);

  const monthYearLabel = useMemo(() => {
    const d = weekDays[0];
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }, [weekDays]);

  function openAdd(dateKey: string) {
    setDefaultDate(dateKey);
    setLogOpen(true);
  }

  return (
    <div className="space-y-4">

      {/* ── navigation ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-base font-semibold w-44 text-center select-none">
          {monthYearLabel}
        </span>

        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {weekOffset !== 0 && (
          <button
            onClick={() => setWeekOffset(0)}
            className="text-xs text-primary hover:underline px-1"
          >
            Today
          </button>
        )}

        <div className="ml-auto">
          <Button size="sm" onClick={() => openAdd(todayKey)}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* ── week grid ── */}
      <div className="rounded-2xl border border-border overflow-hidden bg-muted/10">
        <div className="grid grid-cols-5 divide-x divide-border">
          {weekDays.map((day, i) => {
            const dateKey    = toDateKey(day);
            const dayEntries = entriesByDate[dateKey] ?? [];
            const isToday    = dateKey === todayKey;
            const totalHours = dayEntries.reduce((s, e) => s + (e.hours ?? 0), 0);
            const hasHours   = totalHours > 0;

            return (
              <div key={dateKey} className="flex flex-col">

                {/* column header */}
                <div className={cn(
                  "px-3 py-2 flex items-center justify-between border-b border-border",
                  isToday ? "bg-primary/[0.06]" : "bg-muted/30 dark:bg-muted/10",
                )}>
                  <div className="flex items-baseline gap-1.5">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      isToday ? "text-primary" : "text-muted-foreground",
                    )}>
                      {DAY_ABBR[i]}
                    </span>
                    <span className={cn(
                      "text-xl font-bold tabular-nums leading-none",
                      isToday ? "text-primary" : "text-foreground",
                    )}>
                      {day.getDate()}
                    </span>
                  </div>

                  {/* hours circle badge */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    "text-[10px] font-bold tabular-nums",
                    hasHours
                      ? isToday
                        ? "bg-primary text-primary-foreground"
                        : "bg-foreground/90 text-background dark:bg-foreground dark:text-background"
                      : "bg-muted text-muted-foreground",
                  )}>
                    {fmtCircle(totalHours)}
                  </div>
                </div>

                {/* ── blocks area ── */}
                <div
                  className="flex-1 min-h-[500px] p-2 flex flex-col gap-2 cursor-pointer group/col relative bg-background"
                  onClick={() => openAdd(dateKey)}
                >
                  {/* empty-state hover hint */}
                  {dayEntries.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover/col:opacity-100 transition-opacity pointer-events-none">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="text-xs text-muted-foreground">Add log</span>
                    </div>
                  )}

                  {dayEntries.map((entry) => {
                    const isOwn   = entry.userId?._id === currentUserId
                                 || (entry.userId as unknown as string) === currentUserId;
                    const canEdit = isOwn || isManagerOrAdmin;
                    const blockH  = Math.max(MIN_BLOCK_H, (entry.hours ?? 0.5) * PX_PER_HOUR);
                    const hexColor  = entry.projectId?.color;
                    const colorCls  = hexColor ? "" : projectColor(entry.projectId?._id ?? entry.projectId?.name ?? "x");
                    const colorStyle = hexColor ? { backgroundColor: hexColor } : {};

                    // layout thresholds
                    const showTask   = blockH >= 92;
                    const showBottom = blockH >= 70;

                    return (
                      <div
                        key={entry._id}
                        style={{ minHeight: blockH, ...colorStyle }}
                        className={cn(
                          "rounded-xl px-3 py-2.5 flex flex-col justify-between",
                          "text-white relative overflow-hidden flex-shrink-0",
                          "transition-[filter] duration-100 hover:brightness-90",
                          canEdit ? "cursor-pointer" : "cursor-default",
                          colorCls,
                          "group/block",
                        )}
                        onClick={(e) => { e.stopPropagation(); if (canEdit) setEditing(entry); }}
                      >
                        {/* top content */}
                        <div className="pr-8">
                          <p className="text-[11px] text-white/65 font-medium leading-snug truncate">
                            {entry.projectId?.name ?? "—"}
                            {isManagerOrAdmin && entry.userId?.name && (
                              <span className="text-white/40"> · {entry.userId.name}</span>
                            )}
                          </p>
                          {showTask && (
                            <p className="text-sm font-bold mt-0.5 leading-snug line-clamp-2">
                              {entry.taskId?.name ?? "—"}
                            </p>
                          )}
                        </div>

                        {/* bottom row */}
                        {showBottom && (
                          <div className="flex items-end justify-between mt-1 gap-1">
                            <p className="text-[11px] text-white/60 leading-none truncate">
                              {entry.startTime && entry.endTime
                                ? `${fmtTime12(entry.startTime)} - ${fmtTime12(entry.endTime)}`
                                : entry.aiUsed
                                ? "AI assisted"
                                : !entry.isBillable
                                ? "non-billable"
                                : ""}
                            </p>
                            <p className="text-sm font-bold leading-none flex-shrink-0">
                              {entry.hours != null ? fmtDuration(entry.hours) : "—"}
                            </p>
                          </div>
                        )}

                        {/* hover edit/delete */}
                        {canEdit && (
                          <div className="absolute top-2 right-2 hidden group-hover/block:flex gap-1">
                            <button
                              className="h-6 w-6 rounded-md bg-black/30 hover:bg-black/50 flex items-center justify-center"
                              onClick={(e) => { e.stopPropagation(); setEditing(entry); }}
                            >
                              <Pencil className="h-3 w-3 text-white" />
                            </button>
                            <button
                              className="h-6 w-6 rounded-md bg-black/30 hover:bg-red-500/70 flex items-center justify-center"
                              onClick={(e) => { e.stopPropagation(); setDeleting(entry._id); }}
                            >
                              <Trash2 className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* add-more button — visible on column hover when day has entries */}
                  {dayEntries.length > 0 && (
                    <button
                      className={cn(
                        "w-full mt-auto border-2 border-dashed border-border/40 rounded-xl h-10",
                        "flex items-center justify-center gap-1.5 flex-shrink-0",
                        "opacity-0 group-hover/col:opacity-100 transition-opacity",
                        "text-xs text-muted-foreground",
                        "hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
                      )}
                      onClick={(e) => { e.stopPropagation(); openAdd(dateKey); }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add log
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* ── modals ── */}
      <LogTimeModal
        open={logOpen}
        onOpenChange={setLogOpen}
        onSuccess={onMutated}
        defaultDate={defaultDate || todayKey}
      />
      {editing && (
        <EditLogModal
          entry={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          onSuccess={onMutated}
        />
      )}
      {deleting && (
        <ConfirmDeleteModal
          entryId={deleting}
          open={!!deleting}
          onOpenChange={(o) => !o && setDeleting(null)}
          onSuccess={onMutated}
        />
      )}
    </div>
  );
}
