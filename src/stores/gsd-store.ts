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
  id: string;
  method: string;
  message?: string;
  notifyType?: string;
  statusKey?: string;
  payload?: unknown;
}

interface GsdState {
  sessionState: SessionState;
  messages: GsdMessage[];
  isStreaming: boolean;
  pendingUIRequests: PendingUIRequest[];
  error: string | null;
  activeProjectPath: string | null;
  backendReady: boolean;
  autoMode: boolean;

  // Actions
  connect: (projectPath: string) => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;
  sendPrompt: (text: string) => Promise<void>;
  startAuto: () => Promise<void>;
  stopAuto: () => Promise<void>;
  nextStep: () => Promise<void>;
  steerExecution: (text: string) => Promise<void>;
  handleGsdEvent: (event: RpcEvent) => void;
  handleProcessExit: (payload: GsdExitPayload) => void;
  handleProcessError: (payload: GsdErrorPayload) => void;
  respondToUIRequest: (requestId: string, response: unknown) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
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
  backendReady: false,
  autoMode: false,

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

  reconnect: async () => {
    const { activeProjectPath, connect } = get();
    if (!activeProjectPath) {
      set({ error: "No project path to reconnect to" });
      return;
    }
    await connect(activeProjectPath);
  },

  sendPrompt: async (text: string) => {
    const { sessionState } = get();
    if (sessionState !== "connected" && sessionState !== "streaming") return;
    const msg: GsdMessage = { role: "user", content: text, timestamp: Date.now() };
    set((s) => ({ messages: [...s.messages, msg] }));
    await client.sendCommand({ type: "prompt", message: text });
  },

  startAuto: async () => {
    const { sessionState } = get();
    if (sessionState !== "connected" && sessionState !== "streaming") return;
    const msg: GsdMessage = { role: "user", content: "/gsd auto", timestamp: Date.now() };
    set((s) => ({ messages: [...s.messages, msg], autoMode: true }));
    await client.sendCommand({ type: "prompt", message: "/gsd auto" });
  },

  stopAuto: async () => {
    set({ autoMode: false, isStreaming: false });
    await client.sendCommand({ type: "abort" });
  },

  nextStep: async () => {
    const { sessionState } = get();
    if (sessionState !== "connected" && sessionState !== "streaming") return;
    const msg: GsdMessage = { role: "user", content: "/gsd next", timestamp: Date.now() };
    set((s) => ({ messages: [...s.messages, msg] }));
    await client.sendCommand({ type: "prompt", message: "/gsd next" });
  },

  steerExecution: async (text: string) => {
    const { sessionState } = get();
    if (sessionState !== "streaming") return;
    await client.sendCommand({ type: "steer", message: text });
  },

  handleGsdEvent: (event: RpcEvent) => {
    switch (event.type) {
      case "agent_start":
        set({ isStreaming: true, sessionState: "streaming" });
        break;

      case "agent_end": {
        // agent_end carries the full messages array — extract the last assistant message
        // as the canonical final content, replacing the streaming placeholder if any.
        const assistantMsgs = event.messages.filter((m) => m.role === "assistant");
        const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
        if (lastAssistant) {
          // Flatten content: can be string or array of content blocks
          const text =
            typeof lastAssistant.content === "string"
              ? lastAssistant.content
              : lastAssistant.content
                  .filter((b) => b.type === "text")
                  .map((b) => b.text ?? "")
                  .join("");
          set((s) => {
            const msgs = [...s.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.role === "assistant") {
              // Replace streaming placeholder with final content
              msgs[msgs.length - 1] = { ...lastMsg, content: text };
            } else {
              msgs.push({ role: "assistant", content: text, timestamp: Date.now() });
            }
            return { messages: msgs, isStreaming: false, sessionState: "connected", autoMode: false };
          });
        } else {
          set({ isStreaming: false, sessionState: "connected", autoMode: false });
        }
        break;
      }

      case "message_update": {
        // Stream text deltas to give live feedback during generation
        const ev = event.assistantMessageEvent;
        if (ev.type === "text_delta" && ev.delta) {
          const delta = ev.delta;
          set((s) => {
            const msgs = [...s.messages];
            const last = msgs[msgs.length - 1];
            if (last && last.role === "assistant") {
              msgs[msgs.length - 1] = { ...last, content: last.content + delta };
            } else {
              msgs.push({ role: "assistant", content: delta, timestamp: Date.now() });
            }
            return { messages: msgs };
          });
        }
        break;
      }

      case "extension_ui_request": {
        const { id, method, message, notifyType, statusKey, payload } = event;
        set((s) => ({
          pendingUIRequests: [
            ...s.pendingUIRequests,
            { id, method, message, notifyType, statusKey, payload },
          ],
        }));
        break;
      }

      case "error":
        set({ error: event.message });
        break;

      case "extensions_ready":
        set({ backendReady: true });
        break;

      case "response": {
        if (!event.success) {
          set({ error: event.error ?? `Command ${event.command} failed` });
        }
        break;
      }

      // turn_start, turn_end, message_start, message_end — informational
      default:
        break;
    }
  },

  handleProcessExit: (_payload: GsdExitPayload) => {
    set({ sessionState: "disconnected", isStreaming: false, backendReady: false, autoMode: false });
  },

  handleProcessError: (payload: GsdErrorPayload) => {
    set({ sessionState: "error", error: payload.message, isStreaming: false, backendReady: false, autoMode: false });
  },

  respondToUIRequest: async (requestId: string, response: unknown) => {
    set((s) => ({
      pendingUIRequests: s.pendingUIRequests.filter((r) => r.id !== requestId),
    }));
    // Send response back via RPC — the exact command shape depends on GSD's protocol
    // For now, use a generic command. This will be refined when M003 implements UI request rendering.
    await client.sendCommand({
      type: "steer",
      message: JSON.stringify({ request_id: requestId, response }),
    });
  },

  clearMessages: () => set({ messages: [] }),

  clearError: () => set({ error: null }),
}));
