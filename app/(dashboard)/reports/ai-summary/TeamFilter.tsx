"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface TeamOption {
  _id: string;
  name: string;
}

export function TeamFilter({ teams }: { teams: TeamOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("teamId") ?? "all";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("teamId");
    } else {
      params.set("teamId", value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="h-9 w-48 text-sm">
        <SelectValue placeholder="All Teams" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Teams</SelectItem>
        {teams.map((t) => (
          <SelectItem key={t._id} value={t._id}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
