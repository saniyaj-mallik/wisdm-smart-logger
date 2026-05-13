"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList, Cell,
} from "recharts";
import {
  Pencil, Trash2, Plus, Loader2, CheckSquare, Hash, AlignLeft,
  BarChart2, Activity, Percent, Sigma, TrendingUp, ArrowUpDown,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type FieldType = "yes_no" | "number" | "text";

export interface FieldStat {
  fieldId: string;
  count: number;
  totalEntries: number;
  details: {
    sum?: number;
    avg?: number;
    min?: number;
    max?: number;
    topValues?: { value: string; count: number }[];
  };
}

interface CustomField {
  _id: string;
  label: string;
  type: FieldType;
  unit: string | null;
  isActive: boolean;
  createdAt: string;
}

interface ReportData {
  field: { _id: string; label: string; type: string; unit: string | null };
  from: string;
  to: string;
  overview: {
    count: number;
    totalEntries: number;
    usagePct: number;
    sum?: number;
    avg?: number;
    min?: number;
    max?: number;
    topValues?: { value: string; count: number }[];
  };
  dailyTrend: { date: string; count: number; total: number }[];
  byUser: { name: string; email: string; count: number; sum: number }[];
  byProject: { name: string; count: number; sum: number }[];
  recentEntries: {
    date: string;
    userName: string;
    userEmail: string;
    projectName: string;
    taskName: string;
    value: boolean | number | string | null;
  }[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<FieldType, string> = {
  yes_no: "Yes / No",
  number: "Number",
  text:   "Text",
};

const TYPE_ICONS: Record<FieldType, React.ElementType> = {
  yes_no: CheckSquare,
  number: Hash,
  text:   AlignLeft,
};

const TYPE_BADGE: Record<FieldType, string> = {
  yes_no: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  number: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  text:   "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const TYPE_BORDER: Record<FieldType, string> = {
  yes_no: "border-l-sky-500",
  number: "border-l-violet-500",
  text:   "border-l-amber-500",
};

const DATE_PRESETS = [
  { label: "7d",  days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "All", days: null },
] as const;

const BAR_COLORS = [
  "hsl(var(--primary))",
  "#22c55e", "#f59e0b", "#a855f7", "#06b6d4",
  "#f43f5e", "#84cc16", "#fb923c",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function allTimeDates() {
  return { from: "2020-01-01", to: new Date().toISOString().slice(0, 10) };
}

function daysAgoDates(days: number) {
  const to   = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
  return { from, to };
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtValue(value: boolean | number | string | null, type: string) {
  if (value === null || value === undefined) return "—";
  if (type === "yes_no") return value ? "Yes" : "No";
  return String(value);
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked, onChange, disabled,
}: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        checked ? "bg-primary" : "bg-input"
      )}
    >
      <span className={cn(
        "pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-md ring-0 transition-transform duration-200",
        checked ? "translate-x-4" : "translate-x-0"
      )} />
    </button>
  );
}

// ── Type badge ────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: FieldType }) {
  const Icon = TYPE_ICONS[type];
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full",
      TYPE_BADGE[type]
    )}>
      <Icon className="h-3 w-3" />
      {TYPE_LABELS[type]}
    </span>
  );
}

// ── Create / Edit dialog ──────────────────────────────────────────────────────

