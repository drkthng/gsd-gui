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
      type: "extension_ui_request";
      request_id: string;
      kind: string;
      payload: unknown;
    }
  | { type: "session_state_changed"; payload: unknown }
  | { type: "error"; message: string };

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
