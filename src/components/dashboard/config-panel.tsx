import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
              <Input id="token-profile" defaultValue="standard" placeholder="standard, fast, deep" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workflow-mode">Workflow Mode</Label>
              <Input id="workflow-mode" defaultValue="auto" placeholder="auto, manual, step" />
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
              <Input id="research-model" defaultValue="claude-sonnet-4-20250514" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="planning-model">Planning Model</Label>
              <Input id="planning-model" defaultValue="claude-sonnet-4-20250514" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="execution-model">Execution Model</Label>
              <Input id="execution-model" defaultValue="claude-sonnet-4-20250514" />
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
              <Input id="isolation-mode" defaultValue="worktree" placeholder="worktree, branch, none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merge-strategy">Merge Strategy</Label>
              <Input id="merge-strategy" defaultValue="squash" placeholder="squash, merge, rebase" />
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
              <Input id="enforcement-mode" defaultValue="warn" placeholder="warn, hard, none" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
