import { HelpCircle, BookOpen, Keyboard, ExternalLink } from "lucide-react";

export function HelpPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <HelpCircle className="h-6 w-6 text-primary" data-testid="page-icon" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Help</h1>
          <p className="text-sm text-muted-foreground">
            Documentation, shortcuts, and support resources.
          </p>
        </div>
      </div>

      <div
        className="rounded-lg border bg-card p-4 text-card-foreground"
        data-testid="mock-section"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">Getting Started</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          GSD is a desktop application for managing AI-assisted software development projects.
          Use the sidebar to navigate between views.
        </p>
        <div className="mt-3 space-y-2">
          {[
            { step: "1", text: "Create a project workspace from the Projects page" },
            { step: "2", text: "Define milestones and break them into slices" },
            { step: "3", text: "Start a chat session to work with AI agents" },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-3 rounded-md border bg-background px-3 py-2"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {item.step}
              </span>
              <span className="text-sm text-foreground">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-lg border bg-card p-4 text-card-foreground"
        data-testid="mock-section"
      >
        <div className="flex items-center gap-2">
          <Keyboard className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">Keyboard Shortcuts</h2>
        </div>
        <div className="mt-3 space-y-1.5">
          {[
            { keys: "Ctrl + K", desc: "Command palette" },
            { keys: "Ctrl + B", desc: "Toggle sidebar" },
            { keys: "Ctrl + /", desc: "Focus chat input" },
            { keys: "Ctrl + ,", desc: "Open settings" },
          ].map((shortcut) => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between rounded-md px-3 py-1.5"
            >
              <span className="text-sm text-foreground">{shortcut.desc}</span>
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-lg border bg-card p-4 text-card-foreground"
        data-testid="mock-section"
      >
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">Documentation</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Full documentation is available in the project repository. See the README for setup
          instructions, architecture overview, and contribution guidelines.
        </p>
      </div>
    </div>
  );
}