function FieldDialog({
  open, onOpenChange, initial, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: CustomField;
  onSave: () => void;
}) {
  const [label, setLabel]       = useState(initial?.label ?? "");
  const [type, setType]         = useState<FieldType>(initial?.type ?? "yes_no");
  const [unit, setUnit]         = useState(initial?.unit ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  async function handleSave() {
    if (!label.trim()) { setError("Label is required"); return; }
    setError("");
    setSaving(true);
    try {
      const url    = initial ? `/api/admin/custom-fields/${initial._id}` : "/api/admin/custom-fields";
      const method = initial ? "PATCH" : "POST";
      const body: Record<string, unknown> = { label: label.trim(), type, unit: unit.trim() || null };
      if (initial) body.isActive = isActive;
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error?.formErrors?.[0] ?? err.error ?? "Failed to save");
        return;
      }
      onOpenChange(false);
      onSave();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Field" : "New Custom Field"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Label</Label>
            <Input placeholder="e.g. Saved time?" value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as FieldType)} disabled={!!initial}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes_no">Yes / No</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="text">Text</SelectItem>
              </SelectContent>
            </Select>
            {initial && (
              <p className="text-xs text-muted-foreground">Field type cannot be changed after creation</p>
            )}
          </div>
          {type === "number" && (
            <div className="space-y-1.5">
              <Label>Unit <span className="text-muted-foreground">(optional)</span></Label>
              <Input placeholder="e.g. minutes, hours" value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
          )}
          {initial && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Visible to users when logging time</p>
              </div>
              <ToggleSwitch checked={isActive} onChange={() => setIsActive(!isActive)} />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Overview stat card (detail sheet) ─────────────────────────────────────────

function OverviewCard({
  label, value, sub, icon: Icon, color, bg,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <div className={cn("rounded-md p-1.5", bg)}>
          <Icon className={cn("h-3.5 w-3.5", color)} />
        </div>
      </div>
      <p className={cn("text-2xl font-bold font-mono", color)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Chart tooltips ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TrendTooltip({ active, payload, label, isNumber, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium mb-1">{fmtDate(label)}</p>
      <p>{payload[0]?.value} use{Number(payload[0]?.value) !== 1 ? "s" : ""}</p>
      {isNumber && payload[1] && (
        <p className="text-muted-foreground">Total: {payload[1].value}{unit ? ` ${unit}` : ""}</p>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HBarTooltip({ active, payload, isNumber, unit }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium mb-1">{d?.name ?? d?.email}</p>
      <p>{d?.count} use{d?.count !== 1 ? "s" : ""}</p>
      {isNumber && d?.sum > 0 && (
        <p className="text-muted-foreground">Total: {d.sum}{unit ? ` ${unit}` : ""}</p>
      )}
    </div>
  );
}

// ── Detail report sheet ───────────────────────────────────────────────────────

function DetailSheet({ field, open, onOpenChange }: {
  field: CustomField | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const def                       = allTimeDates();
  const [from, setFrom]           = useState(def.from);
  const [to, setTo]               = useState(def.to);
  const [activePreset, setPreset] = useState<number | null>(null);
  const [data, setData]           = useState<ReportData | null>(null);
  const [loading, setLoading]     = useState(false);

  const fetchReport = useCallback(async () => {
    if (!field) return;
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/admin/custom-fields/${field._id}/report?from=${from}&to=${to}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [field, from, to]);

  useEffect(() => {
    if (open && field) fetchReport();
  }, [open, field, fetchReport]);

  function applyPreset(days: number | null) {
    setPreset(days);
    const range = days ? daysAgoDates(days) : allTimeDates();
    setFrom(range.from);
    setTo(range.to);
  }

  const isNumber = field?.type === "number";
  const isText   = field?.type === "text";
  const unit     = field?.unit ?? "";
  const ov       = data?.overview;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 pr-6">
            {field && (() => { const Icon = TYPE_ICONS[field.type]; return <Icon className="h-4 w-4 text-muted-foreground shrink-0" />; })()}
            <SheetTitle className="text-base truncate">{field?.label}</SheetTitle>
            {field && <TypeBadge type={field.type} />}
          </div>
          <SheetDescription className="sr-only">Detailed field report</SheetDescription>
          {/* Date controls */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {DATE_PRESETS.map((p) => (
              <Button
                key={p.label}
                size="sm"
                variant={activePreset === p.days ? "default" : "outline"}
                className="h-7 px-3 text-xs"
                onClick={() => applyPreset(p.days)}
              >
                {p.label}
              </Button>
            ))}
            <div className="flex items-center gap-1.5 ml-auto">
              <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset(-1); }}
                className="h-7 text-xs w-32" />
              <span className="text-muted-foreground text-xs">–</span>
              <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset(-1); }}
                className="h-7 text-xs w-32" />
              <Button size="sm" className="h-7 px-3 text-xs" onClick={fetchReport} disabled={loading}>
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
          {loading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
              </div>
              <Skeleton className="h-48 rounded-lg" />
              <Skeleton className="h-40 rounded-lg" />
            </div>
          )}

          {!loading && !data && (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              Failed to load report
            </div>
          )}

          {!loading && data && (
            <>
              {/* Overview */}
              <section>
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Overview</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <OverviewCard label="Total Uses" value={ov?.count ?? 0}
                    sub={`out of ${ov?.totalEntries ?? 0} logs`} icon={Activity}
                    color="text-primary" bg="bg-primary/10" />
                  <OverviewCard label="Adoption Rate" value={`${ov?.usagePct ?? 0}%`}
                    sub="of all log entries" icon={Percent}
                    color="text-green-600 dark:text-green-400" bg="bg-green-100 dark:bg-green-900/30" />
                  {isNumber && (
                    <>
                      <OverviewCard label={`Total${unit ? ` (${unit})` : ""}`}
                        value={ov?.sum ?? 0} sub={`min ${ov?.min ?? 0} · max ${ov?.max ?? 0}`}
                        icon={Sigma} color="text-amber-600 dark:text-amber-400" bg="bg-amber-100 dark:bg-amber-900/30" />
                      <OverviewCard label={`Average${unit ? ` (${unit})` : ""}`}
                        value={ov?.avg ?? 0} sub="per use" icon={TrendingUp}
                        color="text-purple-600 dark:text-purple-400" bg="bg-purple-100 dark:bg-purple-900/30" />
                    </>
                  )}
                  {!isNumber && (ov?.count ?? 0) > 0 && (
                    <OverviewCard label="Not Used"
                      value={(ov?.totalEntries ?? 0) - (ov?.count ?? 0)}
                      sub="entries without this field" icon={ArrowUpDown}
                      color="text-muted-foreground" bg="bg-muted" />
                  )}
                </div>
              </section>

              {/* Daily trend */}
              <section>
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Daily Usage</h3>
                <div className="rounded-lg border border-border bg-card p-4">
                  {data.dailyTrend.every((d) => d.count === 0) ? (
                    <div className="h-[160px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <BarChart2 className="h-8 w-8 opacity-20" />
                      <p className="text-sm">No entries in this period</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={data.dailyTrend} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.12)" />
                        <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip content={<TrendTooltip isNumber={isNumber} unit={unit} />} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={28} />
                        {isNumber && (
                          <Bar dataKey="total" fill="hsl(var(--primary) / 0.3)" radius={[3, 3, 0, 0]} maxBarSize={28} />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </section>

              {/* Text top values */}
              {isText && ov?.topValues && ov.topValues.length > 0 && (
                <section>
                  <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Top Values</h3>
                  <div className="rounded-lg border border-border overflow-hidden">
                    {ov.topValues.map(({ value, count }, i) => {
                      const pct = ov.count > 0 ? Math.round((count / ov.count) * 100) : 0;
                      return (
                        <div key={value} className={cn("flex items-center gap-3 px-4 py-3 text-sm", i > 0 && "border-t border-border")}>
                          <span className="w-5 text-xs text-muted-foreground font-mono shrink-0">{i + 1}</span>
                          <span className="flex-1 truncate font-medium">{value}</span>
                          <div className="w-28 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground font-mono w-14 text-right">{count}× ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* By User */}
              <section>
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">By User</h3>
                {data.byUser.length === 0 ? (
                  <div className="rounded-lg border border-border h-24 flex items-center justify-center text-sm text-muted-foreground">
                    No data for this period
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-card p-4">
                    <ResponsiveContainer width="100%" height={Math.max(120, data.byUser.length * 42)}>
                      <BarChart layout="vertical"
                        data={data.byUser.slice(0, 10)}
                        margin={{ top: 0, right: 48, left: 4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128,128,128,0.12)" />
                        <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={96} />
                        <Tooltip content={<HBarTooltip isNumber={isNumber} unit={unit} />} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
                          {data.byUser.slice(0, 10).map((_, i) => (
                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                          ))}
                          <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    {isNumber && (
                      <div className="mt-3 border-t border-border pt-3">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">User</TableHead>
                              <TableHead className="text-xs text-right">Uses</TableHead>
                              <TableHead className="text-xs text-right">Total {unit}</TableHead>
                              <TableHead className="text-xs text-right">Avg {unit}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.byUser.map((u) => (
                              <TableRow key={u.email}>
                                <TableCell className="text-sm py-2">{u.name}</TableCell>
                                <TableCell className="text-right font-mono text-sm py-2">{u.count}</TableCell>
                                <TableCell className="text-right font-mono text-sm py-2">{u.sum}</TableCell>
                                <TableCell className="text-right font-mono text-sm py-2">
                                  {u.count > 0 ? Math.round((u.sum / u.count) * 100) / 100 : 0}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* By Project */}
              <section>
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">By Project</h3>
                {data.byProject.length === 0 ? (
                  <div className="rounded-lg border border-border h-24 flex items-center justify-center text-sm text-muted-foreground">
                    No data for this period
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-card p-4">
                    <ResponsiveContainer width="100%" height={Math.max(120, data.byProject.length * 42)}>
                      <BarChart layout="vertical"
                        data={data.byProject.slice(0, 10)}
                        margin={{ top: 0, right: 48, left: 4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128,128,128,0.12)" />
                        <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                        <Tooltip content={<HBarTooltip isNumber={isNumber} unit={unit} />} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
                          {data.byProject.slice(0, 10).map((_, i) => (
                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                          ))}
                          <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>

              {/* Recent Entries */}
              <section className="pb-4">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Recent Entries</h3>
                {data.recentEntries.length === 0 ? (
                  <div className="rounded-lg border border-border h-24 flex items-center justify-center text-sm text-muted-foreground">
                    No entries in this period
                  </div>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Project / Task</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.recentEntries.map((e, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </TableCell>
                            <TableCell className="text-sm">{e.userName}</TableCell>
                            <TableCell>
                              <p className="text-sm font-medium">{e.projectName}</p>
                              <p className="text-xs text-muted-foreground">{e.taskName}</p>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={cn(
                                "inline-block text-xs font-mono px-2 py-0.5 rounded-full",
                                field?.type === "yes_no"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                  : "bg-primary/10 text-primary"
                              )}>
                                {fmtValue(e.value, field?.type ?? "text")}
                                {isNumber && unit && e.value !== null && ` ${unit}`}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Stat card (analytics grid) ────────────────────────────────────────────────

function StatCard({ field, stat, onViewDetails }: {
  field: CustomField;
  stat: FieldStat | undefined;
  onViewDetails: () => void;
}) {
  const usageCount   = stat?.count ?? 0;
  const totalEntries = stat?.totalEntries ?? 0;
  const usagePct     = totalEntries > 0 ? Math.round((usageCount / totalEntries) * 100) : 0;

  return (
    <Card className={cn(
      "border-l-4 transition-opacity",
      TYPE_BORDER[field.type],
      !field.isActive && "opacity-60"
    )}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold truncate">{field.label}</CardTitle>
            {field.unit && (
              <p className="text-xs text-muted-foreground mt-0.5">{field.unit}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!field.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                Paused
              </span>
            )}
            <TypeBadge type={field.type} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {/* Usage bar */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-2xl font-bold font-mono">{usageCount}</span>
            <span className="text-xs text-muted-foreground">{usagePct}% of {totalEntries} logs</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all",
                field.type === "yes_no" ? "bg-sky-500" :
                field.type === "number" ? "bg-violet-500" : "bg-amber-500"
              )}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">total uses</p>
        </div>

        {/* Number stats */}
        {field.type === "number" && stat?.details && usageCount > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-border pt-3">
            {[
              { label: "Total", value: `${stat.details.sum}${field.unit ? ` ${field.unit}` : ""}` },
              { label: "Average", value: `${stat.details.avg}${field.unit ? ` ${field.unit}` : ""}` },
              { label: "Min", value: stat.details.min },
              { label: "Max", value: stat.details.max },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-muted-foreground">{label}</p>
                <p className="font-semibold font-mono mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Text top values */}
        {field.type === "text" && stat?.details?.topValues && usageCount > 0 && (
          <div className="border-t border-border pt-3 space-y-1.5">
            <p className="text-xs text-muted-foreground">Top values</p>
            {stat.details.topValues.map(({ value, count }) => (
              <div key={value} className="flex items-center justify-between text-xs">
                <span className="truncate max-w-[160px] font-medium">{value}</span>
                <span className="ml-2 text-muted-foreground font-mono shrink-0">{count}×</span>
              </div>
            ))}
          </div>
        )}

        {usageCount === 0 && (
          <p className="text-xs text-muted-foreground border-t border-border pt-3">
            No data recorded yet
          </p>
        )}

        <div className="border-t border-border pt-3">
          <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1.5" onClick={onViewDetails}>
            <BarChart2 className="h-3.5 w-3.5" /> View Detailed Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CustomFieldsClient({
  fields: initialFields,
  stats,
}: {
  fields: CustomField[];
  stats: FieldStat[];
}) {
  const router = useRouter();
  const [fields, setFields]           = useState<CustomField[]>(initialFields);
  const [creating, setCreating]       = useState(false);
  const [editing, setEditing]         = useState<CustomField | null>(null);
  const [deleting, setDeleting]       = useState<string | null>(null);
  const [toggling, setToggling]       = useState<string | null>(null);
  const [reportField, setReportField] = useState<CustomField | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/custom-fields/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFields((prev) => prev.filter((f) => f._id !== id));
        router.refresh();
      }
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    setToggling(id);
    try {
      const res = await fetch(`/api/admin/custom-fields/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (res.ok) {
        setFields((prev) => prev.map((f) => f._id === id ? { ...f, isActive } : f));
      }
    } finally {
      setToggling(null);
    }
  }

  function reload() {
    router.refresh();
    fetch("/api/admin/custom-fields").then((r) => r.json()).then(setFields).catch(() => {});
  }

  const statsById = new Map(stats.map((s) => [s.fieldId, s]));

  return (
    <>
      {/* ── Fields table ── */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Table toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            {fields.length === 0
              ? "No custom fields"
              : `${fields.length} custom field${fields.length !== 1 ? "s" : ""}`}
          </p>
          <Button size="sm" className="h-8 gap-1.5" onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" /> New Field
          </Button>
        </div>

        {fields.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <SlidersHorizontal className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold mb-1">No custom fields yet</h3>
            <p className="text-xs text-muted-foreground max-w-xs mb-4">
              Create custom fields to collect extra data when users log their time — like saved hours, client names, or mood ratings.
            </p>
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Create your first field
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="pl-4">Label</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead className="w-20 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field) => {
                const stat = statsById.get(field._id);
                return (
                  <TableRow
                    key={field._id}
                    className={cn("group", !field.isActive && "opacity-60")}
                  >
                    <TableCell className="pl-4">
                      <p className="font-medium text-sm">{field.label}</p>
                      {field.unit && (
                        <p className="text-xs text-muted-foreground">{field.unit}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={field.type} />
                    </TableCell>
                    <TableCell>
                      <ToggleSwitch
                        checked={field.isActive}
                        disabled={toggling === field._id}
                        onChange={() => handleToggleActive(field._id, !field.isActive)}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono font-semibold">{stat?.count ?? 0}</span>
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => setEditing(field)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(field._id)}
                          disabled={deleting === field._id}
                        >
                          {deleting === field._id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ── Analytics ── */}
      {fields.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Field Analytics</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4 pl-6">
            Usage statistics across all time log entries
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((field) => (
              <StatCard
                key={field._id}
                field={field}
                stat={statsById.get(field._id)}
                onViewDetails={() => setReportField(field)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Dialogs ── */}
      {creating && (
        <FieldDialog
          open={creating}
          onOpenChange={(o) => !o && setCreating(false)}
          onSave={() => { setCreating(false); reload(); }}
        />
      )}
      {editing && (
        <FieldDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          initial={editing}
          onSave={() => { setEditing(null); reload(); }}
        />
      )}
      <DetailSheet
        field={reportField}
        open={!!reportField}
        onOpenChange={(o) => !o && setReportField(null)}
      />
    </>
  );
}
