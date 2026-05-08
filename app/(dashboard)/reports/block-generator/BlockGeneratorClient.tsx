"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Copy, Download, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Format = "text" | "markdown" | "csv";
type GroupBy = "project-task" | "day" | "project";
type BillableFilter = "all" | "billable" | "non-billable";
type Period = "this-week" | "last-week" | "this-month" | "last-month" | "custom";

function getDateRange(period: Period): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;

  if (period === "this-week") {
    const mon = new Date(now); mon.setDate(now.getDate() + diffToMon); mon.setHours(0,0,0,0);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { from: mon.toISOString().slice(0, 10), to: sun.toISOString().slice(0, 10) };
  }
  if (period === "last-week") {
    const mon = new Date(now); mon.setDate(now.getDate() + diffToMon - 7); mon.setHours(0,0,0,0);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { from: mon.toISOString().slice(0, 10), to: sun.toISOString().slice(0, 10) };
  }
  if (period === "this-month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  }
  if (period === "last-month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  }
  return { from: now.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
}

export function BlockGeneratorClient({
  defaultFrom,
  defaultTo,
  isManagerOrAdmin,
}: {
  defaultFrom: string;
  defaultTo: string;
  isManagerOrAdmin: boolean;
}) {
  const [period, setPeriod] = useState<Period>("this-week");
  const [customFrom, setCustomFrom] = useState(defaultFrom);
  const [customTo, setCustomTo] = useState(defaultTo);
  const [groupBy, setGroupBy] = useState<GroupBy>("project-task");
  const [billableFilter, setBillableFilter] = useState<BillableFilter>("all");
  const [format, setFormat] = useState<Format>("text");

  const [block, setBlock] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function getEffectiveDates() {
    if (period === "custom") return { from: customFrom, to: customTo };
    return getDateRange(period);
  }

  async function generate() {
    setLoading(true);
    setError("");
    setBlock(null);
    const { from, to } = getEffectiveDates();

    try {
      const res = await fetch("/api/reports/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, groupBy, billableFilter, format }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Generation failed");
        return;
      }
      const data = await res.json();
      setBlock(data.block);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (!block) return;
    await navigator.clipboard.writeText(block);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    if (!block) return;
    const ext = format === "markdown" ? "md" : format === "csv" ? "csv" : "txt";
    const { from } = getEffectiveDates();
    const filename = `time-report-${from}.${ext}`;
    const blob = new Blob([block], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const periods: { value: Period; label: string }[] = [
    { value: "this-week", label: "This Week" },
    { value: "last-week", label: "Last Week" },
    { value: "this-month", label: "This Month" },
    { value: "last-month", label: "Last Month" },
    { value: "custom", label: "Custom Range" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Options panel */}
      <Card>
        <CardContent className="pt-5 space-y-5">
          {/* Period */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Period
            </Label>
            <div className="space-y-1">
              {periods.map((p) => (
                <label key={p.value} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="period"
                    value={p.value}
                    checked={period === p.value}
                    onChange={() => setPeriod(p.value)}
                    className="accent-primary"
                  />
                  {p.label}
                </label>
              ))}
            </div>
            {period === "custom" && (
              <div className="flex gap-2 mt-2">
                <div className="space-y-1 flex-1">
                  <Label className="text-xs">From</Label>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1 flex-1">
                  <Label className="text-xs">To</Label>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Group by */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Group By
            </Label>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project-task">Project + Task</SelectItem>
                <SelectItem value="project">Project Only</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Billable filter */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Include
            </Label>
            <Select
              value={billableFilter}
              onValueChange={(v) => setBillableFilter(v as BillableFilter)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entries</SelectItem>
                <SelectItem value="billable">Billable only</SelectItem>
                <SelectItem value="non-billable">Non-billable only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Format
            </Label>
            <div className="space-y-1">
              {(["text", "markdown", "csv"] as Format[]).map((f) => (
                <label key={f} className="flex items-center gap-2 cursor-pointer text-sm capitalize">
                  <input
                    type="radio"
                    name="format"
                    value={f}
                    checked={format === f}
                    onChange={() => setFormat(f)}
                    className="accent-primary"
                  />
                  {f === "text" ? "Plain Text" : f === "markdown" ? "Markdown" : "CSV"}
                </label>
              ))}
            </div>
          </div>

          <Button onClick={generate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…
              </>
            ) : (
              "Generate Report"
            )}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {/* Preview panel */}
      <Card>
        <CardContent className="pt-5">
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-3 bg-muted rounded" style={{ width: `${60 + (i % 3) * 15}%` }} />
              ))}
            </div>
          ) : block ? (
            <div className="space-y-3">
              <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-words max-h-[60vh] overflow-y-auto rounded-md bg-muted p-4">
                {block}
              </pre>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyToClipboard} className="flex-1">
                  {copied ? (
                    <><Check className="h-3.5 w-3.5 mr-1.5 text-green-600" /> Copied!</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy</>
                  )}
                </Button>
                <Button size="sm" variant="outline" onClick={download} className="flex-1">
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Configure options and click Generate
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
