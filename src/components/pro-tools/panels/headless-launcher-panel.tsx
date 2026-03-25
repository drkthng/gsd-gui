import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";
import { Play } from "lucide-react";

interface HeadlessProfile {
  id: string;
  name: string;
  model: string;
  lastUsed?: string;
  status: "idle" | "active";
}

const MOCK_PROFILES: HeadlessProfile[] = [
  { id: "p1", name: "Code Review Bot", model: "claude-sonnet-4-20250514", lastUsed: "2 hours ago", status: "idle" },
  { id: "p2", name: "Test Writer", model: "claude-sonnet-4-20250514", lastUsed: "5 min ago", status: "active" },
  { id: "p3", name: "Doc Generator", model: "gpt-4o", status: "idle" },
];

const STATUS_VARIANT: Record<HeadlessProfile["status"], "default" | "secondary"> = {
  active: "default",
  idle: "secondary",
};

export function HeadlessLauncherPanel() {
  return (
    <ProToolPanel title="Headless Launcher" status="ready">
      <div className="grid gap-3">
        {MOCK_PROFILES.map((profile) => (
          <Card key={profile.id} data-testid={`profile-${profile.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{profile.name}</CardTitle>
              <Badge variant={STATUS_VARIANT[profile.status]}>{profile.status}</Badge>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-0">
              <div>
                <p className="text-sm text-muted-foreground">{profile.model}</p>
                {profile.lastUsed && (
                  <p className="mt-1 text-xs text-muted-foreground">Last used: {profile.lastUsed}</p>
                )}
              </div>
              <Button size="sm" variant="outline" aria-label={`Launch ${profile.name}`}>
                <Play className="mr-1 h-3 w-3" />
                Launch
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
