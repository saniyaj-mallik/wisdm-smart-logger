import { connectDB } from "../lib/mongodb";
import Project from "../models/Project";
import Task from "../models/Task";

const data = [
  {
    project: { name: "upep.mx", clientName: "UPEP", budgetHours: 500 },
    tasks: ["Discovery & Planning", "UI Design", "Frontend Development", "Backend Development", "QA Testing", "Deployment"],
  },
  {
    project: { name: "two-lines-press", clientName: "Two Lines Press", budgetHours: 200 },
    tasks: ["Content Migration", "Theme Customisation", "Plugin Integration", "QA & Launch"],
  },
  {
    project: { name: "wisdmlabs-internal", clientName: null, budgetHours: null },
    tasks: ["Sprint Planning", "Knowledge Base", "Recruitment", "Team Meetings", "R&D"],
  },
  {
    project: { name: "ldgr-plugin", clientName: "WisdmLabs", budgetHours: 300 },
    tasks: ["Feature Development", "Bug Fixes", "Documentation", "Code Review", "Release"],
  },
];

async function seed() {
  await connectDB();
  for (const { project, tasks } of data) {
    const p = await Project.findOneAndUpdate(
      { name: project.name },
      { ...project, isActive: true },
      { upsert: true, new: true }
    );
    for (const name of tasks) {
      await Task.findOneAndUpdate(
        { projectId: p._id, name },
        { projectId: p._id, name, isActive: true },
        { upsert: true }
      );
    }
    console.log(`  ✓ ${project.name} (${tasks.length} tasks)`);
  }
  console.log("Seed complete");
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
