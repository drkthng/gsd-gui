import { Folder, MessageSquare, History, Trash2, Loader2, Pencil } from "lucide-react";
import * as React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditProjectDialog } from "./edit-project-dialog";
import type { SavedProject } from "@/lib/types";

interface ProjectCardProps {
  project: SavedProject;
  onClick: () => void;
  onRemove: () => void;
  onEdit?: (name: string, description: string) => Promise<void>;
  onOpenChat?: () => void;
  onViewSessions?: () => void;
  isActiveSession?: boolean;
  isConnecting?: boolean;
}

export function ProjectCard({
  project,
  onClick,
  onRemove,
  onEdit,
  onOpenChat,
  onViewSessions,
  isActiveSession = false,
  isConnecting = false,
}: ProjectCardProps) {
  const [editOpen, setEditOpen] = React.useState(false);

  return (
    <>
      <Card
        className="cursor-pointer transition-colors hover:bg-muted/50 group flex flex-col"
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
            <div className="flex items-center gap-1 shrink-0">
              {isActiveSession && (
                <Badge className="h-5 px-1.5 text-[10px] gap-1 bg-green-600 hover:bg-green-600 text-white">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  Live
                </Badge>
              )}
              {isConnecting && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] gap-1">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  Connecting
                </Badge>
              )}
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
                  aria-label={`Edit ${project.name}`}
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                aria-label={`Remove ${project.name}`}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground truncate font-mono">{project.path}</p>
        </CardHeader>

        {project.description && (
          <CardContent className="pt-0 pb-2 flex-1">
            <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
          </CardContent>
        )}

        {(onOpenChat || onViewSessions) && (
          <CardFooter className="pt-2 gap-2">
            {onOpenChat && (
              <Button
                size="sm"
                variant={isActiveSession ? "default" : "outline"}
                className="flex-1 h-7 text-xs gap-1.5"
                onClick={(e) => { e.stopPropagation(); onOpenChat(); }}
              >
                <MessageSquare className="h-3 w-3" />
                {isActiveSession ? "Resume Chat" : "Open Chat"}
              </Button>
            )}
            {onViewSessions && (
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 h-7 text-xs gap-1.5"
                onClick={(e) => { e.stopPropagation(); onViewSessions(); }}
              >
                <History className="h-3 w-3" />
                Sessions
              </Button>
            )}
          </CardFooter>
        )}
      </Card>

      {onEdit && (
        <EditProjectDialog
          project={project}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSave={onEdit}
        />
      )}
    </>
  );
}
