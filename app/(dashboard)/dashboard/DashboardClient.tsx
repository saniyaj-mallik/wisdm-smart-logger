"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Pencil, Trash2, Inbox, BrainCircuit, DollarSign, Ban } from "lucide-react";
import { LogTimeModal } from "@/components/modals/LogTimeModal";
import { EditLogModal } from "@/components/modals/EditLogModal";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import { formatDate } from "@/lib/time-utils";
import { cn } from "@/lib/utils";

interface Stats {
  totalHours: number;
  billableHrs: number;
  nonBillable: number;
  aiCount: number;
}

interface LogEntry {
  _id: string;
  hours: number | null;
  loggedAt: string;
  isBillable: boolean;
  aiUsed: boolean;
  notes: string | null;
  startTime: string | null;
  endTime: string | null;
  projectId: { _id: string; name: string };
  taskId: { _id: string; name: string };
}

const statCards = (stats: Stats) => [
  {
    title: "This Week",
    value: `${stats.totalHours}h`,
    icon: Clock,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    title: "Billable",
    value: `${stats.billableHrs}h`,
    icon: DollarSign,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  {
    title: "Non-Billable",
    value: `${stats.nonBillable}h`,
    icon: Ban,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    title: "AI Assisted",
    value: `${stats.aiCount} logs`,
    icon: BrainCircuit,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
];

export function DashboardClient({
  stats,
  recentEntries,
}: {
  stats: Stats;
  recentEntries: LogEntry[];
}) {
  const router = useRouter();
  const [logOpen, setLogOpen] = useState(false);
  const [editing, setEditing] = useState<LogEntry | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function onMutated() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards(stats).map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={cn("rounded-md p-1.5", card.bg)}>
                <card.icon className={cn("h-3.5 w-3.5", card.color)} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className={cn("text-2xl font-bold", card.color)}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent logs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Recent Logs</h2>
          <Button size="sm" onClick={() => setLogOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Log Time
          </Button>
        </div>

        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Inbox className="h-7 w-7" />
                      <p className="text-sm">No logs yet — start by logging your time</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                recentEntries.map((entry) => (
                  <TableRow key={entry._id} className="group">
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(entry.loggedAt)}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {entry.projectId?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.taskId?.name ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {entry.hours != null ? `${entry.hours}h` : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {entry.isBillable ? (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-300 dark:border-green-700">
                            Billable
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Non-bill
                          </Badge>
                        )}
                        {entry.aiUsed && (
                          <Badge variant="outline" className="text-xs text-purple-600 border-purple-300 dark:border-purple-700">
                            AI
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditing(entry)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleting(entry._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <LogTimeModal open={logOpen} onOpenChange={setLogOpen} onSuccess={onMutated} />
      {editing && (
        <EditLogModal
          entry={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          onSuccess={onMutated}
        />
      )}
      {deleting && (
        <ConfirmDeleteModal
          entryId={deleting}
          open={!!deleting}
          onOpenChange={(o) => !o && setDeleting(null)}
          onSuccess={onMutated}
        />
      )}
    </div>
  );
}
