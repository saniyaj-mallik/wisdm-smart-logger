"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Inbox } from "lucide-react";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { cn } from "@/lib/utils";

interface Project {
  _id: string;
  name: string;
  clientName?: string | null;
  budgetHours?: number | null;
  color?: string | null;
  isActive: boolean;
  taskCount: number;
}

export function ProjectsGrid({ projects }: { projects: Project[] }) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
          <Inbox className="h-10 w-10" />
          <p className="text-sm">No projects yet</p>
          <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
            Create first project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link key={p._id} href={`/projects/${p._id}`} className="block">
              <div
                className={cn(
                  "rounded-lg border border-border bg-card p-5 h-full hover:shadow-md transition-all cursor-pointer group",
                  p.color ? "border-l-4" : "",
                  !p.isActive && "opacity-60"
                )}
                style={p.color ? { borderLeftColor: p.color } : {}}
              >
                <div className="flex items-start gap-2.5 mb-2">
                  {p.color && (
                    <span
                      className="mt-[5px] h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                  )}
                  <h3 className="font-semibold text-[15px] leading-snug group-hover:text-primary transition-colors">
                    {p.name}
                  </h3>
                </div>

                {p.clientName && (
                  <p className="text-sm text-muted-foreground mb-3 pl-5">{p.clientName}</p>
                )}

                <div className={cn("flex items-center gap-2 text-xs flex-wrap mt-3", p.clientName ? "" : "pl-5")}>
                  {p.budgetHours && (
                    <span className="font-mono text-muted-foreground">{p.budgetHours}h</span>
                  )}
                  <span className={cn(
                    "px-2 py-0.5 rounded-full font-medium",
                    p.isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {p.isActive ? "Active" : "Archived"}
                  </span>
                  <span className="ml-auto text-muted-foreground">
                    {p.taskCount} {p.taskCount === 1 ? "task" : "tasks"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
