import { useState, useCallback } from "react";
import { Search, MessageSquare, Clock, ChevronDown, ChevronRight, Loader2, ChevronsDown, Bot, User, Terminal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/empty-state";
import { createGsdClient } from "@/services/gsd-client";
import { useProjectStore } from "@/stores/project-store";
import type { SessionInfo, SessionMessage } from "@/lib/types";
import type { UseSessionsResult } from "@/hooks/use-sessions";

const client = createGsdClient();

interface SessionBrowserProps {
  sessions: SessionInfo[];
  total: number;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onLoadAll: () => void;
}

export function SessionBrowser({
  sessions,
  total,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onLoadAll,
}: SessionBrowserProps) {
  const [search, setSearch] = useState("");

  if (sessions.length === 0) {
    return <EmptyState icon={Clock} title="No sessions" description="No session history found for this project." />;
  }

  const filtered = search
    ? sessions.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.preview.toLowerCase().includes(search.toLowerCase()),
      )
    : sessions;

  const topLevel = filtered.filter((s) => !s.parentId);
  const children = filtered.filter((s) => s.parentId);

  return (
    <div className="space-y-3">
      {/* Search + count */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sessions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {sessions.length} / {total}
        </span>
      </div>

      {/* Session rows */}
      <div className="space-y-1">
        {topLevel.map((session) => (
          <div key={session.id}>
            <SessionRow session={session} />
            {children
              .filter((c) => c.parentId === session.id)
              .map((child) => (
                <div key={child.id} className="ml-6 mt-1">
                  <SessionRow session={child} />
                </div>
              ))}
          </div>
        ))}
        {children
          .filter((c) => !topLevel.some((t) => t.id === c.parentId))
          .map((child) => (
            <div key={child.id} className="ml-6">
              <SessionRow session={child} />
            </div>
          ))}
      </div>

      {/* Pagination controls */}
      {hasMore && (
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            Load next 10
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={onLoadAll}
            disabled={isLoadingMore}
          >
            <ChevronsDown className="h-3.5 w-3.5" />
            Load all {total} sessions
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual session row with expandable message thread
// ---------------------------------------------------------------------------

function SessionRow({ session }: { session: SessionInfo }) {
  const activeProject = useProjectStore((s) => s.activeProject);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<SessionMessage[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (messages !== null || !activeProject) return;
    setLoading(true);
    setError(null);
    try {
      const data = await client.readSessionMessages(activeProject.path, session.id);
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [messages, activeProject, session.id]);

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) void loadMessages();
  };

  return (
    <div
      className={`rounded-md border transition-colors ${
        session.isActive ? "border-primary/40 bg-primary/5" : "border-border"
      }`}
    >
      {/* Row header — click to expand */}
      <button
        className="flex w-full items-start gap-3 p-3 text-left hover:bg-muted/40 rounded-md transition-colors"
        onClick={handleToggle}
      >
        <span className="mt-0.5 text-muted-foreground">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>
        <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{session.name}</span>
            {session.isActive && (
              <Badge className="text-[10px] bg-green-600 text-white">Active</Badge>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground mt-0.5">{session.preview}</p>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
            <span>{session.messageCount} msgs</span>
            <span className="font-mono">${session.cost.toFixed(4)}</span>
            <span>
              {new Date(isNaN(Number(session.lastActiveAt))
                ? session.lastActiveAt
                : Number(session.lastActiveAt) * 1000
              ).toLocaleString()}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded message thread */}
      {expanded && (
        <div className="border-t px-3 pb-3">
          {loading && (
            <div className="flex items-center gap-2 pt-3 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading messages…
            </div>
          )}
          {error && (
            <p className="pt-3 text-xs text-destructive">{error}</p>
          )}
          {messages && messages.length === 0 && (
            <p className="pt-3 text-xs text-muted-foreground">No readable messages in this session.</p>
          )}
          {messages && messages.length > 0 && (
            <ScrollArea className="max-h-[480px] pt-3">
              <div className="space-y-3 pr-2">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ message }: { message: SessionMessage }) {
  const isUser = message.role === "user";
  const isTool = message.role === "toolResult" || message.role === "tool_result";

  const Icon = isUser ? User : isTool ? Terminal : Bot;
  const label = isUser ? "You" : isTool ? "Tool" : "Agent";
  const bubbleClass = isUser
    ? "bg-primary/10 border-primary/20"
    : isTool
      ? "bg-muted/60 border-border font-mono"
      : "bg-background border-border";

  return (
    <div className={`rounded-md border p-3 text-sm ${bubbleClass} ${message.isError ? "border-destructive/50 bg-destructive/5" : ""}`}>
      <div className="flex items-center gap-1.5 mb-1.5 text-xs text-muted-foreground">
        <Icon className="h-3 w-3" />
        <span className="font-medium">{label}</span>
        {message.isError && <Badge variant="destructive" className="text-[10px] h-4">error</Badge>}
      </div>
      <pre className={`whitespace-pre-wrap break-words leading-relaxed ${isTool ? "text-xs" : ""}`}>
        {message.content}
      </pre>
    </div>
  );
}

// Re-export the hook type for the sessions page
export type { UseSessionsResult };
