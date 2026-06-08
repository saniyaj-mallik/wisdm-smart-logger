import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import Task from "@/models/Task";
import TimeEntry from "@/models/TimeEntry";
import User from "@/models/User";
import { Types } from "mongoose";
import { stripTime } from "@/lib/time-utils";
import type { AuthUser } from "@/lib/mcp-auth";

// ---- Tool result shape ----

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function endOfDay(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

// ---- Tool definitions (returned to Claude via tools/list) ----

export function listTools() {
  return [
    {
      name: "get_projects",
      description:
        "List all active projects. Returns id, name, clientName, color, and budgetHours for each.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_tasks",
      description:
        "List active tasks for a project. Call get_projects first to find the projectId.",
      inputSchema: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "MongoDB ObjectId of the project" },
        },
        required: ["projectId"],
      },
    },
    {
      name: "log_time",
      description:
        "Create a new time entry. Use get_projects and get_tasks to obtain valid IDs first.",
      inputSchema: {
        type: "object",
        properties: {
          projectId:  { type: "string",  description: "Project ID" },
          taskId:     { type: "string",  description: "Task ID" },
          hours:      { type: "number",  description: "Hours worked, e.g. 2.5" },
          notes:      { type: "string",  description: "Optional description of work done" },
          date:       { type: "string",  description: "Date in YYYY-MM-DD format. Defaults to today." },
          isBillable: { type: "boolean", description: "Whether the time is billable. Defaults to true." },
          aiUsed:     { type: "boolean", description: "Whether AI assistance was used. Defaults to false." },
        },
        required: ["projectId", "taskId", "hours"],
      },
    },
    {
      name: "get_my_logs",
      description: "Retrieve the current user's time entries for a date range.",
      inputSchema: {
        type: "object",
        properties: {
          startDate: { type: "string", description: "Start date in YYYY-MM-DD format" },
          endDate:   { type: "string", description: "End date in YYYY-MM-DD format" },
          projectId: { type: "string", description: "Optional: filter to a specific project" },
        },
        required: ["startDate", "endDate"],
      },
    },
    {
      name: "get_summary",
      description:
        "Get time statistics for a date range: total hours, billable hours, AI hours, entry count, and a per-project breakdown.",
      inputSchema: {
        type: "object",
        properties: {
          startDate: { type: "string", description: "Start date in YYYY-MM-DD format" },
          endDate:   { type: "string", description: "End date in YYYY-MM-DD format" },
        },
        required: ["startDate", "endDate"],
      },
    },
    {
      name: "update_log",
      description:
        "Update an existing time entry. Use get_my_logs to find the entry id first.",
      inputSchema: {
        type: "object",
        properties: {
          logId:      { type: "string",  description: "ID of the time entry to update" },
          hours:      { type: "number",  description: "Updated hours" },
          notes:      { type: "string",  description: "Updated notes" },
          isBillable: { type: "boolean", description: "Updated billable flag" },
        },
        required: ["logId"],
      },
    },
    {
      name: "create_task",
      description:
        "Create a new task inside a project. Use get_projects first to find the projectId.",
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
      name: "delete_log",
      description:
        "Delete one of your own time entries. Use get_my_logs to find the log id first.",
      inputSchema: {
        type: "object",
        properties: {
          logId: { type: "string", description: "ID of the time entry to delete" },
        },
        required: ["logId"],
      },
    },
    {
      name: "get_users",
      description:
        "List all active users with their id, name, email, and role. Available to managers and admins only.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "create_project",
      description:
        "Create a new project. Available to managers and admins only.",
      inputSchema: {
        type: "object",
        properties: {
          name:        { type: "string", description: "Project name (required, must be unique)" },
          clientName:  { type: "string", description: "Optional client name" },
          description: { type: "string", description: "Optional project description" },
          budgetHours: { type: "number", description: "Optional budget in hours" },
          color:       { type: "string", description: "Optional hex color, e.g. #3b82f6" },
        },
        required: ["name"],
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
  ];
}

// ---- Dispatcher ----

export async function callTool(
  name: string,
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  switch (name) {
    case "get_projects":
      return getProjects();
    case "get_tasks":
      return getTasks(args.projectId as string);
    case "log_time":
      return logTime(args, user);
    case "get_my_logs":
      return getMyLogs(args, user);
    case "get_summary":
      return getSummary(args, user);
    case "update_log":
      return updateLog(args, user);
    case "create_task":
      return createTask(args, user);
    case "delete_log":
      return deleteLog(args, user);
    case "get_users":
      return getUsers(user);
    case "create_project":
      return createProject(args, user);
    case "assign_user_to_task":
      return assignUserToTask(args, user);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ---- Handlers ----

async function getProjects(): Promise<ToolResult> {
  await connectDB();
  const projects = await Project.find({ isActive: true })
    .select("_id name clientName color budgetHours")
    .sort({ name: 1 })
    .lean();

  return ok(
    projects.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      clientName: p.clientName ?? null,
      color: p.color ?? null,
      budgetHours: p.budgetHours ?? null,
    }))
  );
}

async function getTasks(projectId: string): Promise<ToolResult> {
  if (!projectId) throw new Error("projectId is required");
  await connectDB();
  const tasks = await Task.find({ projectId, isActive: true })
    .select("_id name estimatedHours")
    .sort({ name: 1 })
    .lean();

  return ok(
    tasks.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      estimatedHours: t.estimatedHours ?? null,
    }))
  );
}

