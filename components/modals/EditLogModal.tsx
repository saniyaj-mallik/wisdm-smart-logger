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

  useEffect(() => {
    if (!open) return;
    fetch("/api/projects").then((r) => r.json()).then(setProjects).catch(() => setProjects([]));
    fetch(`/api/projects/${entry.projectId._id}/tasks`)
      .then((r) => r.json())
      .then(setTasks)
      .catch(() => setTasks([]));
  }, [open, entry.projectId._id]);

  async function handleProjectChange(pid: string) {
    setProjectId(pid);
    setTaskId("");
    setTasks([]);
    if (!pid) return;
    const res = await fetch(`/api/projects/${pid}/tasks`);
    const data = await res.json();
    setTasks(data);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Log</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !projectId || !taskId}>
              {submitting ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
