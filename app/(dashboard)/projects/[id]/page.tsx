import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import Task from "@/models/Task";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectDetail } from "./ProjectDetail";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  await connectDB();
  const project = await Project.findById(params.id).lean();
  if (!project) notFound();

  const tasks = await Task.find({ projectId: params.id })
    .sort({ isActive: -1, name: 1 })
    .lean();

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.clientName ? `Client: ${project.clientName}` : undefined}
      />
      <ProjectDetail
        project={JSON.parse(JSON.stringify(project))}
        tasks={JSON.parse(JSON.stringify(tasks))}
        isAdmin={isAdmin}
      />
    </div>
  );
}
