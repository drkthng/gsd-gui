import { FolderKanban } from "lucide-react";

const mockProjects = [
  { name: "gsd-ui", status: "Active", tasks: 12, progress: 68 },
  { name: "api-gateway", status: "Active", tasks: 8, progress: 45 },
  { name: "docs-site", status: "Paused", tasks: 5, progress: 20 },
];

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

      <div
        className="rounded-lg border bg-card p-4 text-card-foreground"
        data-testid="mock-section"
      >
        <h2 className="mb-3 text-sm font-medium text-foreground">
          Active Projects
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mockProjects.map((project) => (
            <div
              key={project.name}
              className="rounded-md border bg-background p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{project.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    project.status === "Active"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {project.status}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{project.tasks} tasks</span>
                <span>{project.progress}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-lg border bg-card p-4 text-card-foreground"
        data-testid="mock-section"
      >
        <h2 className="mb-3 text-sm font-medium text-foreground">
          Project Statistics
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-foreground">3</div>
            <div className="text-xs text-muted-foreground">Total Projects</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">25</div>
            <div className="text-xs text-muted-foreground">Open Tasks</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">44%</div>
            <div className="text-xs text-muted-foreground">Avg Progress</div>
          </div>
        </div>
      </div>
    </div>
  );
}
