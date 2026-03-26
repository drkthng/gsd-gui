// GSD Client — IPC abstraction layer
// This is the ONLY file in the frontend that may import @tauri-apps/api (D005).

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import type {
  RpcCommand,
  QuerySnapshot,
  ProjectInfo,
  SavedProject,
  MilestoneInfo,
  GsdEventPayload,
  GsdExitPayload,
  GsdErrorPayload,
  GsdFileChangedPayload,
} from "@/lib/types";

// Re-export types so downstream consumers import from gsd-client (D005 boundary)
export type {
  RpcCommand,
  QuerySnapshot,
  ProjectInfo,
  SavedProject,
  MilestoneInfo,
  GsdEventPayload,
  GsdExitPayload,
  GsdErrorPayload,
  GsdFileChangedPayload,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// GsdClient interface
// ---------------------------------------------------------------------------

export interface GsdClient {
  // Commands (invoke-based)
  startSession: (projectPath: string) => Promise<void>;
  stopSession: () => Promise<void>;
  sendCommand: (command: RpcCommand) => Promise<void>;
  queryState: (projectPath: string) => Promise<QuerySnapshot>;
  listProjects: (scanPath: string) => Promise<ProjectInfo[]>;
  startFileWatcher: (projectPath: string) => Promise<void>;
  stopFileWatcher: () => Promise<void>;
  // GSD parser
  parseProjectMilestones: (projectPath: string) => Promise<MilestoneInfo[]>;
  // Project registry
  getSavedProjects: () => Promise<SavedProject[]>;
  addProject: (projectPath: string, description?: string) => Promise<SavedProject>;
  removeProject: (projectId: string) => Promise<void>;
  // Event listeners (listen-based) — return unlisten functions
  onGsdEvent: (
    handler: (payload: GsdEventPayload) => void,
  ) => Promise<() => void>;
  onProcessExit: (
    handler: (payload: GsdExitPayload) => void,
  ) => Promise<() => void>;
  onProcessError: (
    handler: (payload: GsdErrorPayload) => void,
  ) => Promise<() => void>;
  onFileChanged: (
    handler: (payload: GsdFileChangedPayload) => void,
  ) => Promise<() => void>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createGsdClient(): GsdClient {
  return {
    // ---- invoke-based commands ----
    startSession: (projectPath: string) =>
      invoke("start_gsd_session", { projectPath }),

    stopSession: () => invoke("stop_gsd_session"),

    sendCommand: (command: RpcCommand) =>
      invoke("send_gsd_command", { command: JSON.stringify(command) }),

    queryState: (projectPath: string) =>
      invoke<QuerySnapshot>("query_gsd_state", { projectPath }),

    listProjects: (scanPath: string) =>
      invoke<ProjectInfo[]>("list_projects", { scanPath }),

    startFileWatcher: (projectPath: string) =>
      invoke("start_file_watcher", { projectPath }),

    stopFileWatcher: () => invoke("stop_file_watcher"),

    // ---- GSD parser ----
    parseProjectMilestones: (projectPath: string) =>
      invoke<MilestoneInfo[]>("parse_project_milestones", { projectPath }),

    // ---- project registry ----
    getSavedProjects: () =>
      invoke<SavedProject[]>("get_saved_projects"),

    addProject: (projectPath: string, description?: string) =>
      invoke<SavedProject>("add_project", { projectPath, description: description ?? null }),

    removeProject: (projectId: string) =>
      invoke("remove_project", { projectId }),

    // ---- listen-based event subscriptions ----
    onGsdEvent: (handler) =>
      listen<GsdEventPayload>("gsd-event", (event) =>
        handler(event.payload),
      ).then((unlisten) => unlisten),

    onProcessExit: (handler) =>
      listen<GsdExitPayload>("gsd-process-exit", (event) =>
        handler(event.payload),
      ).then((unlisten) => unlisten),

    onProcessError: (handler) =>
      listen<GsdErrorPayload>("gsd-process-error", (event) =>
        handler(event.payload),
      ).then((unlisten) => unlisten),

    onFileChanged: (handler) =>
      listen<GsdFileChangedPayload>("gsd-file-changed", (event) =>
        handler(event.payload),
      ).then((unlisten) => unlisten),
  };
}
