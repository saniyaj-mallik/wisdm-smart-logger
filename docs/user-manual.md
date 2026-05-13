# WisdmLabs Smart Logger — User Manual

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard](#dashboard)
4. [Logging Time](#logging-time)
5. [My Logs](#my-logs)
6. [Projects](#projects)
7. [Reports](#reports)
   - [Summary](#summary-report)
   - [Block Generator](#block-generator)
   - [Team Overview](#team-overview)
8. [Profile](#profile)
9. [Admin: User Management](#admin-user-management)
10. [Roles & Permissions](#roles--permissions)
11. [Tips & Shortcuts](#tips--shortcuts)

---

## Introduction

WisdmLabs Smart Logger is a time-tracking tool for the WisdmLabs team. Use it to:

- Log hours worked on projects and tasks each day
- Mark work as billable or non-billable
- Flag entries where AI tools assisted your work
- View your own history and generate reports
- Export formatted time blocks to share with stakeholders

---

## Getting Started

### Logging In

1. Open the app in your browser (`http://localhost:3000` or your team's URL)
2. Enter your **email** and **password**
3. Click **Sign In**

You will be taken to the Dashboard on successful login.

### Registering

If you don't have an account yet:

1. Click **Register** on the login page
2. Enter your **full name**, **email**, and a **password**
3. Click **Create Account**

> Your account will be created with the default **Developer** role. An admin can upgrade your role if needed.

### Changing Your Theme

Click the **sun/moon icon** in the bottom-left sidebar to toggle between light and dark mode.

---

## Dashboard

The Dashboard is your home screen. It shows:

- **Stats for the current week** — total hours logged, billable hours, non-billable hours, and the count of AI-assisted entries
- **Recent Logs** — your last several time entries with project, task, date, and hours

Use the **Log Time** button (top-right of the page or in the sidebar) to quickly add a new entry.

---

## Logging Time

### Opening the Log Time Form

Click **Log Time** from the Dashboard, Sidebar, or the Logs page.

### Filling in the Form

| Field | Description |
|---|---|
| **Project** | Select the project you worked on |
| **Task** | Select the specific task (populated after choosing a project) |
| **Date** | The date the work was done (defaults to today) |
| **Hours** | How many hours you worked |
| **Start / End Time** | Alternative to entering hours directly — enter clock times and the hours are calculated automatically |
| **Billable** | Check if this time is billable to the client (checked by default) |
| **AI Assisted** | Check if you used AI tools (e.g., Claude, ChatGPT) significantly during this work |
| **Notes** | Optional — describe what you worked on (max 1000 characters) |

### Hours vs. Start/End Time

You can switch between two input modes:

- **Hours mode** — type the decimal hours (e.g., `2.5` for 2 hours 30 minutes)
- **Time mode** — enter a start time (`09:00`) and end time (`11:30`); the hours are calculated automatically and handle overnight spans

### Saving

Click **Save Entry**. The log will appear in your recent entries immediately.

---

## My Logs

The **Logs** page (`/logs`) shows all your time entries in a table.

### Filtering

Use the filter bar at the top to narrow down entries by:

- **Date range** — from and to dates
- **Project** — show only entries for a specific project
- **Task** — show only entries for a specific task

### Editing an Entry

Click the **pencil icon** on any row to open the edit form. All fields can be changed.

### Deleting an Entry

Click the **trash icon** on any row. You will see a confirmation prompt before the entry is removed.

> Managers and admins can view and manage entries for any user. Developers and SMEs can only see their own.

---

## Projects

The **Projects** page (`/projects`) lists all active projects you have access to.

### Viewing a Project

Click any project name to open its detail page, which shows:

- Project description, client name, budget hours, and color
- A list of all tasks in the project with their estimated hours

### Creating a Project *(Admin only)*

On the Projects page, click **New Project** and fill in:

- **Name** — required, must be unique
- **Client Name** — optional
- **Description** — optional
- **Budget Hours** — optional target/cap
- **Color** — a hex color to visually identify the project in reports

### Creating a Task *(Admin only)*

On a project's detail page, click **Add Task** and enter:

- **Task Name** — required (must be unique within the project)
- **Description** — optional
- **Estimated Hours** — optional reference value

### Archiving a Project *(Admin only)*

Open a project's detail page, click **Edit Project**, and uncheck **Active**. Archived projects will no longer appear in the log time form or the default project list.

---

## Reports

Access reports from the **Reports** section in the sidebar.

### Date Filters

All report pages share the same date filter bar at the top:

- **From / To** — enter any date range and click **Apply**
- **Quick presets** — This Week, Last Week, This Month, Last Month apply instantly without pressing Apply

---

### Summary Report

**URL:** `/reports/summary`

Shows your personal time summary for the selected period.

**Stat Cards:**

| Card | What it shows |
|---|---|
| Total Hours | All hours logged in the period |
| Billable | Hours marked as billable + % of total |
| Non-Billable | Hours marked as non-billable + % of total |
| AI Assisted | Hours where AI tools were used + % of total |

**Charts:**

- **Daily Hours** — bar chart showing each day's billable (green) and non-billable (amber) hours side by side
- **Hours Breakdown** — donut chart showing the proportion of billable, non-billable, and AI-assisted hours

**By Project Table:**

Shows how your hours are split across projects with billable percentage and entry count. Click a project name to drill into its detailed report.

**Viewing Another User's Summary** *(Manager/Admin)*

Use the **User** dropdown at the top of the filter bar to switch to any team member's data. The page header updates to reflect whose summary you are viewing.

---

### Block Generator

**URL:** `/reports/block-generator`

Generates a formatted text block from your (or another user's) time entries. Useful for pasting into project management tools, client reports, or status updates.

#### Configuring the Block

| Setting | Options |
|---|---|
| **Period** | From / To date range |
| **Group By** | Project & Task · Day · Project only |
| **Include** | All entries · Billable only · Non-billable only |
| **Format** | Plain Text · Markdown · CSV |
| **User** | Your entries or a team member's *(manager/admin)* |

#### Using the Output

Click **Generate** to produce the block. Then:

- **Copy** — copies the full block to your clipboard
- **Download** — saves it as a `.txt`, `.md`, or `.csv` file

**Format examples:**

*Plain Text*
```
== upep.mx / MECH-13 ==
  01 May 2025   2.00h  [billable]
  02 May 2025   1.50h  [billable]
  Subtotal: 3.50h
```

*Markdown*
```markdown
## upep.mx / MECH-13
| Date | Hours | Billable |
|------|-------|----------|
| 01 May 2025 | 2.00h | ✓ |
```

*CSV*
```
date,project,task,estimated_hours,hours,billable,ai_used,notes
2025-05-01,upep.mx,MECH-13,8,2,true,false,
```

---

### Team Overview

**URL:** `/reports/team`

*Available to managers and admins only.*

Shows a table of all team members with their total, billable, non-billable, and AI-assisted hours for the selected period. Use this to quickly review team utilization.

---

## Profile

**URL:** `/profile`

Update your personal information:

- **Display Name** — how your name appears across the app
- **Change Password** — enter your current password and a new one twice to confirm

Click **Save Changes** after making updates.

---

## Admin: User Management

**URL:** `/admin/users`

*Available to admins only.*

The Users table lists every account with their email, role, and active status.

### Changing a User's Role

Click the **Edit** icon next to a user. Select a new role from the dropdown:

| Role | Typical use |
|---|---|
| Developer | Standard team member |
| SME | Subject matter expert (same access as developer) |
| Manager | Team lead who needs to view all users' reports |
| Admin | Full system access |

### Deactivating a User

In the edit form, uncheck **Active**. Deactivated users cannot log in.

### Reactivating a User

Find the user in the list (deactivated users still appear), click Edit, and check **Active** again.

---

## Roles & Permissions

| Feature | Dev / SME | Manager | Admin |
|---|---|---|---|
| Log own time | ✓ | ✓ | ✓ |
| View own logs | ✓ | ✓ | ✓ |
| View any user's logs | — | ✓ | ✓ |
| Edit/delete own logs | ✓ | ✓ | ✓ |
| Edit/delete any log | — | — | ✓ |
| View own reports | ✓ | ✓ | ✓ |
| View any user's reports | — | ✓ | ✓ |
| Team overview report | — | ✓ | ✓ |
| Create/edit projects | — | — | ✓ |
| Create/edit tasks | — | — | ✓ |
| Archive projects | — | — | ✓ |
| User management | — | — | ✓ |
| Change user roles | — | — | ✓ |

---

## Tips & Shortcuts

**Log as you go** — It takes less time to log hours at the end of each task than to reconstruct a whole day at 5pm.

**Use start/end time** — If you glance at the clock when you start and stop, use the Time mode in the log form. You don't need to calculate hours manually.

**Notes help future-you** — Even a short note ("Fixed pagination bug in task list") makes reports and client conversations much easier later.

**Billable by default** — The Billable checkbox is on by default. Remember to uncheck it for internal meetings, admin work, or learning time.

**AI flag matters** — Check AI Assisted whenever a significant portion of output was generated or reviewed with AI help. This data feeds into team-level AI usage insights.

**Quick presets** — The This Week, Last Week, etc. preset buttons on report pages apply instantly — no need to click Apply after using them.

**Dark mode** — Toggle dark/light mode with the icon at the bottom of the sidebar. Your preference is saved automatically.
