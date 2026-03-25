import { useState } from "react";
import { Search, MessageSquare, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { SessionInfo } from "@/lib/types";

interface SessionBrowserProps {
  sessions: SessionInfo[];
}

export function SessionBrowser({ sessions }: SessionBrowserProps) {
  const [search, setSearch] = useState("");

  if (sessions.length === 0) {
    return <EmptyState icon={Clock} title="No sessions" description="No session history available." />;
  }

  const filtered = search
    ? sessions.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.preview.toLowerCase().includes(search.toLowerCase())
      )
    : sessions;

  // Separate top-level and child sessions
  const topLevel = filtered.filter((s) => !s.parentId);
  const children = filtered.filter((s) => s.parentId);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search sessions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="space-y-1">
        {topLevel.map((session) => (
          <div key={session.id}>
            <SessionRow session={session} />
            {children
              .filter((c) => c.parentId === session.id)
              .map((child) => (
                <div key={child.id} className="ml-6">
                  <SessionRow session={child} />
                </div>
              ))}
          </div>
        ))}
        {/* Orphaned children (parent filtered out) */}
        {children
          .filter((c) => !topLevel.some((t) => t.id === c.parentId))
          .map((child) => (
            <div key={child.id} className="ml-6">
              <SessionRow session={child} />
            </div>
          ))}
      </div>
    </div>
  );
}

function SessionRow({ session }: { session: SessionInfo }) {
  return (
    <div className={`flex items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50 ${
      session.isActive ? "border-primary/50 bg-primary/5" : ""
    }`}>
      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{session.name}</span>
          {session.isActive && <Badge className="text-[10px]">Active</Badge>}
        </div>
        <p className="truncate text-xs text-muted-foreground mt-0.5">{session.preview}</p>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
          <span>{session.messageCount} msgs</span>
          <span className="font-mono">${session.cost.toFixed(2)}</span>
          <span>{new Date(session.lastActiveAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
