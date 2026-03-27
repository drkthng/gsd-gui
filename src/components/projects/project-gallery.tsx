import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, FolderOpen, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { ProjectCard } from "./project-card";
import { NewProjectWizard } from "./new-project-wizard";
import { useProjectStore } from "@/stores/project-store";
import { useImportDetection } from "@/hooks/use-import-detection";
import { createGsdClient } from "@/services/gsd-client";
import type { WizardFormData } from "./new-project-wizard";

const client = createGsdClient();

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
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardInitialData, setWizardInitialData] = useState<Partial<WizardFormData>>({});
  const [wizardMode, setWizardMode] = useState<"new" | "import">("new");

  const importDetection = useImportDetection();

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleNewProject = () => {
    setWizardMode("new");
    setWizardInitialData({});
    setWizardOpen(true);
  };

  const handleImportProject = async () => {
    setImportError(null);
    try {
      const selected = await openDirectoryPicker();
      if (!selected) return;

      // Detect metadata to pre-fill wizard (returns result directly)
      const meta = await importDetection.detect(selected);

      // Map metadata to WizardFormData partial
      const prefilled: Partial<WizardFormData> = {
        folder: selected,
        ...(meta?.detectedName ? { name: meta.detectedName } : {}),
        ...(meta?.language ? { techStack: [meta.language] } : {}),
      };

      setWizardMode("import");
      setWizardInitialData(prefilled);
      setWizardOpen(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setImportError(msg);
    }
  };

  const handleWizardSubmit = async (data: WizardFormData) => {
    setImportError(null);
    try {
      if (wizardMode === "new") {
        // Run gsd init then register the project
        await client.initProject(data.folder);
      }
      // Register project in the store (both new and import)
      const saved = await addProject(data.folder, data.description || undefined);
      selectProject(saved);
      setWizardOpen(false);
      navigate("/milestones");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setImportError(msg);
      // Re-throw so wizard can handle it if needed
      throw err;
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
          description="Import an existing GSD project or create a new one to get started."
        />
        <div className="flex gap-2">
          <Button onClick={handleNewProject}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
          <Button variant="outline" onClick={handleImportProject}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Import Project
          </Button>
        </div>
        {importError && (
          <p className="text-sm text-destructive">{importError}</p>
        )}
        <NewProjectWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          onSubmit={handleWizardSubmit}
          onPickFolder={openDirectoryPicker}
          initialData={wizardInitialData}
        />
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
        <Button size="sm" onClick={handleNewProject}>
          <Plus className="mr-1 h-4 w-4" />
          New Project
        </Button>
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
            onClick={() => {
              selectProject(project);
              navigate("/milestones");
            }}
            onRemove={() => removeProject(project.id)}
          />
        ))}
      </div>
      <NewProjectWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSubmit={handleWizardSubmit}
        onPickFolder={openDirectoryPicker}
        initialData={wizardInitialData}
      />
    </div>
  );
}
