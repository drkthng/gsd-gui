import { useState } from "react";
import { FolderKanban, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { ProjectCard } from "./project-card";
import { useProjectStore } from "@/stores/project-store";
import type { ProjectDisplayInfo } from "@/lib/types";

/**
 * Project gallery — grid of project cards with search/filter.
 * Reads from project-store. Shows empty state when no projects, loading state while fetching.
 */
export function ProjectGallery() {
  const projects = useProjectStore((s) => s.projects) as ProjectDisplayInfo[];
  const isLoading = useProjectStore((s) => s.isLoading);
  const error = useProjectStore((s) => s.error);
  const selectProject = useProjectStore((s) => s.selectProject);
  const [search, setSearch] = useState("");

  if (isLoading) {
    return <LoadingState message="Fetching projects…" />;
  }

  if (error) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Error loading projects"
        description={error}
      />
    );
  }

  const filtered = search
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No projects"
        description="Create a new project or import an existing one to get started."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={(p) => selectProject(p)}
          />
        ))}
      </div>
    </div>
  );
}
