"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Loader2, BrainCircuit, DollarSign,
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
