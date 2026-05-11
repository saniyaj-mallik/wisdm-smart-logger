# Spec 03 — Time Logging

## Purpose

Implement the core time-entry CRUD. Users log hours against a project task using either a direct hours value or a start/end time range. The dashboard shows the current user's recent logs and this-week total. Managers and admins can view all users' logs.

## Dependencies

- `specs/01-users-auth.md` complete
- `specs/02-projects-tasks.md` complete — projects and tasks exist in DB

---

## Model — `models/TimeEntry.ts`

```ts
import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ITimeEntry extends Document {
  userId: Types.ObjectId
  projectId: Types.ObjectId
  taskId: Types.ObjectId
  hours: number | null
  startTime: string | null   // "HH:MM" 24h
  endTime: string | null     // "HH:MM" 24h
  loggedAt: Date             // date only — time stripped on save
  isBillable: boolean
  aiUsed: boolean
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

const TimeEntrySchema = new Schema<ITimeEntry>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User',    required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    taskId:    { type: Schema.Types.ObjectId, ref: 'Task',    required: true },
    hours:     { type: Number, default: null, min: 0.01, max: 24 },
    startTime: { type: String, default: null },
    endTime:   { type: String, default: null },
    loggedAt:  { type: Date, required: true, index: true },
    isBillable:{ type: Boolean, default: true },
    aiUsed:    { type: Boolean, default: false },
    notes:     { type: String, default: null, maxlength: 1000 },
  },
  { timestamps: true }
)

export default mongoose.models.TimeEntry || mongoose.model<ITimeEntry>('TimeEntry', TimeEntrySchema)
```

---

## Utility — `lib/time-utils.ts`

```ts
export function computeHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins < 0) mins += 24 * 60   // overnight span guard
  return Math.round((mins / 60) * 100) / 100
}

export function stripTime(date: string | Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}
```

---

## Zod Schemas (add to `lib/zod-schemas.ts`)

```ts
export const CreateLogSchema = z.object({
  projectId:  z.string().min(1),
  taskId:     z.string().min(1),
  hours:      z.number().positive().max(24).nullable().optional(),
  startTime:  z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format').nullable().optional(),
  endTime:    z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format').nullable().optional(),
  loggedAt:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  isBillable: z.boolean().default(true),
  aiUsed:     z.boolean().default(false),
  notes:      z.string().max(1000).nullable().optional(),
}).refine(
  (d) => d.hours != null || (d.startTime != null && d.endTime != null),
  { message: 'Provide either hours or both startTime and endTime' }
)

export type CreateLogInput = z.infer<typeof CreateLogSchema>

// Only these fields can be patched — userId is never patchable
export const UpdateLogSchema = z.object({
  projectId:  z.string().min(1).optional(),
  taskId:     z.string().min(1).optional(),
  hours:      z.number().positive().max(24).nullable().optional(),
  startTime:  z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  endTime:    z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  loggedAt:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isBillable: z.boolean().optional(),
  aiUsed:     z.boolean().optional(),
  notes:      z.string().max(1000).nullable().optional(),
})
```

---

## API Routes

### `app/api/logs/route.ts`

```
GET /api/logs
Auth: any session
Query params:
  from=YYYY-MM-DD       (optional)
  to=YYYY-MM-DD         (optional)
  projectId=<id>        (optional)
  taskId=<id>           (optional)
  userId=<id>           (optional — manager/admin only)
Behaviour:
  - dev/sme: always filters to own userId regardless of query param
  - manager/admin: can filter by any userId or omit for all
Response: populated array [{ ...entry, project: { name }, task: { name }, user: { name, email } }]
Limit: 200 most recent
```

```
POST /api/logs
Auth: any session
Body: CreateLogSchema
Behaviour:
  - hours computed from startTime/endTime if hours is null
  - loggedAt time stripped via stripTime()
  - userId always set from session — cannot be overridden by body
Response: 201 ITimeEntry
```

### `app/api/logs/[id]/route.ts`

```
PATCH /api/logs/[id]
Auth: session — own entry or admin
Body: UpdateLogSchema (partial — validated, no userId field)
Behaviour:
  - Finds entry, checks entry.userId === session.user.id OR role === 'admin'
  - If hours in body is null and start/end provided, recompute hours
Response: updated ITimeEntry

DELETE /api/logs/[id]
Auth: session — own entry or admin
Response: { success: true }
```

---

## Pages

### `/dashboard` — `app/(dashboard)/dashboard/page.tsx`

Server component. Fetches:
1. This week's entries for current user (Mon–Sun of current week)
2. Last 10 entries for current user

