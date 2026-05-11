import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { BlockGeneratorWizard } from "./BlockGeneratorWizard";

export default async function BlockGeneratorPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  return (
    <div>
      <PageHeader
        title="Block Report Generator"
        description="Generate a formatted time report ready to download or share"
      />
      <BlockGeneratorWizard userId={userId} />
    </div>
  );
}
