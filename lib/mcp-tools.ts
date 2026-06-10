import { connectDB } from "@/lib/mongodb";
import CustomField from "@/models/CustomField";
import Project from "@/models/Project";
import Task from "@/models/Task";
import Team from "@/models/Team";
import TimeEntry from "@/models/TimeEntry";
import User from "@/models/User";
import { Types } from "mongoose";
import { computeHours, stripTime } from "@/lib/time-utils";
import type { AuthUser } from "@/lib/mcp-auth";

// ---- Tool result shape ----

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

type CustomFieldValue = {
  fieldId: string;
  value: boolean | number | string;
};

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function endOfDay(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) throw new Error(`Invalid time format "${timeStr}" — expected HH:MM (24-hour), e.g. 09:30`);
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h > 23 || m > 59) throw new Error(`Invalid time "${timeStr}" — hours must be 0-23 and minutes 0-59`);
  return h * 60 + m;
}

function hoursFromStartEnd(start: string, end: string): number {
  // validate format first, then delegate calculation to shared util
  parseTimeToMinutes(start);
  parseTimeToMinutes(end);
  const diff = computeHours(start, end);
  if (diff > 24) throw new Error("Duration between startTime and endTime cannot exceed 24 hours");
  return diff;
}

function requireRole(user: AuthUser, roles: string[], action: string) {
  if (!roles.includes(user.role)) {
    throw new Error(`Access denied: only ${roles.join("/")} can ${action}`);
  }
}

