"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    if (fd.get("name")) body.name = fd.get("name") as string;
    if (fd.get("newPassword")) {
      body.currentPassword = fd.get("currentPassword") as string;
      body.newPassword = fd.get("newPassword") as string;
    }
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setErrors(json.error?.fieldErrors ?? { _: [json.error] });
    } else {
      setSuccess(true);
      await update();
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div>
      <PageHeader title="Profile" description="Update your account details" />
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Account settings</CardTitle>
          <CardDescription>
            Email:{" "}
            <span className="font-medium text-foreground">
              {session?.user?.email}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={session?.user?.name ?? ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
              />
              {errors.currentPassword && (
                <p className="text-xs text-destructive">
                  {errors.currentPassword[0]}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                minLength={8}
              />
              {errors.newPassword && (
                <p className="text-xs text-destructive">
                  {errors.newPassword[0]}
                </p>
              )}
            </div>
            {errors._ && (
              <p className="text-sm text-destructive">{errors._[0]}</p>
            )}
            {success && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Profile updated successfully
              </p>
            )}
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
