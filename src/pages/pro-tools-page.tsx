import { Wrench, type LucideIcon } from "lucide-react";
import {
  Layers,
  Monitor,
  GitBranch,
  Activity,
  FileText,
  Bug,
  BarChart3,
  Database,
  Key,
  Settings2,
  Gauge,
  Cpu,
  Zap,
  LineChart,
  Network,
  Eye,
  FlaskConical,
  Palette,
  ScrollText,
} from "lucide-react";
import { Link } from "react-router-dom";

export interface PanelCardDef {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  path: string;
}

export interface PanelCategory {
  name: string;
  panels: PanelCardDef[];
}

export const panelCategories: PanelCategory[] = [
  {
    name: "Orchestration",
    panels: [
      { id: "parallel", label: "Parallel", description: "Run tasks in parallel across agents", icon: Layers, path: "/pro-tools/parallel" },
      { id: "headless-launcher", label: "Headless Launcher", description: "Launch headless agent sessions", icon: Monitor, path: "/pro-tools/headless-launcher" },
      { id: "worktree", label: "Worktree", description: "Manage git worktrees for isolation", icon: GitBranch, path: "/pro-tools/worktree" },
      { id: "session-manager", label: "Session Manager", description: "Monitor and manage active sessions", icon: Activity, path: "/pro-tools/session-manager" },
    ],
  },
  {
    name: "Diagnostics",
    panels: [
      { id: "log-viewer", label: "Log Viewer", description: "Stream and filter agent logs", icon: FileText, path: "/pro-tools/log-viewer" },
      { id: "debugger", label: "Debugger", description: "Step-through agent execution debugger", icon: Bug, path: "/pro-tools/debugger" },
      { id: "metrics", label: "Metrics", description: "Real-time performance metrics", icon: BarChart3, path: "/pro-tools/metrics" },
      { id: "trace-viewer", label: "Trace Viewer", description: "Distributed trace visualization", icon: ScrollText, path: "/pro-tools/trace-viewer" },
    ],
  },
  {
    name: "Data & Config",
    panels: [
      { id: "state-inspector", label: "State Inspector", description: "Browse and edit runtime state", icon: Database, path: "/pro-tools/state-inspector" },
      { id: "secrets", label: "Secrets", description: "Manage environment secrets", icon: Key, path: "/pro-tools/secrets" },
      { id: "config-editor", label: "Config Editor", description: "Edit agent and project config", icon: Settings2, path: "/pro-tools/config-editor" },
    ],
  },
  {
    name: "Tuning",
    panels: [
      { id: "benchmarks", label: "Benchmarks", description: "Run and compare benchmarks", icon: Gauge, path: "/pro-tools/benchmarks" },
      { id: "resource-monitor", label: "Resource Monitor", description: "CPU, memory, and disk usage", icon: Cpu, path: "/pro-tools/resource-monitor" },
      { id: "prompt-lab", label: "Prompt Lab", description: "Experiment with prompt variations", icon: Zap, path: "/pro-tools/prompt-lab" },
      { id: "ab-testing", label: "A/B Testing", description: "Compare agent configurations", icon: FlaskConical, path: "/pro-tools/ab-testing" },
    ],
  },
  {
    name: "Visualization",
    panels: [
      { id: "dependency-graph", label: "Dependency Graph", description: "Visualize project dependencies", icon: Network, path: "/pro-tools/dependency-graph" },
      { id: "coverage-map", label: "Coverage Map", description: "Code coverage heat map", icon: Eye, path: "/pro-tools/coverage-map" },
      { id: "token-usage", label: "Token Usage", description: "Token consumption analytics", icon: LineChart, path: "/pro-tools/token-usage" },
      { id: "theme-preview", label: "Theme Preview", description: "Preview and customize themes", icon: Palette, path: "/pro-tools/theme-preview" },
    ],
  },
];

export function ProToolsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Wrench className="h-6 w-6 text-primary" data-testid="page-icon" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pro Tools</h1>
          <p className="text-sm text-muted-foreground">
            Advanced tools for orchestration, diagnostics, configuration, tuning, and visualization.
          </p>
        </div>
      </div>

      {panelCategories.map((category) => (
        <section key={category.name} data-testid="panel-category">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {category.name}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {category.panels.map((panel) => (
              <Link
                key={panel.id}
                to={panel.path}
                className="group flex items-start gap-3 rounded-lg border bg-card p-4 text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                data-testid="panel-card"
              >
                <div className="rounded-md bg-muted p-2 group-hover:bg-background">
                  <panel.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium">{panel.label}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {panel.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
