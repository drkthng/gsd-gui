import * as React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { WizardFormData } from "../new-project-wizard";

interface TypeStepProps {
  formData: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
}

export function TypeStep({ formData, onChange }: TypeStepProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Are you starting from scratch, or importing existing code?
      </p>
      <RadioGroup
        value={formData.type}
        onValueChange={(value) =>
          onChange({ type: value as WizardFormData["type"] })
        }
        className="flex flex-col gap-3"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="new" id="type-new" />
          <Label htmlFor="type-new" className="cursor-pointer">
            New project
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="existing" id="type-existing" />
          <Label htmlFor="type-existing" className="cursor-pointer">
            Existing code
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
