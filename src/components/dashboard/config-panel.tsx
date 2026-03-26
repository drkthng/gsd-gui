import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Tabbed configuration panel for GSD preferences.
 * Tabs: General, Models, Git, Budget
 * TODO: Wire to real preferences.md read/write via headless commands
 */
export function ConfigPanel() {
  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="models">Models</TabsTrigger>
        <TabsTrigger value="git">Git</TabsTrigger>
        <TabsTrigger value="budget">Budget</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4 mt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token-profile">Token Profile</Label>
              <Select defaultValue="standard">
                <SelectTrigger id="token-profile">
                  <SelectValue placeholder="Select profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">Fast — Lower token limits, quicker responses</SelectItem>
                  <SelectItem value="standard">Standard — Balanced token usage</SelectItem>
                  <SelectItem value="deep">Deep — Higher token limits, thorough analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workflow-mode">Workflow Mode</Label>
              <Select defaultValue="auto">
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

      <TabsContent value="models" className="space-y-4 mt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Model Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="research-model">Research Model</Label>
              <Select defaultValue="claude-sonnet-4-20250514">
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
              <Select defaultValue="claude-sonnet-4-20250514">
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
              <Select defaultValue="claude-sonnet-4-20250514">
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

      <TabsContent value="git" className="space-y-4 mt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Git Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="isolation-mode">Isolation Mode</Label>
              <Select defaultValue="worktree">
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
              <Label htmlFor="merge-strategy">Merge Strategy</Label>
              <Select defaultValue="squash">
                <SelectTrigger id="merge-strategy">
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="squash">Squash — Single commit per milestone</SelectItem>
                  <SelectItem value="merge">Merge — Preserve full commit history</SelectItem>
                  <SelectItem value="rebase">Rebase — Linear history</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="budget" className="space-y-4 mt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Budget Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budget-ceiling">Budget Ceiling ($)</Label>
              <Input id="budget-ceiling" type="number" defaultValue="50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enforcement-mode">Enforcement Mode</Label>
              <Select defaultValue="warn">
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
  );
}
