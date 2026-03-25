import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface NewProjectWizardProps {
  open: boolean;
  onClose: () => void;
}

interface WizardData {
  name: string;
  path: string;
  description: string;
  techStack: string;
}

/**
 * 3-step new project wizard.
 * Step 1: Name + folder path
 * Step 2: Description + tech stack (optional)
 * Step 3: Summary + create
 */
export function NewProjectWizard({ open, onClose }: NewProjectWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    name: "",
    path: "",
    description: "",
    techStack: "",
  });

  const canAdvanceStep1 = data.name.trim() && data.path.trim();

  const handleNext = () => {
    if (step === 1 && !canAdvanceStep1) return;
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleCreate = () => {
    // TODO: call gsd-client to initialize project at data.path
    onClose();
  };

  const handleClose = () => {
    setStep(1);
    setData({ name: "", path: "", description: "", techStack: "" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            New Project — <Badge variant="outline">Step {step} of 3</Badge>
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                placeholder="my-project"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="folder-path">Folder Path</Label>
              <Input
                id="folder-path"
                value={data.path}
                onChange={(e) => setData({ ...data, path: e.target.value })}
                placeholder="/home/user/projects/my-project"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={data.description}
                onChange={(e) => setData({ ...data, description: e.target.value })}
                placeholder="What is this project about?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tech-stack">Tech Stack (optional)</Label>
              <Input
                id="tech-stack"
                value={data.techStack}
                onChange={(e) => setData({ ...data, techStack: e.target.value })}
                placeholder="React, TypeScript, Node.js…"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>{" "}
              <span className="font-medium">{data.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Path:</span>{" "}
              <span className="font-mono text-xs">{data.path}</span>
            </div>
            {data.description && (
              <div>
                <span className="text-muted-foreground">Description:</span>{" "}
                <span>{data.description}</span>
              </div>
            )}
            {data.techStack && (
              <div>
                <span className="text-muted-foreground">Stack:</span>{" "}
                <span>{data.techStack}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleClose} aria-label="Cancel">
            Cancel
          </Button>
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} aria-label="Back">
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={handleNext} aria-label="Next">
              Next
            </Button>
          ) : (
            <Button onClick={handleCreate} aria-label="Create project">
              Create Project
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
