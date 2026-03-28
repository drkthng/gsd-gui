import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGsdStore } from "@/stores/gsd-store";

interface RestartBannerProps {
  /** Latest installed version to display in the banner. */
  version?: string;
}

/**
 * Full-width amber banner shown after a successful GSD upgrade.
 * Prompts the user to restart the Tauri application to apply changes.
 */
export function RestartBanner({ version }: RestartBannerProps) {
  const dismissRestartBanner = useGsdStore((s) => s.dismissRestartBanner);

  const handleRestart = async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("restart_app");
    } catch {
      // If invoke fails, just dismiss the banner — nothing else we can do
      dismissRestartBanner();
    }
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200"
      role="status"
      aria-live="polite"
      data-testid="restart-banner"
    >
      <RefreshCw className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="flex-1 text-sm">
        GSD updated{version ? ` to v${version}` : ""}.{" "}
        <span className="font-medium">Restart to apply changes.</span>
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="h-7 border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-xs"
          onClick={() => void handleRestart()}
          data-testid="restart-now-btn"
        >
          Restart Now
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 text-xs px-2"
          onClick={dismissRestartBanner}
          data-testid="restart-later-btn"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Later
        </Button>
      </div>
    </div>
  );
}
