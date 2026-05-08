"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ConfirmArchiveModal } from "./ConfirmArchiveModal";
import { Loader2, Check } from "lucide-react";
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

interface User {
  _id: string;
  name: string;
  email: string;
}

interface EditTaskModalProps {
  task: Task;
  users: User[];
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskModal({
  task,
  users,
  currentUserId,
  open,
  onOpenChange,
}: EditTaskModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [assignees, setAssignees] = useState<string[]>(
    (task.assignees ?? []).map((a) => a._id)
  );

  function toggleAssignee(id: string) {
    setAssignees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const body: Record<string, any> = { name: fd.get("name") };
    body.description = fd.get("description") || null;
    body.estimatedHours = fd.get("estimatedHours")
      ? Number(fd.get("estimatedHours"))
      : null;
    body.assignees = assignees;

    const res = await fetch(`/api/tasks/${task._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setErrors(json.error?.fieldErrors ?? { _: [json.error] });
    } else {
      onOpenChange(false);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleArchive() {
    await fetch(`/api/tasks/${task._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !task.isActive }),
    });
    onOpenChange(false);
    router.refresh();
  }

  const sortedUsers = [...users].sort((a, b) => {
    if (a._id === currentUserId) return -1;
    if (b._id === currentUserId) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="et-name">Task name *</Label>
              <Input id="et-name" name="name" defaultValue={task.name} required />
              {errors.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="et-hours">Estimated hours</Label>
              <Input
                id="et-hours"
                name="estimatedHours"
                type="number"
                min="0.5"
                step="0.5"
                defaultValue={task.estimatedHours ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="et-desc">Description</Label>
              <Textarea
                id="et-desc"
                name="description"
                rows={2}
                defaultValue={task.description ?? ""}
              />
            </div>

            {sortedUsers.length > 0 && (
              <div className="space-y-1.5">
                <Label>Assign to</Label>
                <div className="border border-border rounded-md divide-y divide-border max-h-44 overflow-y-auto">
                  {sortedUsers.map((u) => (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => toggleAssignee(u._id)}
                      className="flex items-center gap-3 px-3 py-2 w-full hover:bg-muted/50 transition-colors text-left"
                    >
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                          {u.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {u.name}
                          {u._id === currentUserId && (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
                          )}
                        </p>
                      </div>
                      <div className={cn(
                        "h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                        assignees.includes(u._id)
                          ? "bg-primary border-primary"
                          : "border-border"
                      )}>
                        {assignees.includes(u._id) && (
                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {errors._ && <p className="text-sm text-destructive">{errors._[0]}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save changes
            </Button>
          </form>
          <Separator />
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive"
            onClick={() => setArchiveOpen(true)}
          >
            {task.isActive ? "Archive task" : "Restore task"}
          </Button>
        </DialogContent>
      </Dialog>

      <ConfirmArchiveModal
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={task.isActive ? "Archive task?" : "Restore task?"}
        description={
          task.isActive
            ? "This task will be hidden from new time logs."
            : "This task will be available again for time logging."
        }
        onConfirm={handleArchive}
      />
    </>
  );
}
