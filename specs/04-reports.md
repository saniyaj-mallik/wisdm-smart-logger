# Spec 04 — Reports & Statistics

## Purpose

Surface aggregated time data through MongoDB aggregation pipelines. Provides four API endpoints and three report pages: a personal summary with stat cards, a project breakdown table, and a team overview (manager/admin only). All views support date range filtering.

## Dependencies

- `specs/03-time-logging.md` complete — time entries exist in DB

---

## Role-Based Data Scope

| Role | What they can see |
|---|---|
| `dev` / `sme` | Own entries only — `userId` filter is always forced to `session.user.id` |
| `manager` / `admin` | All users — can optionally filter by `userId` or `projectId` |

Enforce this inside each API route, not in middleware.

---

## API Routes

### 1. `GET /api/reports/summary`

Returns total hours and breakdowns for a user over a date range.

**Query params:** `from` (YYYY-MM-DD), `to` (YYYY-MM-DD), `userId?` (manager+ only)

**Aggregation pipeline:**

```ts
await TimeEntry.aggregate([
  {
    $match: {
      userId: new Types.ObjectId(targetUserId),
      loggedAt: { $gte: new Date(from), $lte: new Date(to) },
    },
  },
  {
    $group: {
      _id: null,
      totalHours:    { $sum: '$hours' },
      billableHours: { $sum: { $cond: ['$isBillable', '$hours', 0] } },
      aiHours:       { $sum: { $cond: ['$aiUsed', '$hours', 0] } },
      entryCount:    { $sum: 1 },
    },
  },
])
```

**Response:**
```ts
{
  totalHours: number,
  billableHours: number,
  nonBillableHours: number,    // computed: total - billable
  billablePct: number,         // 0–100
  aiHours: number,
  aiPct: number,
  entryCount: number,
}
```

---

### 2. `GET /api/reports/by-project`

Hours grouped by project for a user and date range.

**Query params:** `from`, `to`, `userId?`

**Aggregation pipeline:**

```ts
await TimeEntry.aggregate([
  {
    $match: {
      userId: new Types.ObjectId(targetUserId),
      loggedAt: { $gte: new Date(from), $lte: new Date(to) },
    },
  },
  {
    $group: {
      _id: '$projectId',
      totalHours:    { $sum: '$hours' },
      billableHours: { $sum: { $cond: ['$isBillable', '$hours', 0] } },
      entryCount:    { $sum: 1 },
    },
  },
  {
    $lookup: {
      from: 'projects',
      localField: '_id',
      foreignField: '_id',
      as: 'project',
    },
  },
  { $unwind: '$project' },
  { $sort: { totalHours: -1 } },
])
```

**Response:** `[{ projectId, projectName, totalHours, billableHours, billablePct, entryCount }]`

---

### 3. `GET /api/reports/by-task`

Hours grouped by task within a specific project.

**Query params:** `from`, `to`, `projectId` (required), `userId?`

**Aggregation pipeline:**

```ts
await TimeEntry.aggregate([
  {
    $match: {
      ...(targetUserId ? { userId: new Types.ObjectId(targetUserId) } : {}),
      projectId: new Types.ObjectId(projectId),
      loggedAt: { $gte: new Date(from), $lte: new Date(to) },
    },
  },
  {
    $group: {
      _id: '$taskId',
      totalHours: { $sum: '$hours' },
      entryCount: { $sum: 1 },
    },
  },
  {
    $lookup: {
      from: 'tasks',
      localField: '_id',
      foreignField: '_id',
      as: 'task',
    },
  },
  { $unwind: '$task' },
  { $sort: { totalHours: -1 } },
])
```

**Response:** `[{ taskId, taskName, estimatedHours, totalHours, entryCount }]`

---

### 4. `GET /api/reports/by-user` (manager/admin only)

Hours grouped by user, optionally filtered by project.

**Query params:** `from`, `to`, `projectId?`

**Aggregation pipeline:**

```ts
await TimeEntry.aggregate([
  {
    $match: {
      ...(projectId ? { projectId: new Types.ObjectId(projectId) } : {}),
      loggedAt: { $gte: new Date(from), $lte: new Date(to) },
    },
  },
  {
    $group: {
      _id: '$userId',
      totalHours:    { $sum: '$hours' },
      billableHours: { $sum: { $cond: ['$isBillable', '$hours', 0] } },
      aiHours:       { $sum: { $cond: ['$aiUsed', '$hours', 0] } },
      entryCount:    { $sum: 1 },
    },
  },
  {
    $lookup: {
      from: 'users',
      localField: '_id',
      foreignField: '_id',
      as: 'user',
    },
  },
  { $unwind: '$user' },
  {
    $project: {
      totalHours: 1, billableHours: 1, aiHours: 1, entryCount: 1,
      'user.name': 1, 'user.email': 1, 'user.role': 1,
    },
  },
  { $sort: { totalHours: -1 } },
])
```

