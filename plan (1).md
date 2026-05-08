# WisdmLabs Smart Logger — Build Plan

**What it is:** A corporate time-logging system where developers and SMEs log hours against company projects and tasks. Managers review team output; admins govern users and projects.

> **Canonical specs are in `specs/`.** Each phase has a self-contained spec file that is the authoritative reference for implementation. This plan file is the high-level overview; the spec files have the exact models, API shapes, Zod schemas, component props, and checklists.
>
> | Spec file | Contents |
> |---|---|
> | `specs/00-setup.md` | Scaffold, dependencies, Tailwind + shadcn, ThemeProvider |
> | `specs/ui-system.md` | Sidebar shell, modals, theme tokens, visual rules |
> | `specs/01-users-auth.md` | User model, NextAuth v5, middleware, register/login |
> | `specs/02-projects-tasks.md` | Project + Task models, CRUD, seed script |
> | `specs/03-time-logging.md` | TimeEntry model, Zod schemas, dashboard, cascade form |
> | `specs/04-reports.md` | MongoDB aggregation pipelines, report pages |
> | `specs/05-block-generator.md` | Block formatter, plain/markdown/CSV output, generator page |

## Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** MongoDB + Mongoose
- **Auth:** NextAuth v5 (credentials provider)
- **Validation:** Zod
- **Styling:** Tailwind CSS + `tailwindcss-animate`
- **UI primitives:** shadcn/ui (Radix UI under the hood)
- **Icons:** Lucide React
- **Theme:** `next-themes` (dark / light, persisted in localStorage)

---

## UI/UX System

### Layout — Dashboard Shell

Every authenticated page shares the same shell:

```
┌──────────────────────────────────────────────────────┐
│  SIDEBAR (fixed, 240px)  │  MAIN CONTENT AREA        │
│                          │                           │
│  ┌──────────────────┐    │  ┌─────────────────────┐  │
│  │  Logo + App name │    │  │  Page header        │  │
│  └──────────────────┘    │  │  (title + actions)  │  │
│                          │  └─────────────────────┘  │
│  ── MAIN ─────────────   │                           │
│  Dashboard               │  Page content             │
│  Log Time                │  (tables, cards, charts)  │
│  My Logs                 │                           │
│                          │                           │
│  ── PROJECTS ──────────  │                           │
│  All Projects            │                           │
│  (admin) Manage Tasks    │                           │
│                          │                           │
│  ── REPORTS ───────────  │                           │
│  My Summary              │                           │
│  Project Breakdown       │                           │
│  Team Overview           │                           │
│  Block Generator         │                           │
│                          │                           │
│  ── ADMIN ─────────────  │                           │
│  (admin only)            │                           │
│  Users                   │                           │
│                          │                           │
│  ────────────────────    │                           │
│  [avatar] Name           │                           │
│  Profile · Sign out      │                           │
│  [sun/moon toggle]       │                           │
└──────────────────────────────────────────────────────┘
```

- Sidebar is **always visible on desktop** (≥ 1024px), collapses to a hamburger sheet on mobile
- Active nav item has a left accent bar + highlighted background
- Admin-only sections are hidden from non-admin roles — not just disabled, hidden
- User avatar + role badge at the bottom of the sidebar
- Dark/light toggle lives in the sidebar footer

### Component: `components/layout/Sidebar.tsx`
- Renders nav groups: Main, Projects, Reports, Admin
- Reads `session.user.role` to conditionally show admin items
- Uses `usePathname()` to mark the active item

### Component: `components/layout/DashboardShell.tsx`
- Wraps sidebar + `<main>` with correct padding
- Passes `children` into main area

### Component: `components/layout/PageHeader.tsx`
- Props: `title`, `description?`, `action?` (renders a button/modal trigger top-right)
- Used on every page for consistent header layout

---

### Modal Strategy

All create / edit / delete actions open a **modal dialog** — no full-page navigations for these operations. The table or list behind stays visible.

| Action | Modal |
|---|---|
| Log Time | `LogTimeModal` — project picker → task picker → form |
| Edit Log Entry | `EditLogModal` — pre-filled form |
| Delete Log Entry | `ConfirmDeleteModal` — destructive confirm dialog |
| Create Project | `CreateProjectModal` — name, client, budget |
| Edit Project | `EditProjectModal` — same fields, pre-filled |
| Archive Project | `ConfirmArchiveModal` |
| Add Task to Project | `AddTaskModal` — task name, estimated hours |
| Edit Task | `EditTaskModal` |
| Change User Role | `EditUserModal` — role selector dropdown |
| Deactivate User | `ConfirmDeactivateModal` |
| Generate API Token | inline reveal on profile page (no modal needed) |

