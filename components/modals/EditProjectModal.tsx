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
import { ConfirmArchiveModal } from "./ConfirmArchiveModal";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PROJECT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#6366f1", "#a855f7",
  "#ec4899", "#6b7280",
];

interface Project {
  _id: string;
  name: string;
  clientName?: string | null;
  description?: string | null;
  budgetHours?: number | null;
  color?: string | null;
  isActive: boolean;
}

interface EditProjectModalProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProjectModal({ project, open, onOpenChange }: EditProjectModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [color, setColor] = useState<string | null>(project.color ?? null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const body: Record<string, any> = { name: fd.get("name") };
    body.clientName = fd.get("clientName") || null;
    body.description = fd.get("description") || null;
    body.budgetHours = fd.get("budgetHours") ? Number(fd.get("budgetHours")) : null;
    body.color = color ?? null;

    const res = await fetch(`/api/projects/${project._id}`, {
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
    await fetch(`/api/projects/${project._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !project.isActive }),
    });
    onOpenChange(false);
    router.refresh();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="ep-name">Project name *</Label>
              <Input id="ep-name" name="name" defaultValue={project.name} required />
              {errors.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ep-client">Client name</Label>
              <Input id="ep-client" name="clientName" defaultValue={project.clientName ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ep-budget">Budget hours</Label>
              <Input id="ep-budget" name="budgetHours" type="number" min="1" step="0.5" defaultValue={project.budgetHours ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ep-desc">Description</Label>
              <Textarea id="ep-desc" name="description" rows={2} defaultValue={project.description ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Project color</Label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(color === c ? null : c)}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110",
                      color === c ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>
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
            {project.isActive ? "Archive project" : "Restore project"}
          </Button>
        </DialogContent>
      </Dialog>

      <ConfirmArchiveModal
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={project.isActive ? "Archive project?" : "Restore project?"}
        description={
          project.isActive
            ? "Archived projects won't appear in time logging. Existing logs are kept."
            : "This will make the project active and available for time logging again."
        }
        onConfirm={handleArchive}
      />
    </>
  );
}
