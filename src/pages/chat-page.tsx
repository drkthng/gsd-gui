import { MessageSquare } from "lucide-react";
import { ChatView } from "@/components/chat";
import { MessageInput } from "@/components/chat";
import { AutoModeControls } from "@/components/controls";

export function ChatPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" data-testid="page-icon" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Chat</h1>
            <p className="text-sm text-muted-foreground">
              Interact with GSD agents and manage conversations.
            </p>
          </div>
        </div>
        <AutoModeControls />
      </div>
      <ChatView />
      <MessageInput />
    </div>
  );
}