**Response:** `[{ userId, userName, userEmail, userRole, totalHours, billableHours, aiHours, entryCount }]`

---

## Pages

### `/reports` — `app/(dashboard)/reports/page.tsx`

Landing page. Contains the date range selector and links/tabs to the individual report views. Defaults to "this week" (Mon–Sun of current week).

Components:
- `<ReportFilters>` — date range inputs (from/to), optional project filter, optional user filter (manager+)
- Navigation tabs/cards to: Summary, Project Breakdown, Team Overview

### `/reports/summary` — `app/(dashboard)/reports/summary/page.tsx`

Server component. Reads `from`/`to` from searchParams, calls `/api/reports/summary`.

Renders `<SummaryCards>` with 4 stat cards:
- Total hours (large number)
- Billable hours + % of total
- Non-billable hours
- AI-assisted hours + % of total

Below cards: `<ProjectBreakdownTable>` (calls `/api/reports/by-project` with same range) so users see the full picture on one page.

### `/reports/projects` — `app/(dashboard)/reports/projects/page.tsx`

Server component. Renders `<ProjectBreakdownTable>` with drill-down: clicking a project row navigates to `/reports/projects/[id]?from=&to=` which shows the `by-task` breakdown.

### `/reports/team` — `app/(dashboard)/reports/team/page.tsx`

Access: manager/admin only (check role in the server component and show 403 message to others).

Server component. Renders `<TeamOverviewTable>` with per-user rows.

Clicking a user row opens `<UserDetailModal>` showing their project breakdown for the selected period.

---

## Components

### `components/ReportFilters.tsx`

Client component. Props: `defaultFrom`, `defaultTo`, `showUserFilter?: boolean`

Renders:
- "From" date input
- "To" date input
- Quick presets: This Week · Last Week · This Month · Last Month
- Optional: Project `<Select>` (populated from `/api/projects`)
- Optional: User `<Select>` (populated from `/api/users`, visible to manager+)
- "Apply" button → updates URL searchParams with `router.push()`

### `components/SummaryCards.tsx`

Props: `data: SummaryResponse`

4-column grid of stat cards. Each card:
- Large monospace number (e.g. `24.5h`)
- Label below
- Subtle percentage badge (e.g. `83% billable`)

### `components/ProjectBreakdownTable.tsx`

Props: `rows: ProjectBreakdownRow[]`, `onRowClick?: (projectId: string) => void`

Table columns: Project · Client · Total Hours · Billable Hours · Billable % · Entries

Hours values in `font-mono`. Billable% shown as a thin progress bar + number.

### `components/TeamOverviewTable.tsx`

Props: `rows: UserBreakdownRow[]`

Table columns: User · Role · Total Hours · Billable Hours · AI Hours · Entries

---

## Checklist

- [ ] `app/api/reports/summary/route.ts`
- [ ] `app/api/reports/by-project/route.ts`
- [ ] `app/api/reports/by-task/route.ts`
- [ ] `app/api/reports/by-user/route.ts`
- [ ] `app/(dashboard)/reports/page.tsx` — landing + filters
- [ ] `app/(dashboard)/reports/summary/page.tsx`
- [ ] `app/(dashboard)/reports/projects/page.tsx`
- [ ] `app/(dashboard)/reports/projects/[id]/page.tsx` — task breakdown
- [ ] `app/(dashboard)/reports/team/page.tsx` — manager/admin only
- [ ] `components/ReportFilters.tsx`
- [ ] `components/SummaryCards.tsx`
- [ ] `components/ProjectBreakdownTable.tsx`
- [ ] `components/TeamOverviewTable.tsx`

## Verification

1. Seed 10–15 time entries spread across 2 users, 3 projects, and 2 weeks
2. Summary report for user A, this week — totals match manual sum from entries
3. Billable % = billable hours / total hours × 100
4. Project breakdown — hours per project sum to match summary total
5. Task breakdown for project X — hours sum to project total
6. Team overview — visible to manager/admin, hidden (redirect) to dev/sme
7. Team overview hours per user — sum of all users matches total across all entries for the period
8. Date range filter: changing `from`/`to` updates all report values
