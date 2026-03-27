import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WizardFormData } from "../new-project-wizard";

interface NameStepProps {
  formData: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
}

export function NameStep({ formData, onChange }: NameStepProps) {
  const [touched, setTouched] = React.useState(false);
  const hasError = touched && formData.name.trim() === "";

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Give your project a short, descriptive name.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wizard-name">Name</Label>
        <Input
          id="wizard-name"
          placeholder="my-project"
          value={formData.name}
          onChange={(e) => onChange({ name: e.target.value })}
          onBlur={() => setTouched(true)}
          aria-invalid={hasError}
          aria-describedby={hasError ? "wizard-name-error" : undefined}
        />
        {hasError && (
          <p id="wizard-name-error" className="text-sm text-destructive">
            Project name is required.
          </p>
        )}
      </div>
    </div>
  );
}
