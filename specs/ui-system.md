# Spec UI — Design System & Shell

## Purpose

Define the complete UI foundation: dashboard shell layout, sidebar navigation, modal patterns, theme system, and visual design rules. This spec is built **alongside Phase 1** and extended throughout subsequent phases. Every page in the app uses the components defined here.

## Dependencies

- `specs/00-setup.md` complete — shadcn/ui initialized, CSS tokens in globals.css

---

## Layout Architecture

### `components/layout/DashboardShell.tsx`

```tsx
// Server component — wraps all (dashboard) pages
export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
```

### `app/(dashboard)/layout.tsx`

```tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  return <DashboardShell>{children}</DashboardShell>
}
```

---

## Sidebar — `components/layout/Sidebar.tsx`

Client component (needs `usePathname`).

### Structure

```
┌──────────────────────────────┐
│  ◆ WisdmLabs Logger    [≡]  │  ← logo + mobile collapse trigger
├──────────────────────────────┤
│                              │
│  MAIN                        │
│  ▸ Dashboard                 │
│  ▸ Log Time    (shortcut)    │
│  ▸ My Logs                   │
│                              │
│  PROJECTS                    │
│  ▸ All Projects              │
│  ▸ Manage Tasks  (admin)     │
│                              │
│  REPORTS                     │
│  ▸ Summary                   │
│  ▸ Project Breakdown         │
│  ▸ Team Overview  (mgr+)     │
│  ▸ Block Generator           │
│                              │
│  ADMIN                       │  ← hidden for non-admin
│  ▸ Users                     │
│                              │
├──────────────────────────────┤
│  [avatar] Name               │
│  role badge                  │
│  [profile] [sign out]        │
│  [sun/moon toggle]           │
└──────────────────────────────┘
```

### Nav item active state

```tsx
const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

<Link
  href={item.href}
  className={cn(
    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
    isActive
      ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary -ml-px pl-[calc(0.75rem+1px)]'
      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
  )}
>
  <item.icon className="h-4 w-4 shrink-0" />
  {item.label}
</Link>
```

### Nav groups definition

```ts
// Inside Sidebar.tsx
const navGroups = [
  {
    label: 'MAIN',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'My Logs',   href: '/logs',      icon: Clock },
    ],
  },
  {
    label: 'PROJECTS',
    items: [
      { label: 'All Projects',  href: '/projects',       icon: FolderKanban },
      { label: 'Manage Tasks',  href: '/projects/tasks', icon: ListChecks, adminOnly: true },
    ],
  },
  {
    label: 'REPORTS',
    items: [
      { label: 'Summary',           href: '/reports/summary',         icon: BarChart3 },
      { label: 'Project Breakdown', href: '/reports/projects',        icon: PieChart },
      { label: 'Team Overview',     href: '/reports/team',            icon: Users, managerOnly: true },
      { label: 'Block Generator',   href: '/reports/block-generator', icon: FileText },
    ],
  },
  {
    label: 'ADMIN',
    adminOnly: true,
    items: [
      { label: 'Users', href: '/admin/users', icon: UserCog },
    ],
  },
]
```

Items with `adminOnly: true` render only when `session.user.role === 'admin'`.
Items with `managerOnly: true` render when role is `manager` or `admin`.

### Mobile behaviour

On `< 1024px` (lg breakpoint), the sidebar is hidden. A hamburger button in a top bar opens it as a `shadcn/ui Sheet` (slide-in drawer from left). The sheet contains the same `Sidebar` content.

---

## Page Header — `components/layout/PageHeader.tsx`

```tsx
interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode   // renders top-right (usually a Button that opens a modal)
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
```

---

## Theme Toggle — `components/ThemeToggle.tsx`

```tsx
'use client'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="h-8 w-8"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
```

---

## Modal System

### Base pattern

Every modal follows the same wrapper structure using shadcn/ui `Dialog`:

