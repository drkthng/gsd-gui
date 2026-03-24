import { Settings as SettingsIcon, Palette, Key, Plug } from "lucide-react";

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-6 w-6 text-primary" data-testid="page-icon" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure application preferences and integrations.
          </p>
        </div>
      </div>

      <div
        className="rounded-lg border bg-card p-4 text-card-foreground"
        data-testid="mock-section"
      >
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">Appearance</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Theme is configurable via the sidebar toggle (dark / light / system).
        </p>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
            <span className="text-sm text-foreground">Theme</span>
            <span className="text-xs text-muted-foreground">System (auto)</span>
          </div>
          <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
            <span className="text-sm text-foreground">Sidebar position</span>
            <span className="text-xs text-muted-foreground">Left</span>
          </div>
          <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
            <span className="text-sm text-foreground">Font size</span>
            <span className="text-xs text-muted-foreground">14px</span>
          </div>
        </div>
      </div>

      <div
        className="rounded-lg border bg-card p-4 text-card-foreground"
        data-testid="mock-section"
      >
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">API Keys</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Manage API keys for LLM providers and external services.
        </p>
        <div className="mt-3 space-y-2">
          {[
            { name: "Anthropic", status: "Configured", masked: "sk-ant-•••••qX" },
            { name: "OpenAI", status: "Not set", masked: "—" },
          ].map((key) => (
            <div
              key={key.name}
              className="flex items-center justify-between rounded-md border bg-background px-3 py-2"
            >
              <span className="text-sm text-foreground">{key.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{key.masked}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-lg border bg-card p-4 text-card-foreground"
        data-testid="mock-section"
      >
        <div className="flex items-center gap-2">
          <Plug className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">Integrations</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Connect external tools and services.
        </p>
        <div className="mt-3 space-y-2">
          {[
            { name: "GitHub", connected: true },
            { name: "Linear", connected: false },
            { name: "Slack", connected: false },
          ].map((integration) => (
            <div
              key={integration.name}
              className="flex items-center justify-between rounded-md border bg-background px-3 py-2"
            >
              <span className="text-sm text-foreground">{integration.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  integration.connected
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {integration.connected ? "Connected" : "Not connected"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
