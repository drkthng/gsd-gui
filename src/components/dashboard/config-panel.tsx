import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { usePreferences } from "@/hooks/use-preferences";
import { useProjectStore } from "@/stores/project-store";
import type { PreferencesData } from "@/lib/types";

// ---------------------------------------------------------------------------
// Defaults — used when a loaded preference field is absent
// ---------------------------------------------------------------------------
const DEFAULTS = {
  mode: "auto",
  gitIsolation: "worktree",
  gitAutoPush: false,
  researchModel: "claude-sonnet-4-20250514",
  planningModel: "claude-sonnet-4-20250514",
  executionModel: "claude-sonnet-4-20250514",
  budgetCeiling: "50",
  enforcement: "warn",
} as const;

// ---------------------------------------------------------------------------
// Form shape — flat, UI-friendly representation derived from PreferencesData
// ---------------------------------------------------------------------------
interface FormState {
  mode: string;
  gitIsolation: string;
  gitAutoPush: string; // "true" | "false" — Select requires string values
  researchModel: string;
  planningModel: string;
  executionModel: string;
  budgetCeiling: string;
  enforcement: string;
}

function prefsToForm(prefs: PreferencesData | null): FormState {
  const models = prefs?.models as Record<string, string> | undefined;
  const budget = prefs?.budget as Record<string, unknown> | undefined;
  return {
    mode: prefs?.mode ?? DEFAULTS.mode,
    gitIsolation: prefs?.git?.isolation ?? DEFAULTS.gitIsolation,
    gitAutoPush: String(prefs?.git?.auto_push ?? DEFAULTS.gitAutoPush),
    researchModel: models?.research ?? DEFAULTS.researchModel,
    planningModel: models?.planning ?? DEFAULTS.planningModel,
    executionModel: models?.execution ?? DEFAULTS.executionModel,
    budgetCeiling: String(budget?.ceiling ?? DEFAULTS.budgetCeiling),
    enforcement: String(budget?.enforcement ?? DEFAULTS.enforcement),
  };
}

function formToPrefs(form: FormState, existing: PreferencesData | null): PreferencesData {
  const base: PreferencesData = { ...(existing ?? {}) };
  base.mode = form.mode;
  base.git = {
    ...(existing?.git ?? {}),
    isolation: form.gitIsolation,
    auto_push: form.gitAutoPush === "true",
  };
  base.models = {
    research: form.researchModel,
    planning: form.planningModel,
    execution: form.executionModel,
  };
  base.budget = {
    ceiling: Number(form.budgetCeiling),
    enforcement: form.enforcement,
  };
  return base;
}

// ---------------------------------------------------------------------------
// ConfigPanel
// ---------------------------------------------------------------------------

/**
 * Tabbed configuration panel for GSD preferences.
 * Tabs: General, Models, Git, Budget
 * Wired to real preferences via the usePreferences hook.
 */
export function ConfigPanel() {
  const { preferences, isLoading, isSaving, error, savePreferences } = usePreferences();
  const activeProject = useProjectStore((s) => s.activeProject);
  const [form, setForm] = useState<FormState>(() => prefsToForm(null));

  // Sync form when preferences load or change
  useEffect(() => {
    setForm(prefsToForm(preferences));
  }, [preferences]);

  // Convenience setter — works like setState but for a single key
  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const data = formToPrefs(form, preferences);
    await savePreferences(data);
  }

  // Empty state when no project is selected
  if (!activeProject) {
    return (
      <EmptyState
        icon={Settings}
        title="No project selected"
        description="Select a project to view and edit its preferences."
      />
    );
  }

  // Loading state
  if (isLoading) {
    return <LoadingState message="Loading preferences…" />;
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="git">Git</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------------------- */}
        {/* General tab                                                      */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workflow-mode">Workflow Mode</Label>
                <Select
                  value={form.mode}
                  onValueChange={(v) => setField("mode", v)}
                >
                  <SelectTrigger id="workflow-mode">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto — Fully autonomous execution</SelectItem>
                    <SelectItem value="manual">Manual — User confirms each step</SelectItem>
                    <SelectItem value="step">Step — Pause between slices</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* Models tab                                                        */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="models" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Model Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="research-model">Research Model</Label>
                <Select
                  value={form.researchModel}
                  onValueChange={(v) => setField("researchModel", v)}
                >
                  <SelectTrigger id="research-model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-sonnet-4-20250514">Claude Sonnet 4</SelectItem>
                    <SelectItem value="claude-opus-4-20250514">Claude Opus 4</SelectItem>
                    <SelectItem value="o3">OpenAI o3</SelectItem>
                    <SelectItem value="o4-mini">OpenAI o4-mini</SelectItem>
                    <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                    <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="planning-model">Planning Model</Label>
                <Select
                  value={form.planningModel}
                  onValueChange={(v) => setField("planningModel", v)}
                >
                  <SelectTrigger id="planning-model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-sonnet-4-20250514">Claude Sonnet 4</SelectItem>
                    <SelectItem value="claude-opus-4-20250514">Claude Opus 4</SelectItem>
                    <SelectItem value="o3">OpenAI o3</SelectItem>
                    <SelectItem value="o4-mini">OpenAI o4-mini</SelectItem>
                    <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                    <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="execution-model">Execution Model</Label>
                <Select
                  value={form.executionModel}
                  onValueChange={(v) => setField("executionModel", v)}
                >
                  <SelectTrigger id="execution-model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-sonnet-4-20250514">Claude Sonnet 4</SelectItem>
                    <SelectItem value="claude-opus-4-20250514">Claude Opus 4</SelectItem>
                    <SelectItem value="o3">OpenAI o3</SelectItem>
                    <SelectItem value="o4-mini">OpenAI o4-mini</SelectItem>
                    <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                    <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* Git tab                                                           */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="git" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Git Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="isolation-mode">Isolation Mode</Label>
                <Select
                  value={form.gitIsolation}
                  onValueChange={(v) => setField("gitIsolation", v)}
                >
                  <SelectTrigger id="isolation-mode">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worktree">Worktree — Isolated git worktree per milestone</SelectItem>
                    <SelectItem value="branch">Branch — Milestone branch, no worktree</SelectItem>
                    <SelectItem value="none">None — Work directly on current branch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="auto-push">Auto Push</Label>
                <Select
                  value={form.gitAutoPush}
                  onValueChange={(v) => setField("gitAutoPush", v)}
                >
                  <SelectTrigger id="auto-push">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Enabled — Push after each milestone</SelectItem>
                    <SelectItem value="false">Disabled — Manual push only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* Budget tab                                                        */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="budget" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Budget Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budget-ceiling">Budget Ceiling ($)</Label>
                <Input
                  id="budget-ceiling"
                  type="number"
                  value={form.budgetCeiling}
                  onChange={(e) => setField("budgetCeiling", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enforcement-mode">Enforcement Mode</Label>
                <Select
                  value={form.enforcement}
                  onValueChange={(v) => setField("enforcement", v)}
                >
                  <SelectTrigger id="enforcement-mode">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warn">Warn — Alert when nearing budget</SelectItem>
                    <SelectItem value="hard">Hard — Stop execution at budget limit</SelectItem>
                    <SelectItem value="none">None — No budget enforcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
