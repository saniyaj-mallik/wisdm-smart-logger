# WisdmLabs Smart Logger — Technical Documentation

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Environment Setup](#environment-setup)
6. [Database](#database)
7. [Authentication & Authorization](#authentication--authorization)
8. [Data Models](#data-models)
9. [API Reference](#api-reference)
10. [Reports System](#reports-system)
11. [Block Generator](#block-generator)
12. [Key Utilities](#key-utilities)
13. [Component Architecture](#component-architecture)
14. [Deployment](#deployment)

---

## Overview

WisdmLabs Smart Logger is an internal time-tracking and project-reporting platform built with Next.js 14 (App Router). It allows team members to log work hours against projects and tasks, track billable vs. non-billable time, flag AI-assisted work, and generate structured reports and formatted export blocks.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.2.x |
| Language | TypeScript | 5.x |
| UI Primitives | Radix UI | latest |
| UI Components | Shadcn/ui | — |
| Styling | Tailwind CSS | 3.4.x |
| Authentication | NextAuth.js | 5.0.0-beta |
| Database ORM | Mongoose | 9.6.x |
| Database | MongoDB Atlas | — |
| Password Hashing | bcryptjs | 3.x |
| Validation | Zod | 4.4.x |
| Icons | Lucide React | 1.14.x |
| Charts | Recharts | 2.x |
| Theme | next-themes | 0.4.x |

---

## Architecture

### Route Groups

The app uses Next.js route groups for separation of concerns:

```
app/
├── (auth)/          # Public routes — no session required
│   ├── login/
│   └── register/
├── (dashboard)/     # Protected routes — session required
│   ├── dashboard/
│   ├── logs/
│   ├── projects/
│   ├── reports/
│   ├── profile/
│   └── admin/
└── api/             # REST API handlers
```

### Request Flow

```
Browser → middleware.ts (auth check)
       → Server Component (session + DB fetch)
       → Client Component (interaction)
       → API Route (mutation)
       → MongoDB
```

### Rendering Strategy

- **Server Components** — data fetching, initial page render, DB aggregations
- **Client Components** — forms, modals, date pickers, interactive filters, charts
- **API Routes** — all mutations (POST/PATCH/DELETE) and some GET queries

### Middleware

`middleware.ts` protects all dashboard routes. Unauthenticated requests are redirected to `/login`. Admin-only route enforcement (e.g., `/admin/*`) is handled at the page level.

Protected prefixes: `/dashboard`, `/logs`, `/projects`, `/reports`, `/profile`, `/admin`

---

## Project Structure

```
wisdm-smart-logger/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Wraps all dashboard pages with shell
│   │   ├── dashboard/page.tsx      # Home — stats + recent logs
│   │   ├── logs/page.tsx           # Time entry log list
│   │   ├── projects/
│   │   │   ├── page.tsx            # Projects list
│   │   │   └── [id]/page.tsx       # Project detail + tasks
│   │   ├── reports/
│   │   │   ├── page.tsx            # Reports landing
│   │   │   ├── summary/page.tsx    # Individual user summary
│   │   │   ├── block-generator/    # Formatted export block
│   │   │   ├── projects/[id]/      # Project drill-down
│   │   │   └── team/               # Team overview (manager/admin)
│   │   ├── profile/page.tsx
│   │   └── admin/users/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── logs/
│   │   │   ├── route.ts            # GET, POST
│   │   │   └── [id]/route.ts       # PATCH, DELETE
│   │   ├── projects/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── tasks/route.ts
│   │   ├── tasks/[id]/route.ts
│   │   ├── users/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── teams/route.ts
│   │   └── reports/
│   │       ├── summary/route.ts
│   │       ├── block/route.ts
│   │       ├── by-project/route.ts
│   │       ├── by-task/route.ts
│   │       └── by-user/route.ts
│   ├── layout.tsx
│   └── page.tsx                    # Redirects to /dashboard
├── components/
│   ├── ui/                         # Shadcn primitives
│   ├── layout/
│   │   ├── DashboardShell.tsx
│   │   ├── Sidebar.tsx
│   │   └── PageHeader.tsx
│   ├── modals/
│   │   ├── LogTimeModal.tsx
│   │   ├── EditLogModal.tsx
│   │   ├── CreateProjectModal.tsx
│   │   └── ConfirmDeleteModal.tsx
│   └── reports/
│       ├── ReportFilters.tsx
│       ├── SummaryCards.tsx
│       ├── SummaryCharts.tsx
│       ├── ProjectBreakdownTable.tsx
│       └── TeamOverviewTable.tsx
├── lib/
│   ├── auth.ts                     # NextAuth credentials provider
│   ├── auth.config.ts              # JWT + session callbacks
│   ├── mongodb.ts                  # Singleton DB connection
│   ├── zod-schemas.ts              # Input validation schemas
│   ├── time-utils.ts               # Hour computation, date helpers
│   ├── block-formatter.ts          # Report format engine
│   └── utils.ts                    # cn() + general helpers
├── models/
│   ├── User.ts
│   ├── Project.ts
│   ├── Task.ts
│   ├── TimeEntry.ts
│   └── Team.ts
├── middleware.ts
├── scripts/
│   ├── seed.ts                     # Sample projects + tasks
│   └── seed-admin.ts               # Default admin user
├── specs/                          # Feature specification files
├── types/
│   └── next-auth.d.ts              # NextAuth type augmentation
└── docs/                           # This documentation
```

---

## Environment Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- npm / yarn / pnpm

### Installation

```bash
git clone <repo-url>
cd wisdm-smart-logger
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
NEXTAUTH_SECRET=<random-32-char-string>
NEXTAUTH_URL=http://localhost:3000
```

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `NEXTAUTH_SECRET` | JWT signing secret (also accepted as `AUTH_SECRET`) |
| `NEXTAUTH_URL` | Base URL for NextAuth callbacks |

### Running Locally

```bash
npm run dev        # Development server (http://localhost:3000)
npm run build      # Production build
npm run start      # Production server
npm run lint       # ESLint
```

### Seeding the Database

```bash
# Create the admin user (admin@wisdmlabs.com / admin123!)
npx tsx scripts/seed-admin.ts

# Create sample projects and tasks
npx tsx scripts/seed.ts
```

---

## Database

### Connection

`lib/mongodb.ts` implements a singleton pattern that caches the Mongoose connection across hot-reloads in development:

```ts
// Connection is cached in global scope to prevent multiple connections
const cached = global.mongoose ?? { conn: null, promise: null };
```

All API routes and server components call `await connectDB()` before any DB operations.

### Collections

| Collection | Mongoose Model | Description |
|---|---|---|
| `users` | `User` | Application accounts |
| `projects` | `Project` | Billable/internal projects |
| `tasks` | `Task` | Work items within projects |
| `timeentries` | `TimeEntry` | Individual time log records |
| `teams` | `Team` | User groupings |

---

## Authentication & Authorization

### Strategy

NextAuth v5 with **JWT sessions** and a **credentials provider** (email + password).

### Auth Flow

```
1. User submits email + password
2. credentials.authorize() fetches User from DB
3. bcrypt.compare() verifies password (12 rounds)
4. JWT created: { id, name, email, role }
5. Session stores: { user: { id, name, email, role } }
6. All protected routes verify session via auth() or middleware
```

### Role System

| Role | Permissions |
|---|---|
| `dev` | Own time entries only; view own reports |
| `sme` | Same as dev |
| `manager` | View/report on any user; cannot manage system config |
| `admin` | Full access including user management, project/task creation |

### Session Usage

**Server Components:**
```ts
import { auth } from "@/lib/auth";
const session = await auth();
const userId = session!.user.id;
const role = session!.user.role;
```

**API Routes:**
```ts
const session = await auth();
if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

### Type Augmentation

`types/next-auth.d.ts` extends the default NextAuth types to include `id` and `role` on the session user:

```ts
declare module "next-auth" {
  interface Session {
    user: { id: string; role: UserRole } & DefaultSession["user"];
  }
}
```

---

## Data Models

### User

```ts
{
  name:         string           // required
  email:        string           // required, unique, lowercase, trimmed
  passwordHash: string           // bcrypt hash, excluded from API responses
  role:         "dev" | "sme" | "manager" | "admin"  // default: "dev"
  isActive:     boolean          // default: true
  createdAt:    Date
  updatedAt:    Date
}
```

### Project

```ts
{
  name:        string    // required, unique
  clientName:  string?   // optional
  description: string?   // optional
  budgetHours: number?   // optional
  color:       string?   // hex color, optional
  isActive:    boolean   // default: true
  createdAt:   Date
  updatedAt:   Date
}
```

### Task

```ts
{
  projectId:      ObjectId   // ref → Project, required, indexed
  name:           string     // required; unique per project
  description:    string?
  estimatedHours: number?
  assignees:      ObjectId[] // ref → User
  isActive:       boolean    // default: true
  createdAt:      Date
  updatedAt:      Date
}
// Unique compound index: (projectId, name)
```

### TimeEntry

```ts
{
  userId:    ObjectId   // ref → User, required, indexed
  projectId: ObjectId   // ref → Project, required
  taskId:    ObjectId   // ref → Task, required
  hours:     number     // 0.01–24 (decimal)
  startTime: string?    // "HH:MM" 24-hour format
  endTime:   string?    // "HH:MM" 24-hour format
  loggedAt:  Date       // date only, time stripped to UTC midnight
  isBillable: boolean   // default: true
  aiUsed:    boolean    // default: false
  notes:     string?    // max 1000 chars
  createdAt: Date
  updatedAt: Date
}
// Indexes: userId, loggedAt
```

### Team

```ts
{
  name:        string     // required, unique
  description: string?
  leaderId:    ObjectId   // ref → User, required
  memberIds:   ObjectId[] // ref → User
  createdAt:   Date
  updatedAt:   Date
}
```

---

## API Reference

All endpoints require an authenticated session unless otherwise noted. Error responses follow `{ error: string }` format.

---

### Authentication

#### `POST /api/auth/register`

Registers a new user.

**Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securepassword"
}
```

**Response:** `201 Created` | `400 Bad Request` | `409 Conflict`

---

### Time Entries

#### `GET /api/logs`

Returns time entries. `dev`/`sme` always see their own. `manager`/`admin` can filter by any user.

**Query Params:**

| Param | Type | Description |
|---|---|---|
| `userId` | string | Filter by user (manager/admin only) |
| `from` | string | Start date (YYYY-MM-DD) |
| `to` | string | End date (YYYY-MM-DD) |
| `projectId` | string | Filter by project |
| `taskId` | string | Filter by task |

**Response:** `200 OK` — array of time entries with populated project/task names.

---

#### `POST /api/logs`

Creates a new time entry. `userId` is always taken from the session (cannot be overridden).

**Body:**
```json
{
  "projectId": "<objectId>",
  "taskId": "<objectId>",
  "loggedAt": "2025-05-13",
  "hours": 3.5,
  "isBillable": true,
  "aiUsed": false,
  "notes": "Implemented feature X"
}
```

Alternatively, provide `startTime`/`endTime` instead of `hours`:
```json
{
  "startTime": "09:00",
  "endTime": "12:30"
}
```

**Response:** `201 Created` with the created entry.

---

#### `PATCH /api/logs/[id]`

Updates a time entry. Users can edit their own; admins can edit any.

**Body:** Partial — any fields from the POST body.

**Response:** `200 OK` with updated entry.

---

#### `DELETE /api/logs/[id]`

Deletes a time entry. Users can delete their own; admins can delete any.

**Response:** `200 OK` | `403 Forbidden` | `404 Not Found`

---

### Projects

#### `GET /api/projects`

Returns active projects. Admins can pass `?includeArchived=true` to include inactive ones.

**Response:** `200 OK` — array of projects.

---

#### `POST /api/projects`

Creates a project. **Admin only.**

**Body:**
```json
{
  "name": "Project Alpha",
  "clientName": "Acme Corp",
  "description": "Description here",
  "budgetHours": 200,
  "color": "#3b82f6"
}
```

**Response:** `201 Created`

---

#### `GET /api/projects/[id]`

Returns a single project with its tasks.

**Response:** `200 OK` | `404 Not Found`

---

#### `PATCH /api/projects/[id]`

Updates a project. **Admin only.**

**Body:** Partial project fields including `isActive` for archiving.

---

#### `GET /api/projects/[id]/tasks`

Returns all active tasks for a project.

---

#### `POST /api/projects/[id]/tasks`

Creates a task in a project. **Admin only.**

**Body:**
```json
{
  "name": "Task name",
  "description": "Optional description",
  "estimatedHours": 8
}
```

---

#### `PATCH /api/tasks/[id]`

Updates a task. **Admin only.**

---

### Users

#### `GET /api/users`

Returns all users (excluding `passwordHash`).

**Response:** `200 OK` — array of users sorted by `createdAt`.

---

#### `PATCH /api/users/[id]`

Updates a user's role or active status. **Admin only.**

**Body:**
```json
{
  "role": "manager",
  "isActive": true
}
```

---

### Teams

#### `GET /api/teams`

Returns all teams.

#### `POST /api/teams`

Creates a team.

**Body:**
```json
{
  "name": "Frontend Team",
  "description": "Handles UI development",
  "leaderId": "<userId>",
  "memberIds": ["<userId1>", "<userId2>"]
}
```

---

### Reports

All report endpoints accept `from` and `to` query params (YYYY-MM-DD). Role rules are the same as `/api/logs`.

#### `GET /api/reports/summary`

Returns aggregated stats for a user over a date range.

**Query Params:** `from`, `to`, `userId` (optional, manager/admin)

**Response:**
```json
{
  "totalHours": 42.5,
  "billableHours": 36,
  "nonBillableHours": 6.5,
  "billablePct": 85,
  "aiHours": 10,
  "aiPct": 24,
  "entryCount": 18
}
```

---

#### `GET /api/reports/by-project`

Hours grouped by project.

#### `GET /api/reports/by-task`

Hours grouped by task within a project. Accepts `projectId`.

#### `GET /api/reports/by-user`

Hours grouped by user. **Manager/admin only.**

---

#### `POST /api/reports/block`

Generates a formatted text block from time entries.

**Body:**
```json
{
  "from": "2025-05-01",
  "to": "2025-05-31",
  "userId": "<optional>",
  "groupBy": "project-task",
  "billableFilter": "all",
  "format": "markdown"
}
```

| Field | Options |
|---|---|
| `groupBy` | `"project-task"`, `"day"`, `"project"` |
| `billableFilter` | `"all"`, `"billable"`, `"non-billable"` |
| `format` | `"text"`, `"markdown"`, `"csv"` |

**Response:** `200 OK` — `{ block: string }`

---

## Reports System

### Summary Page (`/reports/summary`)

- 4 stat cards: Total Hours, Billable, Non-Billable, AI Assisted
- Daily Hours bar chart (stacked: billable + non-billable)
- Hours Breakdown donut chart (billable / non-billable / AI)
- Project breakdown table with billable % progress bars
- User dropdown defaults to current user; managers/admins can view any user
- Date range presets: This Week, Last Week, This Month, Last Month

### Aggregation Pipeline (Summary)

The summary page runs 4 parallel MongoDB aggregations:

1. **Stats** — `$group` with `$sum` + `$cond` for billable/AI hours
2. **By Project** — `$group` → `$lookup` (projects) → `$sort`
3. **Daily** — `$group` by `$dateToString` → fills missing days with zeros server-side
4. **Users** — fetches active users for dropdown

### Team Overview (`/reports/team`)

Accessible to `manager` and `admin` roles. Shows all users with their total, billable, and AI hours for the selected period.

---

## Block Generator

The block generator (`/reports/block-generator`) produces formatted time reports suitable for pasting into project management tools or sending to clients.

### Format Options

**Plain Text** — fixed-width aligned columns:
```
== Project Alpha / Feature Work ==
  2025-05-01  3.50h  [billable]
  2025-05-02  2.00h  [billable]
  Subtotal: 5.50h
```

**Markdown** — GitHub-flavored tables:
```markdown
## Project Alpha / Feature Work
| Date | Hours | Billable |
|------|-------|----------|
| 2025-05-01 | 3.50h | ✓ |
```

**CSV** — spreadsheet-ready:
```
date,project,task,estimated_hours,hours,billable,ai_used,notes
2025-05-01,Project Alpha,Feature Work,8,3.5,true,false,
```

### Formatter (`lib/block-formatter.ts`)

Pure function `formatBlock(entries, options, userName)` dispatches to format-specific handlers. Grouping strategies:

- `groupByProject()` — groups entries by `projectName + taskName`
- `groupByDay()` — groups entries by `loggedAt` date
- Total computation via `totalHours()` and `pct()` helpers

---

## Key Utilities

### `lib/time-utils.ts`

| Function | Signature | Description |
|---|---|---|
| `computeHours` | `(start: string, end: string) => number` | Converts HH:MM range to decimal hours; handles overnight spans |
| `stripTime` | `(date: Date) => Date` | Returns UTC midnight — prevents timezone shifting in DB |
| `getWeekRange` | `() => { from: Date; to: Date }` | Current Monday–Sunday |
| `formatDate` | `(date: Date) => string` | Formats as DD MMM YYYY (en-IN locale) |

### `lib/mongodb.ts`

Singleton Mongoose connection. Caches connection in `global.mongoose` to survive Next.js hot reloads.

### `lib/zod-schemas.ts`

Centralised Zod schemas for all API inputs. Used in both client-side form validation and server-side route handlers.

### `lib/utils.ts`

- `cn(...classes)` — Tailwind class merger using `clsx` + `tailwind-merge`

---

## Component Architecture

### Layout Components

**`DashboardShell`** — Flex wrapper (sidebar + main content), max-width 7xl.

**`Sidebar`** — Navigation with logo, grouped nav links (MAIN, PROJECTS, REPORTS, ADMIN), user avatar, role badge, theme toggle. On mobile (`< 1024px`) renders as a Sheet drawer.

**`PageHeader`** — Title + description + optional action button slot.

### Modal Pattern

All modals follow a consistent pattern:

```tsx
<Modal open={open} onOpenChange={setOpen} onSuccess={() => router.refresh()} />
```

- Built on Shadcn `Dialog`
- Field-level validation errors displayed inline
- Submit button shows loading spinner
- On success: close + `router.refresh()` to re-fetch server data

### Chart Components (`SummaryCharts`)

Uses Recharts with `ResponsiveContainer` for responsive sizing:

- **BarChart** — daily data, stacked bars (billable=green, non-billable=amber)
- **PieChart** — donut style (innerRadius=52, outerRadius=76), 3-segment: billable/non-billable/AI

Custom tooltip renders in a styled `bg-popover` box matching the app theme.

### ReportFilters

Client component managing date range + user selection state. Key behaviors:

- **Date Apply** — pressing Apply updates `from`/`to` in URL; preserves other params
- **User select** — immediately navigates on change; removes `userId` from URL when selecting self
- **Presets** — immediately navigate without pressing Apply

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set environment variables in the Vercel dashboard:
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (set to your production domain)

### Manual (Node.js)

```bash
npm run build
npm run start        # Runs on port 3000 by default
```

### Production Checklist

- [ ] `NEXTAUTH_SECRET` is a strong random string (32+ chars)
- [ ] `MONGODB_URI` points to Atlas with IP allowlist configured
- [ ] `NEXTAUTH_URL` set to exact production domain
- [ ] MongoDB indexes verified (`userId`, `loggedAt` on `timeentries`)
- [ ] Admin user seeded or created manually
- [ ] Run `npm audit` — address high-severity vulnerabilities before go-live
