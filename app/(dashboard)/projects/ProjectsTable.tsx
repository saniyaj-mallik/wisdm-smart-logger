"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import {
  Plus, Search, Star, FolderKanban, Clock, CheckSquare, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Project {
  _id: string;
  name: string;
  clientName?: string | null;
  budgetHours?: number | null;
  color?: string | null;
  isActive: boolean;
  taskCount: number;
}

type StatusFilter = "all" | "active" | "archived";

// ── Favorites helpers ─────────────────────────────────────────────────────────

const FAV_KEY = "sl_favorite_projects";

function loadFavs(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]"); }
  catch { return []; }
}

function saveFavs(ids: string[]) {
  localStorage.setItem(FAV_KEY, JSON.stringify(ids));
}

// ── Project card ──────────────────────────────────────────────────────────────

function ProjectCard({
  project, isFavorite, onToggleFavorite,
}: {
  project: Project;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
}) {
  return (
    <Link href={`/projects/${project._id}`} className="block group">
      <div
        className={cn(
          "relative rounded-xl border border-border bg-card overflow-hidden",
          "border-t-[3px] hover:shadow-md transition-all duration-200 h-full",
          !project.isActive && "opacity-60"
        )}
        style={{ borderTopColor: project.color ?? "hsl(var(--border))" }}
      >
        {/* Card body */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              {project.color && (
                <span
                  className="h-2.5 w-2.5 rounded-sm shrink-0 mt-0.5"
                  style={{ backgroundColor: project.color }}
                />
              )}
              <h3 className={cn(
                "font-semibold text-[14px] leading-snug truncate group-hover:text-primary transition-colors",
                !project.color && "pl-0"
              )}>
                {project.name}
              </h3>
            </div>

            {/* Star button */}
            <button
              onClick={onToggleFavorite}
              className={cn(
                "shrink-0 p-1 rounded-md transition-colors",
                isFavorite
                  ? "text-amber-400 hover:text-amber-500"
                  : "text-muted-foreground/40 hover:text-amber-400 opacity-0 group-hover:opacity-100"
              )}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-amber-400")} />
            </button>
          </div>

          {project.clientName && (
            <p className="text-xs text-muted-foreground truncate pl-4">{project.clientName}</p>
          )}
        </div>

        {/* Card footer */}
        <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
          <span className={cn(
            "text-[11px] font-medium px-1.5 py-0.5 rounded-full",
            project.isActive
              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
              : "bg-muted text-muted-foreground"
          )}>
            {project.isActive ? "Active" : "Archived"}
          </span>

          {project.budgetHours != null && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <Clock className="h-3 w-3" />
              {project.budgetHours}h
            </span>
          )}

          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground font-medium">
            <CheckSquare className="h-3 w-3" />
            {project.taskCount} {project.taskCount === 1 ? "task" : "tasks"}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, label, count }: {
  icon: React.ElementType;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="text-sm font-semibold">{label}</h2>
      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-mono">
        {count}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProjectsGrid({ projects }: { projects: Project[] }) {
  const [createOpen, setCreateOpen]       = useState(false);
  const [favorites, setFavorites]         = useState<string[]>([]);
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>("all");

  useEffect(() => { setFavorites(loadFavs()); }, []);

  function toggleFavorite(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveFavs(next);
      return next;
    });
  }

  // Filter by search + status
  const filtered = projects.filter((p) => {
    const matchSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.clientName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.isActive) ||
      (statusFilter === "archived" && !p.isActive);
    return matchSearch && matchStatus;
  });

  const favProjects   = filtered.filter((p) => favorites.includes(p._id));
  const otherProjects = filtered.filter((p) => !favorites.includes(p._id));

  const STATUS_OPTS: { value: StatusFilter; label: string }[] = [
    { value: "all",      label: "All"      },
    { value: "active",   label: "Active"   },
    { value: "archived", label: "Archived" },
  ];

  return (
    <>
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex items-center rounded-lg border border-border overflow-hidden h-8">
          {STATUS_OPTS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                "px-3 text-xs font-medium transition-colors h-full",
                statusFilter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Count */}
        <span className="text-sm text-muted-foreground hidden sm:block">
          {filtered.length} project{filtered.length !== 1 ? "s" : ""}
        </span>

        <div className="flex-1 sm:flex-none" />

        {/* New project */}
        <Button size="sm" className="h-8 gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> New Project
        </Button>
      </div>

      {/* ── No projects at all ── */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FolderKanban className="h-6 w-6 opacity-50" />
          </div>
          <p className="text-sm font-semibold">No projects yet</p>
          <p className="text-xs mt-1 text-center max-w-xs">
            Create your first project to start tracking time and tasks.
          </p>
          <Button size="sm" className="mt-5 gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Create first project
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        /* ── No search results ── */
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
          <Search className="h-8 w-8 opacity-20 mb-3" />
          <p className="text-sm font-semibold">No projects found</p>
          <p className="text-xs mt-1">
            Try adjusting your search or filter.
          </p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Favorites section ── */}
          {favProjects.length > 0 && (
            <div>
              <SectionLabel icon={Star} label="Favorites" count={favProjects.length} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favProjects.map((p) => (
                  <ProjectCard
                    key={p._id}
                    project={p}
                    isFavorite
                    onToggleFavorite={(e) => toggleFavorite(p._id, e)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── All / remaining projects ── */}
          {otherProjects.length > 0 && (
            <div>
              {favProjects.length > 0 && (
                <SectionLabel icon={FolderKanban} label="All Projects" count={otherProjects.length} />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherProjects.map((p) => (
                  <ProjectCard
                    key={p._id}
                    project={p}
                    isFavorite={false}
                    onToggleFavorite={(e) => toggleFavorite(p._id, e)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <CreateProjectModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
