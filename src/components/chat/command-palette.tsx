import { Loader2 } from "lucide-react";
import { useGsdStore } from "@/stores/gsd-store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GsdCommand } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the command description suggests it takes arguments.
 * Detects pipe-separated sub-commands (e.g. "foo | bar") or angle-bracket
 * placeholders (e.g. "<filename>").
 */
export function commandTakesArgs(cmd: GsdCommand): boolean {
  return /[|]|<[^>]+>/.test(cmd.description);
}

/** Strip a leading "/" from the query before matching command names. */
function normalizeQuery(raw: string): string {
  return raw.startsWith("/") ? raw.slice(1) : raw;
}

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

type CommandGroup = {
  label: string;
  commands: GsdCommand[];
};

function groupCommands(commands: GsdCommand[]): CommandGroup[] {
  const gsdCommands = commands.filter(
    (c) => c.source === "extension" && !c.name.startsWith("skill:"),
  );
  const skills = commands.filter((c) => c.name.startsWith("skill:"));
  const prompts = commands.filter((c) => c.source === "prompt");

  const groups: CommandGroup[] = [
    { label: "GSD Commands", commands: gsdCommands },
    { label: "Skills", commands: skills },
    { label: "Prompt Templates", commands: prompts },
  ];

  return groups.filter((g) => g.commands.length > 0);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CommandPaletteProps {
  query: string;
  onSelect: (command: GsdCommand) => void;
  onDismiss: () => void;
  activeIndex: number;
  onActiveIndexChange: (i: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Floating command palette that appears above the chat textarea when the user
 * types "/". Reads available commands from gsd-store and displays filtered,
 * grouped rows.
 *
 * Keyboard navigation is NOT handled here — the parent (MessageInput) owns
 * activeIndex and calls onSelect / onDismiss.
 */
export function CommandPalette({
  query,
  onSelect,
  activeIndex,
}: CommandPaletteProps) {
  const availableCommands = useGsdStore((s) => s.availableCommands);
  const commandsLoaded = useGsdStore((s) => s.commandsLoaded);

  // Loading state
  if (!commandsLoaded) {
    return (
      <div
        role="listbox"
        aria-label="Commands"
        className="absolute bottom-[100%] left-0 right-0 z-50 max-h-64 overflow-y-auto rounded-md border bg-background shadow-lg"
      >
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading commands…
        </div>
      </div>
    );
  }

  // Filter by normalized query prefix (case-insensitive)
  const normalized = normalizeQuery(query).toLowerCase();
  const filtered = availableCommands.filter((c) =>
    c.name.toLowerCase().startsWith(normalized),
  );

  const groups = groupCommands(filtered);

  // Compute a flat ordered list so we can map globalIndex → command
  const flatCommands = groups.flatMap((g) => g.commands);

  if (flatCommands.length === 0) {
    return (
      <div
        role="listbox"
        aria-label="Commands"
        className="absolute bottom-[100%] left-0 right-0 z-50 max-h-64 overflow-y-auto rounded-md border bg-background shadow-lg"
      >
        <div className="px-3 py-2 text-sm text-muted-foreground">
          No commands found
        </div>
      </div>
    );
  }

  let globalIndex = 0;

  return (
    <div
      role="listbox"
      aria-label="Commands"
      className="absolute bottom-[100%] left-0 right-0 z-50 max-h-64 overflow-y-auto rounded-md border bg-background shadow-lg"
    >
      {groups.map((group) => (
        <div key={group.label}>
          {/* Section header */}
          <div className="sticky top-0 bg-muted/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
            {group.label}
          </div>

          {group.commands.map((cmd) => {
            const itemIndex = globalIndex++;
            const isActive = itemIndex === activeIndex;
            const description =
              cmd.description.length > 60
                ? cmd.description.slice(0, 60) + "…"
                : cmd.description;

            return (
              <div
                key={cmd.name}
                role="option"
                aria-selected={isActive}
                onClick={() => onSelect(cmd)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 hover:text-accent-foreground",
                )}
              >
                {/* Left: command name + description */}
                <div className="flex min-w-0 flex-col">
                  <span className="font-mono font-medium">/{cmd.name}</span>
                  {description && (
                    <span className="truncate text-xs text-muted-foreground">
                      {description}
                    </span>
                  )}
                </div>

                {/* Right: source badge */}
                <Badge
                  variant="secondary"
                  className="shrink-0 text-xs"
                >
                  {cmd.source}
                </Badge>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
