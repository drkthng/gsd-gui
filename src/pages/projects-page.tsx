import { useState } from "react";
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectGallery } from "@/components/projects";
import { NewProjectWizard } from "@/components/projects";

export function ProjectsPage() {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-6 w-6 text-primary" data-testid="page-icon" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="text-sm text-muted-foreground">
              Browse and manage your project workspaces.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setWizardOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New Project
        </Button>
      </div>
      <ProjectGallery />
      <NewProjectWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}
