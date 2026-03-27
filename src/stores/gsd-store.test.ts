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
      backendReady: false,
      autoMode: false,
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
      expect(mockClient.sendCommand).toHaveBeenCalledWith({ type: "prompt", message: "hello" });
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
      handleGsdEvent({ type: "agent_start" });
      expect(useGsdStore.getState().isStreaming).toBe(true);
      expect(useGsdStore.getState().sessionState).toBe("streaming");
    });

    it("handles agent_end by clearing streaming state only", () => {
      useGsdStore.setState({ isStreaming: true, sessionState: "streaming" });
      const { handleGsdEvent } = useGsdStore.getState();
      handleGsdEvent({
        type: "agent_end",
        messages: [
          { role: "user", content: [{ type: "text", text: "hi" }] },
          { role: "assistant", content: [{ type: "text", text: "Hello there" }] },
        ],
      });
      expect(useGsdStore.getState().isStreaming).toBe(false);
      expect(useGsdStore.getState().sessionState).toBe("connected");
    });

    it("handles turn_end by finalizing the assistant message", () => {
      // Simulate a streaming placeholder from text_deltas
      useGsdStore.setState({
        messages: [{ role: "assistant", content: "partial...", timestamp: Date.now() }],
      });
      const { handleGsdEvent } = useGsdStore.getState();
      handleGsdEvent({
        type: "turn_end",
        message: { role: "assistant", content: [{ type: "text", text: "Final answer here." }] },
        toolResults: [],
      });
      const msgs = useGsdStore.getState().messages;
      expect(msgs[msgs.length - 1].role).toBe("assistant");
      expect(msgs[msgs.length - 1].content).toBe("Final answer here.");
    });

    it("handles message_update text_delta by streaming content", () => {
      const { handleGsdEvent } = useGsdStore.getState();
      handleGsdEvent({
        type: "message_update",
        assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: "Hello " },
        message: { role: "assistant", content: [{ type: "text", text: "Hello " }] },
      });
      handleGsdEvent({
        type: "message_update",
        assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: "world" },
        message: { role: "assistant", content: [{ type: "text", text: "Hello world" }] },
      });
      const msgs = useGsdStore.getState().messages;
      expect(msgs.length).toBeGreaterThanOrEqual(1);
      const lastMsg = msgs[msgs.length - 1];
      expect(lastMsg.role).toBe("assistant");
      expect(lastMsg.content).toBe("Hello world");
    });

    it("handles extension_ui_request by queuing", () => {
      const { handleGsdEvent } = useGsdStore.getState();
      handleGsdEvent({
        type: "extension_ui_request",
        id: "r1",
        method: "select",
        payload: { options: ["a", "b"] },
      });
      expect(useGsdStore.getState().pendingUIRequests).toHaveLength(1);
      expect(useGsdStore.getState().pendingUIRequests[0].id).toBe("r1");
    });

    it("handles error event", () => {
      const { handleGsdEvent } = useGsdStore.getState();
      handleGsdEvent({ type: "error", message: "rate limit" });
      expect(useGsdStore.getState().error).toBe("rate limit");
    });

    it("handles extensions_ready by setting backendReady to true", () => {
      expect(useGsdStore.getState().backendReady).toBe(false);
      const { handleGsdEvent } = useGsdStore.getState();
      handleGsdEvent({ type: "extensions_ready" });
      expect(useGsdStore.getState().backendReady).toBe(true);
    });

    it("handles response with success=true without setting error", () => {
      const { handleGsdEvent } = useGsdStore.getState();
      handleGsdEvent({
        type: "response",
        command: "get_state",
        success: true,
        data: { currentMilestone: "M001" },
      });
      expect(useGsdStore.getState().error).toBeNull();
    });

    it("handles response with success=false by setting error", () => {
      const { handleGsdEvent } = useGsdStore.getState();
      handleGsdEvent({
        type: "response",
        command: "set_model",
        success: false,
        error: "Model not available",
      });
      expect(useGsdStore.getState().error).toBe("Model not available");
    });

    it("handles response with success=false and no error field gracefully", () => {
      const { handleGsdEvent } = useGsdStore.getState();
      handleGsdEvent({
        type: "response",
        command: "set_model",
        success: false,
      });
      expect(useGsdStore.getState().error).toBe("Command set_model failed");
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

    it("resets backendReady to false", () => {
      useGsdStore.setState({ sessionState: "connected", backendReady: true });
      const { handleProcessExit } = useGsdStore.getState();
      handleProcessExit({ code: 1, timestamp: Date.now() });
      expect(useGsdStore.getState().backendReady).toBe(false);
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

    it("resets backendReady to false", () => {
      useGsdStore.setState({ sessionState: "connected", backendReady: true });
      const { handleProcessError } = useGsdStore.getState();
      handleProcessError({ message: "crash", timestamp: Date.now() });
      expect(useGsdStore.getState().backendReady).toBe(false);
    });
  });

  describe("reconnect", () => {
    it("calls connect with activeProjectPath when set", async () => {
      useGsdStore.setState({ sessionState: "disconnected", activeProjectPath: "/my/project" });
      const { reconnect } = useGsdStore.getState();
      await reconnect();
      expect(mockClient.startSession).toHaveBeenCalledWith("/my/project");
      expect(useGsdStore.getState().sessionState).toBe("connected");
    });

    it("sets error when no activeProjectPath is set", async () => {
      useGsdStore.setState({ sessionState: "disconnected", activeProjectPath: null });
      const { reconnect } = useGsdStore.getState();
      await reconnect();
      expect(mockClient.startSession).not.toHaveBeenCalled();
      expect(useGsdStore.getState().error).toBe("No project path to reconnect to");
    });
  });

  describe("clearError", () => {
    it("sets error to null", () => {
      useGsdStore.setState({ error: "something broke" });
      const { clearError } = useGsdStore.getState();
      clearError();
      expect(useGsdStore.getState().error).toBeNull();
    });
  });

  describe("respondToUIRequest", () => {
    it("removes request from queue and sends response", async () => {
      useGsdStore.setState({
        sessionState: "connected",
        pendingUIRequests: [
          { id: "r1", method: "select", payload: {} },
          { id: "r2", method: "confirm", payload: {} },
        ],
      });
      const { respondToUIRequest } = useGsdStore.getState();
      await respondToUIRequest("r1", "option_a");
      expect(useGsdStore.getState().pendingUIRequests).toHaveLength(1);
      expect(useGsdStore.getState().pendingUIRequests[0].id).toBe("r2");
    });
  });

  describe("auto-mode actions", () => {
    it("startAuto sends /gsd auto prompt and sets autoMode true", async () => {
      useGsdStore.setState({ sessionState: "connected" });
      const { startAuto } = useGsdStore.getState();
      await startAuto();
      expect(mockClient.sendCommand).toHaveBeenCalledWith({
        type: "prompt",
        message: "/gsd auto",
      });
      expect(useGsdStore.getState().autoMode).toBe(true);
    });

    it("stopAuto sends abort command and sets autoMode false", async () => {
      useGsdStore.setState({
        sessionState: "streaming",
        isStreaming: true,
        autoMode: true,
      });
      const { stopAuto } = useGsdStore.getState();
      await stopAuto();
      expect(mockClient.sendCommand).toHaveBeenCalledWith({ type: "abort" });
      expect(useGsdStore.getState().autoMode).toBe(false);
      expect(useGsdStore.getState().isStreaming).toBe(false);
    });

    it("nextStep sends /gsd next prompt", async () => {
      useGsdStore.setState({ sessionState: "connected" });
      const { nextStep } = useGsdStore.getState();
      await nextStep();
      expect(mockClient.sendCommand).toHaveBeenCalledWith({
        type: "prompt",
        message: "/gsd next",
      });
    });

    it("steerExecution sends steer command with text", async () => {
      useGsdStore.setState({ sessionState: "streaming", isStreaming: true });
      const { steerExecution } = useGsdStore.getState();
      await steerExecution("focus on tests");
      expect(mockClient.sendCommand).toHaveBeenCalledWith({
        type: "steer",
        message: "focus on tests",
      });
    });

    it("agent_end resets autoMode to false", () => {
      useGsdStore.setState({
        isStreaming: true,
        sessionState: "streaming",
        autoMode: true,
      });
      const { handleGsdEvent } = useGsdStore.getState();
      handleGsdEvent({ type: "agent_end", messages: [] });
      expect(useGsdStore.getState().autoMode).toBe(false);
    });

    it("handleProcessExit resets autoMode to false", () => {
      useGsdStore.setState({
        sessionState: "connected",
        autoMode: true,
      });
      const { handleProcessExit } = useGsdStore.getState();
      handleProcessExit({ code: 0, timestamp: Date.now() });
      expect(useGsdStore.getState().autoMode).toBe(false);
    });

    it("handleProcessError resets autoMode to false", () => {
      useGsdStore.setState({
        sessionState: "connected",
        autoMode: true,
      });
      const { handleProcessError } = useGsdStore.getState();
      handleProcessError({ message: "crash", timestamp: Date.now() });
      expect(useGsdStore.getState().autoMode).toBe(false);
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
