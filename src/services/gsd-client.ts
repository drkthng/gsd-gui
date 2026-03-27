// GSD Client — IPC abstraction layer
// This is the ONLY file in the frontend that may import @tauri-apps/api (D005).
// When running outside Tauri (browser dev mode), a demo client is used instead.
//
// IMPORTANT: @tauri-apps/api is imported DYNAMICALLY inside createTauriClient()
// to avoid crashing in browser mode. The module-level code in @tauri-apps/api/core
// accesses window.__TAURI_INTERNALS__ which doesn't exist outside Tauri, causing
// "Cannot read properties of undefined (reading 'transformCallback')" errors.

import { createDemoClient } from "./demo-client";

import type {
  RpcCommand,
  QuerySnapshot,
  ProjectInfo,
  SavedProject,
  MilestoneInfo,
  SessionInfo,
  PreferencesData,
  ActivityEntry,
  GsdEventPayload,
  GsdExitPayload,
  GsdErrorPayload,
  GsdFileChangedPayload,
  ProjectMetadata,
  GsdVersionInfo,
  GsdUpgradeProgressPayload,
} from "@/lib/types";

// Re-export types so downstream consumers import from gsd-client (D005 boundary)
export type {
  RpcCommand,
  QuerySnapshot,
  ProjectInfo,
  SavedProject,
  MilestoneInfo,
  SessionInfo,
  PreferencesData,
  ActivityEntry,
  GsdEventPayload,
  GsdExitPayload,
  GsdErrorPayload,
  GsdFileChangedPayload,
  ProjectMetadata,
  GsdVersionInfo,
  GsdUpgradeProgressPayload,
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
  // Session / preferences / activity parsers
  listSessions: (projectPath: string) => Promise<SessionInfo[]>;
  readPreferences: (projectPath: string) => Promise<PreferencesData>;
  writePreferences: (projectPath: string, data: PreferencesData) => Promise<void>;
  listActivity: (projectPath: string) => Promise<ActivityEntry[]>;
  // Project init & metadata detection
  initProject: (path: string) => Promise<void>;
  detectProjectMetadata: (path: string) => Promise<ProjectMetadata>;
  // GSD version / upgrade
  checkGsdVersion: () => Promise<GsdVersionInfo>;
  upgradeGsd: () => Promise<void>;
  onUpgradeProgress: (
    handler: (payload: GsdUpgradeProgressPayload) => void,
  ) => Promise<() => void>;
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
// Tauri detection
// ---------------------------------------------------------------------------

/** Returns true when running inside the Tauri webview (not a plain browser). */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

// ---------------------------------------------------------------------------
// Tauri client (real IPC)
// ---------------------------------------------------------------------------

function createTauriClient(): GsdClient {
  // Lazy-load Tauri APIs to avoid module-level crashes in browser mode
  const getInvoke = () => import("@tauri-apps/api/core").then((m) => m.invoke);
  const getListen = () => import("@tauri-apps/api/event").then((m) => m.listen);

  return {
    startSession: async (projectPath: string) => {
      const invoke = await getInvoke();
      return invoke("start_gsd_session", { projectPath });
    },

    stopSession: async () => {
      const invoke = await getInvoke();
      return invoke("stop_gsd_session");
    },

    sendCommand: async (command: RpcCommand) => {
      const invoke = await getInvoke();
      return invoke("send_gsd_command", { command: JSON.stringify(command) });
    },

    queryState: async (projectPath: string) => {
      const invoke = await getInvoke();
      return invoke<QuerySnapshot>("query_gsd_state", { projectPath });
    },

    listProjects: async (scanPath: string) => {
      const invoke = await getInvoke();
      return invoke<ProjectInfo[]>("list_projects", { scanPath });
    },

    startFileWatcher: async (projectPath: string) => {
      const invoke = await getInvoke();
      return invoke("start_file_watcher", { projectPath });
    },

    stopFileWatcher: async () => {
      const invoke = await getInvoke();
      return invoke("stop_file_watcher");
    },

    parseProjectMilestones: async (projectPath: string) => {
      const invoke = await getInvoke();
      return invoke<MilestoneInfo[]>("parse_project_milestones", { projectPath });
    },

    getSavedProjects: async () => {
      const invoke = await getInvoke();
      return invoke<SavedProject[]>("get_saved_projects");
    },

    addProject: async (projectPath: string, description?: string) => {
      const invoke = await getInvoke();
      return invoke<SavedProject>("add_project", { projectPath, description: description ?? null });
    },

    removeProject: async (projectId: string) => {
      const invoke = await getInvoke();
      return invoke("remove_project", { projectId });
    },

    listSessions: async (projectPath: string) => {
      const invoke = await getInvoke();
      return invoke<SessionInfo[]>("list_project_sessions_cmd", { projectPath });
    },

    readPreferences: async (projectPath: string) => {
      const invoke = await getInvoke();
      return invoke<PreferencesData>("read_preferences_cmd", { projectPath });
    },

    writePreferences: async (projectPath: string, data: PreferencesData) => {
      const invoke = await getInvoke();
      return invoke("write_preferences_cmd", { projectPath, prefs: data });
    },

    listActivity: async (projectPath: string) => {
      const invoke = await getInvoke();
      return invoke<ActivityEntry[]>("list_activity_cmd", { projectPath });
    },

    initProject: async (path: string) => {
      const invoke = await getInvoke();
      return invoke("init_project", { path });
    },

    detectProjectMetadata: async (path: string) => {
      const invoke = await getInvoke();
      return invoke<ProjectMetadata>("detect_project_metadata", { path });
    },

    checkGsdVersion: async () => {
      const invoke = await getInvoke();
      return invoke<GsdVersionInfo>("check_gsd_version");
    },

    upgradeGsd: async () => {
      const invoke = await getInvoke();
      return invoke("upgrade_gsd");
    },

    onUpgradeProgress: async (handler) => {
      const listen = await getListen();
      return listen<GsdUpgradeProgressPayload>("gsd-upgrade-progress", (event) =>
        handler(event.payload),
      );
    },

    onGsdEvent: async (handler) => {
      const listen = await getListen();
      return listen<GsdEventPayload>("gsd-event", (event) =>
        handler(event.payload),
      );
    },

    onProcessExit: async (handler) => {
      const listen = await getListen();
      return listen<GsdExitPayload>("gsd-process-exit", (event) =>
        handler(event.payload),
      );
    },

    onProcessError: async (handler) => {
      const listen = await getListen();
      return listen<GsdErrorPayload>("gsd-process-error", (event) =>
        handler(event.payload),
      );
    },

    onFileChanged: async (handler) => {
      const listen = await getListen();
      return listen<GsdFileChangedPayload>("gsd-file-changed", (event) =>
        handler(event.payload),
      );
    },
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createGsdClient(): GsdClient {
  return isTauri() ? createTauriClient() : createDemoClient();
}
