import { FolderKanban } from "lucide-react";
import { ProjectGallery } from "@/components/projects";

export function ProjectsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <FolderKanban className="h-6 w-6 text-primary" data-testid="page-icon" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Browse and manage your project workspaces.
          </p>
        </div>
      </div>
      <ProjectGallery />
    </div>
  );
}
