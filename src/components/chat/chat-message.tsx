import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { GsdMessage } from "@/stores/gsd-store";
import { CodeBlock } from "./code-block";

interface ChatMessageProps {
  message: GsdMessage;
}

/**
 * Single chat message — user or assistant.
 * Assistant messages are rendered as markdown with GFM support.
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback className={`text-xs ${isUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
          {isUser ? "You" : "GSD"}
        </AvatarFallback>
      </Avatar>
      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
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
    </div>
  );
}
