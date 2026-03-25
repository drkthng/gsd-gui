import { create } from "zustand";
import { createGsdClient } from "@/services/gsd-client";
import type {
  RpcEvent,
  GsdExitPayload,
  GsdErrorPayload,
  SessionState,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GsdMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface PendingUIRequest {
  request_id: string;
  kind: string;
  payload: unknown;
}

interface GsdState {
  sessionState: SessionState;
  messages: GsdMessage[];
  isStreaming: boolean;
  pendingUIRequests: PendingUIRequest[];
  error: string | null;
  activeProjectPath: string | null;

  // Actions
  connect: (projectPath: string) => Promise<void>;
  disconnect: () => Promise<void>;
  sendPrompt: (text: string) => Promise<void>;
  handleGsdEvent: (event: RpcEvent) => void;
  handleProcessExit: (payload: GsdExitPayload) => void;
  handleProcessError: (payload: GsdErrorPayload) => void;
  respondToUIRequest: (requestId: string, response: unknown) => Promise<void>;
  clearMessages: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const client = createGsdClient();

export const useGsdStore = create<GsdState>()((set, get) => ({
  sessionState: "idle",
  messages: [],
  isStreaming: false,
  pendingUIRequests: [],
  error: null,
  activeProjectPath: null,

  connect: async (projectPath: string) => {
    set({ sessionState: "connecting", activeProjectPath: projectPath, error: null });
    try {
      await client.startSession(projectPath);
      set({ sessionState: "connected" });
    } catch (err) {
      set({
        sessionState: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  disconnect: async () => {
    try {
      await client.stopSession();
    } catch {
      // Best-effort shutdown
    }
    set({
      sessionState: "disconnected",
      activeProjectPath: null,
      isStreaming: false,
    });
  },

  sendPrompt: async (text: string) => {
    const { sessionState } = get();
    if (sessionState !== "connected" && sessionState !== "streaming") return;
    const msg: GsdMessage = { role: "user", content: text, timestamp: Date.now() };
    set((s) => ({ messages: [...s.messages, msg] }));
    await client.sendCommand({ type: "prompt", text });
  },

  handleGsdEvent: (event: RpcEvent) => {
    switch (event.type) {
      case "agent_start":
        set({ isStreaming: true, sessionState: "streaming" });
        break;

      case "agent_end":
        set({ isStreaming: false, sessionState: "connected" });
        break;

      case "assistant_message": {
        set((s) => {
          const msgs = [...s.messages];
          const last = msgs[msgs.length - 1];
          if (last && last.role === "assistant" && !event.done) {
            // Append to existing streaming message
            msgs[msgs.length - 1] = { ...last, content: last.content + event.content };
          } else if (last && last.role === "assistant" && event.done) {
            // Final chunk — append content and mark done
            msgs[msgs.length - 1] = { ...last, content: last.content + event.content };
          } else {
            // New assistant message
            msgs.push({ role: "assistant", content: event.content, timestamp: Date.now() });
          }
          return { messages: msgs };
        });
        break;
      }

      case "extension_ui_request":
        set((s) => ({
          pendingUIRequests: [
            ...s.pendingUIRequests,
            { request_id: event.request_id, kind: event.kind, payload: event.payload },
          ],
        }));
        break;

      case "error":
        set({ error: event.message });
        break;

      // tool_execution_start, tool_execution_end, session_state_changed
      // are informational — could be handled by future UI components
      default:
        break;
    }
  },

  handleProcessExit: (_payload: GsdExitPayload) => {
    set({ sessionState: "disconnected", isStreaming: false });
  },

  handleProcessError: (payload: GsdErrorPayload) => {
    set({ sessionState: "error", error: payload.message, isStreaming: false });
  },

  respondToUIRequest: async (requestId: string, response: unknown) => {
    set((s) => ({
      pendingUIRequests: s.pendingUIRequests.filter((r) => r.request_id !== requestId),
    }));
    // Send response back via RPC — the exact command shape depends on GSD's protocol
    // For now, use a generic command. This will be refined when M003 implements UI request rendering.
    await client.sendCommand({
      type: "steer",
      text: JSON.stringify({ request_id: requestId, response }),
    });
  },

  clearMessages: () => set({ messages: [] }),
}));
