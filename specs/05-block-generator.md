# Spec 05 — Block Report Generator

## Purpose

Generate a clean, formatted text block summarising a user's time log for a period — ready to paste into a standup, Slack message, client update, Jira ticket, or email. Supports plain text, Markdown, and CSV output. The core logic lives in a pure `block-formatter.ts` function; the page provides the options form and a live preview.

## Dependencies

- `specs/03-time-logging.md` complete — time entries exist
- `specs/02-projects-tasks.md` complete — project and task names available

---

## Output Formats

### Plain Text Example

```
Time Report — Saniya Mallik
Period: 29 Apr – 05 May 2025
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT: upep.mx                                          8.5 h
  Task: Checkout UI                                       3.0 h  [billable] [AI]
  Task: Cart persistence bug fix                          1.5 h  [billable]
  Task: PR review #42                                     2.0 h  [billable]
  Task: Deployment prep                                   2.0 h  [billable]

PROJECT: wisdmlabs-internal                               4.0 h
  Task: Sprint planning                                   1.0 h  [non-billable]
  Task: Knowledge base update                             3.0 h  [non-billable]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 12.5 h  ·  Billable: 8.5 h (68%)  ·  AI-assisted: 3.0 h (24%)
```

### Markdown Example

```markdown
## Time Report — Saniya Mallik
**Period:** 29 Apr – 05 May 2025

---

### upep.mx — 8.5 h
| Task | Hours | Billable | AI |
|---|---|---|---|
| Checkout UI | 3.0 | ✓ | ✓ |
| Cart persistence bug fix | 1.5 | ✓ | |
| PR review #42 | 2.0 | ✓ | |
| Deployment prep | 2.0 | ✓ | |

### wisdmlabs-internal — 4.0 h
| Task | Hours | Billable | AI |
|---|---|---|---|
| Sprint planning | 1.0 | | |
| Knowledge base update | 3.0 | | |

---
**Total:** 12.5 h · **Billable:** 8.5 h (68%) · **AI-assisted:** 3.0 h (24%)
```

### CSV Format

Columns (header row always included):

```
date,project,task,hours,billable,ai_used,notes
2025-04-29,upep.mx,Checkout UI,3.0,true,true,""
2025-04-29,upep.mx,Cart persistence bug fix,1.5,true,false,""
...
```

CSV column definitions:
- `date` — `YYYY-MM-DD` (loggedAt)
- `project` — project name string
- `task` — task name string
- `hours` — decimal number
- `billable` — `true` / `false`
- `ai_used` — `true` / `false`
- `notes` — quoted string, empty string if null

---

## API Route — `app/api/reports/block/route.ts`

```
POST /api/reports/block
Auth: any session
```

**Request body:**

```ts
{
  from: string                   // YYYY-MM-DD
  to: string                     // YYYY-MM-DD
  userId?: string                // manager/admin only; defaults to session user
  groupBy: 'project-task' | 'day' | 'project'
  billableFilter: 'all' | 'billable' | 'non-billable'
  format: 'text' | 'markdown' | 'csv'
}
```

**Zod schema (add to `lib/zod-schemas.ts`):**

```ts
export const BlockReportSchema = z.object({
  from:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to:             z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  userId:         z.string().optional(),
  groupBy:        z.enum(['project-task', 'day', 'project']).default('project-task'),
  billableFilter: z.enum(['all', 'billable', 'non-billable']).default('all'),
  format:         z.enum(['text', 'markdown', 'csv']).default('text'),
})
```

**Route handler logic:**

1. Parse + validate body with `BlockReportSchema`
2. Resolve `targetUserId`: if `userId` provided and role is manager/admin use it; else use `session.user.id`
3. Fetch matching entries with populate: `TimeEntry.find({ userId, loggedAt: { $gte, $lte }, ...billableFilter }).populate('projectId', 'name').populate('taskId', 'name').lean()`
4. Apply `billableFilter` in the DB query: `isBillable: true` / `isBillable: false` / no filter
5. Fetch user name from DB for the report header
6. Call `formatBlock(entries, options, userName)` from `lib/block-formatter.ts`
7. Return `{ block: string }`

---

## Pure Function — `lib/block-formatter.ts`

```ts
export interface BlockEntry {
  loggedAt: Date
  projectName: string
  taskName: string
  hours: number
  isBillable: boolean
  aiUsed: boolean
  notes: string | null
}

export interface BlockOptions {
  from: string
  to: string
  groupBy: 'project-task' | 'day' | 'project'
  format: 'text' | 'markdown' | 'csv'
}

export function formatBlock(
  entries: BlockEntry[],
  options: BlockOptions,
  userName: string
): string {
  if (options.format === 'csv') return formatCsv(entries)
  if (options.format === 'markdown') return formatMarkdown(entries, options, userName)
  return formatText(entries, options, userName)
}
```

