import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockClient } = vi.hoisted(() => {
  const mockClient = {
    startSession: vi.fn().mockResolvedValue(undefined),
    stopSession: vi.fn().mockResolvedValue(undefined),
    sendCommand: vi.fn().mockResolvedValue(undefined),
    queryState: vi.fn().mockResolvedValue({ currentMilestone: null, activeTasks: 0, totalCost: 0 }),
    listProjects: vi.fn().mockResolvedValue([]),
    startFileWatcher: vi.fn().mockResolvedValue(undefined),
    stopFileWatcher: vi.fn().mockResolvedValue(undefined),
    onGsdEvent: vi.fn().mockResolvedValue(vi.fn()),
    onProcessExit: vi.fn().mockResolvedValue(vi.fn()),
    onProcessError: vi.fn().mockResolvedValue(vi.fn()),
    onFileChanged: vi.fn().mockResolvedValue(vi.fn()),
  };
  return { mockClient };
});

vi.mock("@/services/gsd-client", () => ({
  createGsdClient: () => mockClient,
}));

import { useGsdStore } from "./gsd-store";

describe("gsd-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state (preserve actions)
    useGsdStore.setState({
      sessionState: "idle",
      messages: [],
      isStreaming: false,
      pendingUIRequests: [],
      error: null,
      activeProjectPath: null,
    });
  });

  describe("initial state", () => {
    it("has correct defaults", () => {
      const state = useGsdStore.getState();
      expect(state.sessionState).toBe("idle");
      expect(state.messages).toEqual([]);
      expect(state.isStreaming).toBe(false);
      expect(state.pendingUIRequests).toEqual([]);
      expect(state.error).toBeNull();
      expect(state.activeProjectPath).toBeNull();
    });
  });

  describe("connect", () => {
    it("transitions to connecting then connected on success", async () => {
      const { connect } = useGsdStore.getState();
      const promise = connect("/path/to/project");
      expect(useGsdStore.getState().sessionState).toBe("connecting");
      expect(useGsdStore.getState().activeProjectPath).toBe("/path/to/project");
      await promise;
      expect(useGsdStore.getState().sessionState).toBe("connected");
      expect(mockClient.startSession).toHaveBeenCalledWith("/path/to/project");
    });

    it("transitions to error on failure", async () => {
      mockClient.startSession.mockRejectedValueOnce(new Error("spawn failed"));
      const { connect } = useGsdStore.getState();
      await connect("/bad/path");
      expect(useGsdStore.getState().sessionState).toBe("error");
      expect(useGsdStore.getState().error).toBe("spawn failed");
    });
  });

  describe("disconnect", () => {
    it("transitions to disconnected and clears project path", async () => {
      useGsdStore.setState({ sessionState: "connected", activeProjectPath: "/p" });
      const { disconnect } = useGsdStore.getState();
      await disconnect();
      expect(useGsdStore.getState().sessionState).toBe("disconnected");
      expect(useGsdStore.getState().activeProjectPath).toBeNull();
      expect(mockClient.stopSession).toHaveBeenCalled();
    });
  });

  describe("sendPrompt", () => {
    it("sends prompt command and adds user message", async () => {
      useGsdStore.setState({ sessionState: "connected" });
      const { sendPrompt } = useGsdStore.getState();
      await sendPrompt("hello");
      expect(mockClient.sendCommand).toHaveBeenCalledWith({ type: "prompt", text: "hello" });
      const msgs = useGsdStore.getState().messages;
      expect(msgs).toHaveLength(1);
      expect(msgs[0].role).toBe("user");
      expect(msgs[0].content).toBe("hello");
    });

    it("does nothing when not connected", async () => {
      useGsdStore.setState({ sessionState: "idle" });
      const { sendPrompt } = useGsdStore.getState();
      await sendPrompt("hello");
      expect(mockClient.sendCommand).not.toHaveBeenCalled();
    });
  });

  describe("handleGsdEvent", () => {
    it("handles agent_start by setting streaming", () => {
      const { handleGsdEvent } = useGsdStore.getState();
      handleGsdEvent({ type: "agent_start", session_id: "s1" });
      expect(useGsdStore.getState().isStreaming).toBe(true);
      expect(useGsdStore.getState().sessionState).toBe("streaming");
    });

    it("handles agent_end by clearing streaming", () => {
      useGsdStore.setState({ isStreaming: true, sessionState: "streaming" });
      const { handleGsdEvent } = useGsdStore.getState();
      handleGsdEvent({ type: "agent_end", session_id: "s1" });
      expect(useGsdStore.getState().isStreaming).toBe(false);
      expect(useGsdStore.getState().sessionState).toBe("connected");
    });

    it("handles assistant_message by accumulating messages", () => {
      const { handleGsdEvent } = useGsdStore.getState();
      handleGsdEvent({ type: "assistant_message", content: "Hello ", done: false });
      handleGsdEvent({ type: "assistant_message", content: "world", done: true });
      const msgs = useGsdStore.getState().messages;
      // Streaming: first chunk creates a message, subsequent chunks append
      expect(msgs.length).toBeGreaterThanOrEqual(1);
      const lastMsg = msgs[msgs.length - 1];
      expect(lastMsg.role).toBe("assistant");
      expect(lastMsg.content).toContain("world");
    });

    it("handles extension_ui_request by queuing", () => {
      const { handleGsdEvent } = useGsdStore.getState();
      handleGsdEvent({
        type: "extension_ui_request",
        request_id: "r1",
        kind: "select",
        payload: { options: ["a", "b"] },
      });
      expect(useGsdStore.getState().pendingUIRequests).toHaveLength(1);
      expect(useGsdStore.getState().pendingUIRequests[0].request_id).toBe("r1");
    });

    it("handles error event", () => {
      const { handleGsdEvent } = useGsdStore.getState();
      handleGsdEvent({ type: "error", message: "rate limit" });
      expect(useGsdStore.getState().error).toBe("rate limit");
    });
  });

  describe("handleProcessExit", () => {
    it("sets disconnected state with exit code", () => {
      useGsdStore.setState({ sessionState: "connected" });
      const { handleProcessExit } = useGsdStore.getState();
      handleProcessExit({ code: 0, timestamp: Date.now() });
      expect(useGsdStore.getState().sessionState).toBe("disconnected");
      expect(useGsdStore.getState().isStreaming).toBe(false);
    });
  });

  describe("handleProcessError", () => {
    it("sets error state", () => {
      useGsdStore.setState({ sessionState: "connected" });
      const { handleProcessError } = useGsdStore.getState();
      handleProcessError({ message: "pipe broken", timestamp: Date.now() });
      expect(useGsdStore.getState().sessionState).toBe("error");
      expect(useGsdStore.getState().error).toBe("pipe broken");
    });
  });

  describe("respondToUIRequest", () => {
    it("removes request from queue and sends response", async () => {
      useGsdStore.setState({
        sessionState: "connected",
        pendingUIRequests: [
          { request_id: "r1", kind: "select", payload: {} },
          { request_id: "r2", kind: "confirm", payload: {} },
        ],
      });
      const { respondToUIRequest } = useGsdStore.getState();
      await respondToUIRequest("r1", "option_a");
      expect(useGsdStore.getState().pendingUIRequests).toHaveLength(1);
      expect(useGsdStore.getState().pendingUIRequests[0].request_id).toBe("r2");
    });
  });

  describe("clearMessages", () => {
    it("empties messages array", () => {
      useGsdStore.setState({
        messages: [{ role: "user", content: "hi", timestamp: Date.now() }],
      });
      const { clearMessages } = useGsdStore.getState();
      clearMessages();
      expect(useGsdStore.getState().messages).toEqual([]);
    });
  });
});
