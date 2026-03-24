// GSD Client — IPC abstraction layer
// This is the ONLY file in the frontend that may import @tauri-apps/api.
// Currently uses no-op implementations. Real Tauri IPC will be wired in M002.

export interface GsdSession {
  id: string;
  startedAt: string;
}

export interface CommandResult {
  success: boolean;
  data: unknown;
}

export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
}

export interface GsdState {
  currentMilestone: string | null;
  activeTasks: number;
  totalCost: number;
}

export interface GsdClient {
  startSession: () => Promise<GsdSession>;
  stopSession: () => Promise<void>;
  sendCommand: (
    command: string,
    args?: Record<string, unknown>,
  ) => Promise<CommandResult>;
  queryState: () => Promise<GsdState>;
  listProjects: () => Promise<ProjectInfo[]>;
}

export function createGsdClient(): GsdClient {
  return {
    startSession: async () => ({
      id: "no-op",
      startedAt: new Date().toISOString(),
    }),
    stopSession: async () => {},
    sendCommand: async () => ({ success: true, data: null }),
    queryState: async () => ({
      currentMilestone: null,
      activeTasks: 0,
      totalCost: 0,
    }),
    listProjects: async () => [],
  };
}
