# Spec 02 — Projects & Tasks

## Purpose

Implement the two-level project hierarchy: Projects (client-facing work units) and Tasks (work items within a project). Admins create and manage both. All authenticated users can list active projects and their tasks when filling in a time log. Includes a seed script for baseline data.

## Dependencies

- `specs/01-users-auth.md` complete — auth system working, session available in API routes

---

## Model — `models/Project.ts`

```ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IProject extends Document {
  name: string
  clientName: string | null
  description: string | null
  budgetHours: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    clientName: { type: String, default: null, trim: true },
    description: { type: String, default: null },
    budgetHours: { type: Number, default: null, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema)
```

---

## Model — `models/Task.ts`

```ts
import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ITask extends Document {
  projectId: Types.ObjectId
  name: string
  description: string | null
  estimatedHours: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const TaskSchema = new Schema<ITask>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    estimatedHours: { type: Number, default: null, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

// Unique task name per project
TaskSchema.index({ projectId: 1, name: 1 }, { unique: true })

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema)
```

---

## Zod Schemas (add to `lib/zod-schemas.ts`)

```ts
export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  clientName: z.string().max(100).trim().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  budgetHours: z.number().positive().max(100000).nullable().optional(),
})

export const UpdateProjectSchema = CreateProjectSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export const CreateTaskSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(500).nullable().optional(),
  estimatedHours: z.number().positive().max(10000).nullable().optional(),
})

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  isActive: z.boolean().optional(),
})
```

---

## API Routes

### `app/api/projects/route.ts`

```
GET /api/projects
Auth: any authenticated session
Query params: ?includeArchived=true  (admin only — defaults false)
Response: IProject[]
```

```
POST /api/projects
Auth: admin only
Body: CreateProjectSchema
Response: 201 IProject
```

### `app/api/projects/[id]/route.ts`

```
GET /api/projects/[id]
Auth: any authenticated session
Response: IProject with tasks[]

PATCH /api/projects/[id]
Auth: admin only
Body: UpdateProjectSchema (partial)
Response: IProject

DELETE not exposed — use isActive: false to archive
```

### `app/api/projects/[id]/tasks/route.ts`

```
GET /api/projects/[id]/tasks
Auth: any authenticated session
Response: ITask[] (active only, unless ?includeArchived=true by admin)

POST /api/projects/[id]/tasks
Auth: admin only
Body: CreateTaskSchema
Response: 201 ITask
```

### `app/api/tasks/[id]/route.ts`

```
PATCH /api/tasks/[id]
Auth: admin only
Body: UpdateTaskSchema (partial)
Response: ITask
```

---

## Pages

### `/projects` — `app/(dashboard)/projects/page.tsx`
- Server component
- Fetches all projects from DB
- Renders `<ProjectsTable>` with columns: name, client, budget hours, logged hours (aggregated from TimeEntry — can be 0 in this phase), status badge, row actions
- Page header action button: "New Project" → opens `<CreateProjectModal>`
- Admin sees all; non-admins see active only with no action buttons

### `/projects/[id]` — `app/(dashboard)/projects/[id]/page.tsx`
- Server component — fetches project + its tasks
- Shows project details card (name, client, budget, description)
- Shows `<TasksTable>` with columns: name, estimated hours, status, row actions
- Admin: "Edit Project" button → `<EditProjectModal>`, "Add Task" → `<AddTaskModal>`
- Admin: row actions on tasks → `<EditTaskModal>`

---

## Components

### `components/modals/CreateProjectModal.tsx`
- Props: `open`, `onOpenChange`, `onSuccess`
- Form fields: name (required), clientName, description, budgetHours
- POST `/api/projects` on submit
- On success: `onSuccess()` + `router.refresh()`

### `components/modals/EditProjectModal.tsx`
- Props: `project: IProject`, `open`, `onOpenChange`, `onSuccess`
- Same fields pre-filled
- PATCH `/api/projects/[id]` on submit
- Archive button: sets `isActive: false` via `<ConfirmArchiveModal>`

