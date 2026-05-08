import { z } from "zod";

// ── Auth ──────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const UpdateProfileSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).max(100).optional(),
  })
  .refine((d) => !d.newPassword || !!d.currentPassword, {
    message: "Current password required to set a new password",
    path: ["currentPassword"],
  });

export const UpdateUserRoleSchema = z.object({
  role: z.enum(["dev", "sme", "manager", "admin"]).optional(),
  isActive: z.boolean().optional(),
});

// ── Projects & Tasks ──────────────────────────────────────────────────────────

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  clientName: z.string().max(100).trim().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  budgetHours: z.number().positive().max(100000).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const CreateTaskSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(500).nullable().optional(),
  estimatedHours: z.number().positive().max(10000).nullable().optional(),
  assignees: z.array(z.string()).optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ── Time Logging ─────────────────────────────────────────────────────────────

export const CreateLogSchema = z
  .object({
    projectId: z.string().min(1),
    taskId: z.string().min(1),
    hours: z.number().positive().max(24).nullable().optional(),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Use HH:MM format")
      .nullable()
      .optional(),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Use HH:MM format")
      .nullable()
      .optional(),
    loggedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
    isBillable: z.boolean().default(true),
    aiUsed: z.boolean().default(false),
    notes: z.string().max(1000).nullable().optional(),
  })
  .refine(
    (d) => d.hours != null || (d.startTime != null && d.endTime != null),
    { message: "Provide either hours or both startTime and endTime" }
  );

export type CreateLogInput = z.infer<typeof CreateLogSchema>;

export const UpdateLogSchema = z.object({
  projectId: z.string().min(1).optional(),
  taskId: z.string().min(1).optional(),
  hours: z.number().positive().max(24).nullable().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  loggedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isBillable: z.boolean().optional(),
  aiUsed: z.boolean().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

// ── Block Report ──────────────────────────────────────────────────────────────

export const BlockReportSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  userId: z.string().optional(),
  groupBy: z.enum(["project-task", "day", "project"]).default("project-task"),
  billableFilter: z
    .enum(["all", "billable", "non-billable"])
    .default("all"),
  format: z.enum(["text", "markdown", "csv"]).default("text"),
});
