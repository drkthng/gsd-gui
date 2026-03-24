import { MessageSquare, Plus, Send } from "lucide-react";

export function ChatPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-primary" data-testid="page-icon" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chat</h1>
          <p className="text-sm text-muted-foreground">
            Interact with AI agents and manage conversations.
          </p>
        </div>
      </div>

      <div
        className="rounded-lg border bg-card p-4 text-card-foreground"
        data-testid="mock-section"
      >
        <h2 className="mb-3 text-sm font-medium text-foreground">
          Recent Conversations
        </h2>
        <div className="space-y-3">
          {[
            { title: "Refactor auth module", time: "2 min ago", preview: "Let me analyze the authentication flow..." },
            { title: "Debug CI pipeline", time: "1 hour ago", preview: "The failing test is in integration/..." },
            { title: "Design system review", time: "Yesterday", preview: "I've reviewed the component library..." },
          ].map((conv) => (
            <div
              key={conv.title}
              className="flex items-start gap-3 rounded-md border bg-background p-3 transition-colors hover:bg-muted/50"
            >
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{conv.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{conv.time}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{conv.preview}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-lg border bg-card p-4 text-card-foreground"
        data-testid="mock-section"
      >
        <h2 className="mb-3 text-sm font-medium text-foreground">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors"
          >
            <Plus className="h-3 w-3" />
            New Conversation
          </button>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors"
          >
            <Send className="h-3 w-3" />
            Quick Prompt
          </button>
        </div>
      </div>
    </div>
  );
}
