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
 */
export function SidebarNav() {
  const location = useLocation();
  const setActiveView = useUIStore((s) => s.setActiveView);

  // Sync Zustand activeView with current route on every location change
  useEffect(() => {
    const match = navItems.find((item) => item.path === location.pathname);
    if (match) {
      setActiveView(match.view);
    }
  }, [location.pathname, setActiveView]);

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton asChild isActive={isActive}>
              <Link to={item.path}>
                <item.icon />
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
