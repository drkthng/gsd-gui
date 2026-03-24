import { Badge } from "@/components/ui/badge";

/**
 * Status bar displayed at the bottom of the app shell.
 * Shows current milestone context, accumulated cost, and active model.
 * All values are mock data for M001.
 */
export function StatusBar() {
  return (
    <footer
      role="contentinfo"
      className="flex h-8 shrink-0 items-center gap-4 border-t bg-muted/50 px-4 text-xs text-muted-foreground transition-colors duration-200"
    >
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="h-5 rounded-sm text-[10px]">
          M001 / S01 / T01
        </Badge>
      </div>
      <div className="flex items-center gap-1">
        <span>Cost:</span>
        <span className="font-mono">$0.00</span>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <span>Model:</span>
        <Badge variant="secondary" className="h-5 rounded-sm text-[10px]">
          Claude Sonnet
        </Badge>
      </div>
    </footer>
  );
}
