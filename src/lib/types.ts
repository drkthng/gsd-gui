// ---------------------------------------------------------------------------
// Shared TypeScript types mirroring Rust IPC structs
// This is the single source of truth for all frontend ↔ Tauri boundary types.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// RPC Commands (frontend → GSD process via stdin)
// Mirrors: src-tauri/src/gsd_rpc.rs — RpcCommand
// serde(tag = "type", rename_all = "snake_case")
// ---------------------------------------------------------------------------

export type RpcCommand =
  | { type: "prompt"; text: string }
  | { type: "steer"; text: string }
  | { type: "abort" }
  | { type: "get_state" }
  | { type: "set_model"; model: string }
  | { type: "get_available_models" }
  | { type: "get_session_stats" }
  | { type: "get_messages" }
  | { type: "new_session" };

// ---------------------------------------------------------------------------
// RPC Events (GSD process → frontend via stdout)
// Mirrors: src-tauri/src/gsd_rpc.rs — RpcEvent
// serde(tag = "type", rename_all = "snake_case")
// Field names stay snake_case in JSON (no rename_all on struct fields).
// ---------------------------------------------------------------------------

export type RpcEvent =
  | { type: "agent_start"; session_id: string }
  | { type: "agent_end"; session_id: string }
  | { type: "assistant_message"; content: string; done: boolean }
  | { type: "tool_execution_start"; tool: string; id: string }
  | { type: "tool_execution_end"; tool: string; id: string; success: boolean }
  | {
      type: "response";
      command: string;
      success: boolean;
      data?: unknown;
      error?: string;
    }
  | { type: "extensions_ready" }
  | {
      type: "extension_ui_request";
      id: string;
      method: string;
      message?: string;
      notifyType?: string;
      statusKey?: string;
      payload?: unknown;
    }
  | { type: "session_state_changed"; payload: unknown }
  | { type: "error"; message: string }
  | { type: string; [key: string]: unknown };

// ---------------------------------------------------------------------------
// Query types
// Mirrors: src-tauri/src/gsd_query.rs
// serde(rename_all = "camelCase")
// ---------------------------------------------------------------------------

/** Snapshot of GSD project state, returned by `query_gsd_state` command. */
export interface QuerySnapshot {
  currentMilestone: string | null;
  activeTasks: number;
  totalCost: number;
}

/** A discovered GSD project directory. */
export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
}

/** A project stored in the persistent registry. */
export interface SavedProject {
  id: string;
  name: string;
  path: string;
  description: string | null;
  addedAt: string;
}

/** Extended project info for gallery display. Built client-side from ProjectInfo + QuerySnapshot. */
export interface ProjectDisplayInfo extends ProjectInfo {
  status: "active" | "paused" | "idle";
  currentMilestone: string | null;
  totalCost: number;
  progress: number; // 0-100
  lastActivity: string | null; // ISO timestamp or null
}

// ---------------------------------------------------------------------------
// Milestone / Slice / Task tree types (for progress dashboard & roadmap)
// ---------------------------------------------------------------------------

export type CompletionStatus = "done" | "in-progress" | "pending" | "blocked";
export type RiskLevel = "low" | "medium" | "high";

export interface TaskInfo {
  id: string;
  title: string;
  status: CompletionStatus;
  cost: number;
  duration: string | null;
}

export interface SliceInfo {
  id: string;
  title: string;
  status: CompletionStatus;
  risk: RiskLevel;
  cost: number;
  progress: number; // 0-100
  tasks: TaskInfo[];
  depends: string[];
}

export interface MilestoneInfo {
  id: string;
  title: string;
  status: CompletionStatus;
  cost: number;
  progress: number; // 0-100
  slices: SliceInfo[];
}

// ---------------------------------------------------------------------------
// Cost data types (for cost overview charts)
// ---------------------------------------------------------------------------

export interface CostByPhase {
  phase: string;
  cost: number;
}

export interface CostByModel {
  model: string;
  cost: number;
}

export interface CostData {
  totalCost: number;
  budgetCeiling: number | null;
  byPhase: CostByPhase[];
  byModel: CostByModel[];
  bySlice: { sliceId: string; title: string; cost: number }[];
}

// ---------------------------------------------------------------------------
// Session types (for session browser)
// ---------------------------------------------------------------------------

export interface SessionInfo {
  id: string;
  name: string;
  messageCount: number;
  cost: number;
  createdAt: string; // ISO
  lastActiveAt: string; // ISO
  preview: string; // first message preview
  parentId: string | null;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Preferences data (from preferences.md YAML frontmatter)
// Keys are camelCase matching Rust serde(rename_all = "camelCase") output.
// Mirrors: src-tauri/src/preferences_parser.rs — returns serde_json::Value
// ---------------------------------------------------------------------------

export interface PreferencesData {
  version?: number;
  mode?: string;
  git?: {
    isolation?: string;
    main_branch?: string;
    auto_push?: boolean;
  };
  custom_instructions?: string[];
  always_use_skills?: string[];
  prefer_skills?: string[];
  avoid_skills?: string[];
  [key: string]: unknown; // allow arbitrary YAML fields — keys are snake_case from YAML source
}

// ---------------------------------------------------------------------------
// Activity entry (from activity JSONL files)
// Mirrors: src-tauri/src/activity_parser.rs — ActivityEntry
// serde(rename_all = "camelCase")
// ---------------------------------------------------------------------------

export interface ActivityEntry {
  id: string;
  action: string; // "plan-slice", "execute-task", etc.
  milestoneId: string;
  sliceId: string | null;
  taskId: string | null;
  timestamp: string; // ISO
  messageCount: number;
}

// ---------------------------------------------------------------------------
// Process event payloads
// Mirrors: src-tauri/src/gsd_process.rs
// No rename_all — fields are single-word, so no casing issue.
// ---------------------------------------------------------------------------

/** Payload emitted as a `gsd-event` Tauri event for each JSONL line from stdout. */
export interface GsdEventPayload {
  raw: string;
  timestamp: number;
}

/** Payload emitted as `gsd-process-exit`. */
export interface GsdExitPayload {
  code: number | null;
  timestamp: number;
}

/** Payload emitted as `gsd-process-error`. */
export interface GsdErrorPayload {
  message: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// File watcher payload
// Mirrors: src-tauri/src/gsd_watcher.rs
// serde(rename_all = "camelCase") — but all fields are single-word anyway.
// ---------------------------------------------------------------------------

/** Payload for `gsd-file-changed` events. */
export interface GsdFileChangedPayload {
  path: string;
  kind: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Session state
// ---------------------------------------------------------------------------

/** Possible states of the GSD agent session. */
export type SessionState =
  | "idle"
  | "connecting"
  | "connected"
  | "streaming"
  | "disconnected"
  | "error";

// ---------------------------------------------------------------------------
// Project metadata (detected by detect_project_metadata Tauri command)
// Mirrors: src-tauri/src/gsd_detect.rs — ProjectMetadata
// serde(rename_all = "camelCase")
// ---------------------------------------------------------------------------

/** Filesystem metadata auto-detected for a candidate project folder. */
export interface ProjectMetadata {
  /** Project name from package.json `name` field, or null if absent. */
  detectedName: string | null;
  /** True if a .git/ directory exists at the project root. */
  isGit: boolean;
  /** Inferred language: "TypeScript", "JavaScript", or null. */
  language: string | null;
  /** True if a .gsd/ directory exists at the project root. */
  hasGsd: boolean;
  /** True if a .planning/ directory exists at the project root. */
  hasPlanning: boolean;
}
