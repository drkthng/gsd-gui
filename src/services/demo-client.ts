// ---------------------------------------------------------------------------
// Demo GSD Client — in-memory mock backend for browser mode
// When the app runs outside Tauri (e.g. `vite dev` in a browser), this
// client provides realistic demo data so all pages are functional.
// ---------------------------------------------------------------------------

import type { GsdClient } from "./gsd-client";
import type {
  SavedProject,
  MilestoneInfo,
  QuerySnapshot,
  ProjectInfo,
  SessionInfo,
  PreferencesData,
  ActivityEntry,
  GsdEventPayload,
  GsdExitPayload,
  GsdErrorPayload,
  GsdFileChangedPayload,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const demoProjects: SavedProject[] = [
  {
    id: "demo-1",
    name: "gsd-gui",
    path: "D:/AiProjects/gsd-gui",
    description: "Tauri 2 desktop GUI for GSD — this project",
    addedAt: "2026-03-15T10:00:00Z",
  },
  {
    id: "demo-2",
    name: "my-saas-app",
    path: "D:/Projects/my-saas-app",
    description: "Full-stack SaaS starter with auth, billing, and dashboards",
    addedAt: "2026-03-18T14:30:00Z",
  },
  {
    id: "demo-3",
    name: "open-source-lib",
    path: "D:/Projects/open-source-lib",
    description: "TypeScript utility library for data transformations",
    addedAt: "2026-03-20T09:15:00Z",
  },
];

const demoMilestones: MilestoneInfo[] = [
  {
    id: "M001",
    title: "Project Scaffolding & Core Shell",
    status: "done",
    cost: 2.40,
    progress: 100,
    slices: [
      {
        id: "S01",
        title: "Vite + Tauri scaffold",
        status: "done",
        risk: "high",
        cost: 0.80,
        progress: 100,
        depends: [],
        tasks: [
          { id: "T01", title: "Scaffold Vite project", status: "done", cost: 0.30, duration: "12m" },
          { id: "T02", title: "Add Tauri backend", status: "done", cost: 0.50, duration: "18m" },
        ],
      },
      {
        id: "S02",
        title: "shadcn/ui & theming",
        status: "done",
        risk: "low",
        cost: 0.60,
        progress: 100,
        depends: ["S01"],
        tasks: [
          { id: "T01", title: "Install shadcn components", status: "done", cost: 0.35, duration: "8m" },
          { id: "T02", title: "Theme provider + mode toggle", status: "done", cost: 0.25, duration: "6m" },
        ],
      },
      {
        id: "S03",
        title: "App shell & routing",
        status: "done",
        risk: "medium",
        cost: 1.00,
        progress: 100,
        depends: ["S02"],
        tasks: [
          { id: "T01", title: "Sidebar navigation", status: "done", cost: 0.40, duration: "10m" },
          { id: "T02", title: "React Router setup", status: "done", cost: 0.30, duration: "8m" },
          { id: "T03", title: "Status bar", status: "done", cost: 0.30, duration: "7m" },
        ],
      },
    ],
  },
  {
    id: "M002",
    title: "Backend Bridge",
    status: "done",
    cost: 4.80,
    progress: 100,
    slices: [
      {
        id: "S01",
        title: "Rust process manager",
        status: "done",
        risk: "high",
        cost: 1.50,
        progress: 100,
        depends: [],
        tasks: [
          { id: "T01", title: "gsd_process.rs", status: "done", cost: 0.80, duration: "25m" },
          { id: "T02", title: "gsd_rpc.rs", status: "done", cost: 0.70, duration: "20m" },
        ],
      },
      {
        id: "S02",
        title: "File watcher & query engine",
        status: "done",
        risk: "medium",
        cost: 1.70,
        progress: 100,
        depends: ["S01"],
        tasks: [
          { id: "T01", title: "gsd_watcher.rs", status: "done", cost: 0.90, duration: "15m" },
          { id: "T02", title: "gsd_query.rs", status: "done", cost: 0.80, duration: "12m" },
        ],
      },
      {
        id: "S03",
        title: "Frontend stores & hooks",
        status: "done",
        risk: "medium",
        cost: 1.60,
        progress: 100,
        depends: ["S01", "S02"],
        tasks: [
          { id: "T01", title: "gsd-store", status: "done", cost: 0.50, duration: "15m" },
          { id: "T02", title: "project-store", status: "done", cost: 0.40, duration: "10m" },
          { id: "T03", title: "useGsdEvents hook", status: "done", cost: 0.70, duration: "18m" },
        ],
      },
    ],
  },
  {
    id: "M003",
    title: "Core Screens",
    status: "in-progress",
    cost: 3.20,
    progress: 60,
    slices: [
      {
        id: "S01",
        title: "Project gallery & import",
        status: "done",
        risk: "low",
        cost: 1.20,
        progress: 100,
        depends: [],
        tasks: [
          { id: "T01", title: "Project card component", status: "done", cost: 0.40, duration: "8m" },
          { id: "T02", title: "Gallery grid + search", status: "done", cost: 0.50, duration: "10m" },
          { id: "T03", title: "Import dialog", status: "done", cost: 0.30, duration: "6m" },
        ],
      },
      {
        id: "S02",
        title: "Chat interface",
        status: "in-progress",
        risk: "medium",
        cost: 1.40,
        progress: 50,
        depends: ["S01"],
        tasks: [
          { id: "T01", title: "Message display + markdown", status: "done", cost: 0.60, duration: "14m" },
          { id: "T02", title: "Streaming response handler", status: "in-progress", cost: 0.50, duration: null },
          { id: "T03", title: "Chat history persistence", status: "pending", cost: 0.30, duration: null },
        ],
      },
      {
        id: "S03",
        title: "Auto mode controls",
        status: "pending",
        risk: "low",
        cost: 0.60,
        progress: 0,
        depends: ["S02"],
        tasks: [
          { id: "T01", title: "Start/stop/pause buttons", status: "pending", cost: 0.30, duration: null },
          { id: "T02", title: "Step mode integration", status: "pending", cost: 0.30, duration: null },
        ],
      },
    ],
  },
];

const demoSessions: SessionInfo[] = [
  {
    id: "sess-abc123",
    name: "M003/S02/T02 — Streaming response handler",
    messageCount: 42,
    cost: 1.85,
    createdAt: "2026-03-25T14:00:00Z",
    lastActiveAt: "2026-03-25T15:30:00Z",
    preview: "Implementing the streaming response handler for the chat interface...",
    parentId: null,
    isActive: true,
  },
  {
    id: "sess-def456",
    name: "M003/S01/T03 — Import dialog",
    messageCount: 28,
    cost: 0.95,
    createdAt: "2026-03-24T10:00:00Z",
    lastActiveAt: "2026-03-24T11:15:00Z",
    preview: "Building the project import dialog with file picker integration...",
    parentId: null,
    isActive: false,
  },
  {
    id: "sess-ghi789",
    name: "M002/S03/T03 — useGsdEvents hook",
    messageCount: 55,
    cost: 2.10,
    createdAt: "2026-03-22T09:00:00Z",
    lastActiveAt: "2026-03-22T11:45:00Z",
    preview: "Creating the useGsdEvents React hook for real-time event streaming...",
    parentId: null,
    isActive: false,
  },
  {
    id: "sess-jkl012",
    name: "Quick bug fix — sidebar collapse",
    messageCount: 12,
    cost: 0.35,
    createdAt: "2026-03-21T16:00:00Z",
    lastActiveAt: "2026-03-21T16:20:00Z",
    preview: "The sidebar collapse animation is janky on first toggle...",
    parentId: null,
    isActive: false,
  },
];

const demoPreferences: PreferencesData = {
  version: 1,
  mode: "auto",
  git: {
    isolation: "worktree",
    main_branch: "main",
    auto_push: false,
  },
  custom_instructions: [
    "Always use TypeScript strict mode",
    "Prefer functional components with hooks",
  ],
  always_use_skills: ["lint", "test"],
  prefer_skills: ["react-best-practices"],
  avoid_skills: [],
};

const demoActivity: ActivityEntry[] = [
  {
    id: "act-001",
    action: "execute-task",
    milestoneId: "M003",
    sliceId: "S02",
    taskId: "T02",
    timestamp: "2026-03-25T15:30:00Z",
    messageCount: 42,
  },
  {
    id: "act-002",
    action: "plan-slice",
    milestoneId: "M003",
    sliceId: "S03",
    taskId: null,
    timestamp: "2026-03-25T14:00:00Z",
    messageCount: 15,
  },
  {
    id: "act-003",
    action: "execute-task",
    milestoneId: "M003",
    sliceId: "S01",
    taskId: "T03",
    timestamp: "2026-03-24T11:15:00Z",
    messageCount: 28,
  },
  {
    id: "act-004",
    action: "complete-slice",
    milestoneId: "M003",
    sliceId: "S01",
    taskId: null,
    timestamp: "2026-03-24T11:20:00Z",
    messageCount: 5,
  },
  {
    id: "act-005",
    action: "execute-task",
    milestoneId: "M002",
    sliceId: "S03",
    taskId: "T03",
    timestamp: "2026-03-22T11:45:00Z",
    messageCount: 55,
  },
  {
    id: "act-006",
    action: "plan-milestone",
    milestoneId: "M003",
    sliceId: null,
    taskId: null,
    timestamp: "2026-03-22T09:00:00Z",
    messageCount: 20,
  },
  {
    id: "act-007",
    action: "complete-milestone",
    milestoneId: "M002",
    sliceId: null,
    taskId: null,
    timestamp: "2026-03-21T17:00:00Z",
    messageCount: 8,
  },
];

// ---------------------------------------------------------------------------
// Simulated event system
// ---------------------------------------------------------------------------

type EventHandler<T> = (payload: T) => void;

const eventHandlers: {
  gsdEvent: EventHandler<GsdEventPayload>[];
  processExit: EventHandler<GsdExitPayload>[];
  processError: EventHandler<GsdErrorPayload>[];
  fileChanged: EventHandler<GsdFileChangedPayload>[];
} = {
  gsdEvent: [],
  processExit: [],
  processError: [],
  fileChanged: [],
};

function simulateStreamingResponse(userMessage: string): void {
  // Simulate agent_start
  const startPayload: GsdEventPayload = {
    raw: JSON.stringify({ type: "agent_start", session_id: "demo-session" }),
    timestamp: Date.now(),
  };
  eventHandlers.gsdEvent.forEach((h) => h(startPayload));

  // Generate a contextual response
  const response = generateDemoResponse(userMessage);
  const words = response.split(" ");

  // Stream words in chunks
  let index = 0;
  const chunkSize = 3;
  const interval = setInterval(() => {
    if (index >= words.length) {
      // Final chunk
      const donePayload: GsdEventPayload = {
        raw: JSON.stringify({ type: "assistant_message", content: "", done: true }),
        timestamp: Date.now(),
      };
      eventHandlers.gsdEvent.forEach((h) => h(donePayload));

      // agent_end
      const endPayload: GsdEventPayload = {
        raw: JSON.stringify({ type: "agent_end", session_id: "demo-session" }),
        timestamp: Date.now(),
      };
      eventHandlers.gsdEvent.forEach((h) => h(endPayload));

      clearInterval(interval);
      return;
    }

    const chunk = words.slice(index, index + chunkSize).join(" ") + " ";
    const msgPayload: GsdEventPayload = {
      raw: JSON.stringify({ type: "assistant_message", content: chunk, done: false }),
      timestamp: Date.now(),
    };
    eventHandlers.gsdEvent.forEach((h) => h(msgPayload));
    index += chunkSize;
  }, 80);
}

function generateDemoResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes("who are you") || lower.includes("what are you")) {
    return "I'm GSD — Get Shit Done. I'm a coding agent that helps you plan, execute, and verify software projects. I work in milestones, slices, and tasks with full observability. This is a demo response — in a real Tauri session, I'd be connected to the actual GSD backend.";
  }

  if (lower.includes("help") || lower.includes("what can you do")) {
    return "I can help with: planning milestones and slices, writing and reviewing code, running tests, debugging issues, managing project state, and tracking costs. Use `/gsd auto` to start auto-mode, or just describe what you need. This is demo mode — connect via Tauri for real functionality.";
  }

  if (lower.includes("status") || lower.includes("progress")) {
    return "Current project status: M003 is in progress (60% complete). S01 (Project gallery) is done, S02 (Chat interface) is 50% through — streaming handler is being worked on. S03 (Auto mode controls) is pending. Total cost so far: $10.40 across 3 milestones.";
  }

  if (lower.includes("test") || lower.includes("run test")) {
    return "Running tests... All 381 tests pass across 55 test files. No regressions detected. Last run: 4.2s. Coverage: 87% statements, 82% branches.";
  }

  return `I received your message: "${userMessage}". This is a demo response — the app is running in browser mode without the Tauri backend. In a real session, GSD would process your request and stream a response. Try importing a project and exploring the milestones and costs views!`;
}

