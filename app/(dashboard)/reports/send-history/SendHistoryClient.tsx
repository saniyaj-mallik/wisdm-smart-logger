"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck, Loader2, Trash2, History,
  Send, CheckCircle2, CalendarDays, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Project {
  _id: string;
  name: string;
  clientName?: string | null;
  color?: string | null;
  isActive: boolean;
  reportFrequencyDays: number;
}

interface ReportSend {
  _id: string;
  projectId: {
    _id: string;
    name: string;
    clientName?: string | null;
    color?: string | null;
    reportFrequencyDays: number;
  };
  from: string;
  to: string;
  format: string;
  downloadedAt: string;
  downloadedBy?: { name: string };
  sentAt: string | null;
  sentBy?: { name: string } | null;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function parseDateStr(s: string | null | undefined): Date {
  if (!s) return new Date();
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysUntilNext(sentAt: string, freq: number): number {
  const next = parseDateStr(sentAt);
  next.setDate(next.getDate() + freq);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((next.getTime() - today.getTime()) / 86400000);
}

function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  return parseDateStr(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function relativeDate(s: string | null | undefined): string {
  if (!s) return "—";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(s); d.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.round(diff / 7)}w ago`;
  return `${Math.round(diff / 30)}mo ago`;
}

// ── Format badge ──────────────────────────────────────────────────────────────

const FORMAT_BADGE: Record<string, string> = {
  xlsx:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  csv:      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  markdown: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  text:     "bg-muted text-muted-foreground",
};

// ── Status card helpers ────────────────────────────────────────────────────────

function getStatusInfo(days: number | null) {
  if (days === null) return { label: "Never sent", badge: "bg-muted text-muted-foreground", border: "border-t-muted-foreground/30" };
  if (days < 0)      return { label: `Overdue ${Math.abs(days)}d`, badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", border: "border-t-red-500" };
  if (days === 0)    return { label: "Due today", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", border: "border-t-amber-500" };
  if (days <= 3)     return { label: `Due in ${days}d`, badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", border: "border-t-amber-500" };
  return { label: `Due in ${days}d`, badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", border: "border-t-green-500" };
}

// ── Project status row ────────────────────────────────────────────────────────

function ProjectStatusRow({ project, lastSent }: { project: Project; lastSent: ReportSend | null }) {
  const freq = project.reportFrequencyDays ?? 14;
  const days = lastSent?.sentAt ? daysUntilNext(lastSent.sentAt, freq) : null;
  const { label, badge } = getStatusInfo(days);

  const nextDue = lastSent?.sentAt ? (() => {
    const d = parseDateStr(lastSent.sentAt!);
    d.setDate(d.getDate() + freq);
    return formatDate(d.toISOString().slice(0, 10));
  })() : "—";

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      {/* Color + name */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {project.color
          ? <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: project.color }} />
          : <span className="h-2 w-2 rounded-sm shrink-0 bg-muted-foreground/30" />
        }
        <div className="min-w-0">
          <p className="text-sm font-medium truncate leading-none">{project.name}</p>
          {project.clientName && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{project.clientName}</p>
          )}
        </div>
      </div>
      {/* Status badge */}
      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0", badge)}>{label}</span>
      {/* Last sent */}
      <span className="text-xs text-muted-foreground shrink-0 w-20 text-right">
        {lastSent?.sentAt ? relativeDate(lastSent.sentAt) : "—"}
      </span>
      {/* Next due */}
      <span className="text-xs shrink-0 w-24 text-right font-medium tabular-nums">{nextDue}</span>
    </div>
  );
}

// ── Report log row ────────────────────────────────────────────────────────────

function ReportLogRow({ log, onMarkSent, onDelete, marking, deleting }: {
  log: ReportSend;
  onMarkSent: (id: string) => void;
  onDelete: (id: string) => void;
  marking: boolean;
  deleting: boolean;
}) {
  const isSent = !!log.sentAt;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors border-l-2",
      isSent ? "border-l-green-500" : "border-l-amber-400"
    )}>
      {/* Project + period */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {log.projectId?.color && (
            <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: log.projectId.color }} />
          )}
          <Link
            href={`/projects/${log.projectId?._id}`}
            className="text-sm font-medium hover:text-primary transition-colors truncate"
          >
            {log.projectId?.name ?? "Unknown"}
          </Link>
          <span className={cn("text-[10px] font-semibold px-1 py-0.5 rounded uppercase shrink-0",
            FORMAT_BADGE[log.format] ?? FORMAT_BADGE.text
          )}>
            {log.format}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
          <CalendarDays className="h-3 w-3 shrink-0" />
          {formatDate(log.from)} – {formatDate(log.to)}
        </p>
      </div>

      {/* Downloaded */}
      <span className="text-xs text-muted-foreground shrink-0 hidden sm:block w-20 text-right">
        {relativeDate(log.downloadedAt)}
      </span>

      {/* Sent status / action */}
      <div className="shrink-0">
        {isSent ? (
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{formatDate(log.sentAt)}</span>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={() => onMarkSent(log._id)}
            disabled={marking}
            className="h-7 text-xs px-2 gap-1"
          >
            {marking
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Send className="h-3 w-3" />
            }
            <span className="hidden sm:inline">Mark Sent</span>
          </Button>
        )}
      </div>

      {/* Delete */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={() => onDelete(log._id)}
        disabled={deleting}
      >
        {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
      </Button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SendHistoryClient() {
  const [sends, setSends] = useState<ReportSend[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/report-sends").then((r) => r.json()),
    ])
      .then(([projs, sds]) => {
        setProjects(Array.isArray(projs) ? projs.filter((p: Project) => p.isActive !== false) : []);
        setSends(Array.isArray(sds) ? sds : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Last SENT entry per project (ignore download-only entries)
  const latestSentByProject = useMemo(() => {
    const map: Record<string, ReportSend> = {};
    for (const s of sends) {
      const pid = s.projectId?._id;
      if (pid && s.sentAt && !map[pid]) map[pid] = s;
    }
    return map;
  }, [sends]);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const la = latestSentByProject[a._id];
      const lb = latestSentByProject[b._id];
      const dA = la?.sentAt ? daysUntilNext(la.sentAt, a.reportFrequencyDays ?? 14) : Infinity;
      const dB = lb?.sentAt ? daysUntilNext(lb.sentAt, b.reportFrequencyDays ?? 14) : Infinity;
      return dA - dB;
    });
  }, [projects, latestSentByProject]);

  async function handleMarkSent(id: string) {
    setMarking(id);
    try {
      const res = await fetch(`/api/report-sends/${id}`, { method: "PATCH" });
      if (res.ok) {
        const updated = await res.json();
        setSends((prev) => prev.map((s) => s._id === id ? updated : s));
      }
    } finally {
      setMarking(null);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/report-sends/${id}`, { method: "DELETE" });
    setSends((prev) => prev.filter((s) => s._id !== id));
    setDeleting(null);
  }