### `components/modals/AddTaskModal.tsx`
- Props: `projectId`, `open`, `onOpenChange`, `onSuccess`
- Form fields: name (required), description, estimatedHours
- POST `/api/projects/[projectId]/tasks` on submit

### `components/modals/EditTaskModal.tsx`
- Props: `task: ITask`, `open`, `onOpenChange`, `onSuccess`
- Same fields pre-filled + archive toggle

### `components/modals/ConfirmArchiveModal.tsx`
- Generic confirm dialog for archive actions
- Props: `title`, `description`, `onConfirm`, `open`, `onOpenChange`
- Confirm button calls `onConfirm()` then closes

---

## Seed Script — `scripts/seed.ts`

```ts
import { connectDB } from '../lib/mongodb'
import Project from '../models/Project'
import Task from '../models/Task'

const data = [
  {
    project: { name: 'upep.mx', clientName: 'UPEP', budgetHours: 500 },
    tasks: ['Discovery & Planning', 'UI Design', 'Frontend Development', 'Backend Development', 'QA Testing', 'Deployment'],
  },
  {
    project: { name: 'two-lines-press', clientName: 'Two Lines Press', budgetHours: 200 },
    tasks: ['Content Migration', 'Theme Customisation', 'Plugin Integration', 'QA & Launch'],
  },
  {
    project: { name: 'wisdmlabs-internal', clientName: null, budgetHours: null },
    tasks: ['Sprint Planning', 'Knowledge Base', 'Recruitment', 'Team Meetings', 'R&D'],
  },
  {
    project: { name: 'ldgr-plugin', clientName: 'WisdmLabs', budgetHours: 300 },
    tasks: ['Feature Development', 'Bug Fixes', 'Documentation', 'Code Review', 'Release'],
  },
]

async function seed() {
  await connectDB()
  for (const { project, tasks } of data) {
    const p = await Project.findOneAndUpdate(
      { name: project.name },
      { ...project, isActive: true },
      { upsert: true, new: true }
    )
    for (const name of tasks) {
      await Task.findOneAndUpdate(
        { projectId: p._id, name },
        { projectId: p._id, name, isActive: true },
        { upsert: true }
      )
    }
  }
  console.log('Seed complete')
  process.exit(0)
}

seed()
```

Run: `npx tsx scripts/seed.ts`

---

## Checklist

- [ ] `models/Project.ts`
- [ ] `models/Task.ts`
- [ ] `lib/zod-schemas.ts` — CreateProjectSchema, UpdateProjectSchema, CreateTaskSchema, UpdateTaskSchema
- [ ] `app/api/projects/route.ts` (GET + POST)
- [ ] `app/api/projects/[id]/route.ts` (GET + PATCH)
- [ ] `app/api/projects/[id]/tasks/route.ts` (GET + POST)
- [ ] `app/api/tasks/[id]/route.ts` (PATCH)
- [ ] `app/(dashboard)/projects/page.tsx` — ProjectsTable
- [ ] `app/(dashboard)/projects/[id]/page.tsx` — project detail + TasksTable
- [ ] `components/modals/CreateProjectModal.tsx`
- [ ] `components/modals/EditProjectModal.tsx`
- [ ] `components/modals/AddTaskModal.tsx`
- [ ] `components/modals/EditTaskModal.tsx`
- [ ] `components/modals/ConfirmArchiveModal.tsx`
- [ ] `scripts/seed.ts`
- [ ] `npx tsx scripts/seed.ts` — projects and tasks in DB

## Verification

1. Run seed script — 4 projects and their tasks appear in MongoDB
2. Visit `/projects` — projects table renders
3. Admin clicks "New Project" — modal opens, fills form, submits — new project appears in table without page reload
4. Admin opens a project — tasks table renders
5. Admin adds a task — task appears in tasks table
6. Non-admin visits `/projects` — no "New Project" button or edit actions visible
7. Archive a project — it disappears from the non-admin list
8. GET `/api/projects/[id]/tasks` — returns only active tasks
