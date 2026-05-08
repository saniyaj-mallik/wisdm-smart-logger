"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, ExternalLink, Inbox } from "lucide-react";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { EditProjectModal } from "@/components/modals/EditProjectModal";
import { cn } from "@/lib/utils";

interface Project {
  _id: string;
  name: string;
  clientName?: string | null;
  budgetHours?: number | null;
  color?: string | null;
  isActive: boolean;
  createdAt: string;
}

export function ProjectsTable({ projects, isAdmin }: { projects: Project[]; isAdmin: boolean }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  return (
    <>
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> New Project
          </Button>
        </div>
      )}

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Inbox className="h-8 w-8" />
                    <p className="text-sm">No projects yet</p>
                    {isAdmin && (
                      <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
                        Create first project
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              projects.map((p) => (
                <TableRow key={p._id} className="group">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {p.color && (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                      )}
                      {p.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {p.clientName ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {p.budgetHours ? `${p.budgetHours}h` : "—"}
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      p.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {p.isActive ? "Active" : "Archived"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/projects/${p._id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateProjectModal open={createOpen} onOpenChange={setCreateOpen} />
      {editing && (
        <EditProjectModal project={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
      )}
    </>
  );
}
