import { Bell, X, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGsdStore, type GsdNotification } from "@/stores/gsd-store";
import { cn } from "@/lib/utils";

const TYPE_STYLES: Record<string, string> = {
  warning: "text-amber-600 dark:text-amber-400",
  error: "text-destructive",
  info: "text-blue-600 dark:text-blue-400",
  success: "text-green-600 dark:text-green-500",
};

/** Notification item for update-available alerts — rendered at the top. */
function UpdateNotificationItem({
  n,
  onDismiss,
}: {
  n: GsdNotification & { payload?: { installed: string; latest: string } };
  onDismiss: () => void;
}) {
  const upgradeInProgress = useGsdStore((s) => s.upgradeInProgress);
  const upgradeError = useGsdStore((s) => s.upgradeError);
  const runUpgrade = useGsdStore((s) => s.runUpgrade);

  const installed = n.payload?.installed ?? "";
  const latest = n.payload?.latest ?? "";

  const handleDismiss = () => {
    if (latest) {
      try {
        localStorage.setItem("gsd-dismissed-update-version", latest);
      } catch {
        // localStorage may be unavailable in some contexts — swallow silently
      }
    }
    onDismiss();
  };

  return (
    <div
      className="group flex flex-col gap-1.5 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-l-2 border-amber-400 dark:border-amber-500 rounded-sm"
      data-testid="update-notification"
    >
      <div className="flex items-start gap-2">
        <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200 leading-snug">
            GSD update available
          </p>
          {installed && latest && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
              v{installed} → v{latest}
            </p>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-opacity"
          aria-label="Dismiss update notification"
          data-testid="update-notification-dismiss"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {upgradeError && (
        <p className="text-[10px] text-destructive leading-snug pl-5">
          {upgradeError}
        </p>
      )}

      <div className="pl-5">
        {upgradeInProgress ? (
          <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Upgrading…</span>
          </div>
        ) : upgradeError ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-destructive hover:text-destructive"
            onClick={() => void runUpgrade()}
            data-testid="update-try-again-btn"
          >
            Try again
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2.5 text-[10px] border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
            onClick={() => void runUpgrade()}
            data-testid="update-btn"
          >
            <RefreshCw className="mr-1 h-2.5 w-2.5" />
            Update &amp; Restart
          </Button>
        )}
      </div>
    </div>
  );
}

/** Standard notification item (non-update). */
function NotificationItem({
  n,
  onDismiss,
}: {
  n: GsdNotification;
  onDismiss: () => void;
}) {
  return (
    <div className="group flex items-start gap-2 px-3 py-2 hover:bg-muted/50 rounded-sm">
      <p
        className={cn(
          "flex-1 text-xs leading-relaxed",
          n.notifyType && TYPE_STYLES[n.notifyType],
        )}
      >
        {n.message}
      </p>
      <button
        onClick={onDismiss}
        className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
        aria-label="Dismiss notification"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function NotificationPopover() {
  const notifications = useGsdStore((s) => s.notifications);
  const dismissNotification = useGsdStore((s) => s.dismissNotification);
  const clearNotifications = useGsdStore((s) => s.clearNotifications);

  const count = notifications.length;

  // Partition: update notifications first (shown at top), rest below
  const updateNotifications = notifications.filter((n) => n.notifyType === "update");
  const otherNotifications = notifications
    .filter((n) => n.notifyType !== "update")
    .slice()
    .reverse();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1.5 px-2 text-[10px] text-muted-foreground hover:text-foreground"
          aria-label={`Notifications (${count})`}
        >
          <Bell className="h-3 w-3" />
          {count > 0 && (
            <Badge
              variant="secondary"
              className={cn(
                "h-4 min-w-4 rounded-full px-1 text-[9px] leading-none",
                updateNotifications.length > 0 &&
                  "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
              )}
            >
              {count > 99 ? "99+" : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="end"
        className="w-80 p-0"
        sideOffset={6}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-xs font-medium">Notifications</span>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] text-muted-foreground"
              onClick={clearNotifications}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Clear all
            </Button>
          )}
        </div>
        {count === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">
            No notifications
          </p>
        ) : (
          <ScrollArea className="max-h-64">
            <div className="py-1 space-y-px">
              {/* Update notifications pinned at top */}
              {updateNotifications.map((n) => (
                <UpdateNotificationItem
                  key={n.id}
                  n={n as GsdNotification & { payload?: { installed: string; latest: string } }}
                  onDismiss={() => dismissNotification(n.id)}
                />
              ))}
              {/* Regular notifications below, newest first */}
              {otherNotifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  n={n}
                  onDismiss={() => dismissNotification(n.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