async function logTime(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  const { projectId, taskId, hours, notes, date, isBillable = true, aiUsed = false } = args;
  if (!projectId || !taskId || !hours) {
    throw new Error("projectId, taskId, and hours are required");
  }

  await connectDB();
  const logDate = date
    ? stripTime(date as string)
    : stripTime(new Date().toISOString().split("T")[0]);

  const entry = await TimeEntry.create({
    userId:       new Types.ObjectId(user._id),
    projectId:    new Types.ObjectId(projectId as string),
    taskId:       new Types.ObjectId(taskId as string),
    hours:        hours as number,
    startTime:    null,
    endTime:      null,
    loggedAt:     logDate,
    isBillable:   isBillable as boolean,
    aiUsed:       aiUsed as boolean,
    notes:        (notes as string) ?? null,
    customFields: [],
  });

  return ok({ id: entry._id.toString(), message: `Logged ${hours}h successfully.` });
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

  const entries = await TimeEntry.find(filter)
    .sort({ loggedAt: -1 })
    .limit(100)
    .populate("projectId", "name")
    .populate("taskId", "name")
    .lean();

  return ok(
    entries.map((e) => ({
      id:         e._id.toString(),
      date:       new Date(e.loggedAt).toISOString().split("T")[0],
      project:    (e.projectId as unknown as { name: string })?.name ?? "Unknown",
      task:       (e.taskId as unknown as { name: string })?.name ?? "Unknown",
      hours:      e.hours,
      notes:      e.notes,
      isBillable: e.isBillable,
      aiUsed:     e.aiUsed,
    }))
  );
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
          _id:          null,
          totalHours:   { $sum: "$hours" },
          billableHours:{ $sum: { $cond: ["$isBillable", "$hours", 0] } },
          aiHours:      { $sum: { $cond: ["$aiUsed",    "$hours", 0] } },
          entryCount:   { $sum: 1 },
        },
      },
    ]);

  const byProject = await TimeEntry.aggregate([
    { $match: { userId, loggedAt: { $gte: fromDate, $lte: toDate } } },
    { $group: { _id: "$projectId", hours: { $sum: "$hours" } } },
    {
      $lookup: {
        from:         "projects",
        localField:   "_id",
        foreignField: "_id",
        as:           "project",
      },
    },
    { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        projectName: { $ifNull: ["$project.name", "Unknown"] },
        hours: 1,
      },
    },
    { $sort: { hours: -1 } },
  ]);

  const round = (n: number) => Math.round(n * 100) / 100;

  return ok({
    period: { from: startDate, to: endDate },
    totalHours:    round(stats.totalHours),
    billableHours: round(stats.billableHours),
    aiHours:       round(stats.aiHours),
    entryCount:    stats.entryCount,
    byProject: byProject.map((r) => ({
      project: r.projectName,
      hours:   round(r.hours),
    })),
  });
}

async function updateLog(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  const { logId, hours, notes, isBillable } = args;
  if (!logId) throw new Error("logId is required");

  await connectDB();
  const entry = await TimeEntry.findById(logId as string);
  if (!entry) throw new Error(`Time entry not found: ${logId}`);
  if (entry.userId.toString() !== user._id) {
    throw new Error("Not authorized to update this entry");
  }

  if (hours !== undefined)      entry.hours      = hours as number;
  if (notes !== undefined)      entry.notes      = notes as string;
  if (isBillable !== undefined) entry.isBillable = isBillable as boolean;
  await entry.save();

  return ok({ success: true, message: "Entry updated successfully." });
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
    description:    description != null ? (description as string) : null,
    isActive:       true,
  });

  return ok({
    id:      task._id.toString(),
    name:    task.name,
    message: `Task "${task.name}" created successfully.`,
  });
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
  if (entry.userId.toString() !== user._id) {
    throw new Error("Not authorized to delete this entry");
  }

  await entry.deleteOne();
  return ok({ success: true, message: "Time entry deleted successfully." });
}

async function getUsers(user: AuthUser): Promise<ToolResult> {
  if (!["manager", "admin"].includes(user.role)) {
    throw new Error("Access denied: only managers and admins can list users");
  }

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

async function createProject(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  if (!["manager", "admin"].includes(user.role)) {
    throw new Error("Access denied: only managers and admins can create projects");
  }

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
    clientName:  clientName != null ? (clientName as string).trim() : null,
    description: description != null ? (description as string) : null,
    budgetHours: budgetHours != null ? (budgetHours as number) : null,
    color:       color != null ? (color as string) : null,
  });

  return ok({
    id:      project._id.toString(),
    name:    project.name,
    message: `Project "${project.name}" created successfully.`,
  });
}

async function assignUserToTask(
  args: Record<string, unknown>,
  user: AuthUser
): Promise<ToolResult> {
  if (!["manager", "admin"].includes(user.role)) {
    throw new Error("Access denied: only managers and admins can assign users to tasks");
  }

  const { taskId, userId } = args;
  if (!taskId || !userId) throw new Error("taskId and userId are required");

  await connectDB();

  const task = await Task.findById(taskId as string);
  if (!task) throw new Error(`Task not found: ${taskId}`);

  const targetUser = await User.findById(userId as string);
  if (!targetUser) throw new Error(`User not found: ${userId}`);

  const userObjId = new Types.ObjectId(userId as string);
  const alreadyAssigned = task.assignees.some((a) => a.equals(userObjId));
  if (alreadyAssigned) {
    return ok({ message: `User "${targetUser.name}" is already assigned to this task.` });
  }

  task.assignees.push(userObjId);
  await task.save();

  return ok({
    taskId:  task._id.toString(),
    userId:  targetUser._id.toString(),
    message: `User "${targetUser.name}" assigned to task "${task.name}" successfully.`,
  });
}
