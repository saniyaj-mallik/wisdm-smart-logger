"use client";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Inbox } from "lucide-react";

interface ProjectRow {
  projectId: string;
  projectName: string;
  clientName: string | null;
  totalHours: number;
  billableHours: number;
  billablePct: number;
  entryCount: number;
}

export function ProjectBreakdownTable({
  rows,
  from,
  to,
  linkable = false,
}: {
  rows: ProjectRow[];
  from?: string;
  to?: string;
  linkable?: boolean;
}) {
  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Billable</TableHead>
            <TableHead>Billable %</TableHead>
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
              <TableRow key={String(row.projectId)} className="group">
                <TableCell className="font-medium text-sm">
                  {linkable ? (
                    <Link
                      href={`/reports/projects/${row.projectId}?from=${from}&to=${to}`}
                      className="hover:underline text-primary"
                    >
                      {row.projectName}
                    </Link>
                  ) : (
                    row.projectName
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.clientName ?? "—"}
                </TableCell>
                <TableCell className="font-mono text-sm">{row.totalHours}h</TableCell>
                <TableCell className="font-mono text-sm">{row.billableHours}h</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${row.billablePct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {row.billablePct}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.entryCount}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
