"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, DollarSign, Ban, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryData {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  billablePct: number;
  aiHours: number;
  aiPct: number;
  entryCount: number;
}

const cards = (d: SummaryData) => [
  {
    title: "Total Hours",
    value: `${d.totalHours}h`,
    sub: `${d.entryCount} entries`,
    icon: Clock,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    title: "Billable",
    value: `${d.billableHours}h`,
    sub: `${d.billablePct}% of total`,
    icon: DollarSign,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  {
    title: "Non-Billable",
    value: `${d.nonBillableHours}h`,
    sub: `${100 - d.billablePct}% of total`,
    icon: Ban,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    title: "AI Assisted",
    value: `${d.aiHours}h`,
    sub: `${d.aiPct}% of total`,
    icon: BrainCircuit,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
];

export function SummaryCards({ data }: { data: SummaryData }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards(data).map((card) => (
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
            <p className={cn("text-2xl font-bold font-mono", card.color)}>{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
