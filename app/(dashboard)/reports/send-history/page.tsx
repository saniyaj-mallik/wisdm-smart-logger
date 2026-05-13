import { PageHeader } from "@/components/layout/PageHeader";
import { SendHistoryClient } from "./SendHistoryClient";

export default function SendHistoryPage() {
  return (
    <div>
      <PageHeader
        title="Report Send History"
        description="Track when block reports were sent to clients and monitor upcoming due dates"
      />
      <SendHistoryClient />
    </div>
  );
}
