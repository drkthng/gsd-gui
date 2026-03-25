import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./chat-message";
import { EmptyState } from "@/components/shared/empty-state";
import { useGsdStore } from "@/stores/gsd-store";

/**
 * Chat view — scrollable message list from gsd-store with streaming indicator.
 * Auto-scrolls to bottom on new messages.
 */
export function ChatView() {
  const messages = useGsdStore((s) => s.messages);
  const isStreaming = useGsdStore((s) => s.isStreaming);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages or streaming updates
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Start a conversation"
        description="Send a message to begin working with GSD."
      />
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-4 p-4">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {isStreaming && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <span>Thinking…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}
