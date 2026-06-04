"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, User, Lock, Mail, Pencil, X } from "lucide-react";

const ROLE_STYLES: Record<string, string> = {
  admin:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  manager: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  sme:     "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  dev:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const AVATAR_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-blue-600",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getGradient(name: string) {
  return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];
}

export function AccountCard() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const name  = session?.user?.name  ?? "";
  const email = session?.user?.email ?? "";
  const role  = session?.user?.role  ?? "dev";

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");
    const newName = (new FormData(e.currentTarget).get("name") as string).trim();
    if (!newName) { setError("Name cannot be empty"); setLoading(false); return; }

    const res  = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error?.fieldErrors?.name?.[0] ?? "Something went wrong");
    } else {
      setSuccess(true);
      await update({ name: newName });
      router.refresh();
      setTimeout(() => { setSuccess(false); setEditing(false); }, 1800);
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
          <User className="h-3.5 w-3.5" />
          Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Avatar + identity */}
        <div className="flex items-center gap-4">
          <div
            className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${getGradient(name)} flex items-center justify-center flex-shrink-0 shadow-sm`}
          >
            <span className="text-xl font-bold text-white select-none">
              {getInitials(name)}
            </span>
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-semibold text-sm leading-tight truncate">{name}</p>
            <div className="flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
            <span
              className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_STYLES[role] ?? ROLE_STYLES.dev}`}
            >
              {role}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Display name edit */}
        {!editing ? (
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Display name</p>
              <p className="text-sm font-medium truncate">{name}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0 h-8 gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">
                Display name
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={name}
                autoFocus
                className="h-9"
              />
            </div>
            {error   && <p className="text-xs text-destructive">{error}</p>}
            {success && <p className="text-xs text-green-600 dark:text-green-400">Name updated ✓</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={loading} className="h-8">
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={() => { setEditing(false); setError(""); }}
                disabled={loading}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export function SecurityCard() {
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [errors,  setErrors]    = useState<Record<string, string[]>>({});
  const formRef = { current: null as HTMLFormElement | null };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setErrors({});
    const fd              = new FormData(e.currentTarget);
    const currentPassword = fd.get("currentPassword") as string;
    const newPassword     = fd.get("newPassword")     as string;

    const res  = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const json = await res.json();
    if (!res.ok) {
      setErrors(json.error?.fieldErrors ?? { _: [json.error ?? "Something went wrong"] });
    } else {
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setSuccess(false), 3500);
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
          <Lock className="h-3.5 w-3.5" />
          Security
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword" className="text-xs">
              Current password
            </Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              placeholder="••••••••"
              className="h-9"
            />
            {errors.currentPassword && (
              <p className="text-xs text-destructive">{errors.currentPassword[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="text-xs">
              New password
            </Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="Min 8 characters"
              minLength={8}
              className="h-9"
            />
            {errors.newPassword && (
              <p className="text-xs text-destructive">{errors.newPassword[0]}</p>
            )}
          </div>

          {errors._ && (
            <p className="text-xs text-destructive">{errors._[0]}</p>
          )}
          {success && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Password updated successfully ✓
            </p>
          )}

          <Button type="submit" size="sm" disabled={loading} className="h-8">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
