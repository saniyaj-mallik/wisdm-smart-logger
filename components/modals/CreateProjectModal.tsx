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
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PROJECT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#6366f1", "#a855f7",
  "#ec4899", "#6b7280",
];

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectModal({ open, onOpenChange }: CreateProjectModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [color, setColor] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const body: Record<string, any> = {
      name: fd.get("name"),
    };
    if (fd.get("clientName")) body.clientName = fd.get("clientName");
    if (fd.get("description")) body.description = fd.get("description");
    if (fd.get("budgetHours")) body.budgetHours = Number(fd.get("budgetHours"));
    if (color) body.color = color;

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setErrors(json.error?.fieldErrors ?? { _: [json.error] });
    } else {
      setColor(null);
      onOpenChange(false);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="cp-name">Project name *</Label>
            <Input id="cp-name" name="name" required />
            {errors.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-client">Client name</Label>
            <Input id="cp-client" name="clientName" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-budget">Budget hours</Label>
            <Input id="cp-budget" name="budgetHours" type="number" min="1" step="0.5" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-desc">Description</Label>
            <Textarea id="cp-desc" name="description" rows={2} />
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
            Create project
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
