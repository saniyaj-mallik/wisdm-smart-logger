"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Download, ChevronRight, Check } from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;
type Format = "xlsx" | "csv" | "text" | "markdown";

interface Project {
  _id: string;
  name: string;
  clientName: string | null;
  color: string | null;
}

interface TaskRow {
  _id: string;
  name: string;
  estimatedHours: number | null;
  actualHours: number;
}

const FORMATS: { value: Format; label: string }[] = [
  { value: "xlsx", label: "Excel (XLSX)" },
  { value: "csv", label: "CSV" },
  { value: "text", label: "Plain Text" },
  { value: "markdown", label: "Markdown" },
];

const STEP_LABELS = ["Project & Dates", "Select Tasks", "Download Report"] as const;

function weekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  return mon.toISOString().slice(0, 10);
}

export function BlockGeneratorWizard({ userId }: { userId: string }) {
  const [step, setStep] = useState<Step>(1);

  // ── Step 1 ──────────────────────────────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [from, setFrom] = useState(weekStart);
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [lastReportNote, setLastReportNote] = useState<string | null>(null);

  // ── Step 2 ──────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  // ── Step 3 ──────────────────────────────────────────────────────────────────
  const [format, setFormat] = useState<Format>("xlsx");
  const [block, setBlock] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects)
      .catch(() => {})
      .finally(() => setProjectsLoading(false));
  }, []);

  function handleProjectSelect(id: string) {
    setSelectedProjectId(id);
    const lastTo = localStorage.getItem(`block-last-to-${id}`);
    if (lastTo) {
      const next = new Date(lastTo + "T12:00:00");
      next.setDate(next.getDate() + 1);
      setFrom(next.toISOString().slice(0, 10));
      setLastReportNote(`Pre-filled from your last report (ended ${lastTo})`);
    } else {
      setFrom(weekStart());
      setLastReportNote(null);
    }
    setTo(new Date().toISOString().slice(0, 10));
  }

  async function goToStep2() {
    setTasksLoading(true);
    try {
      const [tasksRes, actualsRes] = await Promise.all([
        fetch(`/api/projects/${selectedProjectId}/tasks`),
        fetch(
          `/api/reports/by-task?from=${from}&to=${to}&projectId=${selectedProjectId}&userId=${userId}`
        ),
      ]);
      const tasksData: Array<{
        _id: string;
        name: string;
        estimatedHours?: number | null;
      }> = await tasksRes.json();
      const actualsData: Array<{ taskId: string; totalHours: number }> =
        actualsRes.ok ? await actualsRes.json() : [];

      const actualsMap = new Map(
        actualsData.map((a) => [String(a.taskId), a.totalHours])
      );
      const merged: TaskRow[] = tasksData.map((t) => ({
        _id: String(t._id),
        name: t.name,
        estimatedHours: t.estimatedHours ?? null,
        actualHours: actualsMap.get(String(t._id)) ?? 0,
      }));

      setTasks(merged);
      setSelectedTaskIds(new Set(merged.map((t) => t._id)));
      setStep(2);
    } finally {
      setTasksLoading(false);
    }
  }

  async function generateBlock(fmt: Format, taskIds: string[]) {
    setGenerating(true);
    setGenError("");
    setBlock(null);
    try {
      const res = await fetch("/api/reports/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to,
          projectId: selectedProjectId,
          taskIds,
          groupBy: "project-task",
          billableFilter: "all",
          format: fmt === "xlsx" ? "csv" : fmt,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setBlock(data.block);
    } catch {
      setGenError("Failed to generate report. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function goToStep3() {
    setStep(3);
    setFormat("xlsx");
    await generateBlock("xlsx", Array.from(selectedTaskIds));
  }

  async function handleFormatChange(fmt: Format) {
    setFormat(fmt);
    await generateBlock(fmt, Array.from(selectedTaskIds));
  }

  function toggleTask(id: string) {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedTaskIds.size === tasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(tasks.map((t) => t._id)));
    }
  }

  function download() {
    if (!block) return;
    const project = projects.find((p) => p._id === selectedProjectId);
    const slug = (project?.name ?? "report").toLowerCase().replace(/\s+/g, "-");
    const filename = `time-report-${slug}-${from}`;

    if (format === "xlsx") {
      const lines = block.trim().split("\n");
      const data = lines.map((line) => {
        const result: string[] = [];
        let cell = "";
        let inQuotes = false;
        for (const ch of line) {
          if (ch === '"') {
            inQuotes = !inQuotes;
          } else if (ch === "," && !inQuotes) {
            result.push(cell);
            cell = "";
          } else {
            cell += ch;
          }
        }
        result.push(cell);
        return result;
      });
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Time Report");
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const ext =
        format === "markdown" ? "md" : format === "csv" ? "csv" : "txt";
      const blob = new Blob([block], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    }

    localStorage.setItem(`block-last-to-${selectedProjectId}`, to);
  }

  const selectedProject = projects.find((p) => p._id === selectedProjectId);
  const canProceedStep1 =
    !!selectedProjectId && !!from && !!to && from <= to;
  const canProceedStep2 = selectedTaskIds.size > 0;

  return (
    <div className="space-y-5">
      {/* ── Step Indicator ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-1">
        {STEP_LABELS.map((label, i) => {
          const s = (i + 1) as Step;
          const done = step > s;
          const active = step === s;
          return (
            <div key={s} className="flex items-center gap-1">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    active && "bg-primary text-primary-foreground",
                    done && "bg-primary/20 text-primary",
                    !active && !done && "bg-muted text-muted-foreground"
                  )}
                >
                  {done ? <Check className="w-3 h-3" /> : s}
                </div>
                <span
                  className={cn(
                    "text-sm hidden sm:inline",
                    active && "font-semibold",
                    !active && "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
              {s < 3 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground mx-1 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* ── Step 1: Project + Dates ──────────────────────────────────── */}
          {step === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Select Project
                </Label>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {projectsLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-12 rounded-lg bg-muted animate-pulse"
                        />
                      ))
                    : projects.length === 0
                    ? (
                        <p className="text-sm text-muted-foreground py-6 text-center">
                          No active projects found.
                        </p>
                      )
                    : projects.map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => handleProjectSelect(p._id)}
                          className={cn(
                            "w-full text-left px-3.5 py-2.5 rounded-lg border text-sm transition-colors",
                            selectedProjectId === p._id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40 hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {p.color && (
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: p.color }}
                              />
                            )}
                            <span className="font-medium">{p.name}</span>
                          </div>
                          {p.clientName && (
                            <p className="text-xs text-muted-foreground mt-0.5 pl-4">
                              {p.clientName}
                            </p>
                          )}
                        </button>
                      ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Date Range
                </Label>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="h-9 text-sm"
                  />
                  {lastReportNote && (
                    <p className="text-xs text-primary/80">{lastReportNote}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Task Selection ────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{selectedProject?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {from} → {to}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-primary hover:underline underline-offset-2"
                >
                  {selectedTaskIds.size === tasks.length && tasks.length > 0
                    ? "Deselect all"
                    : "Select all"}
                </button>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="w-10 p-3 text-left">
                        <input
                          type="checkbox"
                          className="accent-primary"
                          checked={
                            selectedTaskIds.size === tasks.length &&
                            tasks.length > 0
                          }
                          onChange={toggleAll}
                        />
                      </th>
                      <th className="p-3 text-left font-medium">Task</th>
                      <th className="p-3 text-right font-medium w-28">
                        Estimated
                      </th>
                      <th className="p-3 text-right font-medium w-28">
                        Actual
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-10 text-center text-sm text-muted-foreground"
                        >
                          No tasks found for this project
                        </td>
                      </tr>
                    ) : (
                      tasks.map((t) => (
                        <tr
                          key={t._id}
                          className={cn(
                            "border-b last:border-0 transition-colors cursor-pointer",
                            selectedTaskIds.has(t._id)
                              ? "bg-background hover:bg-muted/20"
                              : "bg-muted/10 opacity-50"
                          )}
                          onClick={() => toggleTask(t._id)}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              className="accent-primary pointer-events-none"
                              checked={selectedTaskIds.has(t._id)}
                              readOnly
                            />
                          </td>
                          <td className="p-3 font-medium">{t.name}</td>
                          <td className="p-3 text-right text-muted-foreground">
                            {t.estimatedHours != null
                              ? `${t.estimatedHours}h`
                              : "—"}
                          </td>
                          <td className="p-3 text-right">
                            {t.actualHours > 0 ? (
                              <span className="font-medium">
                                {t.actualHours}h
                              </span>
                            ) : (
                              <span className="text-muted-foreground">0h</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {tasks.length > 0 && (
                <p className="text-xs text-muted-foreground text-right">
                  {selectedTaskIds.size} of {tasks.length} task
                  {tasks.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

          {/* ── Step 3: Format + Preview ──────────────────────────────────── */}
          {step === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Format picker */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Format
                </Label>
                <div className="space-y-2">
                  {FORMATS.map((f) => (
                    <label
                      key={f.value}
                      className={cn(
                        "flex items-center gap-2.5 cursor-pointer text-sm px-3 py-2.5 rounded-lg border transition-colors",
                        format === f.value
                          ? "border-primary bg-primary/5 font-medium"
                          : "border-border hover:border-primary/40",
                        generating && "pointer-events-none opacity-50"
                      )}
                    >
                      <input
                        type="radio"
                        name="report-format"
                        value={f.value}
                        checked={format === f.value}
                        onChange={() => handleFormatChange(f.value)}
                        disabled={generating}
                        className="accent-primary"
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
                {format === "xlsx" && !generating && block && (
                  <p className="text-xs text-muted-foreground px-1">
                    Preview shows CSV — downloads as .xlsx
                  </p>
                )}
              </div>

              {/* Preview */}
              <div className="lg:col-span-2">
                {generating ? (
                  <div className="flex flex-col items-center justify-center h-72 bg-muted/50 rounded-lg gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Generating report…
                    </p>
                  </div>
                ) : genError ? (
                  <div className="flex items-center justify-center h-72 bg-destructive/5 rounded-lg text-sm text-destructive border border-destructive/20 px-4 text-center">
                    {genError}
                  </div>
                ) : block ? (
                  <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-words max-h-[55vh] overflow-y-auto rounded-lg bg-muted p-4">
                    {block}
                  </pre>
                ) : null}
              </div>
            </div>
          )}

          {/* ── Navigation ───────────────────────────────────────────────── */}
          <div
            className={cn(
              "flex items-center mt-6 pt-5 border-t",
              step > 1 ? "justify-between" : "justify-end"
            )}
          >
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => (s - 1) as Step)}
                disabled={generating}
              >
                ← Back
              </Button>
            )}

            {step === 1 && (
              <Button
                onClick={goToStep2}
                disabled={!canProceedStep1 || tasksLoading}
              >
                {tasksLoading && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}

            {step === 2 && (
              <Button onClick={goToStep3} disabled={!canProceedStep2}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}

            {step === 3 && (
              <Button
                onClick={download}
                disabled={!block || generating}
                className="min-w-40"
              >
                <Download className="w-4 h-4 mr-2" />
                Download{" "}
                {format === "xlsx"
                  ? "XLSX"
                  : format === "markdown"
                  ? "MD"
                  : format.toUpperCase()}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
