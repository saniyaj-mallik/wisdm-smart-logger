import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import Task from "@/models/Task";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectsGrid } from "./ProjectsTable";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session) return null;

  await connectDB();
  const [projects, taskCounts] = await Promise.all([
    Project.find({}).sort({ name: 1 }).lean(),
    Task.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$projectId", count: { $sum: 1 } } },
    ]),
  ]);

  const countMap = new Map(
    taskCounts.map((tc: { _id: unknown; count: number }) => [String(tc._id), tc.count])
  );
  const projectsWithCount = projects.map((p) => ({
    ...p,
    taskCount: countMap.get(String(p._id)) ?? 0,
  }));

  return (
    <div>
      <PageHeader title="Projects" description="All projects and their tasks" />
      <ProjectsGrid projects={JSON.parse(JSON.stringify(projectsWithCount))} />
    </div>
  );
}
