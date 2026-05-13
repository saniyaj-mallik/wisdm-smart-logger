"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, X, Loader2 } from "lucide-react";

interface Project { _id: string; name: string }
interface Task    { _id: string; name: string }

interface CustomFieldDef {
  _id: string;
  label: string;
  type: "yes_no" | "number" | "text";
  unit: string | null;
}

interface FieldState {
  enabled: boolean;
  value: string;
}

type TimeMode = "hours" | "range";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function LogTimeModal({
  open,
  onOpenChange,
  onSuccess,
  defaultDate,
  defaultProjectId,
  defaultTaskId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess?: () => void;
  defaultDate?: string;
  defaultProjectId?: string;
  defaultTaskId?: string;
}) {
  const router = useRouter();

  const [projects, setProjects]     = useState<Project[]>([]);
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [projectId, setProjectId]   = useState(defaultProjectId ?? "");
  const [taskId, setTaskId]         = useState(defaultTaskId ?? "");
  const [date, setDate]             = useState(defaultDate ?? todayString());
  const [timeMode, setTimeMode]     = useState<TimeMode>("hours");
  const [hours, setHours]           = useState("");
  const [startTime, setStartTime]   = useState("");
  const [endTime, setEndTime]       = useState("");
  const [isBillable, setIsBillable] = useState(true);
  const [aiUsed, setAiUsed]         = useState(false);
  const [notes, setNotes]           = useState("");
  const [error, setError]           = useState("");
  const [submitting, setSubmitting] = useState(false);

  // custom fields
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDef[]>([]);
  const [fieldStates, setFieldStates]         = useState<Record<string, FieldState>>({});

  // quick-add project
  const [addingProject, setAddingProject]     = useState(false);
  const [newProjectName, setNewProjectName]   = useState("");
  const [savingProject, setSavingProject]     = useState(false);
  const [projectError, setProjectError]       = useState("");

  // quick-add task
  const [addingTask, setAddingTask]   = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [savingTask, setSavingTask]   = useState(false);
  const [taskError, setTaskError]     = useState("");

  // Sync date on open
  useEffect(() => {
    if (open) setDate(defaultDate ?? todayString());
  }, [open, defaultDate]);

  // Fetch projects & active custom fields on open
  useEffect(() => {
    if (!open) return;
    fetch("/api/projects")
      .then((r) => r.json())
      .then((projs: Project[]) => setProjects(projs))
      .catch(() => setProjects([]));

    fetch("/api/admin/custom-fields?active=true")
      .then((r) => r.json())
      .then((defs: CustomFieldDef[]) => setCustomFieldDefs(defs))
      .catch(() => setCustomFieldDefs([]));
  }, [open]);

  // Fetch tasks when a project is pre-selected on open
  useEffect(() => {
    if (!open || !defaultProjectId) return;
    fetch(`/api/projects/${defaultProjectId}/tasks`)
      .then((r) => r.json())
      .then((data: Task[]) => {
        setTasks(data);
        if (defaultTaskId) setTaskId(defaultTaskId);
      })
      .catch(() => setTasks([]));
  }, [open, defaultProjectId, defaultTaskId]);

  async function handleProjectChange(pid: string) {
    setProjectId(pid);
    setTaskId("");
    setTasks([]);
    if (!pid) return;
    const res  = await fetch(`/api/projects/${pid}/tasks`);
    const data = await res.json();
    setTasks(data);
  }

  // ── quick add project ──────────────────────────────────────────────────────
  async function handleQuickAddProject() {
    const name = newProjectName.trim();
    if (!name) return;
    setSavingProject(true);
    setProjectError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) {
        setProjectError(
          json.error?.fieldErrors?.name?.[0] ??
          json.error?.formErrors?.[0] ??
          json.error?.name?.[0] ??
          "Failed to create project"
        );
        return;
      }
      const created: Project = { _id: json._id, name: json.name };
      setProjects((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewProjectName("");
      setAddingProject(false);
      await handleProjectChange(created._id);
    } finally {
      setSavingProject(false);
    }
  }

  // ── quick add task ─────────────────────────────────────────────────────────
  async function handleQuickAddTask() {
    const name = newTaskName.trim();
    if (!name || !projectId) return;
    setSavingTask(true);
    setTaskError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) {
        setTaskError(
          json.error?.fieldErrors?.name?.[0] ??
          json.error?.formErrors?.[0] ??
          json.error?.name?.[0] ??
          "Failed to create task"
        );
        return;
      }
      const created: Task = { _id: json._id, name: json.name };
      setTasks((prev) => [...prev, created]);
      setTaskId(created._id);
      setNewTaskName("");
      setAddingTask(false);
    } finally {
      setSavingTask(false);
    }
  }

  // ── custom field helpers ───────────────────────────────────────────────────
  function toggleField(fieldId: string, checked: boolean) {
    setFieldStates((prev) => ({
      ...prev,
      [fieldId]: { enabled: checked, value: prev[fieldId]?.value ?? "" },
    }));
  }

  function setFieldValue(fieldId: string, value: string) {
    setFieldStates((prev) => ({
      ...prev,
      [fieldId]: { enabled: true, value },
    }));
  }

  function buildCustomFields() {
    return Object.entries(fieldStates)
      .filter(([, s]) => s.enabled)
      .map(([fieldId, s]) => {
        const def = customFieldDefs.find((f) => f._id === fieldId);
        let value: boolean | number | string = true;
        if (def?.type === "number") value = parseFloat(s.value) || 0;
        else if (def?.type === "text") value = s.value;
        return { fieldId, value };
      });
  }

  // ── form reset & submit ────────────────────────────────────────────────────
  function resetForm() {
    setProjectId(defaultProjectId ?? "");
    setTaskId(defaultTaskId ?? "");
    setDate(defaultDate ?? todayString());
    setTimeMode("hours"); setHours("");
    setStartTime(""); setEndTime("");
    setIsBillable(true); setAiUsed(false); setNotes(""); setError("");
    setFieldStates({});
    if (!defaultProjectId) setTasks([]);
    setAddingProject(false); setNewProjectName(""); setProjectError("");
    setAddingTask(false); setNewTaskName(""); setTaskError("");
  }

  function handleOpenChange(o: boolean) {
    if (!o) resetForm();
    onOpenChange(o);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const body: Record<string, unknown> = {
      projectId, taskId, loggedAt: date, isBillable, aiUsed, notes: notes || null,
      customFields: buildCustomFields(),
    };

    if (timeMode === "hours") {
      const h = parseFloat(hours);
      if (isNaN(h) || h <= 0) { setError("Enter a valid number of hours"); return; }
      body.hours = h;
    } else {
      if (!startTime || !endTime) { setError("Enter both start and end times"); return; }
      body.startTime = startTime;
      body.endTime   = endTime;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error?.formErrors?.[0] ?? err.error ?? "Failed to save");
        return;
      }
      handleOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  // ── helpers ────────────────────────────────────────────────────────────────
  function QuickAddInline({
    value, onChange, onSave, onCancel, saving, error: err, placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    onSave: () => void;
    onCancel: () => void;
    saving: boolean;
    error: string;
    placeholder: string;
  }) {
    return (
      <div className="space-y-1">
        <div className="flex gap-1.5">
          <Input
            autoFocus
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); onSave(); }
              if (e.key === "Escape") onCancel();
            }}
            className="flex-1 h-8 text-sm"
          />
          <Button
            type="button"
            size="sm"
            className="h-8 px-3"
            onClick={onSave}
            disabled={saving || !value.trim()}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onCancel}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        {err && <p className="text-xs text-destructive">{err}</p>}
      </div>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 shrink-0 border-b border-border">
          <DialogTitle>Log Time</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto scrollbar-modal px-6 py-5 space-y-4">

          {/* ── Project ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Project</Label>
              {!addingProject && (
                <button
                  type="button"
                  onClick={() => { setAddingProject(true); setAddingTask(false); }}
                  className="flex items-center gap-0.5 text-xs text-primary hover:underline"
                >
                  <Plus className="h-3 w-3" /> New project
                </button>
              )}
            </div>

            {addingProject ? (
              <QuickAddInline
                placeholder="Project name…"
                value={newProjectName}
                onChange={setNewProjectName}
                onSave={handleQuickAddProject}
                onCancel={() => { setAddingProject(false); setNewProjectName(""); setProjectError(""); }}
                saving={savingProject}
                error={projectError}
              />
            ) : (
              <Select value={projectId} onValueChange={handleProjectChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select project…" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* ── Task ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Task</Label>
              {!addingTask && projectId && (
                <button
                  type="button"
                  onClick={() => { setAddingTask(true); setAddingProject(false); }}
                  className="flex items-center gap-0.5 text-xs text-primary hover:underline"
                >
                  <Plus className="h-3 w-3" /> New task
                </button>
              )}
            </div>

            {addingTask ? (
              <QuickAddInline
                placeholder="Task name…"
                value={newTaskName}
                onChange={setNewTaskName}
                onSave={handleQuickAddTask}
                onCancel={() => { setAddingTask(false); setNewTaskName(""); setTaskError(""); }}
                saving={savingTask}
                error={taskError}
              />
            ) : (
              <Select
                value={taskId}
                onValueChange={setTaskId}
                disabled={!projectId}
                required
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={projectId ? (tasks.length === 0 ? "No tasks — add one above" : "Select task…") : "Select a project first"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((t) => (
                    <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* ── Date ── */}
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* ── Time mode ── */}
          <div className="space-y-1.5">
            <Label>Time Entry</Label>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={timeMode === "hours" ? "default" : "outline"}
                onClick={() => setTimeMode("hours")} className="flex-1">
                Enter Hours
              </Button>
              <Button type="button" size="sm" variant={timeMode === "range" ? "default" : "outline"}
                onClick={() => setTimeMode("range")} className="flex-1">
                Start / End
              </Button>
            </div>
            {timeMode === "hours" ? (
              <Input type="number" step="0.01" min="0.01" max="24" placeholder="e.g. 2.5"
                value={hours} onChange={(e) => setHours(e.target.value)} />
            ) : (
              <div className="flex gap-2">
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="HH:MM" />
                <span className="self-center text-muted-foreground text-sm">to</span>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="HH:MM" />
              </div>
            )}
          </div>

          {/* ── Checkboxes ── */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox id="billable" checked={isBillable}
                onCheckedChange={(v: boolean | "indeterminate") => setIsBillable(v === true)} />
              <Label htmlFor="billable" className="cursor-pointer">Billable</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="aiUsed" checked={aiUsed}
                onCheckedChange={(v: boolean | "indeterminate") => setAiUsed(v === true)} />
              <Label htmlFor="aiUsed" className="cursor-pointer">AI Used</Label>
            </div>
          </div>

          {/* ── Custom Fields ── */}
          {customFieldDefs.length > 0 && (
            <div className="space-y-1.5">
              <Label>Custom Fields</Label>
              <div className="space-y-2 rounded-md border border-border p-3">
                {customFieldDefs.map((field) => {
                  const state = fieldStates[field._id] ?? { enabled: false, value: "" };
                  return (
                    <div key={field._id}>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`cf-${field._id}`}
                          checked={state.enabled}
                          onCheckedChange={(v: boolean | "indeterminate") =>
                            toggleField(field._id, v === true)
                          }
                        />
                        <Label htmlFor={`cf-${field._id}`} className="cursor-pointer font-normal">
                          {field.label}
                          {field.type === "number" && field.unit && (
                            <span className="ml-1 text-xs text-muted-foreground">({field.unit})</span>
                          )}
                        </Label>
                      </div>
                      {state.enabled && field.type === "number" && (
                        <div className="mt-1.5 ml-6">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={field.unit ? `Value in ${field.unit}` : "Enter value"}
                            value={state.value}
                            onChange={(e) => setFieldValue(field._id, e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                      {state.enabled && field.type === "text" && (
                        <div className="mt-1.5 ml-6">
                          <Input
                            placeholder="Enter value"
                            value={state.value}
                            onChange={(e) => setFieldValue(field._id, e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Notes ── */}
          <div className="space-y-1.5">
            <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea rows={2} placeholder="What did you work on?"
              value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

        </div>
        <div className="px-6 py-4 border-t border-border shrink-0">
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !projectId || !taskId}>
              {submitting ? "Saving…" : "Save Log"}
            </Button>
          </DialogFooter>
        </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
