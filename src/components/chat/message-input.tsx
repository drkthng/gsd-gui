import { useState, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGsdStore } from "@/stores/gsd-store";
import { CommandPalette, commandTakesArgs } from "./command-palette";
import type { GsdCommand } from "@/lib/types";

/**
 * Message input — multi-line textarea with send button.
 * Enter sends, Shift+Enter inserts newline. Disabled while streaming.
 *
 * When the user types "/" (without a space following the command token),
 * a floating CommandPalette appears above the textarea. Arrow keys navigate
 * the palette; Enter/Tab selects; Escape dismisses.
 */
export function MessageInput() {
  const [value, setValue] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = useGsdStore((s) => s.isStreaming);
  const sendPrompt = useGsdStore((s) => s.sendPrompt);
  const availableCommands = useGsdStore((s) => s.availableCommands);

  // Palette is shown when value starts with "/" and no space has been typed
  // after the command token (i.e. the user hasn't started entering arguments).
  const showPalette = paletteOpen && value.startsWith("/") && !value.includes(" ");

  // The query passed to CommandPalette is the current value (e.g. "/gsd")
  const paletteQuery = value;

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function handleSelect(cmd: GsdCommand) {
    if (commandTakesArgs(cmd)) {
      // Fill command token + trailing space, leave cursor for argument entry
      setValue("/" + cmd.name + " ");
      setPaletteOpen(false);
      textareaRef.current?.focus();
    } else {
      // No arguments expected — send immediately
      setValue("");
      setPaletteOpen(false);
      sendPrompt("/" + cmd.name);
      textareaRef.current?.focus();
    }
  }

  // -------------------------------------------------------------------------
  // Derived flat command list (same filter as CommandPalette uses internally,
  // mirrored here so keyboard nav can know the list length).
  // -------------------------------------------------------------------------

  function getFilteredFlatCommands(): GsdCommand[] {
    const normalized = value.startsWith("/") ? value.slice(1).toLowerCase() : value.toLowerCase();
    return availableCommands.filter((c) =>
      c.name.toLowerCase().startsWith(normalized),
    );
  }

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      if (newValue.startsWith("/") && !newValue.includes(" ")) {
        setPaletteOpen(true);
        setActiveIndex(0);
      } else {
        setPaletteOpen(false);
        setActiveIndex(0);
      }
    },
    [],
  );

  const handleSend = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setValue("");
    setPaletteOpen(false);
    await sendPrompt(trimmed);
    textareaRef.current?.focus();
  }, [value, sendPrompt]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (showPalette) {
        const flatCommands = getFilteredFlatCommands();
        const maxIndex = flatCommands.length - 1;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, Math.max(0, maxIndex)));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIndex((i) => Math.max(0, i - 1));
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setPaletteOpen(false);
          setActiveIndex(0);
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          if (flatCommands.length > 0 && activeIndex >= 0 && activeIndex <= maxIndex) {
            e.preventDefault();
            handleSelect(flatCommands[activeIndex]);
            return;
          }
        }
      }

      // Default Enter behaviour: send
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showPalette, activeIndex, availableCommands, value, handleSend],
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex items-end gap-2 border-t p-4">
      {/* Relative wrapper so the palette can be positioned absolutely above */}
      <div className="relative flex-1">
        {showPalette && (
          <CommandPalette
            query={paletteQuery}
            activeIndex={activeIndex}
            onSelect={handleSelect}
            onDismiss={() => {
              setPaletteOpen(false);
              setActiveIndex(0);
            }}
            onActiveIndexChange={setActiveIndex}
          />
        )}
        <Textarea
          ref={textareaRef}
          placeholder="Type a message…"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          rows={1}
          className="min-h-[40px] max-h-[160px] resize-none"
        />
      </div>
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
