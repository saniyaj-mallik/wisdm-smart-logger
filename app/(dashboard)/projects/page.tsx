import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectsTable } from "./ProjectsTable";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session) return null;

  await connectDB();
  const projects = await Project.find({}).sort({ name: 1 }).lean();

  return (
    <div>
      <PageHeader
        title="Projects"
        description="All projects and their tasks"
      />
      <ProjectsTable
        projects={JSON.parse(JSON.stringify(projects))}
        isAdmin={true}
      />
    </div>
  );
}
