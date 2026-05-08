"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EditProjectModal } from "@/components/modals/EditProjectModal";
import { AddTaskModal } from "@/components/modals/AddTaskModal";
import { EditTaskModal } from "@/components/modals/EditTaskModal";
import { ChevronLeft, Plus, Pencil, Inbox, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Assignee {
  _id: string;
  name: string;
  email: string;
}

interface Task {
  _id: string;
  name: string;
  description?: string | null;
  estimatedHours?: number | null;
  assignees: Assignee[];
  isActive: boolean;
}

interface Project {
  _id: string;
  name: string;
  clientName?: string | null;
  description?: string | null;
  budgetHours?: number | null;
  color?: string | null;
  isActive: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export function ProjectDetail({
  project,
  tasks,
  users,
  currentUserId,
}: {
  project: Project;
  tasks: Task[];
  users: User[];
  currentUserId: string;
}) {
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const activeTasks = tasks.filter((t) => t.isActive);
  const archivedTasks = tasks.filter((t) => !t.isActive);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        All Projects
      </Link>

      {/* Project header */}
      <div className="flex items-start gap-3">
        {project.color && (
          <span
            className="mt-2 h-3 w-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: project.color }}
          />
        )}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => setEditProjectOpen(true)}
            className="group flex items-center gap-2 text-left"
          >
            <h1 className="text-2xl font-semibold tracking-tight group-hover:text-primary transition-colors">
              {project.name}
            </h1>
            <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
          </button>

          <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-muted-foreground">
            {project.clientName && <span>Client: {project.clientName}</span>}
            {project.budgetHours && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {project.budgetHours}h budget
              </span>
            )}
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              project.isActive
                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                : "bg-muted text-muted-foreground"
            )}>
              {project.isActive ? "Active" : "Archived"}
            </span>
          </div>

          {project.description && (
            <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
          )}
        </div>
      </div>

      {/* Tasks section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">
            Tasks
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {activeTasks.length} active
            </span>
          </h2>
          <Button size="sm" onClick={() => setAddTaskOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Task
          </Button>
        </div>

        {tasks.length === 0 ? (
          <div className="border border-border rounded-lg py-16 flex flex-col items-center gap-2 text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p className="text-sm">No tasks yet</p>
            <Button size="sm" variant="outline" onClick={() => setAddTaskOpen(true)}>
              Add first task
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {activeTasks.map((task) => (
              <TaskCard key={task._id} task={task} onEdit={() => setEditingTask(task)} />
            ))}
            {archivedTasks.length > 0 && (
              <>
                <p className="text-xs font-medium text-muted-foreground pt-3 pb-1">Archived</p>
                {archivedTasks.map((task) => (
                  <TaskCard key={task._id} task={task} onEdit={() => setEditingTask(task)} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <EditProjectModal
        project={project}
        open={editProjectOpen}
        onOpenChange={setEditProjectOpen}
      />
      <AddTaskModal
        projectId={project._id}
        users={users}
        currentUserId={currentUserId}
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
      />
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          users={users}
          currentUserId={currentUserId}
          open={!!editingTask}
          onOpenChange={(o) => !o && setEditingTask(null)}
        />
      )}
    </div>
  );
}

function TaskCard({ task, onEdit }: { task: Task; onEdit: () => void }) {
  return (
    <div className={cn(
      "group flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:shadow-sm transition-shadow",
      !task.isActive && "opacity-55"
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{task.name}</span>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {task.estimatedHours != null && (
            <span className="text-xs text-muted-foreground font-mono">{task.estimatedHours}h est.</span>
          )}
          {task.assignees.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {task.assignees.slice(0, 5).map((a) => (
                  <Avatar key={a._id} className="h-5 w-5 border-2 border-background">
                    <AvatarFallback className="text-[9px] bg-primary/15 text-primary font-semibold">
                      {a.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {task.assignees.length > 5 && (
                <span className="text-xs text-muted-foreground">+{task.assignees.length - 5}</span>
              )}
            </div>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
        onClick={onEdit}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
