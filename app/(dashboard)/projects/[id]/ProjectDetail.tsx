"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { LogTimeModal } from "@/components/modals/LogTimeModal";
import { EditProjectModal } from "@/components/modals/EditProjectModal";
import { AddTaskModal } from "@/components/modals/AddTaskModal";
import { EditTaskModal } from "@/components/modals/EditTaskModal";
import {
  ChevronLeft, Plus, Pencil, Inbox, Clock,
  CheckCircle2, Circle, ArchiveIcon, Users, ListChecks,
  Loader2, BrainCircuit, DollarSign, CalendarCheck, History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/time-utils";

interface Assignee { _id: string; name: string; email: string }

interface Task {
  _id: string;
  name: string;
  description?: string | null;
  estimatedHours?: number | null;
  assignees: Assignee[];
  isActive: boolean;
  hoursSpent: number;
}

interface Project {
  _id: string;
  name: string;
  clientName?: string | null;
  description?: string | null;
  budgetHours?: number | null;
  color?: string | null;
  isActive: boolean;
  reportFrequencyDays?: number;
}

interface ReportSendEntry {
  _id: string;
  sentAt: string;
  sentBy?: { name: string };
}

interface User { _id: string; name: string; email: string; role: string }

interface LogEntry {
  _id: string;
  hours: number | null;
  loggedAt: string;
  isBillable: boolean;
  aiUsed: boolean;
  notes: string | null;
  userId: { _id: string; name: string; email: string };
}

export function ProjectDetail({
  project, tasks, users, currentUserId,
}: {
  project: Project;
  tasks: Task[];
  users: User[];
  currentUserId: string;
}) {
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [panelRefreshKey, setPanelRefreshKey] = useState(0);

  const activeTasks = tasks.filter((t) => t.isActive);
  const archivedTasks = tasks.filter((t) => !t.isActive);
  const totalEstimated = activeTasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0);
  const allAssignees = new Set(tasks.flatMap((t) => t.assignees.map((a) => a._id)));
  const accentColor = project.color ?? "#6366f1";

  function openPanel(task: Task) { setSelectedTask(task); }
  function openEdit(e: React.MouseEvent, task: Task) {
    e.stopPropagation();
    setEditingTask(task);
  }

  return (
    <div className="space-y-6">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" /> All Projects
      </Link>

      {/* Hero card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-1.5 w-full" style={{ backgroundColor: accentColor }} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div
                className="mt-0.5 h-10 w-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-lg"
                style={{ backgroundColor: accentColor + "30", color: accentColor }}
              >
                {project.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                    project.isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {project.isActive ? "Active" : "Archived"}
                  </span>
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{project.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  {project.clientName && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                      <span className="font-medium text-foreground/70">{project.clientName}</span>
                    </div>
                  )}
                  {project.budgetHours && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{project.budgetHours}h budget</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => setEditProjectOpen(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="border-t border-border grid grid-cols-3 divide-x divide-border">
          {[
            { icon: ListChecks, label: "Active Tasks", value: String(activeTasks.length), bg: "bg-primary/10", iconCls: "text-primary" },
            { icon: Clock, label: "Est. Hours", value: totalEstimated > 0 ? `${totalEstimated}h` : "—", bg: "bg-amber-100 dark:bg-amber-900/30", iconCls: "text-amber-600 dark:text-amber-400" },
            { icon: Users, label: "Assignees", value: allAssignees.size > 0 ? String(allAssignees.size) : "—", bg: "bg-purple-100 dark:bg-purple-900/30", iconCls: "text-purple-600 dark:text-purple-400" },
          ].map(({ icon: Icon, label, value, bg, iconCls }) => (
            <div key={label} className="px-5 py-3 flex items-center gap-3">
              <div className={cn("h-8 w-8 rounded-md flex items-center justify-center shrink-0", bg)}>
                <Icon className={cn("h-4 w-4", iconCls)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold leading-none mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Schedule */}
      <ReportScheduleSection
        projectId={project._id}
        initialFrequencyDays={project.reportFrequencyDays ?? 14}
      />

      {/* Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base">Tasks</h2>
            {activeTasks.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                {activeTasks.length}
              </span>
            )}
          </div>
          <Button size="sm" onClick={() => setAddTaskOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Task
          </Button>
        </div>

        {tasks.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Inbox className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">No tasks yet</p>
              <p className="text-xs mt-0.5">Add tasks to start tracking work on this project</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setAddTaskOpen(true)} className="gap-1.5 mt-1">
              <Plus className="h-3.5 w-3.5" /> Add first task
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            {/* Column header */}
            <div className="grid grid-cols-[auto_1fr_120px_140px_150px_40px] items-center gap-4 px-4 py-2 bg-muted/40 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <div className="w-4" />
              <div>Task</div>
              <div className="hidden sm:block">Estimated</div>
              <div className="hidden sm:block">Logged</div>
              <div className="hidden md:block">Assigned</div>
              <div />
            </div>

            {/* Active tasks */}
            {activeTasks.map((task, i) => (
              <TaskRow
                key={task._id}
                task={task}
                accentColor={accentColor}
                isLast={i === activeTasks.length - 1 && archivedTasks.length === 0}
                onClick={() => openPanel(task)}
                onEdit={(e) => openEdit(e, task)}
              />
            ))}

            {/* Archived section */}
            {archivedTasks.length > 0 && (
              <>
                <button
                  onClick={() => setShowArchived((v) => !v)}
                  className="w-full flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t border-border"
                >
                  <ArchiveIcon className="h-3.5 w-3.5" />
                  {showArchived ? "Hide" : "Show"} archived ({archivedTasks.length})
                </button>
                {showArchived && archivedTasks.map((task, i) => (
                  <TaskRow
                    key={task._id}
                    task={task}
                    accentColor={accentColor}
                    isLast={i === archivedTasks.length - 1}
                    onClick={() => openPanel(task)}
                    onEdit={(e) => openEdit(e, task)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <EditProjectModal project={project} open={editProjectOpen} onOpenChange={setEditProjectOpen} />
      <AddTaskModal projectId={project._id} users={users} currentUserId={currentUserId} open={addTaskOpen} onOpenChange={setAddTaskOpen} />
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          users={users}
          currentUserId={currentUserId}
          open={!!editingTask}
          onOpenChange={(o) => !o && setEditingTask(null)}
        />
      )}

      {/* Task logs panel */}
      <TaskLogsPanel
        task={selectedTask}
        accentColor={accentColor}
        open={!!selectedTask}
        onOpenChange={(o) => !o && setSelectedTask(null)}
        onLogTime={() => setLogOpen(true)}
        refreshKey={panelRefreshKey}
      />

      {/* Log time modal — rendered OUTSIDE Sheet to avoid Radix nested-dialog conflict */}
      <LogTimeModal
        open={logOpen}
        onOpenChange={setLogOpen}
        defaultProjectId={project._id}
        defaultTaskId={selectedTask?._id}
        onSuccess={() => setPanelRefreshKey((k) => k + 1)}
      />
    </div>
  );
}

// ── Report Schedule helpers ───────────────────────────────────────────────────

function parseDateStr(dateStr: string): Date {
  const d = dateStr.slice(0, 10);
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
}

function daysUntilNext(sentAt: string, frequencyDays: number): number {
  const last = parseDateStr(sentAt);
  const nextDue = new Date(last);
  nextDue.setDate(nextDue.getDate() + frequencyDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((nextDue.getTime() - today.getTime()) / 86400000);
}

function addDays(dateStr: string, days: number): string {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateDisplay(dateStr: string): string {
  const d = parseDateStr(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function relativeDateDisplay(dateStr: string): string {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = parseDateStr(dateStr);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.round(diff / 7)}w ago`;
  return `${Math.round(diff / 30)}mo ago`;
}

// ── Log Send Modal (project detail) ─────────────────────────────────────────

function LogSendProjectModal({ projectId, open, onOpenChange, onSaved }: {
  projectId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: (send: ReportSendEntry) => void;
}) {
  const [sentAt, setSentAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setSentAt(new Date().toISOString().slice(0, 10)); setError(""); }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/report-sends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, sentAt }),
      });
      if (!res.ok) { setError("Failed to save"); return; }
      onSaved(await res.json());
      onOpenChange(false);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Log Report Send</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Date Sent</Label>
            <Input
              type="date"
              value={sentAt}
              onChange={(e) => setSentAt(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Log Send
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Report Schedule Section ───────────────────────────────────────────────────

function ReportScheduleSection({ projectId, initialFrequencyDays }: {
  projectId: string;
  initialFrequencyDays: number;
}) {
  const [sends, setSends] = useState<ReportSendEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [frequencyDays, setFrequencyDays] = useState(initialFrequencyDays);
  const [editingFreq, setEditingFreq] = useState(false);
  const [freqInput, setFreqInput] = useState(String(initialFrequencyDays));
  const [savingFreq, setSavingFreq] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/report-sends?projectId=${projectId}`)
      .then((r) => r.json())
      .then((data) => setSends(Array.isArray(data) ? data : []))
      .catch(() => setSends([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  const lastSend = sends[0] ?? null;
  const days = lastSend ? daysUntilNext(lastSend.sentAt, frequencyDays) : null;

  async function saveFrequency() {
    const val = parseInt(freqInput);
    if (isNaN(val) || val < 1 || val > 365) return;
    setSavingFreq(true);
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportFrequencyDays: val }),
    });
    setFrequencyDays(val);
    setEditingFreq(false);
    setSavingFreq(false);
  }

  // Status badge
  let statusLabel: string;
  let statusBadge: string;
  if (!lastSend) {
    statusLabel = "Never sent"; statusBadge = "bg-muted text-muted-foreground";
  } else if (days! < 0) {
    statusLabel = `Overdue ${Math.abs(days!)}d`;
    statusBadge = "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  } else if (days! === 0) {
    statusLabel = "Due today";
    statusBadge = "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  } else if (days! <= 3) {
    statusLabel = `Due in ${days}d`;
    statusBadge = "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  } else {
    statusLabel = `Due in ${days}d`;
    statusBadge = "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Report Schedule</h2>
          {!loading && (
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md", statusBadge)}>
              {statusLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/reports/send-history" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
            <History className="h-3 w-3" /> History
          </Link>
          <Button size="sm" onClick={() => setLogOpen(true)} className="h-7 text-xs gap-1 px-2.5">
            <Plus className="h-3 w-3" /> Log Send
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-5 py-3.5 flex items-center gap-5 flex-wrap border-b border-border">
        {/* Frequency */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Frequency:</span>
          {editingFreq ? (
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={freqInput}
                onChange={(e) => setFreqInput(e.target.value)}
                className="h-6 w-14 text-xs px-1.5"
                min="1"
                max="365"
              />
              <span className="text-xs text-muted-foreground">days</span>
              <Button size="sm" onClick={saveFrequency} disabled={savingFreq} className="h-6 text-xs px-2">
                {savingFreq ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
              </Button>
              <Button
                variant="ghost" size="sm"
                onClick={() => { setEditingFreq(false); setFreqInput(String(frequencyDays)); }}
                className="h-6 text-xs px-1.5"
              >
                ✕
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setEditingFreq(true)}
              className="flex items-center gap-1 text-xs font-medium hover:text-primary group transition-colors"
            >
              Every {frequencyDays} days
              <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
            </button>
          )}
        </div>

        <div className="w-px h-4 bg-border" />

        {/* Last sent */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Last sent:</span>
          <span className="text-xs font-medium">
            {loading ? "…" : lastSend
              ? `${relativeDateDisplay(lastSend.sentAt)} · ${formatDateDisplay(lastSend.sentAt)}`
              : "Never"
            }
          </span>
        </div>

        {lastSend && days !== null && (
          <>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Next due:</span>
              <span className="text-xs font-medium">
                {formatDateDisplay(addDays(lastSend.sentAt, frequencyDays))}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Recent sends list */}
      {!loading && sends.length > 0 && (
        <div className="px-5 py-3 space-y-1.5">
          {sends.slice(0, 3).map((s) => (
            <div key={s._id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                <span className="font-medium">{formatDateDisplay(s.sentAt)}</span>
              </div>
              <span className="text-muted-foreground">{relativeDateDisplay(s.sentAt)}</span>
            </div>
          ))}
          {sends.length > 3 && (
            <Link href="/reports/send-history" className="text-xs text-primary hover:underline block mt-1">
              +{sends.length - 3} more →
            </Link>
          )}
        </div>
      )}

      {!loading && sends.length === 0 && (
        <div className="px-5 py-3">
          <p className="text-xs text-muted-foreground">No reports sent yet — log the first send above.</p>
        </div>
      )}

      <LogSendProjectModal
        projectId={projectId}
        open={logOpen}
        onOpenChange={setLogOpen}
        onSaved={(send) => setSends((prev) => [send, ...prev])}
      />
    </div>
  );
}

function TaskRow({
  task, accentColor, isLast, onClick, onEdit,
}: {
  task: Task;
  accentColor: string;
  isLast: boolean;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
}) {
  const progress =
    task.estimatedHours && task.estimatedHours > 0
      ? Math.min(100, Math.round((task.hoursSpent / task.estimatedHours) * 100))
      : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group grid grid-cols-[auto_1fr_120px_140px_150px_40px] items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors",
        !isLast && "border-b border-border",
        !task.isActive && "opacity-55"
      )}
    >
      {/* Color dot / status */}
      <div className="w-4 flex items-center justify-center">
        {task.isActive
          ? <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
          : <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/40" />
        }
      </div>

      {/* Name + left stripe via box shadow */}
      <div className="min-w-0 flex items-center gap-2">
        <span
          className="h-4 w-0.5 rounded-full shrink-0"
          style={{ backgroundColor: task.isActive ? accentColor : "transparent" }}
        />
        <div className="min-w-0">
          <p className={cn("text-sm font-medium truncate", !task.isActive && "line-through decoration-muted-foreground/40")}>
            {task.name}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground truncate">{task.description}</p>
          )}
        </div>
      </div>

      {/* Estimated */}
      <div className="hidden sm:block">
        <p className="text-sm font-mono">
          {task.estimatedHours != null
            ? `${task.estimatedHours}h`
            : <span className="text-muted-foreground">—</span>
          }
        </p>
      </div>

      {/* Logged */}
      <div className="hidden sm:flex items-center gap-1.5">
        <p className={cn(
          "text-sm font-mono",
          progress !== null && progress >= 100 ? "text-red-500 dark:text-red-400" : ""
        )}>
          {task.hoursSpent > 0 ? `${task.hoursSpent}h` : <span className="text-muted-foreground">0h</span>}
        </p>
        {progress !== null && (
          <span className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
            progress >= 100
              ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              : "bg-muted text-muted-foreground"
          )}>
            {progress}%
          </span>
        )}
      </div>

      {/* Assignees */}
      <div className="hidden md:flex items-center gap-1.5">
        {task.assignees.length === 0 ? (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        ) : (
          <>
            <div className="flex -space-x-2">
              {task.assignees.slice(0, 4).map((a) => (
                <Avatar key={a._id} className="h-6 w-6 border-2 border-background" title={a.name}>
                  <AvatarFallback className="text-[9px] font-bold" style={{ backgroundColor: accentColor + "25", color: accentColor }}>
                    {a.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            {task.assignees.length === 1 && (
              <span className="text-xs text-muted-foreground truncate max-w-[70px]">
                {task.assignees[0].name.split(" ")[0]}
              </span>
            )}
            {task.assignees.length > 4 && (
              <span className="text-[10px] text-muted-foreground">+{task.assignees.length - 4}</span>
            )}
          </>
        )}
      </div>

      {/* Edit */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function TaskLogsPanel({
  task, accentColor, open, onOpenChange, onLogTime, refreshKey,
}: {
  task: Task | null;
  accentColor: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogTime: () => void;
  refreshKey: number;
}) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!task) return;
    setLoading(true);
    setLogs([]);
    fetch(`/api/logs?taskId=${task._id}`)
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [task?._id, refreshKey]);

  const totalLogged = logs.reduce((s, l) => s + (l.hours ?? 0), 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col" side="right">
        {/* Panel header */}
        <div className="border-b border-border p-5 pr-10">
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-md flex items-center justify-center shrink-0 text-sm font-bold"
              style={{ backgroundColor: accentColor + "25", color: accentColor }}
            >
              {task?.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-base truncate">{task?.name}</SheetTitle>
              {task?.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
              )}
            </div>
          </div>

          {/* Mini stats */}
          {!loading && logs.length > 0 && (
            <div className="flex gap-4 mt-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Entries</p>
                <p className="text-base font-bold">{logs.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Logged</p>
                <p className="text-base font-bold">{Math.round(totalLogged * 100) / 100}h</p>
              </div>
              {task?.estimatedHours != null && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Estimated</p>
                  <p className="text-base font-bold">{task.estimatedHours}h</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Log list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Inbox className="h-8 w-8 opacity-40" />
              <p className="text-sm font-medium text-foreground">No logs yet</p>
              <p className="text-xs">No time has been logged on this task</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => (
                <div key={log._id} className="px-5 py-3.5 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-[10px] font-bold" style={{ backgroundColor: accentColor + "20", color: accentColor }}>
                          {log.userId?.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{log.userId?.name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(log.loggedAt)}</p>
                      </div>
                    </div>
                    <p className="text-sm font-mono font-semibold shrink-0">
                      {log.hours != null ? `${log.hours}h` : "—"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 mt-2 ml-9">
                    {log.isBillable ? (
                      <Badge variant="outline" className="text-[10px] h-5 gap-1 text-green-600 border-green-300 dark:border-green-700 px-1.5">
                        <DollarSign className="h-2.5 w-2.5" /> Billable
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground px-1.5">
                        Non-bill
                      </Badge>
                    )}
                    {log.aiUsed && (
                      <Badge variant="outline" className="text-[10px] h-5 gap-1 text-purple-600 border-purple-300 dark:border-purple-700 px-1.5">
                        <BrainCircuit className="h-2.5 w-2.5" /> AI
                      </Badge>
                    )}
                    {log.notes && (
                      <p className="text-[11px] text-muted-foreground italic truncate ml-1">{log.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Sticky footer */}
        <div className="border-t border-border p-4">
          <Button className="w-full gap-2" onClick={onLogTime}>
            <Plus className="h-4 w-4" /> Log Time on this Task
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
