import { AlertCircle, RefreshCw, WifiOff, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useGsdStore } from "@/stores/gsd-store";

/**
 * ConnectionStatusBanner shows contextual error/disconnected banners
 * with reconnect and dismiss actions. Renders nothing when connected/idle.
 */
export function ConnectionStatusBanner() {
  const sessionState = useGsdStore((s) => s.sessionState);
  const error = useGsdStore((s) => s.error);
  const reconnect = useGsdStore((s) => s.reconnect);
  const clearError = useGsdStore((s) => s.clearError);

  // Binary-not-found: error message from resolve_gsd_binary contains "Could not find"
  const isBinaryNotFound = sessionState === "error" && error?.includes("Could not find");

  if (sessionState === "error") {
    return (
      <div className="px-6 pt-3" data-testid="connection-status-banner">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {isBinaryNotFound ? "GSD Binary Not Found" : "Connection Error"}
          </AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{error}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => reconnect()}
                data-testid="reconnect-button"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Reconnect
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearError()}
                data-testid="dismiss-button"
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (sessionState === "disconnected") {
    return (
      <div className="px-6 pt-3" data-testid="connection-status-banner">
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Session Disconnected</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>The GSD session has ended.</p>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => reconnect()}
                data-testid="reconnect-button"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Reconnect
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // connected, connecting, idle, streaming — no banner
  return null;
}
