import { AlertTriangle, RefreshCw } from "lucide-react";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";

export interface ProToolPanelProps {
  title: string;
  status: "loading" | "error" | "empty" | "ready";
  errorMessage?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
}

/**
 * Wrapper component for individual Pro Tool panels.
 * Handles loading, error (with retry), empty, and ready states.
 */
export function ProToolPanel({
  title,
  status,
  errorMessage,
  onRetry,
  children,
}: ProToolPanelProps) {
  return (
    <div className="flex flex-col gap-4 p-6" data-testid="pro-tool-panel">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>

      {status === "loading" && <LoadingState message={`Loading ${title}…`} />}

      {status === "error" && (
        <div
          className="flex flex-col items-center justify-center gap-3 py-16 text-center"
          role="alert"
          data-testid="panel-error"
        >
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">
            {errorMessage ?? "Something went wrong."}
          </p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
        </div>
      )}

      {status === "empty" && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center" data-testid="panel-empty">
          <p className="text-sm text-muted-foreground">No data available.</p>
        </div>
      )}

      {status === "ready" && children}
    </div>
  );
}
