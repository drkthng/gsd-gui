import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NameStep } from "./wizard-steps/name-step";
import { FolderStep } from "./wizard-steps/folder-step";
import { TypeStep } from "./wizard-steps/type-step";
import { DescriptionStep } from "./wizard-steps/description-step";
import { TechStackStep } from "./wizard-steps/tech-stack-step";
import { ActionStep } from "./wizard-steps/action-step";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WizardFormData {
  name: string;
  folder: string;
  type: "new" | "existing";
  description: string;
  techStack: string[];
  action: "dashboard" | "auto";
}

const STEP_COUNT = 6;

const STEP_TITLES: Record<number, string> = {
  0: "Project Name",
  1: "Project Folder",
  2: "Project Type",
  3: "Description",
  4: "Tech Stack",
  5: "Create Project",
};

const DEFAULT_FORM_DATA: WizardFormData = {
  name: "",
  folder: "",
  type: "new",
  description: "",
  techStack: [],
  action: "dashboard",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface NewProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<WizardFormData>;
  onSubmit: (data: WizardFormData) => Promise<void>;
  onPickFolder: () => Promise<string | null>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NewProjectWizard({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  onPickFolder,
}: NewProjectWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState<WizardFormData>(() => ({
    ...DEFAULT_FORM_DATA,
    ...initialData,
  }));
  const [submitting, setSubmitting] = React.useState(false);

  // Reset when dialog opens
  React.useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setFormData({ ...DEFAULT_FORM_DATA, ...initialData });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(updates: Partial<WizardFormData>) {
    setFormData((prev) => ({ ...prev, ...updates }));
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  function handleNext() {
    setCurrentStep((s) => Math.min(STEP_COUNT - 1, s + 1));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  }

  // Next is disabled on step 0 when name is empty
  const nextDisabled = currentStep === 0 && formData.name.trim() === "";
  const isLastStep = currentStep === STEP_COUNT - 1;

  const stepContent: Record<number, React.ReactNode> = {
    0: <NameStep formData={formData} onChange={handleChange} />,
    1: (
      <FolderStep
        formData={formData}
        onChange={handleChange}
        onPickFolder={onPickFolder}
      />
    ),
    2: <TypeStep formData={formData} onChange={handleChange} />,
    3: <DescriptionStep formData={formData} onChange={handleChange} />,
    4: <TechStackStep formData={formData} onChange={handleChange} />,
    5: <ActionStep formData={formData} onChange={handleChange} />,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{STEP_TITLES[currentStep]}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {STEP_COUNT}
          </p>
        </DialogHeader>

        <div className="py-2">{stepContent[currentStep]}</div>

        <DialogFooter className="flex flex-row justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>

          {isLastStep ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Creating…" : "Create Project"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              disabled={nextDisabled}
            >
              Next
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
