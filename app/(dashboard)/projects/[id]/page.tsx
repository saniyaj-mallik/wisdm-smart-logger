import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import Task from "@/models/Task";
import User from "@/models/User";
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

  const [tasks, users] = await Promise.all([
    Task.find({ projectId: params.id })
      .sort({ isActive: -1, name: 1 })
      .populate("assignees", "name email")
      .lean(),
    User.find({ isActive: true }).select("name email role").sort({ name: 1 }).lean(),
  ]);

  // Normalize tasks so assignees is always an array (existing tasks predate the field)
  const normalizedTasks = tasks.map((t: any) => ({
    ...t,
    assignees: t.assignees ?? [],
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
