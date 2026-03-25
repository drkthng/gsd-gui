import { Settings } from "lucide-react";
import { ConfigPanel } from "@/components/dashboard/config-panel";

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" data-testid="page-icon" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure GSD preferences and model settings.
          </p>
        </div>
      </div>
      <ConfigPanel />
    </div>
  );
}
