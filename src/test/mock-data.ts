import type { MilestoneInfo, CostData, SessionInfo } from "@/lib/types";

export const mockMilestones: MilestoneInfo[] = [
  {
    id: "M001",
    title: "Project Scaffolding",
    status: "done",
    cost: 2.40,
    progress: 100,
    slices: [
      {
        id: "S01", title: "Vite + Tauri scaffold", status: "done", risk: "high",
        cost: 0.80, progress: 100, depends: [],
        tasks: [
          { id: "T01", title: "Scaffold Vite", status: "done", cost: 0.30, duration: "12m" },
          { id: "T02", title: "Add Tauri", status: "done", cost: 0.50, duration: "18m" },
        ],
      },
      {
        id: "S02", title: "shadcn/ui setup", status: "done", risk: "low",
        cost: 0.60, progress: 100, depends: ["S01"],
        tasks: [
          { id: "T01", title: "Install components", status: "done", cost: 0.60, duration: "8m" },
        ],
      },
    ],
  },
  {
    id: "M002",
    title: "Backend Bridge",
    status: "in-progress",
    cost: 3.10,
    progress: 50,
    slices: [
      {
        id: "S01", title: "Rust process manager", status: "done", risk: "high",
        cost: 1.50, progress: 100, depends: [],
        tasks: [
          { id: "T01", title: "gsd_process.rs", status: "done", cost: 0.80, duration: "25m" },
          { id: "T02", title: "gsd_rpc.rs", status: "done", cost: 0.70, duration: "20m" },
        ],
      },
      {
        id: "S02", title: "Frontend stores", status: "in-progress", risk: "medium",
        cost: 1.60, progress: 40, depends: ["S01"],
        tasks: [
          { id: "T01", title: "gsd-store", status: "done", cost: 0.90, duration: "15m" },
          { id: "T02", title: "project-store", status: "in-progress", cost: 0.70, duration: null },
        ],
      },
    ],
  },
];

export const mockCostData: CostData = {
  totalCost: 12.50,
  budgetCeiling: 50.0,
  byPhase: [
    { phase: "research", cost: 2.10 },
    { phase: "planning", cost: 1.80 },
    { phase: "execution", cost: 6.40 },
    { phase: "verification", cost: 2.20 },
  ],
  byModel: [
    { model: "Claude Sonnet", cost: 8.30 },
    { model: "Claude Haiku", cost: 3.10 },
    { model: "GPT-4o", cost: 1.10 },
  ],
  bySlice: [
    { sliceId: "S01", title: "Scaffold", cost: 2.40 },
    { sliceId: "S02", title: "UI setup", cost: 1.80 },
    { sliceId: "S03", title: "Process manager", cost: 3.50 },
    { sliceId: "S04", title: "Stores", cost: 2.60 },
    { sliceId: "S05", title: "Hooks", cost: 2.20 },
  ],
};

export const mockSessions: SessionInfo[] = [
  {
    id: "sess-1", name: "Scaffold project", messageCount: 24, cost: 1.20,
    createdAt: "2026-03-20T10:00:00Z", lastActiveAt: "2026-03-20T11:30:00Z",
    preview: "Create a new Tauri 2 project with React...", parentId: null, isActive: false,
  },
  {
    id: "sess-2", name: "Debug CI pipeline", messageCount: 18, cost: 0.85,
    createdAt: "2026-03-22T14:00:00Z", lastActiveAt: "2026-03-22T15:00:00Z",
    preview: "The failing test is in integration/...", parentId: null, isActive: false,
  },
  {
    id: "sess-3", name: "Auto mode M002/S03", messageCount: 42, cost: 3.20,
    createdAt: "2026-03-25T09:00:00Z", lastActiveAt: "2026-03-25T10:00:00Z",
    preview: "Starting auto mode for M002/S03...", parentId: null, isActive: true,
  },
  {
    id: "sess-4", name: "Steer: fix test mock", messageCount: 8, cost: 0.40,
    createdAt: "2026-03-25T09:30:00Z", lastActiveAt: "2026-03-25T09:45:00Z",
    preview: "The vi.hoisted pattern needs...", parentId: "sess-3", isActive: false,
  },
];
