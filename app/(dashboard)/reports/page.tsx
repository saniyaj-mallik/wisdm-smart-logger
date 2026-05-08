import { redirect } from "next/navigation";
import { getWeekRange } from "@/lib/time-utils";

export default function ReportsPage() {
  const { from, to } = getWeekRange();
  redirect(`/reports/summary?from=${from.toISOString().slice(0, 10)}&to=${to.toISOString().slice(0, 10)}`);
}
