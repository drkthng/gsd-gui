import { ChatPage } from "@/pages/chat-page";
import { ProjectsPage } from "@/pages/projects-page";
import { MilestonesPage } from "@/pages/milestones-page";
import { TimelinePage } from "@/pages/timeline-page";
import { CostsPage } from "@/pages/costs-page";
import { SettingsPage } from "@/pages/settings-page";
import { HelpPage } from "@/pages/help-page";
import type { View } from "@/stores/ui-store";

export interface AppRoute {
  path: string;
  element: React.ReactElement;
  view: View;
}

export interface IndexRedirect {
  index: true;
  to: string;
}

export type RouteEntry = AppRoute | IndexRedirect;

/**
 * Application route definitions.
 *
 * Each route maps a URL path to a page component and its corresponding
 * View identifier from the UI store. The index entry redirects `/` → `/chat`.
 */
export const appRoutes: RouteEntry[] = [
  { index: true, to: "/chat" },
  { path: "/chat", element: <ChatPage />, view: "chat" },
  { path: "/projects", element: <ProjectsPage />, view: "projects" },
  { path: "/milestones", element: <MilestonesPage />, view: "milestones" },
  { path: "/timeline", element: <TimelinePage />, view: "timeline" },
  { path: "/costs", element: <CostsPage />, view: "costs" },
  { path: "/settings", element: <SettingsPage />, view: "settings" },
  { path: "/help", element: <HelpPage />, view: "help" },
];

/** Only the navigable page routes (excludes the index redirect). */
export const pageRoutes = appRoutes.filter(
  (r): r is AppRoute => !("index" in r),
);
