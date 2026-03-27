import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { WizardFormData } from "../new-project-wizard";

interface DescriptionStepProps {
  formData: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
}

export function DescriptionStep({ formData, onChange }: DescriptionStepProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Optionally describe what this project does. This helps GSD understand
        your goals.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wizard-description">Description (optional)</Label>
        <Textarea
          id="wizard-description"
          placeholder="A short description of your project…"
          rows={4}
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>
    </div>
  );
}
