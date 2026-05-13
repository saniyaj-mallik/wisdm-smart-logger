import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import CustomField from "@/models/CustomField";
import TimeEntry from "@/models/TimeEntry";
import { PageHeader } from "@/components/layout/PageHeader";
import { CustomFieldsClient } from "./CustomFieldsClient";
import type { FieldStat } from "./CustomFieldsClient";

export default async function CustomFieldsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  await connectDB();

  const [fields, statsRaw, totalEntries] = await Promise.all([
    CustomField.find({}).sort({ createdAt: 1 }).lean(),
    TimeEntry.aggregate([
      { $unwind: "$customFields" },
      {
        $group: {
          _id: "$customFields.fieldId",
          count: { $sum: 1 },
          values: { $push: "$customFields.value" },
        },
      },
    ]),
    TimeEntry.countDocuments(),
  ]);

  const statsMap = new Map(statsRaw.map((s) => [s._id.toString(), s]));

  const fieldStats: FieldStat[] = fields.map((f) => {
    const id = f._id.toString();
    const raw = statsMap.get(id);
    if (!raw) return { fieldId: id, count: 0, totalEntries, details: {} };

    const { count, values } = raw;
    let details: FieldStat["details"] = {};

    if (f.type === "number") {
      const nums = (values as unknown[]).filter((v) => typeof v === "number") as number[];
      const sum = nums.reduce((a, b) => a + b, 0);
      details = {
        sum: Math.round(sum * 100) / 100,
        avg: nums.length ? Math.round((sum / nums.length) * 100) / 100 : 0,
        min: nums.length ? Math.min(...nums) : 0,
        max: nums.length ? Math.max(...nums) : 0,
      };
    } else if (f.type === "text") {
      const freq: Record<string, number> = {};
      for (const v of values as unknown[]) {
        if (typeof v === "string" && v.trim()) {
          freq[v.trim()] = (freq[v.trim()] ?? 0) + 1;
        }
      }
      details = {
        topValues: Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([value, c]) => ({ value, count: c })),
      };
    }

    return { fieldId: id, count, totalEntries, details };
  });

  return (
    <div>
      <PageHeader
        title="Custom Fields"
        description="Define extra fields users can fill in when logging time"
      />
      <CustomFieldsClient
        fields={JSON.parse(JSON.stringify(fields))}
        stats={fieldStats}
      />
    </div>
  );
}
