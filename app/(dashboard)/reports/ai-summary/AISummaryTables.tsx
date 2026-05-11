"use client";

import { useState, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── types ─────────────────────────────────────────────────────────────────────
export interface UserRow {
  userId: string;
  name: string;
  role: string;
  totalHours: number;
  aiHours: number;
  totalEntries: number;
  aiEntries: number;
  savedHours: number;
}

export interface EfficiencyTask {
  taskId: string;
  userId: string;
  taskName: string;
  projectName: string;
  userName: string;
  estimatedHours: number | null;
  totalHours: number;
  avgWithAI: number | null;
  savedHours: number | null;
  savedPct: number | null;
  vsEstimatePct: number | null;
}

export interface NoAiTask {
  taskId: string;
  userId: string;
  taskName: string;
  projectName: string;
  userName: string;
  totalHours: number;
  totalEntries: number;
  estimatedHours: number | null;
}

// ── helpers ───────────────────────────────────────────────────────────────────
type SortDir = "asc" | "desc";

const ROLE_LABEL: Record<string, string> = {
  dev: "Developer",
  sme: "SME",
  manager: "Manager",
  admin: "Admin",
};

function sortRows<T>(rows: T[], key: keyof T, dir: SortDir): T[] {
  return [...rows].sort((a, b) => {
    const av = a[key] ?? (dir === "asc" ? Infinity : -Infinity);
    const bv = b[key] ?? (dir === "asc" ? Infinity : -Infinity);
    if (typeof av === "string" && typeof bv === "string")
      return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    return dir === "asc"
      ? (av as number) - (bv as number)
      : (bv as number) - (av as number);
  });
}

function useSort<K extends string>(initial: K, initialDir: SortDir = "desc") {
  const [key, setKey] = useState<K>(initial);
  const [dir, setDir] = useState<SortDir>(initialDir);
  function toggle(k: string) {
    const typed = k as K;
    if (typed === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setKey(typed); setDir("desc"); }
  }
  return { key, dir, toggle };
}

// ── sort icon ─────────────────────────────────────────────────────────────────
function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="h-3 w-3 opacity-30 shrink-0" />;
  return dir === "asc"
    ? <ChevronUp className="h-3 w-3 text-primary shrink-0" />
    : <ChevronDown className="h-3 w-3 text-primary shrink-0" />;
}

// ── sortable th ───────────────────────────────────────────────────────────────
function Th({
  label, col, sort, onSort, right = false, className,
}: {
  label: string;
  col: string;
  sort: { key: string; dir: SortDir };
  onSort: (k: string) => void;
  right?: boolean;
  className?: string;
}) {
  const active = sort.key === col;
  return (
    <th
      className={cn(
        "px-4 py-2.5 text-xs font-medium text-muted-foreground",
        "cursor-pointer select-none transition-colors hover:text-foreground",
        right ? "text-right" : "text-left",
        active && "text-foreground",
        className,
      )}
      onClick={() => onSort(col)}
    >
      <span className={cn("inline-flex items-center gap-1", right && "justify-end")}>
        {!right && <SortIcon active={active} dir={sort.dir} />}
        {label}
        {right && <SortIcon active={active} dir={sort.dir} />}
      </span>
    </th>
  );
}

// ── rate bar ──────────────────────────────────────────────────────────────────
function RateBar({ value, color = "bg-violet-500" }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2 justify-end">
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right tabular-nums">{value}%</span>
    </div>
  );
}

