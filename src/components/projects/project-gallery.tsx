import { useEffect, useState } from "react";
import { FolderKanban, FolderOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { ProjectCard } from "./project-card";
import { useProjectStore } from "@/stores/project-store";

/** Safely open a native folder picker. Falls back to prompt() in browser mode. */
async function openDirectoryPicker(): Promise<string | null> {
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select a GSD project folder",
    });
    return selected as string | null;
  } catch {
    // Not running in Tauri — fall back to a browser prompt
    const path = window.prompt("Enter project folder path:");
    return path || null;
  }
}

/**
 * Project gallery — grid of project cards with search/filter.
 * Reads from persistent project registry via project-store.
 */
export function ProjectGallery() {
  const projects = useProjectStore((s) => s.projects);
  const isLoading = useProjectStore((s) => s.isLoading);
  const error = useProjectStore((s) => s.error);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const addProject = useProjectStore((s) => s.addProject);
  const removeProject = useProjectStore((s) => s.removeProject);
  const selectProject = useProjectStore((s) => s.selectProject);
  const [search, setSearch] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleImportProject = async () => {
    setImportError(null);
    try {
      const selected = await openDirectoryPicker();
      if (selected) {
        await addProject(selected);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setImportError(msg);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading projects…" />;
  }

  if (error && projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Error loading projects"
        description={error}
      />
    );
  }

  const filtered = search
    ? projects.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      )
    : projects;

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <EmptyState
          icon={FolderKanban}
          title="No projects"
          description="Import an existing GSD project to get started."
        />
        <Button onClick={handleImportProject}>
          <FolderOpen className="mr-2 h-4 w-4" />
          Import Project
        </Button>
        {importError && (
          <p className="text-sm text-destructive">{importError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleImportProject}>
          <FolderOpen className="mr-1 h-4 w-4" />
          Import
        </Button>
      </div>
      {importError && (
        <p className="text-sm text-destructive">{importError}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => selectProject(project)}
            onRemove={() => removeProject(project.id)}
          />
        ))}
      </div>
    </div>
  );
}
