import { Outlet } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { SidebarNav } from "./sidebar-nav";
import { StatusBar } from "@/components/status-bar/status-bar";
import { ModeToggle } from "@/components/mode-toggle";
import { useGsdEvents } from "@/hooks/use-gsd-events";
import { useToastNotifications } from "@/hooks/use-toast-notifications";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { UIRequestDialog } from "@/components/controls";

/**
 * Root app shell layout composing sidebar navigation, main content, and status bar.
 *
 * Structure:
 * - SidebarProvider manages sidebar open/close state
 * - Sidebar renders header, navigation items, and footer
 * - SidebarInset holds the main content area (via Outlet) and the StatusBar
 *
 * The shadcn/ui Sidebar automatically switches to a Sheet on mobile viewports
 * (< 768px) via the useIsMobile hook.
 */
export function AppShell() {
  // Subscribe to all GSD events and route them to stores
  useGsdEvents();

  // Fire toast notifications on GSD state changes
  useToastNotifications();

  // Register global keyboard shortcuts (Ctrl+N, Ctrl+1-7, Escape)
  useKeyboardShortcuts();

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-2 px-2 py-1">
            <span className="text-lg font-bold tracking-tight">GSD</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <nav aria-label="Main navigation">
                <SidebarNav />
              </nav>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t">
          <div className="flex items-center justify-between gap-2">
            <ModeToggle />
            <SidebarTrigger className="mx-auto" />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-1 flex-col overflow-auto">
          <div className="flex items-center gap-2 border-b px-4 py-2 md:hidden">
            <SidebarTrigger />
            <span className="text-sm font-medium">GSD</span>
          </div>
          <div className="flex-1 overflow-auto transition-colors duration-200">
            <Outlet />
          </div>
          <StatusBar />
        </div>
        <UIRequestDialog />
      </SidebarInset>
    </SidebarProvider>
  );
}