```tsx
'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'

interface ExampleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ExampleModal({ open, onOpenChange, onSuccess }: ExampleModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    const res = await fetch('/api/...', { method: 'POST', body: JSON.stringify(data) })
    const json = await res.json()
    if (!res.ok) {
      setErrors(json.error?.fieldErrors ?? { _: json.error })
    } else {
      onOpenChange(false)
      onSuccess?.()
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Title</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* fields */}
          {errors._ && <p className="text-sm text-destructive">{errors._}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### All modals

| Modal | Phase | Triggered from |
|---|---|---|
| `LogTimeModal` | 3 | Dashboard "Log Time" button, any page |
| `EditLogModal` | 3 | Log list row action |
| `ConfirmDeleteModal` | 3 | Log list row action |
| `CreateProjectModal` | 2 | Projects page header |
| `EditProjectModal` | 2 | Project row action |
| `ConfirmArchiveModal` | 2 | Project or task row action |
| `AddTaskModal` | 2 | Project detail page |
| `EditTaskModal` | 2 | Task row action |
| `EditUserModal` | 1 | Admin users row action |
| `ConfirmDeactivateModal` | 1 | Admin users row action |

---

## Visual Design Rules

### Tables

All list views (logs, projects, tasks, users, reports) use a `<Table>` from shadcn/ui.

Row action icons appear on hover:

```tsx
<TableRow className="group">
  <TableCell>{/* data */}</TableCell>
  <TableCell className="w-20">
    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)}>
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  </TableCell>
</TableRow>
```

### Status Badges

```tsx
// Role
const roleBadge = {
  dev:     'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  sme:     'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  manager: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  admin:   'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

// Active/archived
const statusBadge = {
  active:   'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  archived: 'bg-muted text-muted-foreground',
}

// Billable
const billableBadge = {
  true:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  false: 'bg-muted text-muted-foreground',
}
```

### Empty States

Every table has an empty state component:

```tsx
function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <InboxIcon className="h-10 w-10 text-muted-foreground mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
```

### Monospace values

All hours values, times, and dates use `font-mono`:

```tsx
<span className="font-mono text-sm">{entry.hours.toFixed(1)}h</span>
<span className="font-mono text-xs text-muted-foreground">{entry.startTime}–{entry.endTime}</span>
```

---

## Stat Cards — `components/SummaryCards.tsx`

```tsx
interface StatCard {
  label: string
  value: string    // pre-formatted e.g. "24.5h" or "83%"
  sub?: string     // secondary line e.g. "of 30h total"
  icon: LucideIcon
}

function StatCard({ label, value, sub, icon: Icon }: StatCard) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-3xl font-mono font-semibold mt-2">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}
```

---

## UI Checklist

- [ ] `tailwind.config.ts` — darkMode: 'class', full token set
- [ ] `app/globals.css` — CSS variables (light + dark)
- [ ] `app/layout.tsx` — ThemeProvider with suppressHydrationWarning
- [ ] `app/(dashboard)/layout.tsx` — session check + DashboardShell
- [ ] `components/layout/DashboardShell.tsx`
- [ ] `components/layout/Sidebar.tsx` — nav groups, active state, role-based visibility
- [ ] `components/layout/PageHeader.tsx`
- [ ] `components/ThemeToggle.tsx`
- [ ] `components/EmptyState.tsx`
- [ ] Mobile: Sheet-based sidebar on < 1024px
- [ ] All modals in `components/modals/` follow the base pattern
- [ ] Status badge helpers (role, status, billable)
- [ ] Row hover-reveal action buttons on all tables
- [ ] `font-mono` on all hours / time values

## Verification

1. Visit any dashboard page — sidebar renders with correct nav groups
2. Active page has left accent bar and highlight
3. Non-admin: "ADMIN" section not visible in sidebar
4. Dev/SME: "Team Overview" nav item not visible
5. Click sun/moon toggle — theme switches; preference persists on refresh
6. Mobile (< 1024px): hamburger button appears, sidebar opens as drawer
7. Open any modal — focus trapped, Escape closes it, backdrop click closes it
8. Submit a modal form with invalid data — errors shown inline, modal stays open
9. Submit valid form — modal closes, table updates (router.refresh)
10. Empty state renders when a table has no rows
