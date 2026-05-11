import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import Task from "@/models/Task";
import User from "@/models/User";
import TimeEntry from "@/models/TimeEntry";
import { ProjectDetail } from "./ProjectDetail";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) return null;

  await connectDB();
  const project = await Project.findById(params.id).lean();
  if (!project) notFound();

  const [tasks, users, hoursAgg] = await Promise.all([
    Task.find({ projectId: params.id })
      .sort({ isActive: -1, name: 1 })
      .populate("assignees", "name email")
      .lean(),
    User.find({ isActive: true }).select("name email role").sort({ name: 1 }).lean(),
    TimeEntry.aggregate([
      { $match: { projectId: (project as any)._id } },
      { $group: { _id: "$taskId", hoursSpent: { $sum: "$hours" } } },
    ]),
  ]);

  const hoursMap: Record<string, number> = {};
  for (const row of hoursAgg) {
    hoursMap[String(row._id)] = Math.round((row.hoursSpent ?? 0) * 100) / 100;
  }

  const normalizedTasks = tasks.map((t: any) => ({
    ...t,
    assignees: t.assignees ?? [],
    hoursSpent: hoursMap[String(t._id)] ?? 0,
  }));

  return (
    <ProjectDetail
      project={JSON.parse(JSON.stringify(project))}
      tasks={JSON.parse(JSON.stringify(normalizedTasks))}
      users={JSON.parse(JSON.stringify(users))}
      currentUserId={session.user.id}
    />
  );
}
