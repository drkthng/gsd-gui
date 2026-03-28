import { Link, useLocation } from "react-router-dom";
import {
  MessageSquare,
  FolderKanban,
  Flag,
  Clock,
  History,
  DollarSign,
  Settings,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useUIStore, type View } from "@/stores/ui-store";
import { useGsdStore } from "@/stores/gsd-store";
import { useEffect } from "react";

interface NavItem {
  label: string;
  path: string;
  view: View;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "Chat", path: "/chat", view: "chat", icon: MessageSquare },
  { label: "Projects", path: "/projects", view: "projects", icon: FolderKanban },
  { label: "Milestones", path: "/milestones", view: "milestones", icon: Flag },
  { label: "Timeline", path: "/timeline", view: "timeline", icon: Clock },
  { label: "Sessions", path: "/sessions", view: "sessions", icon: History },
  { label: "Costs", path: "/costs", view: "costs", icon: DollarSign },
  { label: "Settings", path: "/settings", view: "settings", icon: Settings },
  { label: "Pro Tools", path: "/pro-tools", view: "pro-tools", icon: Wrench },
];

/**
 * Sidebar navigation menu with 7 items matching the app routes.
 * Syncs with Zustand activeView state via location change effect.
 * Active item is highlighted based on the current route path.
 * Chat item shows a pulsing dot when a GSD session is running.
 */
export function SidebarNav() {
  const location = useLocation();
  const setActiveView = useUIStore((s) => s.setActiveView);
  const sessionState = useGsdStore((s) => s.sessionState);

  // Sync Zustand activeView with current route on every location change
  useEffect(() => {
    const match = navItems.find((item) => item.path === location.pathname);
    if (match) {
      setActiveView(match.view);
    }
  }, [location.pathname, setActiveView]);

  const isLive =
    sessionState === "connected" ||
    sessionState === "streaming" ||
    sessionState === "connecting";

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const showDot = item.path === "/chat" && isLive;

        return (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton asChild isActive={isActive}>
              <Link to={item.path}>
                <span className="relative">
                  <item.icon />
                  {showDot && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span
                        className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          sessionState === "streaming"
                            ? "animate-ping bg-blue-400"
                            : "bg-green-400"
                        }`}
                      />
                      <span
                        className={`relative inline-flex h-2 w-2 rounded-full ${
                          sessionState === "streaming" ? "bg-blue-500" : "bg-green-500"
                        }`}
                      />
                    </span>
                  )}
                </span>
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export { navItems };
