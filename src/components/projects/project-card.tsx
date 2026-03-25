import { Folder, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SavedProject } from "@/lib/types";

interface ProjectCardProps {
  project: SavedProject;
  onClick: () => void;
  onRemove: () => void;
}

export function ProjectCard({ project, onClick, onRemove }: ProjectCardProps) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50 group"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Folder className="h-4 w-4 shrink-0 text-primary" />
            <CardTitle className="text-sm font-medium truncate">
              {project.name}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label={`Remove ${project.name}`}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground truncate font-mono">
          {project.path}
        </p>
      </CardHeader>
      {project.description && (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