All modals are built on `shadcn/ui Dialog` (Radix `DialogRoot`). They:
- Trap focus when open
- Close on Escape or backdrop click
- Show a loading spinner on submit
- Display inline field-level errors (from Zod) without closing
- On success: close + optimistically update the list (or trigger a revalidation)

### Component structure for modals

```
components/
  modals/
    LogTimeModal.tsx
    EditLogModal.tsx
    ConfirmDeleteModal.tsx
    CreateProjectModal.tsx
    EditProjectModal.tsx
    ConfirmArchiveModal.tsx
    AddTaskModal.tsx
    EditTaskModal.tsx
    EditUserModal.tsx
    ConfirmDeactivateModal.tsx
```

Each modal is self-contained: it owns its form state, submits to the API, and calls an `onSuccess` callback passed from the parent.

---

### Theme System

**Package:** `next-themes`

**Tailwind config:**
```js
// tailwind.config.ts
darkMode: 'class'
```

**Color tokens (CSS variables in `globals.css`):**

| Token | Light | Dark |
|---|---|---|
| `--background` | `#f8fafc` | `#0f172a` |
| `--foreground` | `#0f172a` | `#f8fafc` |
| `--card` | `#ffffff` | `#1e293b` |
| `--card-foreground` | `#0f172a` | `#f8fafc` |
| `--primary` | `#2563eb` | `#3b82f6` |
| `--primary-foreground` | `#ffffff` | `#ffffff` |
| `--muted` | `#f1f5f9` | `#1e293b` |
| `--muted-foreground` | `#64748b` | `#94a3b8` |
| `--border` | `#e2e8f0` | `#334155` |
| `--destructive` | `#ef4444` | `#f87171` |
| `--accent` | `#2563eb` | `#3b82f6` |

shadcn/ui components consume these tokens automatically — no per-component dark mode overrides needed.

**`components/ThemeToggle.tsx`** — a single icon button (sun/moon via Lucide) that calls `setTheme()` from `next-themes`. Placed in the sidebar footer.

**`app/layout.tsx`** wraps the tree in `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`.

---

### Visual Style — Critical Dashboard Aesthetic

- **Dense information layout** — tables, not cards, for list views (logs, projects, users)
- **Stat cards** on the dashboard: total hours this week, billable %, AI usage %, open projects — each card has a large number, label, and subtle trend indicator
- **Subtle borders and shadows** — `border border-border` and `shadow-sm` throughout; no heavy drop shadows
- **Monospace font for time/hours values** — `font-mono` on all hour and time fields
- **Status badges** — pill badges for `billable` / `non-billable`, `active` / `archived`, roles — colour-coded
- **Row actions** — edit / delete icons appear on table row hover (`opacity-0 group-hover:opacity-100`)
- **Empty states** — every table has an illustrated empty state with a CTA (e.g. "No logs yet — Log your first hour")
- **Sidebar accent** — left sidebar uses a slightly darker/lighter surface than main content to visually anchor it

---

### UI Checklist (cross-phase)
- [ ] Install: `shadcn/ui`, `next-themes`, `lucide-react`, `tailwindcss-animate`
- [ ] `app/layout.tsx` — wrap in `ThemeProvider`
- [ ] `globals.css` — CSS variable tokens for both themes
- [ ] `components/layout/Sidebar.tsx`
- [ ] `components/layout/DashboardShell.tsx`
- [ ] `components/layout/PageHeader.tsx`
- [ ] `components/ThemeToggle.tsx`
- [ ] `components/ui/` — shadcn primitives (Button, Input, Select, Dialog, Table, Badge, Card, Tooltip)
- [ ] All modals in `components/modals/`
- [ ] Mobile: sidebar collapses to Sheet on < 1024px

---

## Data Hierarchy

```
Organisation
└── Projects          (e.g. "upep.mx", "wisdmlabs-internal")
    └── Tasks         (e.g. "Sprint 4 – Checkout UI")
        └── TimeEntries  (individual hours logged by a user)
```

---

## Phase 1 — Users & Auth

**Goal:** Working auth with roles. Everything else builds on this.

### Model — `models/User.ts`

