export interface BlockEntry {
  loggedAt: Date;
  projectName: string;
  taskName: string;
  hours: number;
  isBillable: boolean;
  aiUsed: boolean;
  notes: string | null;
}

export interface BlockOptions {
  from: string;
  to: string;
  groupBy: "project-task" | "day" | "project";
  format: "text" | "markdown" | "csv";
}

export function formatBlock(
  entries: BlockEntry[],
  options: BlockOptions,
  userName: string
): string {
  if (options.format === "csv") return formatCsv(entries);
  if (options.format === "markdown") return formatMarkdown(entries, options, userName);
  return formatText(entries, options, userName);
}

function groupByProject(entries: BlockEntry[]): Map<string, BlockEntry[]> {
  return entries.reduce((map, e) => {
    const list = map.get(e.projectName) ?? [];
    list.push(e);
    map.set(e.projectName, list);
    return map;
  }, new Map<string, BlockEntry[]>());
}

function groupByDay(entries: BlockEntry[]): Map<string, BlockEntry[]> {
  return entries.reduce((map, e) => {
    const key = new Date(e.loggedAt).toISOString().slice(0, 10);
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
    return map;
  }, new Map<string, BlockEntry[]>());
}

function totalHours(entries: BlockEntry[]): number {
  return Math.round(entries.reduce((s, e) => s + (e.hours ?? 0), 0) * 100) / 100;
}

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function formatPeriod(from: string, to: string): string {
  const fmt = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  return `${fmt(from)} – ${fmt(to)}`;
}

// ── Plain Text ──────────────────────────────────────────────────────────────

function formatText(entries: BlockEntry[], options: BlockOptions, userName: string): string {
  const SEP = "━".repeat(51);
  const total = totalHours(entries);
  const billable = Math.round(entries.filter((e) => e.isBillable).reduce((s, e) => s + e.hours, 0) * 100) / 100;
  const aiHrs = Math.round(entries.filter((e) => e.aiUsed).reduce((s, e) => s + e.hours, 0) * 100) / 100;

  const lines: string[] = [
    `Time Report — ${userName}`,
    `Period: ${formatPeriod(options.from, options.to)}`,
    SEP,
    "",
  ];

  const groups =
    options.groupBy === "day" ? groupByDay(entries) : groupByProject(entries);

  Array.from(groups.entries()).forEach(([key, items]) => {
    const groupTotal = totalHours(items);
    const header = options.groupBy === "day"
      ? `DATE: ${key}`
      : `PROJECT: ${key}`;
    lines.push(`${header.padEnd(47)} ${String(groupTotal + "h").padStart(5)}`);

    items.forEach((e) => {
      const tags = [e.isBillable ? "[billable]" : "[non-billable]", e.aiUsed ? "[AI]" : ""].filter(Boolean).join(" ");
      const label = `  Task: ${e.taskName}`;
      lines.push(
        `${label.padEnd(47)} ${String(e.hours + "h").padStart(5)}  ${tags}`
      );
    });
    lines.push("");
  });

  lines.push(SEP);
  lines.push(
    `Total: ${total}h  ·  Billable: ${billable}h (${pct(billable, total)}%)  ·  AI-assisted: ${aiHrs}h (${pct(aiHrs, total)}%)`
  );

  return lines.join("\n");
}

// ── Markdown ─────────────────────────────────────────────────────────────────

function formatMarkdown(entries: BlockEntry[], options: BlockOptions, userName: string): string {
  const total = totalHours(entries);
  const billable = Math.round(entries.filter((e) => e.isBillable).reduce((s, e) => s + e.hours, 0) * 100) / 100;
  const aiHrs = Math.round(entries.filter((e) => e.aiUsed).reduce((s, e) => s + e.hours, 0) * 100) / 100;

  const lines: string[] = [
    `## Time Report — ${userName}`,
    `**Period:** ${formatPeriod(options.from, options.to)}`,
    "",
    "---",
    "",
  ];

  const groups =
    options.groupBy === "day" ? groupByDay(entries) : groupByProject(entries);

  Array.from(groups.entries()).forEach(([key, items]) => {
    const groupTotal = totalHours(items);
    const heading = options.groupBy === "day" ? `${key}` : key;
    lines.push(`### ${heading} — ${groupTotal}h`);
    lines.push("| Task | Hours | Billable | AI |");
    lines.push("|---|---|---|---|");
    items.forEach((e) => {
      lines.push(`| ${e.taskName} | ${e.hours} | ${e.isBillable ? "✓" : ""} | ${e.aiUsed ? "✓" : ""} |`);
    });
    lines.push("");
  });

  lines.push("---");
  lines.push(
    `**Total:** ${total}h · **Billable:** ${billable}h (${pct(billable, total)}%) · **AI-assisted:** ${aiHrs}h (${pct(aiHrs, total)}%)`
  );

  return lines.join("\n");
}

// ── CSV ────────────────────────────────────────────────────────────────────

function formatCsv(entries: BlockEntry[]): string {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()
  );

  const rows = sorted.map((e) => {
    const date = new Date(e.loggedAt).toISOString().slice(0, 10);
    const notes = `"${(e.notes ?? "").replace(/"/g, '""')}"`;
    return [date, e.projectName, e.taskName, e.hours, e.isBillable, e.aiUsed, notes].join(",");
  });

  return ["date,project,task,hours,billable,ai_used,notes", ...rows].join("\n");
}
