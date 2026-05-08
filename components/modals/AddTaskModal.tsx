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
import { Loader2 } from "lucide-react";

interface AddTaskModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTaskModal({ projectId, open, onOpenChange }: AddTaskModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const body: Record<string, any> = { name: fd.get("name") };
    if (fd.get("estimatedHours")) body.estimatedHours = Number(fd.get("estimatedHours"));
    if (fd.get("description")) body.description = fd.get("description");

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
      onOpenChange(false);
      router.refresh();
    }
    setLoading(false);
  }

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