| Field | Type | Notes |
|---|---|---|
| name | String | required |
| email | String | required, unique, lowercase |
| passwordHash | String | bcrypt |
| role | Enum | `dev` · `sme` · `manager` · `admin` |
| isActive | Boolean | default `true`; deactivated users cannot log in |
| createdAt | Date | auto |

### Pages

| Route | Access | What |
|---|---|---|
| `/login` | public | email + password form |
| `/register` | public | self-registration, role defaults to `dev` |
| `/profile` | own user | edit name, change password |
| `/admin/users` | admin | list all users, change role, deactivate |

### API

| Endpoint | Access | Action |
|---|---|---|
| `POST /api/auth/register` | public | create user |
| `GET /api/users` | admin | list all users |
| `PATCH /api/users/[id]` | admin | update role or `isActive` |

### Auth Config
- NextAuth v5 credentials provider
- JWT callback stores `id` and `role`
- `middleware.ts` protects all routes under `/dashboard`, `/projects`, `/logs`, `/reports`, `/admin`
- Deactivated users blocked at `authorize` step

### Checklist
- [ ] `lib/mongodb.ts` — connection singleton
- [ ] `models/User.ts`
- [ ] `lib/auth.ts` — NextAuth config
- [ ] `app/api/auth/[...nextauth]/route.ts`
- [ ] `middleware.ts`
- [ ] `app/(auth)/login/page.tsx`
- [ ] `app/(auth)/register/page.tsx` + server action
- [ ] `app/(dashboard)/profile/page.tsx`
- [ ] `app/(dashboard)/admin/users/page.tsx` (admin)
- [ ] `app/api/users/route.ts`
- [ ] `app/api/users/[id]/route.ts`

---

## Phase 2 — Projects & Tasks

**Goal:** Admins create and manage projects. Each project contains tasks that users log against.

### Model — `models/Project.ts`

| Field | Type | Notes |
|---|---|---|
| name | String | required, unique |
| clientName | String | optional — who the project is for |
| description | String | optional |
| budgetHours | Number | optional — planned hours for the project |
| isActive | Boolean | default `true` |
| createdAt | Date | auto |

### Model — `models/Task.ts`

| Field | Type | Notes |
|---|---|---|
| projectId | ObjectId → Project | required, indexed |
| name | String | required |
| description | String | optional |
| estimatedHours | Number | optional |
| isActive | Boolean | default `true` |
| createdAt | Date | auto |

### Pages

| Route | Access | What |
|---|---|---|
| `/projects` | all | list active projects |
| `/projects/new` | admin | create project |
| `/projects/[id]` | admin | edit / archive project |
| `/projects/[id]/tasks` | admin | manage tasks for a project |
| `/projects/[id]/tasks/new` | admin | add task |

### API

| Endpoint | Access | Action |
|---|---|---|
| `GET /api/projects` | all authed | list active projects |
| `POST /api/projects` | admin | create project |
| `PATCH /api/projects/[id]` | admin | update / archive |
| `GET /api/projects/[id]/tasks` | all authed | list tasks for a project |
| `POST /api/projects/[id]/tasks` | admin | add task |
| `PATCH /api/tasks/[id]` | admin | update / archive task |

### Seed Script
`scripts/seed.ts` — upserts baseline projects and tasks.

### Checklist
- [ ] `models/Project.ts`
- [ ] `models/Task.ts`
- [ ] `app/api/projects/route.ts`
- [ ] `app/api/projects/[id]/route.ts`
- [ ] `app/api/projects/[id]/tasks/route.ts`
- [ ] `app/api/tasks/[id]/route.ts`
- [ ] `app/(dashboard)/projects/page.tsx`
- [ ] `app/(dashboard)/projects/new/page.tsx`
- [ ] `app/(dashboard)/projects/[id]/page.tsx`
- [ ] `app/(dashboard)/projects/[id]/tasks/page.tsx`
- [ ] `scripts/seed.ts`

---

## Phase 3 — Time Logging

**Goal:** Users log hours against a project task. Core CRUD with flexible time input.

### Model — `models/TimeEntry.ts`

| Field | Type | Notes |
|---|---|---|
| userId | ObjectId → User | required, indexed |
| projectId | ObjectId → Project | required |
| taskId | ObjectId → Task | required |
| hours | Number \| null | null when start/end used |
| startTime | String \| null | `HH:MM` 24h |
| endTime | String \| null | `HH:MM` 24h |
| loggedAt | Date | date only — time stripped on save |
| isBillable | Boolean | default `true` |
| aiUsed | Boolean | default `false` |
| notes | String \| null | max 1000 chars |

