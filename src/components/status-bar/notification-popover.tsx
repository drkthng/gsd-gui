import { Bell, X, Trash2 } from "lucide-react";
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
              className="h-4 min-w-4 rounded-full px-1 text-[9px] leading-none"
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
            <div className="py-1">
              {[...notifications].reverse().map((n) => (
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
