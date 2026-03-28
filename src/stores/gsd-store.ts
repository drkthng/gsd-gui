import { create } from "zustand";
import { createGsdClient } from "@/services/gsd-client";
import type {
  RpcEvent,
  GsdExitPayload,
  GsdErrorPayload,
  SessionState,
  GsdVersionInfo,
  GsdCommand,
  GetCommandsResponse,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GsdMessage {
  role: "user" | "assistant" | "system";
  content: string;
  thinking?: string;
  timestamp: number;
}

export interface GsdNotification {
  id: string;
  message: string;
  notifyType?: string;
  timestamp: number;
  payload?: unknown;
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
  notifications: GsdNotification[];
  error: string | null;
  activeProjectPath: string | null;
  backendReady: boolean;
  autoMode: boolean;
  // Version / upgrade state
  versionInfo: GsdVersionInfo | null;
  upgradeInProgress: boolean;
  upgradeError: string | null;
  showRestartBanner: boolean;
  // Slash command palette state
  availableCommands: GsdCommand[];
  commandsLoaded: boolean;

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
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  // Version / upgrade actions
  checkForUpdate: () => Promise<void>;
  runUpgrade: () => Promise<void>;
  dismissRestartBanner: () => void;
  // Slash command palette actions
  loadCommands: () => Promise<void>;
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
  notifications: [],
  error: null,
  activeProjectPath: null,
  backendReady: false,
  autoMode: false,
  versionInfo: null,
  upgradeInProgress: false,
  upgradeError: null,
  showRestartBanner: false,
  availableCommands: [],
  commandsLoaded: false,

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
      availableCommands: [],
      commandsLoaded: false,
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

      case "agent_end":
        // agent_end signals the full agent run is done — just clear streaming.
        // Message content is already finalized by turn_end events.
        set({ isStreaming: false, sessionState: "connected", autoMode: false });
        break;

      case "turn_end": {
        // turn_end carries the canonical final message for this turn.
        // Extract text and thinking from content blocks.
        const msg = event.message;
        if (msg.role === "assistant") {
          const blocks = typeof msg.content === "string" ? [] : msg.content;
          const text = typeof msg.content === "string"
            ? msg.content
            : blocks.filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
          const thinking = blocks
            .filter((b) => b.type === "thinking")
            .map((b) => b.thinking ?? "")
            .filter(Boolean)
            .join("\n\n") || undefined;

          if (text) {
            set((s) => {
              const msgs = [...s.messages];
              const last = msgs[msgs.length - 1];
              if (last && last.role === "assistant") {
                msgs[msgs.length - 1] = { ...last, content: text, thinking };
              } else {
                msgs.push({ role: "assistant", content: text, thinking, timestamp: Date.now() });
              }
              return { messages: msgs };
            });
          }
        }
        break;
      }

      case "message_update": {
        // Stream text and thinking deltas for live feedback
        const ev = event.assistantMessageEvent;
        if (ev.type === "text_delta" && "delta" in ev) {
          const delta = ev.delta as string;
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
        } else if (ev.type === "thinking_delta" && "delta" in ev) {
          const delta = ev.delta as string;
          set((s) => {
            const msgs = [...s.messages];
            const last = msgs[msgs.length - 1];
            if (last && last.role === "assistant") {
              msgs[msgs.length - 1] = { ...last, thinking: (last.thinking ?? "") + delta };
            } else {
              msgs.push({ role: "assistant", content: "", thinking: delta, timestamp: Date.now() });
            }
            return { messages: msgs };
          });
        }
        break;
      }

      case "extension_ui_request": {
        const { id, method, message, notifyType, statusKey, payload } = event;
        // Fire-and-forget methods: no dialog needed, respond immediately and move on.
        // Only confirm/select/input/editor require user interaction.
        const SILENT_METHODS = new Set([
          "setStatus", "setTitle", "setWidget",
          "setWorkingMessage", "set_editor_text", "pasteToEditor",
        ]);
        if (method === "notify") {
          // Store notification for the notification panel — never block as dialog
          if (message) {
            set((s) => ({
              notifications: [
                ...s.notifications,
                { id, message, notifyType: notifyType ?? undefined, timestamp: Date.now() },
              ].slice(-50), // keep last 50
            }));
          }
          break;
        }
        if (SILENT_METHODS.has(method)) {
          break;
        }
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
        // Non-blocking — fire and forget; errors are swallowed inside checkForUpdate
        void get().checkForUpdate();
        // Fetch all available slash commands for the palette
        void get().loadCommands();
        break;

      case "response": {
        if (event.command === "get_commands" && event.success) {
          const data = event.data as GetCommandsResponse | undefined;
          const commands = data?.commands ?? [];
          set({ availableCommands: commands, commandsLoaded: true });
        } else if (!event.success) {
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
    set({ sessionState: "disconnected", isStreaming: false, backendReady: false, autoMode: false, availableCommands: [], commandsLoaded: false });
  },

  handleProcessError: (payload: GsdErrorPayload) => {
    set({ sessionState: "error", error: payload.message, isStreaming: false, backendReady: false, autoMode: false, availableCommands: [], commandsLoaded: false });
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
  dismissNotification: (id: string) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  clearNotifications: () => set({ notifications: [] }),

  loadCommands: async () => {
    // Signal that commands are not yet loaded; response arrives as a 'response' event handled in handleGsdEvent
    set({ commandsLoaded: false });
    await client.sendCommand({ type: "get_commands" });
  },

  checkForUpdate: async () => {
    try {
      const info = await client.checkGsdVersion();
      set({ versionInfo: info });
      if (!info.updateAvailable) return;
      // Skip if user already dismissed this exact version
      if (
        typeof localStorage !== "undefined" &&
        localStorage.getItem("gsd-dismissed-update-version") === info.latest
      ) {
        return;
      }
      // Push a structured update notification — UI will render an Update & Restart button
      const notifId = `gsd-update-${info.latest}`;
      set((s) => ({
        notifications: [
          ...s.notifications,
          {
            id: notifId,
            message: `GSD update available: ${info.installed} → ${info.latest}`,
            notifyType: "update",
            timestamp: Date.now(),
            payload: { installed: info.installed, latest: info.latest },
          },
        ].slice(-50),
      }));
    } catch {
      // Version check is non-blocking — swallow errors silently
    }
  },

  runUpgrade: async () => {
    set({ upgradeInProgress: true, upgradeError: null });
    try {
      await client.upgradeGsd();
      // Reconnect session after successful upgrade
      const { disconnect, reconnect } = get();
      await disconnect();
      await reconnect();
      set({ showRestartBanner: true, upgradeInProgress: false });
    } catch (err) {
      set({
        upgradeInProgress: false,
        upgradeError: err instanceof Error ? err.message : String(err),
      });
    }
  },

  dismissRestartBanner: () => set({ showRestartBanner: false }),
}));
