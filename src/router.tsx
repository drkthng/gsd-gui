import { ChatPage } from "@/pages/chat-page";
import { ProjectsPage } from "@/pages/projects-page";
import { MilestonesPage } from "@/pages/milestones-page";
import { TimelinePage } from "@/pages/timeline-page";
import { CostsPage } from "@/pages/costs-page";
import { SettingsPage } from "@/pages/settings-page";
import { ProToolsPage } from "@/pages/pro-tools-page";
import {
  LogViewerPanel,
  DebuggerPanel,
  MetricsPanel,
  TraceViewerPanel,
  SessionManagerPanel,
  StateInspectorPanel,
  SecretsPanel,
  ConfigEditorPanel,
  BenchmarksPanel,
  ResourceMonitorPanel,
  PromptLabPanel,
  AbTestingPanel,
  DependencyGraphPanel,
  CoverageMapPanel,
  TokenUsagePanel,
  ThemePreviewPanel,
} from "@/components/pro-tools/panels";
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
  { path: "/pro-tools", element: <ProToolsPage />, view: "pro-tools" },
  { path: "/pro-tools/log-viewer", element: <LogViewerPanel />, view: "pro-tools" },
  { path: "/pro-tools/debugger", element: <DebuggerPanel />, view: "pro-tools" },
  { path: "/pro-tools/metrics", element: <MetricsPanel />, view: "pro-tools" },
  { path: "/pro-tools/trace-viewer", element: <TraceViewerPanel />, view: "pro-tools" },
  { path: "/pro-tools/session-manager", element: <SessionManagerPanel />, view: "pro-tools" },
  { path: "/pro-tools/state-inspector", element: <StateInspectorPanel />, view: "pro-tools" },
  { path: "/pro-tools/secrets", element: <SecretsPanel />, view: "pro-tools" },
  { path: "/pro-tools/config-editor", element: <ConfigEditorPanel />, view: "pro-tools" },
  { path: "/pro-tools/benchmarks", element: <BenchmarksPanel />, view: "pro-tools" },
  { path: "/pro-tools/resource-monitor", element: <ResourceMonitorPanel />, view: "pro-tools" },
  { path: "/pro-tools/prompt-lab", element: <PromptLabPanel />, view: "pro-tools" },
  { path: "/pro-tools/ab-testing", element: <AbTestingPanel />, view: "pro-tools" },
  { path: "/pro-tools/dependency-graph", element: <DependencyGraphPanel />, view: "pro-tools" },
  { path: "/pro-tools/coverage-map", element: <CoverageMapPanel />, view: "pro-tools" },
  { path: "/pro-tools/token-usage", element: <TokenUsagePanel />, view: "pro-tools" },
  { path: "/pro-tools/theme-preview", element: <ThemePreviewPanel />, view: "pro-tools" },
];

/** Only the navigable page routes (excludes the index redirect). */
export const pageRoutes = appRoutes.filter(
  (r): r is AppRoute => !("index" in r),
);
