import { useState, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGsdStore } from "@/stores/gsd-store";

/**
 * Message input — multi-line textarea with send button.
 * Enter sends, Shift+Enter inserts newline. Disabled while streaming.
 */
export function MessageInput() {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = useGsdStore((s) => s.isStreaming);
  const sendPrompt = useGsdStore((s) => s.sendPrompt);

  const handleSend = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setValue("");
    await sendPrompt(trimmed);
    textareaRef.current?.focus();
  }, [value, sendPrompt]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="flex items-end gap-2 border-t p-4">
      <Textarea
        ref={textareaRef}
        placeholder="Type a message…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isStreaming}
        rows={1}
        className="min-h-[40px] max-h-[160px] resize-none"
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={isStreaming || !value.trim()}
        aria-label="Send message"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