### Internal helpers

**`formatText(entries, options, userName): string`**
- Groups entries by project (or day if `groupBy === 'day'`)
- Builds fixed-width columns using `.padEnd()` for alignment
- Appends footer line with totals

**`formatMarkdown(entries, options, userName): string`**
- Same grouping logic
- Outputs GFM table per group

**`formatCsv(entries): string`**
- Header row: `date,project,task,hours,billable,ai_used,notes`
- One row per entry, sorted by `loggedAt` ascending
- Quotes `notes` field; replaces internal `"` with `""`

**`groupByProject(entries)`**
```ts
function groupByProject(entries: BlockEntry[]): Map<string, BlockEntry[]> {
  return entries.reduce((map, e) => {
    const list = map.get(e.projectName) ?? []
    list.push(e)
    map.set(e.projectName, list)
    return map
  }, new Map<string, BlockEntry[]>())
}
```

**`groupByDay(entries)`**
```ts
function groupByDay(entries: BlockEntry[]): Map<string, BlockEntry[]> {
  return entries.reduce((map, e) => {
    const key = e.loggedAt.toISOString().slice(0, 10)
    const list = map.get(key) ?? []
    list.push(e)
    map.set(key, list)
    return map
  }, new Map<string, BlockEntry[]>())
}
```

---

## Page — `app/(dashboard)/reports/block-generator/page.tsx`

Client component (interactive form + preview).

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  Page header: "Block Report Generator"                  │
├──────────────────────────┬──────────────────────────────┤
│  OPTIONS (left panel)    │  PREVIEW (right panel)       │
│                          │                              │
│  Period:                 │  [monospace preview box]     │
│  ○ This Week             │                              │
│  ○ Last Week             │  [Copy to Clipboard button]  │
│  ○ This Month            │  [Download as .txt button]   │
│  ● Custom ──────────     │                              │
│    From [date] To [date] │                              │
│                          │                              │
│  Group by:               │                              │
│  [Project + Task ▾]      │                              │
│                          │                              │
│  Include:                │                              │
│  [All ▾]                 │                              │
│                          │                              │
│  Format:                 │                              │
│  ○ Plain Text            │                              │
│  ○ Markdown              │                              │
│  ○ CSV                   │                              │
│                          │                              │
│  User (admin+):          │                              │
│  [Self ▾]                │                              │
│                          │                              │
│  [Generate Report]       │                              │
└──────────────────────────┴──────────────────────────────┘
```

**Behaviour:**

1. On "Generate Report" click: POST `/api/reports/block` with current form state
2. Show loading spinner in preview panel during fetch
3. Display `block` string in `<pre className="font-mono text-sm ...">` in preview panel
4. "Copy to Clipboard" uses `navigator.clipboard.writeText(block)`; shows "Copied!" toast for 2s
5. "Download" creates a Blob and triggers download with filename `time-report-YYYY-MM-DD.txt` (or `.md` / `.csv`)

---

## Components

### `components/BlockReportForm.tsx`

Client component. Props: `onGenerate: (options: BlockOptions) => void`, `isLoading: boolean`

Renders all the form inputs described in the page layout above.

### `components/BlockReportPreview.tsx`

Client component. Props: `block: string | null`, `format: 'text' | 'markdown' | 'csv'`, `isLoading: boolean`

- Loading state: skeleton lines
- Empty state: "Configure options and click Generate"
- Content state: `<pre>` block + Copy + Download buttons

---

## Checklist

- [ ] `lib/zod-schemas.ts` — `BlockReportSchema`
- [ ] `lib/block-formatter.ts` — `formatBlock`, `formatText`, `formatMarkdown`, `formatCsv`, grouping helpers
- [ ] `app/api/reports/block/route.ts`
- [ ] `app/(dashboard)/reports/block-generator/page.tsx`
- [ ] `components/BlockReportForm.tsx`
- [ ] `components/BlockReportPreview.tsx`

## Verification

1. Generate plain text report for "this week" — output matches manually counted entries
2. Grouped by project: entries are correctly grouped under project headers
3. Grouped by day: entries are grouped by date header
4. Markdown format: valid GFM table (paste into GitHub markdown preview)
5. CSV format: opens correctly in Excel / Google Sheets with correct columns
6. Footer totals: Total, Billable, AI % match independently computed values
7. Billable filter "billable only" — non-billable entries excluded from output and totals
8. Copy to clipboard — text copied and "Copied!" feedback shown
9. Download .txt — file downloads with correct name
10. Manager selects another user — that user's entries used for the report