Renders:
- **Stat row** (4 cards): Total hours this week · Billable hours · Non-billable hours · AI-assisted count
- **Recent Logs table** with columns: date, project, task, hours, billable badge, ai badge, actions
- Page header action: "Log Time" button → `<LogTimeModal>`

### `/logs/[id]` — `app/(dashboard)/logs/[id]/page.tsx`

Server component. Fetches single entry (owner or admin only, else 404).

Renders entry detail card + Edit / Delete actions.
Edit → `<EditLogModal>`, Delete → `<ConfirmDeleteModal>`.

---

## Components

### `components/modals/LogTimeModal.tsx`
Props: `open`, `onOpenChange`, `onSuccess`, `defaultDate?: string`

Form fields and behaviour:
1. **Project** — `<Select>` populated from GET `/api/projects` (active only)
2. **Task** — `<Select>` disabled until project selected; on project change, fetch GET `/api/projects/[id]/tasks` and populate
3. **Date** — date picker, defaults to today (`YYYY-MM-DD`)
4. **Time input mode toggle** — "Enter hours" vs "Start / End time" (two radio-style tabs)
   - Hours mode: single number input (e.g. 2.5)
   - Start/End mode: two `HH:MM` inputs
5. **Billable** — checkbox, default checked
6. **AI Used** — checkbox, default unchecked
7. **Notes** — textarea, optional

On submit: POST `/api/logs`. On success: `onSuccess()` + `router.refresh()`.

**Cascade fetch logic (inside the component):**

```ts
const [tasks, setTasks] = useState<ITask[]>([])

async function handleProjectChange(projectId: string) {
  setSelectedProject(projectId)
  setSelectedTask('')
  const res = await fetch(`/api/projects/${projectId}/tasks`)
  const data = await res.json()
  setTasks(data)
}
```

### `components/modals/EditLogModal.tsx`
Props: `entry: ITimeEntry & { project, task }`, `open`, `onOpenChange`, `onSuccess`

Same fields as `LogTimeModal`, pre-filled with entry data.
On submit: PATCH `/api/logs/[id]`.

### `components/modals/ConfirmDeleteModal.tsx`
Props: `entryId`, `open`, `onOpenChange`, `onSuccess`

Confirm dialog: "Are you sure? This cannot be undone."
On confirm: DELETE `/api/logs/[id]`. On success: `onSuccess()` + `router.refresh()`.

---

## Dashboard Stat Card Logic

Weekly range computed on the server:

```ts
function getWeekRange() {
  const now = new Date()
  const day = now.getDay()                      // 0=Sun, 1=Mon...
  const diffToMon = (day === 0 ? -6 : 1 - day)
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMon)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { from: monday, to: sunday }
}
```

Stat values derived from the fetched entries array (no separate aggregation query needed for dashboard):

```ts
const totalHours   = entries.reduce((s, e) => s + (e.hours ?? 0), 0)
const billableHrs  = entries.filter(e => e.isBillable).reduce((s, e) => s + (e.hours ?? 0), 0)
const nonBillable  = totalHours - billableHrs
const aiCount      = entries.filter(e => e.aiUsed).length
```

---

## Checklist

- [ ] `models/TimeEntry.ts`
- [ ] `lib/time-utils.ts` — `computeHours` (with overnight guard) + `stripTime`
- [ ] `lib/zod-schemas.ts` — `CreateLogSchema`, `UpdateLogSchema`
- [ ] `app/api/logs/route.ts` (GET + POST)
- [ ] `app/api/logs/[id]/route.ts` (PATCH + DELETE)
- [ ] `app/(dashboard)/dashboard/page.tsx` — stat cards + recent logs table
- [ ] `app/(dashboard)/logs/[id]/page.tsx`
- [ ] `components/modals/LogTimeModal.tsx` — cascade picker + time mode toggle
- [ ] `components/modals/EditLogModal.tsx`
- [ ] `components/modals/ConfirmDeleteModal.tsx`

## Verification

1. Log time via modal — entry appears in dashboard table
2. Log with start/end times — hours computed correctly (e.g. 09:00–11:30 = 2.5h)
3. Log with 23:00–01:00 — hours = 2.0 (overnight guard works)
4. Edit a log — changes saved, table updates
5. Delete a log — entry removed from table
6. Dev user cannot see or edit another user's log via PATCH `/api/logs/[id]`
7. Admin can edit any log
8. Stat cards show correct totals for current week
9. Project → task cascade: selecting a project populates task dropdown with that project's tasks only