  const pendingCount = sends.filter((s) => !s.sentAt).length;
  const sentCount    = sends.filter((s) => !!s.sentAt).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-7 w-10 bg-muted rounded animate-pulse" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card">
            <div className="px-4 py-3 border-b border-border h-10 bg-muted/30 animate-pulse" />
            <div className="p-3 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />)}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card">
            <div className="px-4 py-3 border-b border-border h-10 bg-muted/30 animate-pulse" />
            <div className="p-3 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-5 flex-wrap">
        <div>
          <p className="text-2xl font-bold font-mono leading-none">{projects.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Projects</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div>
          <p className="text-2xl font-bold font-mono leading-none">{sends.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Downloads</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div>
          <p className="text-2xl font-bold font-mono leading-none text-green-600 dark:text-green-400">{sentCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Sent</p>
        </div>
        {pendingCount > 0 && (
          <>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-2xl font-bold font-mono leading-none text-amber-600 dark:text-amber-400">{pendingCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
            </div>
          </>
        )}
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* ── Left: Projects ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Projects</h2>
            <span className="text-xs text-muted-foreground ml-1">({projects.length})</span>
          </div>
          {/* Column headers */}
          {projects.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-1.5 bg-muted/40 border-b border-border">
              <span className="flex-1 text-[11px] font-medium text-muted-foreground">Project</span>
              <span className="text-[11px] font-medium text-muted-foreground shrink-0">Status</span>
              <span className="text-[11px] font-medium text-muted-foreground shrink-0 w-20 text-right">Last sent</span>
              <span className="text-[11px] font-medium text-muted-foreground shrink-0 w-24 text-right">Next due</span>
            </div>
          )}
          <div className="overflow-y-auto max-h-[65vh] scrollbar-modal">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CalendarCheck className="h-7 w-7 opacity-20 mb-2" />
                <p className="text-sm">No active projects</p>
              </div>
            ) : (
              sortedProjects.map((p) => (
                <ProjectStatusRow
                  key={p._id}
                  project={p}
                  lastSent={latestSentByProject[p._id] ?? null}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right: Download logs ────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Download Logs</h2>
            {pendingCount > 0 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ml-1">
                {pendingCount} pending
              </span>
            )}
          </div>
          {/* Column headers */}
          {sends.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-1.5 bg-muted/40 border-b border-border">
              <span className="flex-1 text-[11px] font-medium text-muted-foreground">Project / Period</span>
              <span className="text-[11px] font-medium text-muted-foreground shrink-0 hidden sm:block w-20 text-right">Downloaded</span>
              <span className="text-[11px] font-medium text-muted-foreground shrink-0 w-20 text-right">Status</span>
              <span className="w-6 shrink-0" />
            </div>
          )}
          <div className="overflow-y-auto max-h-[65vh] scrollbar-modal">
            {sends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Clock className="h-7 w-7 opacity-20 mb-2" />
                <p className="text-sm font-medium">No downloads yet</p>
                <p className="text-xs mt-1 text-center max-w-[200px]">
                  Download from{" "}
                  <Link href="/reports/block-generator" className="text-primary hover:underline">
                    Block Generator
                  </Link>{" "}
                  — logs appear here automatically.
                </p>
              </div>
            ) : (
              sends.map((s) => (
                <ReportLogRow
                  key={s._id}
                  log={s}
                  onMarkSent={handleMarkSent}
                  onDelete={handleDelete}
                  marking={marking === s._id}
                  deleting={deleting === s._id}
                />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