function parseCustomFields(raw: unknown): CustomFieldValue[] {
  if (!raw) return [];
  if (!Array.isArray(raw)) throw new Error("customFields must be an array");
  return (raw as CustomFieldValue[]).map((cf) => {
    if (!cf.fieldId || cf.value === undefined) {
      throw new Error("Each customField entry requires fieldId and value");
    }
    return { fieldId: cf.fieldId, value: cf.value };
  });
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// ---- Tool definitions ----

const CUSTOM_FIELDS_PARAM = {
  customFields: {
    type: "array",
    description: "Optional custom field values. Use get_custom_fields to discover available field IDs.",
    items: {
      type: "object",
      properties: {
        fieldId: { type: "string", description: "Custom field ID from get_custom_fields" },
        value:   { description: "Value matching the field type: boolean for yes_no, number for number, string for text" },
      },
      required: ["fieldId", "value"],
    },
  },
};

export function listTools() {
  return [
    // ── Core lookup ──────────────────────────────────────────────────────────
    {
      name: "get_current_user",
      description: "Get your own profile: id, name, email, and role. Call this first to understand your permissions.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_projects",
      description: "List all active projects. Returns id, name, clientName, color, and budgetHours.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_tasks",
      description: "List active tasks for a project including assignee IDs. Call get_projects first.",
      inputSchema: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "MongoDB ObjectId of the project" },
        },
        required: ["projectId"],
      },
    },
    {
      name: "get_custom_fields",
      description: "List all active custom fields (id, label, type, unit). Use these IDs when logging time with customFields.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_users",
      description: "List all active users (id, name, email, role). Available to managers and admins only.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_teams",
      description: "List all teams with their leader and members.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },

    // ── Time logging ─────────────────────────────────────────────────────────
    {
      name: "log_time",
      description:
        "Create a new time entry. Provide either 'hours' OR both 'startTime' and 'endTime' (HH:MM 24-hour). Use get_projects, get_tasks, and get_custom_fields to obtain valid IDs first.",
      inputSchema: {
        type: "object",
        properties: {
          projectId:    { type: "string",  description: "Project ID" },
          taskId:       { type: "string",  description: "Task ID" },
          hours:        { type: "number",  description: "Hours worked, e.g. 2.5. Optional if startTime+endTime provided." },
          startTime:    { type: "string",  description: "Start time HH:MM 24-hour. Optional if hours provided." },
          endTime:      { type: "string",  description: "End time HH:MM 24-hour. Optional if hours provided." },
          notes:        { type: "string",  description: "Optional description of work done" },
          date:         { type: "string",  description: "Date in YYYY-MM-DD format. Defaults to today." },
          isBillable:   { type: "boolean", description: "Whether the time is billable. Defaults to true." },
          aiUsed:       { type: "boolean", description: "Whether AI assistance was used. Defaults to false." },
          ...CUSTOM_FIELDS_PARAM,
        },
        required: ["projectId", "taskId"],
      },
    },
    {
      name: "repeat_log",
      description:
        "Log the same time entry across multiple dates (e.g. every weekday for a week). Use get_projects, get_tasks, and get_custom_fields first.",
      inputSchema: {
        type: "object",
        properties: {
          projectId:  { type: "string",  description: "Project ID" },
          taskId:     { type: "string",  description: "Task ID" },
          startDate:  { type: "string",  description: "First date YYYY-MM-DD" },
          endDate:    { type: "string",  description: "Last date YYYY-MM-DD" },
          days: {
            type: "array",
            items: { type: "string", enum: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"] },
            description: "Which days of the week to log on. Defaults to Mon–Fri if omitted.",
          },
          hours:      { type: "number",  description: "Hours per entry. Optional if startTime+endTime provided." },
          startTime:  { type: "string",  description: "Start time HH:MM. Optional if hours provided." },
          endTime:    { type: "string",  description: "End time HH:MM. Optional if hours provided." },
          notes:      { type: "string",  description: "Optional notes applied to every entry" },
          isBillable: { type: "boolean", description: "Whether entries are billable. Defaults to true." },
          aiUsed:     { type: "boolean", description: "Whether AI assistance was used. Defaults to false." },
          ...CUSTOM_FIELDS_PARAM,
        },
        required: ["projectId", "taskId", "startDate", "endDate"],
      },
    },
    {
      name: "get_my_logs",
      description: "Retrieve your own time entries for a date range. Includes customFields values.",
      inputSchema: {
        type: "object",
        properties: {
          startDate: { type: "string", description: "Start date YYYY-MM-DD" },
          endDate:   { type: "string", description: "End date YYYY-MM-DD" },
          projectId: { type: "string", description: "Optional: filter to a specific project" },
        },
        required: ["startDate", "endDate"],
      },
    },
    {
      name: "get_logs_for_user",
      description: "Retrieve time entries for a specific user. Available to managers and admins only. Use get_users to find the userId.",
      inputSchema: {
        type: "object",
        properties: {
          userId:    { type: "string", description: "User ID whose logs to retrieve" },
          startDate: { type: "string", description: "Start date YYYY-MM-DD" },
          endDate:   { type: "string", description: "End date YYYY-MM-DD" },
          projectId: { type: "string", description: "Optional: filter to a specific project" },
        },
        required: ["userId", "startDate", "endDate"],
      },
    },
    {
      name: "update_log",
      description:
        "Update an existing time entry. Use get_my_logs to find the entry id. Supports updating all fields including date, project, task, aiUsed, and customFields.",
      inputSchema: {
        type: "object",
        properties: {
          logId:      { type: "string",  description: "ID of the time entry to update" },
          projectId:  { type: "string",  description: "New project ID" },
          taskId:     { type: "string",  description: "New task ID" },
          hours:      { type: "number",  description: "Updated hours" },
          startTime:  { type: "string",  description: "Updated start time HH:MM" },
          endTime:    { type: "string",  description: "Updated end time HH:MM" },
          date:       { type: "string",  description: "Updated date in YYYY-MM-DD format" },
          notes:      { type: "string",  description: "Updated notes" },
          isBillable: { type: "boolean", description: "Updated billable flag" },
          aiUsed:     { type: "boolean", description: "Updated AI usage flag" },
          ...CUSTOM_FIELDS_PARAM,
        },
        required: ["logId"],
      },
    },
    {
      name: "delete_log",
      description: "Delete one of your own time entries. Use get_my_logs to find the log id first.",
      inputSchema: {
        type: "object",
        properties: {
          logId: { type: "string", description: "ID of the time entry to delete" },
        },
        required: ["logId"],
      },
    },

    // ── Summary & reports ────────────────────────────────────────────────────
    {
      name: "get_summary",
      description:
        "Get your own time statistics for a date range: total hours, billable hours, AI hours, entry count, and per-project breakdown.",
      inputSchema: {
        type: "object",
        properties: {
          startDate: { type: "string", description: "Start date YYYY-MM-DD" },
          endDate:   { type: "string", description: "End date YYYY-MM-DD" },
        },
        required: ["startDate", "endDate"],
      },
    },
    {
      name: "get_team_report",
      description:
        "Get hours aggregated by user for a date range. Available to SMEs, managers, and admins. Optionally filter by project.",
      inputSchema: {
        type: "object",
        properties: {
          startDate: { type: "string", description: "Start date YYYY-MM-DD" },
          endDate:   { type: "string", description: "End date YYYY-MM-DD" },
          projectId: { type: "string", description: "Optional: filter to a specific project" },
        },
        required: ["startDate", "endDate"],
      },
    },
    {
      name: "get_project_report",
      description:
        "Get hours aggregated by project for a date range across all users. Available to SMEs, managers, and admins. Optionally filter by user.",
      inputSchema: {
        type: "object",
        properties: {
          startDate: { type: "string", description: "Start date YYYY-MM-DD" },
          endDate:   { type: "string", description: "End date YYYY-MM-DD" },
          userId:    { type: "string", description: "Optional: filter to a specific user" },
        },
        required: ["startDate", "endDate"],
      },
    },

    // ── Project management ───────────────────────────────────────────────────
    {
      name: "create_project",
      description: "Create a new project. Available to managers and admins only.",
      inputSchema: {
        type: "object",
        properties: {
          name:        { type: "string", description: "Project name (must be unique)" },
          clientName:  { type: "string", description: "Optional client name" },
          description: { type: "string", description: "Optional project description" },
          budgetHours: { type: "number", description: "Optional budget in hours" },
          color:       { type: "string", description: "Optional hex color, e.g. #3b82f6" },
        },
        required: ["name"],
      },
    },
    {
      name: "update_project",
      description:
        "Update an existing project's details. Available to managers and admins only. Use get_projects to find the projectId.",
      inputSchema: {
        type: "object",
        properties: {
          projectId:           { type: "string",  description: "Project ID to update" },
          name:                { type: "string",  description: "New project name" },
          clientName:          { type: "string",  description: "New client name" },
          description:         { type: "string",  description: "New description" },
          budgetHours:         { type: "number",  description: "New budget in hours" },
          color:               { type: "string",  description: "New hex color, e.g. #3b82f6" },
          isActive:            { type: "boolean", description: "Set false to archive the project" },
          reportFrequencyDays: { type: "number",  description: "Report frequency in days (1–365)" },
        },
        required: ["projectId"],
      },
    },

    // ── Task management ──────────────────────────────────────────────────────
    {
      name: "create_task",
      description: "Create a new task inside a project. Use get_projects first to find the projectId.",
      inputSchema: {
        type: "object",
        properties: {
          projectId:      { type: "string", description: "Project ID" },
          name:           { type: "string", description: "Task name" },
          estimatedHours: { type: "number", description: "Optional estimated hours" },
          description:    { type: "string", description: "Optional task description" },
        },
        required: ["projectId", "name"],
      },
    },
    {
      name: "update_task",
      description:
        "Update an existing task's details. Available to managers and admins only. Use get_tasks to find the taskId.",
      inputSchema: {
        type: "object",
        properties: {
          taskId:         { type: "string",  description: "Task ID to update" },
          name:           { type: "string",  description: "New task name" },
          description:    { type: "string",  description: "New description" },
          estimatedHours: { type: "number",  description: "New estimated hours" },
          isActive:       { type: "boolean", description: "Set false to archive the task" },
        },
        required: ["taskId"],
      },
    },
    {
      name: "assign_user_to_task",
      description:
        "Assign a user to a task. Use get_projects + get_tasks to find taskId, and get_users to find userId. Available to managers and admins only.",
      inputSchema: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "Task ID" },
          userId: { type: "string", description: "User ID to assign" },
        },
        required: ["taskId", "userId"],
      },
    },
    {
      name: "unassign_user_from_task",
      description:
        "Remove a user from a task's assignees. Available to managers and admins only.",
      inputSchema: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "Task ID" },
          userId: { type: "string", description: "User ID to remove" },
        },
        required: ["taskId", "userId"],
      },
    },

    // ── Team management ──────────────────────────────────────────────────────
    {
      name: "create_team",
      description: "Create a new team. Available to managers and admins. The caller becomes the team leader.",
      inputSchema: {
        type: "object",
        properties: {
          name:        { type: "string", description: "Team name (must be unique)" },
          description: { type: "string", description: "Optional team description" },
        },
        required: ["name"],
      },
    },
    {
      name: "add_team_member",
      description:
        "Add a user to a team. Available to managers and admins. Use get_teams to find teamId and get_users to find userId.",
      inputSchema: {
        type: "object",
        properties: {
          teamId: { type: "string", description: "Team ID" },
          userId: { type: "string", description: "User ID to add" },
        },
        required: ["teamId", "userId"],
      },
    },
    {
      name: "remove_team_member",
      description:
        "Remove a user from a team. Available to managers and admins. Use get_teams to find teamId and get_users to find userId.",
      inputSchema: {
        type: "object",
        properties: {
          teamId: { type: "string", description: "Team ID" },
          userId: { type: "string", description: "User ID to remove" },
        },
        required: ["teamId", "userId"],
      },
    },
  ];
}

