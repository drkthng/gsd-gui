import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown, ChevronRight, Brain } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { GsdMessage } from "@/stores/gsd-store";
import { CodeBlock } from "./code-block";

interface ChatMessageProps {
  message: GsdMessage;
}

/**
 * Single chat message — user or assistant.
 * Assistant messages are rendered as markdown with GFM support.
 * Thinking blocks are shown as a collapsible section above the response.
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [thinkingOpen, setThinkingOpen] = useState(false);

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback className={`text-xs ${isUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
          {isUser ? "You" : "GSD"}
        </AvatarFallback>
      </Avatar>
      <div className={`max-w-[80%] space-y-1.5`}>
        {/* Thinking collapsible — only on assistant messages with thinking content */}
        {!isUser && message.thinking && (
          <div className="rounded-md border border-dashed border-purple-300 dark:border-purple-800 overflow-hidden text-xs">
            <button
              className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-muted-foreground hover:bg-muted/50 transition-colors"
              onClick={() => setThinkingOpen((v) => !v)}
            >
              <Brain className="h-3 w-3 shrink-0 text-purple-500" />
              <span className="font-medium text-purple-600 dark:text-purple-400">Thinking</span>
              {thinkingOpen
                ? <ChevronDown className="h-3 w-3 ml-auto" />
                : <ChevronRight className="h-3 w-3 ml-auto" />}
            </button>
            {thinkingOpen && (
              <div className="px-3 pb-2.5 pt-1 font-mono text-muted-foreground whitespace-pre-wrap break-words border-t border-dashed border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20">
                {message.thinking}
              </div>
            )}
          </div>
        )}

        {/* Message body — only render if there's actual content */}
        {message.content && (
          <div className={`rounded-lg px-3 py-2 text-sm ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}>
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-background [&_pre]:rounded-md [&_pre]:p-3 [&_pre]:text-xs [&_code]:text-xs">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      if (match) {
                        return (
                          <CodeBlock
                            language={match[1]}
                            code={String(children).replace(/\n$/, "")}
                          />
                        );
                      }
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
