import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { WizardFormData } from "../new-project-wizard";

interface ActionStepProps {
  formData: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
}

export function ActionStep({ formData, onChange }: ActionStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Review your choices and select what happens after the project is
        created.
      </p>

      {/* Summary */}
      <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-1.5">
        <div>
          <span className="font-medium">Name: </span>
          <span>{formData.name || <em className="text-muted-foreground">—</em>}</span>
        </div>
        <div>
          <span className="font-medium">Folder: </span>
          <span className="break-all">
            {formData.folder || <em className="text-muted-foreground">—</em>}
          </span>
        </div>
        <div>
          <span className="font-medium">Type: </span>
          <span>{formData.type === "new" ? "New project" : "Existing code"}</span>
        </div>
        {formData.description && (
          <div>
            <span className="font-medium">Description: </span>
            <span>{formData.description}</span>
          </div>
        )}
        {formData.techStack.length > 0 && (
          <div>
            <span className="font-medium">Tech stack: </span>
            <span>{formData.techStack.join(", ")}</span>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">After creation</Label>
        <RadioGroup
          value={formData.action}
          onValueChange={(value) =>
            onChange({ action: value as WizardFormData["action"] })
          }
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="dashboard" id="action-dashboard" />
            <Label htmlFor="action-dashboard" className="cursor-pointer">
              Open dashboard
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="auto" id="action-auto" />
            <Label htmlFor="action-auto" className="cursor-pointer">
              Start auto mode
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
