import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { BlockGeneratorClient } from "./BlockGeneratorClient";
import { getWeekRange } from "@/lib/time-utils";

export default async function BlockGeneratorPage() {
  const session = await auth();
  const isManagerOrAdmin =
    session?.user?.role === "manager" || session?.user?.role === "admin";

  const { from, to } = getWeekRange();

  return (
    <div>
      <PageHeader
        title="Block Report Generator"
        description="Generate a formatted summary ready to paste into Slack, email, or Jira"
      />
      <BlockGeneratorClient
        defaultFrom={from.toISOString().slice(0, 10)}
        defaultTo={to.toISOString().slice(0, 10)}
        isManagerOrAdmin={isManagerOrAdmin}
      />
    </div>
  );
}