Rule: `hours` OR (`startTime` + `endTime`) must be present — enforced via Zod.

### `lib/time-utils.ts`
```ts
export function computeHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  return Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 100) / 100
}
```

### Zod Schema (`lib/zod-schemas.ts`)
```ts
export const CreateLogSchema = z.object({
  projectId: z.string().min(1),
  taskId: z.string().min(1),
  hours: z.number().positive().max(24).nullable().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  loggedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isBillable: z.boolean().default(true),
  aiUsed: z.boolean().default(false),
  notes: z.string().max(1000).nullable().optional(),
}).refine(
  (d) => d.hours != null || (d.startTime != null && d.endTime != null),
  { message: 'Provide either hours or both startTime and endTime' }
)
```

### Pages

| Route | Access | What |
|---|---|---|
| `/dashboard` | own user | recent logs + this week's hours summary |
| `/logs/new` | own user | create log — project → task cascade picker |
| `/logs/[id]` | own user / admin | view, edit, delete |

### API

| Endpoint | Access | Action |
|---|---|---|
| `GET /api/logs` | own user (admin = all) | list logs; supports `?from=&to=&projectId=&taskId=` |
| `POST /api/logs` | own user | create log |
| `PATCH /api/logs/[id]` | own user / admin | update |
| `DELETE /api/logs/[id]` | own user / admin | delete |

### Checklist
- [ ] `models/TimeEntry.ts`
- [ ] `lib/time-utils.ts`
- [ ] `lib/zod-schemas.ts`
- [ ] `app/api/logs/route.ts` (GET + POST)
- [ ] `app/api/logs/[id]/route.ts` (PATCH + DELETE)
- [ ] `app/(dashboard)/dashboard/page.tsx`
- [ ] `app/(dashboard)/logs/new/page.tsx`
- [ ] `app/(dashboard)/logs/[id]/page.tsx`
- [ ] `components/LogForm.tsx` (project → task cascade)
- [ ] `components/LogCard.tsx`

---

## Phase 4 — Reports & Statistics

**Goal:** Visualise logged hours for individuals and the team across projects and tasks.

### Who Sees What

| Role | Scope |
|---|---|
| `dev` / `sme` | Own hours only |
| `manager` | All users, all projects |
| `admin` | Same as manager |

### Report Views

| View | Access | Description |
|---|---|---|
| **My Summary** | own user | Hours this week / month, billable vs non-billable |
| **Project Breakdown** | all | Hours per project for a date range |
| **Task Breakdown** | all | Hours per task within a project |
| **AI Usage** | all | Logs where `aiUsed = true` |
| **Team Overview** | manager / admin | Hours per user per project |
| **Budget vs Actual** | manager / admin | `budgetHours` vs logged hours per project |

### API

| Endpoint | Params | Returns |
|---|---|---|
| `GET /api/reports/summary` | `from`, `to`, `userId?` | total, billable %, ai % |
| `GET /api/reports/by-project` | `from`, `to`, `userId?` | `[{ project, hours, billable }]` |
| `GET /api/reports/by-task` | `from`, `to`, `projectId`, `userId?` | `[{ task, hours }]` |
| `GET /api/reports/by-user` | `from`, `to`, `projectId?` | `[{ user, hours }]` (manager+) |

### Pages

| Route | What |
|---|---|
| `/reports` | Date range + view selector landing |
| `/reports/summary` | My summary stat cards |
| `/reports/projects` | Project breakdown table |
| `/reports/team` | Team overview table (manager/admin) |

### Checklist
- [ ] `app/api/reports/summary/route.ts`
- [ ] `app/api/reports/by-project/route.ts`
- [ ] `app/api/reports/by-task/route.ts`
- [ ] `app/api/reports/by-user/route.ts`
- [ ] `app/(dashboard)/reports/page.tsx`
- [ ] `app/(dashboard)/reports/summary/page.tsx`
- [ ] `app/(dashboard)/reports/projects/page.tsx`
- [ ] `app/(dashboard)/reports/team/page.tsx`
- [ ] `components/ReportFilters.tsx`
- [ ] `components/SummaryCards.tsx`
- [ ] `components/ProjectBreakdownTable.tsx`
- [ ] `components/TeamOverviewTable.tsx`

---

## Phase 5 — Block Report Generator

