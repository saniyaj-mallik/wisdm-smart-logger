"use client";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserRow {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  totalHours: number;
  billableHours: number;
  aiHours: number;
  entryCount: number;
}

const roleBadgeClass: Record<string, string> = {
  dev: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0",
  sme: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-0",
  manager: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0",
  admin: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-0",
};

export function TeamOverviewTable({ rows }: { rows: UserRow[] }) {
  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Billable</TableHead>
            <TableHead>AI Hours</TableHead>
            <TableHead>Entries</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Inbox className="h-7 w-7" />
                  <p className="text-sm">No data for this period</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={String(row.userId)}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{row.userName}</p>
                    <p className="text-xs text-muted-foreground">{row.userEmail}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", roleBadgeClass[row.userRole] ?? "")}
                  >
                    {row.userRole}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{row.totalHours}h</TableCell>
                <TableCell className="font-mono text-sm">{row.billableHours}h</TableCell>
                <TableCell className="font-mono text-sm">{row.aiHours}h</TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.entryCount}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
