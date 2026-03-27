import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WizardFormData } from "../new-project-wizard";

const TECH_OPTIONS = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Rust",
  "Go",
  "Other",
] as const;

interface TechStackStepProps {
  formData: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
}

export function TechStackStep({ formData, onChange }: TechStackStepProps) {
  function toggle(tech: string) {
    const current = formData.techStack;
    const next = current.includes(tech)
      ? current.filter((t) => t !== tech)
      : [...current, tech];
    onChange({ techStack: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Select the languages and technologies used in this project.
      </p>
      <div className="flex flex-wrap gap-2">
        {TECH_OPTIONS.map((tech) => {
          const selected = formData.techStack.includes(tech);
          return (
            <button
              key={tech}
              type="button"
              onClick={() => toggle(tech)}
              aria-pressed={selected}
              className="rounded-full border-transparent outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Badge
                variant={selected ? "default" : "outline"}
                className={cn(
                  "cursor-pointer select-none px-3 py-1 text-sm transition-colors",
                  selected && "ring-2 ring-ring ring-offset-1"
                )}
              >
                {tech}
              </Badge>
            </button>
          );
        })}
      </div>
      {formData.techStack.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No technologies selected (optional).
        </p>
      )}
    </div>
  );
}
