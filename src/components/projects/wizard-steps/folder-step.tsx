import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { WizardFormData } from "../new-project-wizard";

interface FolderStepProps {
  formData: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
  onPickFolder: () => Promise<string | null>;
}

export function FolderStep({ formData, onChange, onPickFolder }: FolderStepProps) {
  async function handleBrowse() {
    const picked = await onPickFolder();
    if (picked !== null) {
      onChange({ folder: picked });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Select the directory where the project will be created or already exists.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label>Location</Label>
        <div className="flex items-center gap-2">
          <span
            className="flex-1 truncate rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
            title={formData.folder || undefined}
          >
            {formData.folder || "No folder selected"}
          </span>
          <Button type="button" variant="secondary" onClick={handleBrowse}>
            Browse…
          </Button>
        </div>
      </div>
    </div>
  );
}
