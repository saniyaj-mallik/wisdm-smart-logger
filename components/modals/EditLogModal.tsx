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

interface LogEntry {
  _id: string;
  hours: number | null;
  loggedAt: string;
  isBillable: boolean;
  aiUsed: boolean;
  notes: string | null;
  startTime: string | null;
  endTime: string | null;
  projectId: { _id: string; name: string };
  taskId: { _id: string; name: string };
  customFields?: Array<{
    fieldId: { _id: string; label: string; type: string; unit: string | null } | string;
    value: boolean | number | string;
  }>;
}

type TimeMode = "hours" | "range";

export function EditLogModal({
  entry,
  open,
  onOpenChange,
  onSuccess,
}: {
  entry: LogEntry;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectId, setProjectId] = useState(entry.projectId._id);
  const [taskId, setTaskId] = useState(entry.taskId._id);
  const [date, setDate] = useState(entry.loggedAt.slice(0, 10));
  const [timeMode, setTimeMode] = useState<TimeMode>(
    entry.startTime && entry.endTime ? "range" : "hours"
  );
  const [hours, setHours] = useState(entry.hours?.toString() ?? "");
  const [startTime, setStartTime] = useState(entry.startTime ?? "");
  const [endTime, setEndTime] = useState(entry.endTime ?? "");
  const [isBillable, setIsBillable] = useState(entry.isBillable);
  const [aiUsed, setAiUsed] = useState(entry.aiUsed);
  const [notes, setNotes] = useState(entry.notes ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // custom fields
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDef[]>([]);
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({});

  useEffect(() => {
    if (!open) return;
    fetch("/api/projects").then((r) => r.json()).then(setProjects).catch(() => setProjects([]));
    fetch(`/api/projects/${entry.projectId._id}/tasks`)
      .then((r) => r.json())
      .then(setTasks)
      .catch(() => setTasks([]));

    fetch("/api/admin/custom-fields?active=true")
      .then((r) => r.json())
      .then((defs: CustomFieldDef[]) => {
        setCustomFieldDefs(defs);
        // Pre-populate from existing entry values
        const initial: Record<string, FieldState> = {};
        if (entry.customFields) {
          for (const cf of entry.customFields) {
            const fieldId = typeof cf.fieldId === "string" ? cf.fieldId : cf.fieldId._id;
            const def = defs.find((d) => d._id === fieldId);
            if (def) {
              initial[fieldId] = {
                enabled: true,
                value: cf.value?.toString() ?? "",
              };
            }
          }
        }
        setFieldStates(initial);
      })
      .catch(() => setCustomFieldDefs([]));
  }, [open, entry.projectId._id, entry.customFields]);

  async function handleProjectChange(pid: string) {
    setProjectId(pid);
    setTaskId("");
    setTasks([]);
    if (!pid) return;
    const res = await fetch(`/api/projects/${pid}/tasks`);
    const data = await res.json();
    setTasks(data);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const body: Record<string, unknown> = {
      projectId,
      taskId,
      loggedAt: date,
      isBillable,
      aiUsed,
      notes: notes || null,
      customFields: buildCustomFields(),
    };

    if (timeMode === "hours") {
      const h = parseFloat(hours);
      if (isNaN(h) || h <= 0) { setError("Enter a valid number of hours"); return; }
      body.hours = h;
      body.startTime = null;
      body.endTime = null;
    } else {
      if (!startTime || !endTime) { setError("Enter both start and end times"); return; }
      body.startTime = startTime;
      body.endTime = endTime;
      body.hours = null;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/logs/${entry._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error?.formErrors?.[0] ?? err.error ?? "Failed to save");
        return;
      }
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 shrink-0 border-b border-border">
          <DialogTitle>Edit Log</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto scrollbar-modal px-6 py-5 space-y-4">
          {/* Project */}
          <div className="space-y-1.5">
            <Label>Project</Label>
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
          </div>

          {/* Task */}
          <div className="space-y-1.5">
            <Label>Task</Label>
            <Select
              value={taskId}
              onValueChange={setTaskId}
              disabled={!projectId || tasks.length === 0}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select task…" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((t) => (
                  <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Time mode */}
          <div className="space-y-1.5">
            <Label>Time Entry</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={timeMode === "hours" ? "default" : "outline"}
                onClick={() => setTimeMode("hours")}
                className="flex-1"
              >
                Enter Hours
              </Button>
              <Button
                type="button"
                size="sm"
                variant={timeMode === "range" ? "default" : "outline"}
                onClick={() => setTimeMode("range")}
                className="flex-1"
              >
                Start / End
              </Button>
            </div>
            {timeMode === "hours" ? (
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max="24"
                placeholder="e.g. 2.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            ) : (
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <span className="self-center text-muted-foreground text-sm">to</span>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Checkboxes */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-billable"
                checked={isBillable}
                onCheckedChange={(v: boolean | "indeterminate") => setIsBillable(v === true)}
              />
              <Label htmlFor="edit-billable" className="cursor-pointer">Billable</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-aiUsed"
                checked={aiUsed}
                onCheckedChange={(v: boolean | "indeterminate") => setAiUsed(v === true)}
              />
              <Label htmlFor="edit-aiUsed" className="cursor-pointer">AI Used</Label>
            </div>
          </div>

          {/* Custom Fields */}
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
                          id={`edit-cf-${field._id}`}
                          checked={state.enabled}
                          onCheckedChange={(v: boolean | "indeterminate") =>
                            toggleField(field._id, v === true)
                          }
                        />
                        <Label htmlFor={`edit-cf-${field._id}`} className="cursor-pointer font-normal">
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

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              rows={2}
              placeholder="What did you work on?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

        </div>
        <div className="px-6 py-4 border-t border-border shrink-0">
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !projectId || !taskId}>
              {submitting ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