// ---------------------------------------------------------------------------
// Demo client state
// ---------------------------------------------------------------------------

let sessionConnected = false;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createDemoClient(): GsdClient {
  console.log(
    "%c[GSD Demo Mode]%c Running without Tauri backend — using in-memory demo data",
    "color: #f59e0b; font-weight: bold",
    "color: inherit",
  );

  return {
    startSession: async (_projectPath: string) => {
      sessionConnected = true;
    },

    stopSession: async () => {
      sessionConnected = false;
    },

    sendCommand: async (command) => {
      if (command.type === "prompt" && sessionConnected) {
        // Simulate async response
        setTimeout(() => simulateStreamingResponse(command.text), 200);
      }
    },

    queryState: async (_projectPath: string): Promise<QuerySnapshot> => ({
      currentMilestone: "M003",
      activeTasks: 2,
      totalCost: 10.40,
    }),

    listProjects: async (_scanPath: string): Promise<ProjectInfo[]> =>
      demoProjects.map((p) => ({ id: p.id, name: p.name, path: p.path })),

    startFileWatcher: async () => {},
    stopFileWatcher: async () => {},

    parseProjectMilestones: async (_projectPath: string): Promise<MilestoneInfo[]> =>
      demoMilestones,

    getSavedProjects: async (): Promise<SavedProject[]> => demoProjects,

    addProject: async (projectPath: string, description?: string): Promise<SavedProject> => {
      const name = projectPath.split(/[/\\]/).pop() || "new-project";
      const newProject: SavedProject = {
        id: `demo-${Date.now()}`,
        name,
        path: projectPath,
        description: description ?? null,
        addedAt: new Date().toISOString(),
      };
      demoProjects.push(newProject);
      return newProject;
    },

    removeProject: async (projectId: string) => {
      const idx = demoProjects.findIndex((p) => p.id === projectId);
      if (idx >= 0) demoProjects.splice(idx, 1);
    },

    listSessions: async (_projectPath: string): Promise<SessionInfo[]> =>
      demoSessions,

    readPreferences: async (_projectPath: string): Promise<PreferencesData> =>
      structuredClone(demoPreferences),

    writePreferences: async (_projectPath: string, data: PreferencesData): Promise<void> => {
      Object.assign(demoPreferences, data);
    },

    listActivity: async (_projectPath: string): Promise<ActivityEntry[]> =>
      demoActivity,

    onGsdEvent: async (handler) => {
      eventHandlers.gsdEvent.push(handler);
      return () => {
        const idx = eventHandlers.gsdEvent.indexOf(handler);
        if (idx >= 0) eventHandlers.gsdEvent.splice(idx, 1);
      };
    },

    onProcessExit: async (handler) => {
      eventHandlers.processExit.push(handler);
      return () => {
        const idx = eventHandlers.processExit.indexOf(handler);
        if (idx >= 0) eventHandlers.processExit.splice(idx, 1);
      };
    },

    onProcessError: async (handler) => {
      eventHandlers.processError.push(handler);
      return () => {
        const idx = eventHandlers.processError.indexOf(handler);
        if (idx >= 0) eventHandlers.processError.splice(idx, 1);
      };
    },

    onFileChanged: async (handler) => {
      eventHandlers.fileChanged.push(handler);
      return () => {
        const idx = eventHandlers.fileChanged.indexOf(handler);
        if (idx >= 0) eventHandlers.fileChanged.splice(idx, 1);
      };
    },
  };
}