// ── component ─────────────────────────────────────────────────────────────────
export function AISummaryTables({
  users,
  efficiencyTasks,
  noAiTasks,
}: {
  users: UserRow[];
  efficiencyTasks: EfficiencyTask[];
  noAiTasks: NoAiTask[];
}) {
  // ── user table sort ────────────────────────────────────────────────────────
  type UserKey = "name" | "totalHours" | "aiHours" | "savedHours";
  const userSort = useSort<UserKey>("savedHours");
  const sortedUsers = useMemo(
    () => sortRows(users, userSort.key, userSort.dir),
    [users, userSort.key, userSort.dir],
  );

  // ── efficiency table sort ──────────────────────────────────────────────────
  type EffKey = "taskName" | "projectName" | "userName" | "estimatedHours" | "totalHours" | "savedHours";
  const effSort = useSort<EffKey>("savedHours");
  const sortedEff = useMemo(
    () => sortRows(efficiencyTasks, effSort.key, effSort.dir),
    [efficiencyTasks, effSort.key, effSort.dir],
  );

  // ── no-AI table sort ───────────────────────────────────────────────────────
  type NoAiKey = "taskName" | "projectName" | "userName" | "totalHours" | "totalEntries" | "estimatedHours";
  const noAiSort = useSort<NoAiKey>("totalHours");
  const sortedNoAi = useMemo(
    () => sortRows(noAiTasks, noAiSort.key, noAiSort.dir),
    [noAiTasks, noAiSort.key, noAiSort.dir],
  );

  return (
    <div className="space-y-8">
      {/* ── User AI Usage ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">User AI Usage</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total hours vs AI-assisted, sorted by AI hours
          </p>
        </div>
        {sortedUsers.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted-foreground text-center">No data</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <Th label="User"          col="name"        sort={userSort} onSort={userSort.toggle} className="px-5" />
                <Th label="Total"         col="totalHours"  sort={userSort} onSort={userSort.toggle} right />
                <Th label="AI Hours"      col="aiHours"     sort={userSort} onSort={userSort.toggle} right />
                <Th label="Saved vs Est." col="savedHours"  sort={userSort} onSort={userSort.toggle} right className="px-5" />
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((u) => (
                <tr key={u.userId} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-5 py-3">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground">{ROLE_LABEL[u.role] ?? u.role}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{u.totalHours}h</td>
                  <td className="px-4 py-3 text-right font-semibold text-violet-600 dark:text-violet-400 tabular-nums">
                    {u.aiHours}h
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {u.savedHours > 0 ? (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        ↓ {u.savedHours}h
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Task Efficiency with AI ────────────────────────────────────────── */}
      {efficiencyTasks.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-emerald-500" />
              Task Efficiency with AI
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tasks where AI use reduces time vs non-AI baseline or estimate
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <Th label="Task"              col="taskName"       sort={effSort} onSort={effSort.toggle} className="px-5" />
                  <Th label="Project"           col="projectName"    sort={effSort} onSort={effSort.toggle} />
                  <Th label="User"              col="userName"       sort={effSort} onSort={effSort.toggle} />
                  <Th label="Estimated"         col="estimatedHours" sort={effSort} onSort={effSort.toggle} right />
                  <Th label="Actual Time Spent" col="totalHours"     sort={effSort} onSort={effSort.toggle} right />
                  <Th label="Saved"             col="savedHours"     sort={effSort} onSort={effSort.toggle} right className="px-5" />
                </tr>
              </thead>
              <tbody>
                {sortedEff.map((t) => (
                  <tr key={`${t.taskId}-${t.userId}`} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-5 py-3 font-medium max-w-[180px]">
                      <p className="truncate">{t.taskName}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[140px]">
                      <p className="truncate">{t.projectName}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[120px]">
                      <p className="truncate">{t.userName}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                      {t.estimatedHours != null ? `${t.estimatedHours}h` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-violet-600 dark:text-violet-400 tabular-nums">
                      {t.totalHours > 0 ? `${t.totalHours}h` : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {t.savedHours !== null && t.savedHours > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                          ↓ {t.savedHours}h
                          {t.savedPct !== null && (
                            <span className="text-xs font-normal opacity-75">({t.savedPct}%)</span>
                          )}
                        </span>
                      ) : t.vsEstimatePct !== null && t.vsEstimatePct > 0 ? (
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {t.vsEstimatePct}% under est.
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tasks Not Using AI ─────────────────────────────────────────────── */}
      {noAiTasks.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold text-sm">Tasks Not Using AI</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {noAiTasks.length} task{noAiTasks.length !== 1 ? "s" : ""} with zero AI-assisted entries — potential productivity opportunities
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-amber-50/50 dark:bg-amber-950/10">
                  <Th label="Task"         col="taskName"       sort={noAiSort} onSort={noAiSort.toggle} className="px-5" />
                  <Th label="Project"      col="projectName"    sort={noAiSort} onSort={noAiSort.toggle} />
                  <Th label="User"         col="userName"       sort={noAiSort} onSort={noAiSort.toggle} />
                  <Th label="Logged Hours" col="totalHours"     sort={noAiSort} onSort={noAiSort.toggle} right />
                  <Th label="Entries"      col="totalEntries"   sort={noAiSort} onSort={noAiSort.toggle} right />
                  <Th label="Estimated"    col="estimatedHours" sort={noAiSort} onSort={noAiSort.toggle} right className="px-5" />
                </tr>
              </thead>
              <tbody>
                {sortedNoAi.map((t) => (
                  <tr key={`${t.taskId}-${t.userId}`} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-5 py-3 font-medium max-w-[200px]">
                      <p className="truncate">{t.taskName}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[140px]">
                      <p className="truncate">{t.projectName}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[120px]">
                      <p className="truncate">{t.userName}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{t.totalHours}h</td>
                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{t.totalEntries}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground tabular-nums">
                      {t.estimatedHours != null ? `${t.estimatedHours}h` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