// ---- Dispatcher ----

export async function callTool(
  name: string,
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  switch (name) {
    case "get_current_user":        return getCurrentUser(user);
    case "get_projects":            return getProjects();
    case "get_tasks":               return getTasks(args.projectId as string);
    case "get_custom_fields":       return getCustomFields();
    case "get_users":               return getUsers(user);
    case "get_teams":               return getTeams();
    case "log_time":                return logTime(args, user);
    case "repeat_log":              return repeatLog(args, user);
    case "get_my_logs":             return getMyLogs(args, user);
    case "get_logs_for_user":       return getLogsForUser(args, user);
    case "update_log":              return updateLog(args, user);
    case "delete_log":              return deleteLog(args, user);
    case "get_summary":             return getSummary(args, user);
    case "get_team_report":         return getTeamReport(args, user);
    case "get_project_report":      return getProjectReport(args, user);
    case "create_project":          return createProject(args, user);
    case "update_project":          return updateProject(args, user);
    case "create_task":             return createTask(args, user);
    case "update_task":             return updateTask(args, user);
    case "assign_user_to_task":     return assignUserToTask(args, user);
    case "unassign_user_from_task": return unassignUserFromTask(args, user);
    case "create_team":             return createTeam(args, user);
    case "add_team_member":         return addTeamMember(args, user);
    case "remove_team_member":      return removeTeamMember(args, user);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ---- Handlers ----

async function getCurrentUser(user: AuthUser): Promise<ToolResult> {
  await connectDB();
  const u = await User.findById(user._id).select("_id name email role").lean();
  if (!u) throw new Error("User not found");
  return ok({ id: u._id.toString(), name: u.name, email: u.email, role: u.role });
}

async function getProjects(): Promise<ToolResult> {
  await connectDB();
  const projects = await Project.find({ isActive: true })
    .select("_id name clientName color budgetHours")
    .sort({ name: 1 })
    .lean();

  return ok(
    projects.map((p) => ({
      id:          p._id.toString(),
      name:        p.name,
      clientName:  p.clientName ?? null,
      color:       p.color ?? null,
      budgetHours: p.budgetHours ?? null,
    }))
  );
}

async function getTasks(projectId: string): Promise<ToolResult> {
  if (!projectId) throw new Error("projectId is required");
  await connectDB();
  const tasks = await Task.find({ projectId, isActive: true })
    .select("_id name estimatedHours assignees description")
    .sort({ name: 1 })
    .lean();

  return ok(
    tasks.map((t) => ({
      id:             t._id.toString(),
      name:           t.name,
      description:    t.description ?? null,
      estimatedHours: t.estimatedHours ?? null,
      assigneeIds:    t.assignees.map((a) => a.toString()),
    }))
  );
}

async function getCustomFields(): Promise<ToolResult> {
  await connectDB();
  const fields = await CustomField.find({ isActive: true })
    .select("_id label type unit")
    .sort({ label: 1 })
    .lean();

  return ok(
    fields.map((f) => ({
      id:    f._id.toString(),
      label: f.label,
      type:  f.type,
      unit:  f.unit ?? null,
    }))
  );
}

async function getUsers(user: AuthUser): Promise<ToolResult> {
  requireRole(user, ["manager", "admin"], "list users");
  await connectDB();
  const users = await User.find({ isActive: true })
    .select("_id name email role")
    .sort({ name: 1 })
    .lean();

  return ok(
    users.map((u) => ({
      id:    u._id.toString(),
      name:  u.name,
      email: u.email,
      role:  u.role,
    }))
  );
}

type PopulatedUser = { _id: Types.ObjectId; name: string; email: string };
type PopulatedTeam  = {
  _id:        Types.ObjectId;
  name:       string;
  description?: string;
  leaderId:   PopulatedUser;
  memberIds:  PopulatedUser[];
};

async function getTeams(): Promise<ToolResult> {
  await connectDB();
  const teams = (await Team.find({})
    .populate("leaderId", "name email")
    .populate("memberIds", "name email")
    .sort({ name: 1 })
    .lean()) as unknown as PopulatedTeam[];

  return ok(
    teams.map((t) => ({
      id:          t._id.toString(),
      name:        t.name,
      description: t.description ?? null,
      leader:      { id: t.leaderId._id.toString(), name: t.leaderId.name, email: t.leaderId.email },
      members:     t.memberIds.map((m) => ({ id: m._id.toString(), name: m.name, email: m.email })),
    }))
  );
}

async function logTime(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  const { projectId, taskId, notes, date, isBillable = true, aiUsed = false } = args;
  let { hours, startTime, endTime } = args as { hours?: number; startTime?: string; endTime?: string };

  if (!projectId || !taskId) throw new Error("projectId and taskId are required");

  if (startTime && endTime) {
    if (hours === undefined) hours = hoursFromStartEnd(startTime, endTime);
  } else if (startTime || endTime) {
    throw new Error("Provide both startTime and endTime together, or neither");
  }
  if (hours === undefined) throw new Error("Provide either 'hours' or both 'startTime' and 'endTime'");

  const customFields = parseCustomFields(args.customFields).map((cf) => ({
    fieldId: new Types.ObjectId(cf.fieldId),
    value:   cf.value,
  }));

  await connectDB();
  const logDate = date
    ? stripTime(date as string)
    : stripTime(new Date().toISOString().split("T")[0]);

  const entry = await TimeEntry.create({
    userId:       new Types.ObjectId(user._id),
    projectId:    new Types.ObjectId(projectId as string),
    taskId:       new Types.ObjectId(taskId as string),
    hours,
    startTime:    startTime ?? null,
    endTime:      endTime   ?? null,
    loggedAt:     logDate,
    isBillable:   isBillable as boolean,
    aiUsed:       aiUsed as boolean,
    notes:        (notes as string) ?? null,
    customFields,
  });

  const timeLabel = startTime && endTime ? `${startTime}–${endTime} (${hours}h)` : `${hours}h`;
  return ok({ id: entry._id.toString(), message: `Logged ${timeLabel} successfully.` });
}

const DAY_NAME_TO_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};
const DEFAULT_WEEKDAYS = new Set([1, 2, 3, 4, 5]);

async function repeatLog(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  const { projectId, taskId, startDate, endDate, notes, isBillable = true, aiUsed = false } = args;
  let { hours, startTime, endTime } = args as { hours?: number; startTime?: string; endTime?: string };

  if (!projectId || !taskId || !startDate || !endDate) {
    throw new Error("projectId, taskId, startDate, and endDate are required");
  }

  if (startTime && endTime) {
    if (hours === undefined) hours = hoursFromStartEnd(startTime, endTime);
  } else if (startTime || endTime) {
    throw new Error("Provide both startTime and endTime together, or neither");
  }
  if (hours === undefined) throw new Error("Provide either 'hours' or both 'startTime' and 'endTime'");

  const customFields = parseCustomFields(args.customFields).map((cf) => ({
    fieldId: new Types.ObjectId(cf.fieldId),
    value:   cf.value,
  }));

  const rawDays = args.days as string[] | undefined;
  const allowedDays: Set<number> =
    rawDays && rawDays.length > 0
      ? new Set(
          rawDays.map((d) => {
            const idx = DAY_NAME_TO_INDEX[d];
            if (idx === undefined) throw new Error(`Invalid day name "${d}" — use Sun/Mon/Tue/Wed/Thu/Fri/Sat`);
            return idx;
          })
        )
      : DEFAULT_WEEKDAYS;

  const dates: string[] = [];
  const end = new Date(endDate as string + "T00:00:00Z");
  const cur = new Date(startDate as string + "T00:00:00Z");
  while (cur <= end) {
    if (allowedDays.has(cur.getUTCDay())) dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  if (dates.length === 0) throw new Error("No dates match the selected range and days");
  if (dates.length > 90)  throw new Error("Range too large — maximum 90 entries per call");

  await connectDB();
  const docs = dates.map((d) => ({
    userId:       new Types.ObjectId(user._id),
    projectId:    new Types.ObjectId(projectId as string),
    taskId:       new Types.ObjectId(taskId as string),
    hours,
    startTime:    startTime ?? null,
    endTime:      endTime   ?? null,
    loggedAt:     stripTime(d),
    isBillable:   isBillable as boolean,
    aiUsed:       aiUsed as boolean,
    notes:        (notes as string) ?? null,
    customFields,
  }));

  await TimeEntry.insertMany(docs);

  const timeLabel = startTime && endTime ? `${startTime}–${endTime} (${hours}h)` : `${hours}h`;
  return ok({
    created: dates.length,
    dates,
    message: `Logged ${timeLabel} on ${dates.length} dates (${startDate} to ${endDate}).`,
  });
}

async function getMyLogs(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  const { startDate, endDate, projectId } = args;
  if (!startDate || !endDate) throw new Error("startDate and endDate are required");

  await connectDB();
  const filter: Record<string, unknown> = {
    userId:   new Types.ObjectId(user._id),
    loggedAt: { $gte: new Date(startDate as string), $lte: endOfDay(endDate as string) },
  };
  if (projectId) filter.projectId = new Types.ObjectId(projectId as string);

  return ok(await fetchLogEntries(filter));
}

async function getLogsForUser(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  requireRole(user, ["manager", "admin"], "view another user's logs");

  const { userId, startDate, endDate, projectId } = args;
  if (!userId || !startDate || !endDate) throw new Error("userId, startDate, and endDate are required");

  await connectDB();
  const filter: Record<string, unknown> = {
    userId:   new Types.ObjectId(userId as string),
    loggedAt: { $gte: new Date(startDate as string), $lte: endOfDay(endDate as string) },
  };
  if (projectId) filter.projectId = new Types.ObjectId(projectId as string);

  return ok(await fetchLogEntries(filter));
}

async function fetchLogEntries(filter: Record<string, unknown>) {
  const entries = await TimeEntry.find(filter)
    .sort({ loggedAt: -1 })
    .limit(100)
    .populate("projectId", "name")
    .populate("taskId", "name")
    .populate("customFields.fieldId", "label type unit")
    .lean();

  return entries.map((e) => ({
    id:         e._id.toString(),
    date:       new Date(e.loggedAt).toISOString().split("T")[0],
    project:    (e.projectId as unknown as { name: string })?.name ?? "Unknown",
    task:       (e.taskId    as unknown as { name: string })?.name ?? "Unknown",
    hours:      e.hours,
    startTime:  e.startTime ?? null,
    endTime:    e.endTime   ?? null,
    notes:      e.notes,
    isBillable: e.isBillable,
    aiUsed:     e.aiUsed,
    customFields: e.customFields.map((cf: { fieldId: unknown; value: unknown }) => {
      // After populate + lean, fieldId is a plain object { _id, label, type, unit }
      const field = cf.fieldId as { _id: Types.ObjectId; label: string; type: string; unit?: string } | null;
      return {
        fieldId:   field?._id?.toString() ?? null,
        label:     field?.label ?? null,
        type:      field?.type  ?? null,
        unit:      field?.unit  ?? null,
        value:     cf.value,
      };
    }),
  }));
}

async function updateLog(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  const { logId, notes, isBillable, aiUsed, projectId, taskId } = args;
  let { hours, startTime, endTime } = args as { hours?: number; startTime?: string; endTime?: string };

  if (!logId) throw new Error("logId is required");

  await connectDB();
  const entry = await TimeEntry.findById(logId as string);
  if (!entry) throw new Error(`Time entry not found: ${logId}`);
  if (entry.userId.toString() !== user._id) throw new Error("Not authorized to update this entry");

  // Resolve start/end from existing values when only one side is supplied
  const resolvedStart = startTime ?? (entry.startTime ?? undefined);
  const resolvedEnd   = endTime   ?? (entry.endTime   ?? undefined);

  if (startTime !== undefined || endTime !== undefined) {
    if (!resolvedStart || !resolvedEnd) {
      throw new Error("Provide both startTime and endTime (or the entry must already have both stored)");
    }
    entry.startTime = resolvedStart;
    entry.endTime   = resolvedEnd;
    if (hours === undefined) hours = hoursFromStartEnd(resolvedStart, resolvedEnd);
  }

  // Cross-validate: task must belong to the resolved project
  if (projectId !== undefined || taskId !== undefined) {
    const resolvedProjectId = projectId !== undefined ? (projectId as string) : entry.projectId.toString();
    const resolvedTaskId    = taskId    !== undefined ? (taskId    as string) : entry.taskId.toString();
    const crossTask = await Task.findById(resolvedTaskId).select("projectId").lean();
    if (!crossTask) throw new Error(`Task not found: ${resolvedTaskId}`);
    if (crossTask.projectId.toString() !== resolvedProjectId) {
      throw new Error("Task does not belong to the specified project");
    }
  }

  if (hours      !== undefined) entry.hours      = hours;
  if (notes      !== undefined) entry.notes      = notes as string;
  if (isBillable !== undefined) entry.isBillable = isBillable as boolean;
  if (aiUsed     !== undefined) entry.aiUsed     = aiUsed as boolean;
  if (projectId  !== undefined) entry.projectId  = new Types.ObjectId(projectId as string);
  if (taskId     !== undefined) entry.taskId     = new Types.ObjectId(taskId as string);

  if (args.date !== undefined) {
    entry.loggedAt = stripTime(args.date as string);
  }

  if (args.customFields !== undefined) {
    entry.customFields = parseCustomFields(args.customFields).map((cf) => ({
      fieldId: new Types.ObjectId(cf.fieldId),
      value:   cf.value,
    }));
  }

  await entry.save();
  return ok({ success: true, message: "Entry updated successfully." });
}

async function deleteLog(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  const { logId } = args;
  if (!logId) throw new Error("logId is required");

  await connectDB();
  const entry = await TimeEntry.findById(logId as string);
  if (!entry) throw new Error(`Time entry not found: ${logId}`);
  if (entry.userId.toString() !== user._id) throw new Error("Not authorized to delete this entry");

  await entry.deleteOne();
  return ok({ success: true, message: "Time entry deleted successfully." });
}

async function getSummary(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  const { startDate, endDate } = args;
  if (!startDate || !endDate) throw new Error("startDate and endDate are required");

  await connectDB();
  const userId   = new Types.ObjectId(user._id);
  const fromDate = new Date(startDate as string);
  const toDate   = endOfDay(endDate as string);

  const [stats = { totalHours: 0, billableHours: 0, aiHours: 0, entryCount: 0 }] =
    await TimeEntry.aggregate([
      { $match: { userId, loggedAt: { $gte: fromDate, $lte: toDate } } },
      {
        $group: {
          _id:           null,
          totalHours:    { $sum: "$hours" },
          billableHours: { $sum: { $cond: ["$isBillable", "$hours", 0] } },
          aiHours:       { $sum: { $cond: ["$aiUsed",    "$hours", 0] } },
          entryCount:    { $sum: 1 },
        },
      },
    ]);

  const byProject = await TimeEntry.aggregate([
    { $match: { userId, loggedAt: { $gte: fromDate, $lte: toDate } } },
    { $group: { _id: "$projectId", hours: { $sum: "$hours" } } },
    {
      $lookup: {
        from: "projects", localField: "_id", foreignField: "_id", as: "project",
      },
    },
    { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
    { $project: { projectName: { $ifNull: ["$project.name", "Unknown"] }, hours: 1 } },
    { $sort: { hours: -1 } },
  ]);

  return ok({
    period:        { from: startDate, to: endDate },
    totalHours:    round2(stats.totalHours),
    billableHours: round2(stats.billableHours),
    aiHours:       round2(stats.aiHours),
    entryCount:    stats.entryCount,
    byProject:     byProject.map((r) => ({ project: r.projectName, hours: round2(r.hours) })),
  });
}

async function getTeamReport(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  requireRole(user, ["sme", "manager", "admin"], "view team reports");

  const { startDate, endDate, projectId } = args;
  if (!startDate || !endDate) throw new Error("startDate and endDate are required");

  await connectDB();
  const match: Record<string, unknown> = {
    loggedAt: { $gte: new Date(startDate as string), $lte: endOfDay(endDate as string) },
  };
  if (projectId) match.projectId = new Types.ObjectId(projectId as string);

  const rows = await TimeEntry.aggregate([
    { $match: match },
    {
      $group: {
        _id:           "$userId",
        totalHours:    { $sum: "$hours" },
        billableHours: { $sum: { $cond: ["$isBillable", "$hours", 0] } },
        aiHours:       { $sum: { $cond: ["$aiUsed",    "$hours", 0] } },
        entryCount:    { $sum: 1 },
      },
    },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    {
      $project: {
        totalHours: 1, billableHours: 1, aiHours: 1, entryCount: 1,
        "user.name": 1, "user.email": 1, "user.role": 1,
      },
    },
    { $sort: { totalHours: -1 } },
  ]);

  return ok({
    period: { from: startDate, to: endDate },
    users: rows.map((r) => ({
      userId:       r._id.toString(),
      name:         r.user.name,
      email:        r.user.email,
      role:         r.user.role,
      totalHours:   round2(r.totalHours),
      billableHours:round2(r.billableHours),
      aiHours:      round2(r.aiHours),
      entryCount:   r.entryCount,
    })),
  });
}

async function getProjectReport(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  requireRole(user, ["sme", "manager", "admin"], "view project reports");

  const { startDate, endDate, userId } = args;
  if (!startDate || !endDate) throw new Error("startDate and endDate are required");

  await connectDB();
  const match: Record<string, unknown> = {
    loggedAt: { $gte: new Date(startDate as string), $lte: endOfDay(endDate as string) },
  };
  if (userId) match.userId = new Types.ObjectId(userId as string);

  const rows = await TimeEntry.aggregate([
    { $match: match },
    {
      $group: {
        _id:           "$projectId",
        totalHours:    { $sum: "$hours" },
        billableHours: { $sum: { $cond: ["$isBillable", "$hours", 0] } },
        entryCount:    { $sum: 1 },
      },
    },
    { $lookup: { from: "projects", localField: "_id", foreignField: "_id", as: "project" } },
    { $unwind: "$project" },
    { $sort: { totalHours: -1 } },
  ]);

  return ok({
    period: { from: startDate, to: endDate },
    projects: rows.map((r) => ({
      projectId:    r._id.toString(),
      name:         r.project.name,
      clientName:   r.project.clientName ?? null,
      totalHours:   round2(r.totalHours),
      billableHours:round2(r.billableHours),
      billablePct:  r.totalHours > 0 ? Math.round((r.billableHours / r.totalHours) * 100) : 0,
      entryCount:   r.entryCount,
    })),
  });
}

async function createProject(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  requireRole(user, ["manager", "admin"], "create projects");

  const { name, clientName, description, budgetHours, color } = args;
  if (!name) throw new Error("name is required");

  if (color && !/^#[0-9a-fA-F]{6}$/.test(color as string)) {
    throw new Error("color must be a valid hex color, e.g. #3b82f6");
  }

  await connectDB();
  const existing = await Project.findOne({ name });
  if (existing) throw new Error(`Project "${name}" already exists`);

  const project = await Project.create({
    name:        (name as string).trim(),
    clientName:  clientName  != null ? (clientName  as string).trim() : null,
    description: description != null ? (description as string)        : null,
    budgetHours: budgetHours != null ? (budgetHours as number)        : null,
    color:       color       != null ? (color       as string)        : null,
  });

  return ok({ id: project._id.toString(), name: project.name, message: `Project "${project.name}" created successfully.` });
}

async function updateProject(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  requireRole(user, ["manager", "admin"], "update projects");

  const { projectId, color } = args;
  if (!projectId) throw new Error("projectId is required");

  if (color && !/^#[0-9a-fA-F]{6}$/.test(color as string)) {
    throw new Error("color must be a valid hex color, e.g. #3b82f6");
  }

  const updates: Record<string, unknown> = {};
  const fields = ["name", "clientName", "description", "budgetHours", "color", "isActive", "reportFrequencyDays"] as const;
  for (const f of fields) {
    if (args[f] !== undefined) updates[f] = args[f];
  }

  if (Object.keys(updates).length === 0) throw new Error("No fields provided to update");

  await connectDB();
  const project = await Project.findByIdAndUpdate(projectId as string, updates, { new: true });
  if (!project) throw new Error(`Project not found: ${projectId}`);

  return ok({ id: project._id.toString(), name: project.name, message: `Project "${project.name}" updated successfully.` });
}

async function createTask(
  args: Record<string, unknown>,
  _user: AuthUser
): Promise<ToolResult> {
  const { projectId, name, estimatedHours, description } = args;
  if (!projectId || !name) throw new Error("projectId and name are required");

  await connectDB();
  const existing = await Task.findOne({ projectId, name });
  if (existing) throw new Error(`Task "${name}" already exists in this project`);

  const task = await Task.create({
    projectId:      new Types.ObjectId(projectId as string),
    name:           name as string,
    estimatedHours: estimatedHours != null ? (estimatedHours as number) : null,
    description:    description    != null ? (description    as string) : null,
    isActive:       true,
  });

  return ok({ id: task._id.toString(), name: task.name, message: `Task "${task.name}" created successfully.` });
}

async function updateTask(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  requireRole(user, ["manager", "admin"], "update tasks");

  const { taskId } = args;
  if (!taskId) throw new Error("taskId is required");

  const updates: Record<string, unknown> = {};
  const fields = ["name", "description", "estimatedHours", "isActive"] as const;
  for (const f of fields) {
    if (args[f] !== undefined) updates[f] = args[f];
  }

  if (Object.keys(updates).length === 0) throw new Error("No fields provided to update");

  await connectDB();
  const task = await Task.findByIdAndUpdate(taskId as string, updates, { new: true });
  if (!task) throw new Error(`Task not found: ${taskId}`);

  return ok({ id: task._id.toString(), name: task.name, message: `Task "${task.name}" updated successfully.` });
}

async function assignUserToTask(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  requireRole(user, ["manager", "admin"], "assign users to tasks");

  const { taskId, userId } = args;
  if (!taskId || !userId) throw new Error("taskId and userId are required");

  await connectDB();
  const task = await Task.findById(taskId as string);
  if (!task) throw new Error(`Task not found: ${taskId}`);

  const targetUser = await User.findById(userId as string);
  if (!targetUser) throw new Error(`User not found: ${userId}`);

  const userObjId = new Types.ObjectId(userId as string);
  if (task.assignees.some((a) => a.equals(userObjId))) {
    return ok({ message: `User "${targetUser.name}" is already assigned to this task.` });
  }

  task.assignees.push(userObjId);
  await task.save();

  return ok({ taskId: task._id.toString(), userId: targetUser._id.toString(), message: `User "${targetUser.name}" assigned to task "${task.name}" successfully.` });
}

async function unassignUserFromTask(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  requireRole(user, ["manager", "admin"], "unassign users from tasks");

  const { taskId, userId } = args;
  if (!taskId || !userId) throw new Error("taskId and userId are required");

  await connectDB();
  const task = await Task.findById(taskId as string);
  if (!task) throw new Error(`Task not found: ${taskId}`);

  const targetUser = await User.findById(userId as string);
  if (!targetUser) throw new Error(`User not found: ${userId}`);

  const userObjId = new Types.ObjectId(userId as string);
  if (!task.assignees.some((a) => a.equals(userObjId))) {
    return ok({ message: `User "${targetUser.name}" is not assigned to this task.` });
  }

  task.assignees = task.assignees.filter((a) => !a.equals(userObjId));
  await task.save();

  return ok({ taskId: task._id.toString(), userId: targetUser._id.toString(), message: `User "${targetUser.name}" removed from task "${task.name}" successfully.` });
}

async function createTeam(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  requireRole(user, ["manager", "admin"], "create teams");

  const { name, description } = args;
  if (!name) throw new Error("name is required");

  await connectDB();
  const existing = await Team.findOne({ name: (name as string).trim() });
  if (existing) throw new Error(`Team "${name}" already exists`);

  const team = await Team.create({
    name:        (name as string).trim(),
    description: description != null ? (description as string).trim() : "",
    leaderId:    new Types.ObjectId(user._id),
    memberIds:   [],
  });

  return ok({ id: team._id.toString(), name: team.name, message: `Team "${team.name}" created successfully.` });
}

async function addTeamMember(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  requireRole(user, ["manager", "admin"], "add team members");

  const { teamId, userId } = args;
  if (!teamId || !userId) throw new Error("teamId and userId are required");

  await connectDB();
  const team = await Team.findById(teamId as string);
  if (!team) throw new Error(`Team not found: ${teamId}`);

  const targetUser = await User.findById(userId as string).select("name isActive");
  if (!targetUser) throw new Error(`User not found: ${userId}`);
  if (!targetUser.isActive) throw new Error("Cannot add an inactive user to a team");

  const userObjId = new Types.ObjectId(userId as string);
  if (team.leaderId.equals(userObjId)) {
    return ok({ message: `User "${targetUser.name}" is the team leader and is already part of the team.` });
  }
  if (team.memberIds.some((id: Types.ObjectId) => id.equals(userObjId))) {
    return ok({ message: `User "${targetUser.name}" is already a member of this team.` });
  }

  team.memberIds.push(userObjId);
  await team.save();

  return ok({ teamId: team._id.toString(), userId: targetUser._id.toString(), message: `User "${targetUser.name}" added to team "${team.name}" successfully.` });
}

async function removeTeamMember(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  requireRole(user, ["manager", "admin"], "remove team members");

  const { teamId, userId } = args;
  if (!teamId || !userId) throw new Error("teamId and userId are required");

  await connectDB();
  const team = await Team.findById(teamId as string);
  if (!team) throw new Error(`Team not found: ${teamId}`);

  const targetUser = await User.findById(userId as string).select("name");
  if (!targetUser) throw new Error(`User not found: ${userId}`);

  const userObjId = new Types.ObjectId(userId as string);
  if (!team.memberIds.some((id: Types.ObjectId) => id.equals(userObjId))) {
    return ok({ message: `User "${targetUser.name}" is not a member of this team.` });
  }

  team.memberIds = team.memberIds.filter((id: Types.ObjectId) => !id.equals(userObjId));
  await team.save();

  return ok({ teamId: team._id.toString(), userId: targetUser._id.toString(), message: `User "${targetUser.name}" removed from team "${team.name}" successfully.` });
}
