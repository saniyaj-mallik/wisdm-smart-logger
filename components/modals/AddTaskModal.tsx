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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AddTaskModalProps {
  projectId: string;
  users: User[];
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTaskModal({
  projectId,
  users,
  currentUserId,
  open,
  onOpenChange,
}: AddTaskModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [assignees, setAssignees] = useState<string[]>([]);

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
    if (fd.get("estimatedHours")) body.estimatedHours = Number(fd.get("estimatedHours"));
    if (fd.get("description")) body.description = fd.get("description");
    body.assignees = assignees;

    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setErrors(json.error?.fieldErrors ?? { _: [json.error] });
    } else {
      (e.target as HTMLFormElement).reset();
      setAssignees([]);
      onOpenChange(false);
      router.refresh();
    }
    setLoading(false);
  }

  const sortedUsers = [...users].sort((a, b) => {
    if (a._id === currentUserId) return -1;
    if (b._id === currentUserId) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="at-name">Task name *</Label>
            <Input id="at-name" name="name" required />
            {errors.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="at-hours">Estimated hours</Label>
            <Input id="at-hours" name="estimatedHours" type="number" min="0.5" step="0.5" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="at-desc">Description</Label>
            <Textarea id="at-desc" name="description" rows={2} />
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
            Add task
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