**Goal:** Generate a clean, formatted text block summarising a user's time logs for a period — ready to paste into a standup, client update, Jira ticket, or email.

### Example Output

```
Time Report — Saniya Mallik
Period: 29 Apr – 05 May 2025
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROJECT: upep.mx                                        8.5 h
  Task: Checkout UI                                     3.0 h  [billable] [AI]
  Task: Cart persistence bug fix                        1.5 h  [billable]
  Task: PR review #42                                   2.0 h  [billable]
  Task: Deployment prep                                 2.0 h  [billable]

PROJECT: wisdmlabs-internal                             4.0 h
  Task: Sprint planning                                 1.0 h  [non-billable]
  Task: Knowledge base update                           3.0 h  [non-billable]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 12.5 h  ·  Billable: 8.5 h  ·  AI-assisted: 3.0 h
```

### Generator Options

| Option | Choices |
|---|---|
| Period | This week · Last week · This month · Custom range |
| Group by | Project + Task (default) · Day · Project only |
| Filter | All · Billable only · Non-billable only |
| Format | Plain text · Markdown · CSV |
| User | Own logs · Any user (manager/admin only) |

### API

`POST /api/reports/block`

```ts
// Request body
{
  from: string           // YYYY-MM-DD
  to: string             // YYYY-MM-DD
  userId?: string        // defaults to current user
  groupBy: 'project-task' | 'day' | 'project'
  billableFilter: 'all' | 'billable' | 'non-billable'
  format: 'text' | 'markdown' | 'csv'
}

// Response
{ block: string }
```

### `lib/block-formatter.ts`

Pure function — takes fetched entries + options, returns formatted string. No side effects, fully testable.

### Page

`/reports/block-generator` — options form on left, live preview on right, copy-to-clipboard button.

### Checklist
- [ ] `app/api/reports/block/route.ts`
- [ ] `lib/block-formatter.ts`
- [ ] `app/(dashboard)/reports/block-generator/page.tsx`
- [ ] `components/BlockReportForm.tsx`
- [ ] `components/BlockReportPreview.tsx` (monospace preview + copy button)

---

## Folder Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                  ← session check + navbar
│   │   ├── dashboard/page.tsx
│   │   ├── logs/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── [id]/tasks/page.tsx
│   │   ├── reports/
│   │   │   ├── page.tsx
│   │   │   ├── summary/page.tsx
│   │   │   ├── projects/page.tsx
│   │   │   ├── team/page.tsx
│   │   │   └── block-generator/page.tsx
│   │   ├── admin/
│   │   │   └── users/page.tsx
│   │   └── profile/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── users/route.ts
│       ├── users/[id]/route.ts
│       ├── projects/route.ts
│       ├── projects/[id]/route.ts
│       ├── projects/[id]/tasks/route.ts
│       ├── tasks/[id]/route.ts
│       ├── logs/route.ts
│       ├── logs/[id]/route.ts
│       └── reports/
│           ├── summary/route.ts
│           ├── by-project/route.ts
│           ├── by-task/route.ts
│           ├── by-user/route.ts
│           └── block/route.ts
├── components/
│   ├── NavBar.tsx
│   ├── LogForm.tsx
│   ├── LogCard.tsx
│   ├── ReportFilters.tsx
│   ├── SummaryCards.tsx
│   ├── ProjectBreakdownTable.tsx
│   ├── TeamOverviewTable.tsx
│   ├── BlockReportForm.tsx
│   └── BlockReportPreview.tsx
├── lib/
│   ├── mongodb.ts
│   ├── auth.ts
│   ├── time-utils.ts
│   ├── zod-schemas.ts
│   └── block-formatter.ts
├── models/
│   ├── User.ts
│   ├── Project.ts
│   ├── Task.ts
│   └── TimeEntry.ts
├── scripts/
│   └── seed.ts
├── middleware.ts
└── .env.local
```

---

## Environment Variables

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/timelogger
NEXTAUTH_SECRET=<random-32-char-string>
NEXTAUTH_URL=http://localhost:3000
```

---

## Key Rules

- **hours computation** — compute from `startTime`/`endTime` server-side; never trust client-sent `hours` when times are present.
- **loggedAt storage** — strip time on save to avoid timezone drift in date queries.
- **Role enforcement** — check role inside every API route handler; middleware alone is not sufficient.
- **Cascade picker** — on the log form, selecting a project fetches and populates only that project's tasks.
- **Mongoose model guard** — always export as `mongoose.models.X || mongoose.model(...)`.
