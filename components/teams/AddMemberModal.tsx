"use client";
import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserOption {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  leaderId: { _id: string; name: string; email: string; role: string };
  memberIds: { _id: string; name: string; email: string; role: string }[];
}

interface Props {
  teamId: string;
  currentMemberIds: string[];
  leaderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (team: Team) => void;
}

const roleBadgeClass: Record<string, string> = {
  dev: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0",
  sme: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-0",
  manager: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0",
  admin: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-0",
};

export function AddMemberModal({ teamId, currentMemberIds, leaderId, open, onOpenChange, onAdded }: Props) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        const excluded = new Set([...currentMemberIds, leaderId]);
        setUsers((data as UserOption[]).filter((u) => !excluded.has(u._id) && u.role !== undefined));
      })
      .finally(() => setLoading(false));
  }, [open, currentMemberIds, leaderId]);

  async function handleAdd(userId: string) {
    setAdding(userId);
    setError("");
    const res = await fetch(`/api/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Something went wrong");
    } else {
      onAdded(json);
      onOpenChange(false);
    }
    setAdding(null);
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading users...
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {users.length === 0 ? "All users are already in this team" : "No users match your search"}
              </p>
            ) : (
              filtered.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-2.5 rounded-md hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", roleBadgeClass[user.role] ?? "")}
                    >
                      {user.role}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      disabled={adding === user._id}
                      onClick={() => handleAdd(user._id)}
                    >
                      {adding === user._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
