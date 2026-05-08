"use client";
import { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Plus, Inbox } from "lucide-react";
import { EditProjectModal } from "@/components/modals/EditProjectModal";
import { AddTaskModal } from "@/components/modals/AddTaskModal";
import { EditTaskModal } from "@/components/modals/EditTaskModal";
import { cn } from "@/lib/utils";

interface Project {
  _id: string;
  name: string;
  clientName?: string | null;
  description?: string | null;
  budgetHours?: number | null;
  isActive: boolean;
}
interface Task {
  _id: string;
  name: string;
  description?: string | null;
  estimatedHours?: number | null;
  isActive: boolean;
}

export function ProjectDetail({
  project,
  tasks,
  isAdmin,
}: {
  project: Project;
  tasks: Task[];
  isAdmin: boolean;
}) {
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  return (
    <div className="space-y-6">
      {/* Project info card */}
      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Client</p>
              <p className="font-medium">{project.clientName ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Budget</p>
              <p className="font-mono font-medium">{project.budgetHours ? `${project.budgetHours}h` : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Status</p>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                project.isActive
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  : "bg-muted text-muted-foreground"
              )}>
                {project.isActive ? "Active" : "Archived"}
              </span>
            </div>
            {isAdmin && (
              <div className="flex items-end">
                <Button size="sm" variant="outline" onClick={() => setEditProjectOpen(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit project
                </Button>
              </div>
            )}
          </div>
          {project.description && (
            <p className="mt-3 text-sm text-muted-foreground">{project.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Tasks</h2>
          {isAdmin && (
            <Button size="sm" onClick={() => setAddTaskOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Task
            </Button>
          )}
        </div>
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Estimated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Inbox className="h-7 w-7" />
                      <p className="text-sm">No tasks yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((t) => (
                  <TableRow key={t._id} className="group">
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {t.estimatedHours ? `${t.estimatedHours}h` : "—"}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        t.isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {t.isActive ? "Active" : "Archived"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setEditingTask(t)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <EditProjectModal project={project} open={editProjectOpen} onOpenChange={setEditProjectOpen} />
      <AddTaskModal projectId={project._id} open={addTaskOpen} onOpenChange={setAddTaskOpen} />
      {editingTask && (
        <EditTaskModal task={editingTask} open={!!editingTask} onOpenChange={(o) => !o && setEditingTask(null)} />
      )}
    </div>
  );
}
