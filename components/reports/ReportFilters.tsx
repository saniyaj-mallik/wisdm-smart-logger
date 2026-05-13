"use client";
import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function getThisWeek() {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    from: mon.toISOString().slice(0, 10),
    to: sun.toISOString().slice(0, 10),
  };
}

function getLastWeek() {
  const tw = getThisWeek();
  const from = new Date(tw.from);
  from.setDate(from.getDate() - 7);
  const to = new Date(from);
  to.setDate(from.getDate() + 6);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function getThisMonth() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function getLastMonth() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

const PRESETS = [
  { label: "This Week", fn: getThisWeek },
  { label: "Last Week", fn: getLastWeek },
  { label: "This Month", fn: getThisMonth },
  { label: "Last Month", fn: getLastMonth },
];

export interface UserOption {
  id: string;
  name: string;
  email: string;
}

export function ReportFilters({
  defaultFrom,
  defaultTo,
  users,
  selectedUserId,
  currentUserId,
  children,
}: {
  defaultFrom: string;
  defaultTo: string;
  users?: UserOption[];
  selectedUserId?: string;
  currentUserId?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  function apply(f: string, t: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", f);
    params.set("to", t);
    router.push(`${pathname}?${params.toString()}`);
  }

  function applyUser(uid: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (uid === currentUserId) {
      params.delete("userId");
    } else {
      params.set("userId", uid);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 pb-4 border-b border-border mb-6">
      <div className="flex flex-wrap gap-3">
        {users && users.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs">User</Label>
            <Select
              value={selectedUserId ?? currentUserId ?? ""}
              onValueChange={applyUser}
            >
              <SelectTrigger className="h-8 text-sm w-44">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                    {u.id === currentUserId ? " (You)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 text-sm w-36"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 text-sm w-36"
          />
        </div>
        <div className="flex items-end">
          <Button size="sm" onClick={() => apply(from, to)}>
            Apply
          </Button>
        </div>
      </div>

      <div className="flex gap-1 ml-auto flex-wrap items-center">
        {children}
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => {
              const { from: f, to: t } = p.fn();
              setFrom(f);
              setTo(t);
              apply(f, t);
            }}
          >
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
