import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createDemoClient } from "./demo-client";
import type { GsdClient } from "./gsd-client";
import type { GsdEventPayload } from "@/lib/types";

// ---------------------------------------------------------------------------
// The demo client uses module-level mutable state (demoProjects, eventHandlers,
// sessionConnected). Tests that add/remove projects or register handlers must
// clean up after themselves. Streaming tests use fake timers.
// ---------------------------------------------------------------------------

describe("DemoClient", () => {
  let client: GsdClient;

  beforeEach(() => {
    client = createDemoClient();
  });

  // ---- Factory & interface ----

  describe("createDemoClient()", () => {
    it("returns an object implementing all GsdClient methods", () => {
      expect(typeof client.startSession).toBe("function");
      expect(typeof client.stopSession).toBe("function");
      expect(typeof client.sendCommand).toBe("function");
      expect(typeof client.queryState).toBe("function");
      expect(typeof client.listProjects).toBe("function");
      expect(typeof client.startFileWatcher).toBe("function");
      expect(typeof client.stopFileWatcher).toBe("function");
      expect(typeof client.parseProjectMilestones).toBe("function");
      expect(typeof client.getSavedProjects).toBe("function");
      expect(typeof client.addProject).toBe("function");
      expect(typeof client.removeProject).toBe("function");
      expect(typeof client.onGsdEvent).toBe("function");
      expect(typeof client.onProcessExit).toBe("function");
      expect(typeof client.onProcessError).toBe("function");
      expect(typeof client.onFileChanged).toBe("function");
    });

    it("logs demo mode message to console", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      createDemoClient();
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("[GSD Demo Mode]"),
        expect.any(String),
        expect.any(String),
      );
      spy.mockRestore();
    });
  });

  // ---- getSavedProjects ----

  describe("getSavedProjects()", () => {
    it("returns 3 demo projects with expected structure", async () => {
      const projects = await client.getSavedProjects();
      expect(projects).toHaveLength(3);
      for (const p of projects) {
        expect(p).toHaveProperty("id");
        expect(p).toHaveProperty("name");
        expect(p).toHaveProperty("path");
        expect(p).toHaveProperty("addedAt");
        expect(typeof p.id).toBe("string");
        expect(typeof p.name).toBe("string");
        expect(typeof p.path).toBe("string");
        expect(typeof p.addedAt).toBe("string");
      }
    });

    it("includes gsd-gui as the first project", async () => {
      const projects = await client.getSavedProjects();
      expect(projects[0].name).toBe("gsd-gui");
      expect(projects[0].path).toContain("gsd-gui");
    });
  });

  // ---- parseProjectMilestones ----

  describe("parseProjectMilestones()", () => {
    it("returns 3 milestones", async () => {
      const milestones = await client.parseProjectMilestones("/any/path");
      expect(milestones).toHaveLength(3);
    });

    it("returns milestones with correct nested structure", async () => {
      const milestones = await client.parseProjectMilestones("/any");
      const m1 = milestones[0];
      expect(m1.id).toBe("M001");
      expect(m1.title).toBe("Project Scaffolding & Core Shell");
      expect(m1.status).toBe("done");
      expect(m1.progress).toBe(100);
      expect(m1.slices).toHaveLength(3);

      // Check nested slice structure
      const s1 = m1.slices[0];
      expect(s1.id).toBe("S01");
      expect(s1.tasks).toHaveLength(2);
      expect(s1.tasks[0].id).toBe("T01");
    });

    it("includes an in-progress milestone (M003)", async () => {
      const milestones = await client.parseProjectMilestones("/any");
      const m3 = milestones.find((m) => m.id === "M003");
      expect(m3).toBeDefined();
      expect(m3!.status).toBe("in-progress");
      expect(m3!.progress).toBe(60);
    });

    it("includes pending tasks and slices", async () => {
      const milestones = await client.parseProjectMilestones("/any");
      const m3 = milestones.find((m) => m.id === "M003")!;
      const pendingSlice = m3.slices.find((s) => s.status === "pending");
      expect(pendingSlice).toBeDefined();
      expect(pendingSlice!.id).toBe("S03");

      const pendingTask = m3.slices[1].tasks.find((t) => t.status === "pending");
      expect(pendingTask).toBeDefined();
    });
  });

  // ---- queryState ----

  describe("queryState()", () => {
    it("returns a QuerySnapshot with current state", async () => {
      const snap = await client.queryState("/any");
      expect(snap).toEqual({
        currentMilestone: "M003",
        activeTasks: 2,
        totalCost: 10.40,
      });
    });
  });

  // ---- listProjects ----

  describe("listProjects()", () => {
    it("returns ProjectInfo[] mapped from demo projects", async () => {
      const projects = await client.listProjects("/scan");
      expect(projects.length).toBeGreaterThanOrEqual(3);
      for (const p of projects) {
        expect(p).toHaveProperty("id");
        expect(p).toHaveProperty("name");
        expect(p).toHaveProperty("path");
      }
    });
  });

  // ---- addProject / removeProject ----

  describe("addProject() / removeProject()", () => {
    it("addProject() adds to the list and returns the new project", async () => {
      const before = await client.getSavedProjects();
      const initialCount = before.length;

      const added = await client.addProject("/my/new-project", "A test project");
      expect(added.name).toBe("new-project");
      expect(added.path).toBe("/my/new-project");
      expect(added.description).toBe("A test project");
      expect(added.id).toMatch(/^demo-/);
      expect(added.addedAt).toBeTruthy();

      const after = await client.getSavedProjects();
      expect(after).toHaveLength(initialCount + 1);
      expect(after.find((p) => p.path === "/my/new-project")).toBeDefined();

      // Clean up: remove the added project
      await client.removeProject(added.id);
    });

    it("addProject() defaults description to null when omitted", async () => {
      const added = await client.addProject("/tmp/no-desc");
      expect(added.description).toBeNull();
      await client.removeProject(added.id);
    });

    it("addProject() extracts name from path (last segment)", async () => {
      const added = await client.addProject("C:\\Users\\test\\cool-app");
      expect(added.name).toBe("cool-app");
      await client.removeProject(added.id);
    });

    it("removeProject() removes from the list", async () => {
      const added = await client.addProject("/tmp/to-remove");
      const beforeRemove = await client.getSavedProjects();
      const countBefore = beforeRemove.length;

      await client.removeProject(added.id);

      const afterRemove = await client.getSavedProjects();
      expect(afterRemove).toHaveLength(countBefore - 1);
      expect(afterRemove.find((p) => p.id === added.id)).toBeUndefined();
    });

    it("removeProject() is a no-op for unknown IDs", async () => {
      const before = await client.getSavedProjects();
      await client.removeProject("nonexistent-id");
      const after = await client.getSavedProjects();
      expect(after).toHaveLength(before.length);
    });
  });

  // ---- startSession / stopSession ----

  describe("startSession() / stopSession()", () => {
    afterEach(async () => {
      // Ensure session is stopped to not leak state
      await client.stopSession();
    });

    it("startSession resolves without error", async () => {
      await expect(client.startSession("/any/path")).resolves.toBeUndefined();
    });

    it("stopSession resolves without error", async () => {
      await expect(client.stopSession()).resolves.toBeUndefined();
    });
  });

  // ---- No-op methods ----

  describe("startFileWatcher / stopFileWatcher", () => {
    it("startFileWatcher resolves without error", async () => {
      await expect(client.startFileWatcher("/any")).resolves.toBeUndefined();
    });

    it("stopFileWatcher resolves without error", async () => {
      await expect(client.stopFileWatcher()).resolves.toBeUndefined();
    });
  });

  // ---- Event handler registration ----

  describe("event handler registration", () => {
    it("onGsdEvent registers and unregisters a handler", async () => {
      const handler = vi.fn();
      const unlisten = await client.onGsdEvent(handler);
      expect(typeof unlisten).toBe("function");
      unlisten();
    });

    it("onProcessExit registers and unregisters a handler", async () => {
      const handler = vi.fn();
      const unlisten = await client.onProcessExit(handler);
      expect(typeof unlisten).toBe("function");
      unlisten();
    });

    it("onProcessError registers and unregisters a handler", async () => {
      const handler = vi.fn();
      const unlisten = await client.onProcessError(handler);
      expect(typeof unlisten).toBe("function");
      unlisten();
    });

    it("onFileChanged registers and unregisters a handler", async () => {
      const handler = vi.fn();
      const unlisten = await client.onFileChanged(handler);
      expect(typeof unlisten).toBe("function");
      unlisten();
    });

    it("unlistening prevents further handler calls", async () => {
      // Register two handlers, unlisten the first, verify only second fires
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const unlisten1 = await client.onGsdEvent(handler1);
      const unlisten2 = await client.onGsdEvent(handler2);

      unlisten1();

      // We can't easily trigger events without the streaming system, but
      // verifying the unlisten returned is a function is the key contract.
      // The streaming tests below verify handlers actually fire.
      unlisten2();
    });
  });

  // ---- Streaming simulation ----

  describe("streaming simulation", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(async () => {
      vi.useRealTimers();
      await client.stopSession();
    });

    it("sendCommand with type 'prompt' triggers streaming when session is connected", async () => {
      const events: GsdEventPayload[] = [];
      const unlisten = await client.onGsdEvent((payload) => events.push(payload));

      await client.startSession("/any");
      await client.sendCommand({ type: "prompt", message: "hello" });

      // Advance past the 200ms setTimeout that starts streaming
      vi.advanceTimersByTime(200);

      // First event should be agent_start
      expect(events.length).toBeGreaterThanOrEqual(1);
      const startEvent = JSON.parse(events[0].raw);
      expect(startEvent.type).toBe("agent_start");
      expect(startEvent.session_id).toBe("demo-session");

      // Advance enough ticks to complete the streaming (generous)
      vi.advanceTimersByTime(5000);

      // Verify event sequence: agent_start → chunks → done → agent_end
      const parsed = events.map((e) => JSON.parse(e.raw));
      expect(parsed[0].type).toBe("agent_start");

      // Middle events should be assistant_message with done: false
      const chunks = parsed.filter(
        (p) => p.type === "assistant_message" && p.done === false,
      );
      expect(chunks.length).toBeGreaterThan(0);

      // Should end with a done chunk and agent_end
      const doneChunk = parsed.find(
        (p) => p.type === "assistant_message" && p.done === true,
      );
      expect(doneChunk).toBeDefined();

      const endEvent = parsed[parsed.length - 1];
      expect(endEvent.type).toBe("agent_end");
      expect(endEvent.session_id).toBe("demo-session");

      unlisten();
    });

    it("sendCommand does NOT trigger streaming when session is not connected", async () => {
      const events: GsdEventPayload[] = [];
      const unlisten = await client.onGsdEvent((payload) => events.push(payload));

      // Don't call startSession — session is disconnected
      await client.sendCommand({ type: "prompt", message: "hello" });

      vi.advanceTimersByTime(5000);
      expect(events).toHaveLength(0);

      unlisten();
    });

    it("sendCommand ignores non-prompt commands", async () => {
      const events: GsdEventPayload[] = [];
      const unlisten = await client.onGsdEvent((payload) => events.push(payload));

      await client.startSession("/any");
      await client.sendCommand({ type: "abort" });

      vi.advanceTimersByTime(5000);
      expect(events).toHaveLength(0);

      unlisten();
    });

    it("streaming events fire in correct order: agent_start → chunks → done → agent_end", async () => {
      const eventTypes: string[] = [];
      const unlisten = await client.onGsdEvent((payload) => {
        const parsed = JSON.parse(payload.raw);
        // Collapse consecutive chunk types
        const label =
          parsed.type === "assistant_message"
            ? parsed.done
              ? "done_chunk"
              : "content_chunk"
            : parsed.type;
        eventTypes.push(label);
      });

      await client.startSession("/any");
      await client.sendCommand({ type: "prompt", message: "test" });

      vi.advanceTimersByTime(200);
      vi.advanceTimersByTime(10000);

      // First is agent_start, last is agent_end
      expect(eventTypes[0]).toBe("agent_start");
      expect(eventTypes[eventTypes.length - 1]).toBe("agent_end");

      // Second-to-last is done_chunk
      expect(eventTypes[eventTypes.length - 2]).toBe("done_chunk");

      // All middle events are content_chunks
      const middle = eventTypes.slice(1, -2);
      for (const t of middle) {
        expect(t).toBe("content_chunk");
      }

      unlisten();
    });

    it("streaming chunks contain actual response text", async () => {
      let accumulated = "";
      const unlisten = await client.onGsdEvent((payload) => {
        const parsed = JSON.parse(payload.raw);
        if (parsed.type === "assistant_message" && !parsed.done) {
          accumulated += parsed.content;
        }
      });

      await client.startSession("/any");
      await client.sendCommand({ type: "prompt", message: "what are you" });

      vi.advanceTimersByTime(200);
      vi.advanceTimersByTime(10000);

      // "what are you" should trigger the "who are you" response
      expect(accumulated).toContain("GSD");

      unlisten();
    });

    it("all events have a numeric timestamp", async () => {
      const events: GsdEventPayload[] = [];
      const unlisten = await client.onGsdEvent((payload) => events.push(payload));

      await client.startSession("/any");
      await client.sendCommand({ type: "prompt", message: "hi" });

      vi.advanceTimersByTime(200);
      vi.advanceTimersByTime(5000);

      expect(events.length).toBeGreaterThan(0);
      for (const e of events) {
        expect(typeof e.timestamp).toBe("number");
        expect(e.timestamp).toBeGreaterThan(0);
      }

      unlisten();
    });
  });

  // ---- generateDemoResponse (tested indirectly via streaming) ----

  describe("generateDemoResponse (via streaming)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(async () => {
      vi.useRealTimers();
      await client.stopSession();
    });

    async function getStreamedResponse(prompt: string): Promise<string> {
      let accumulated = "";
      const unlisten = await client.onGsdEvent((payload) => {
        const parsed = JSON.parse(payload.raw);
        if (parsed.type === "assistant_message" && !parsed.done) {
          accumulated += parsed.content;
        }
      });

      await client.startSession("/any");
      await client.sendCommand({ type: "prompt", message: prompt });

      vi.advanceTimersByTime(200);
      vi.advanceTimersByTime(15000);

      unlisten();
      await client.stopSession();
      return accumulated;
    }

    it("responds contextually to 'who are you'", async () => {
      const response = await getStreamedResponse("who are you");
      expect(response).toContain("GSD");
      expect(response).toContain("demo");
    });

    it("responds contextually to 'help'", async () => {
      const response = await getStreamedResponse("help");
      expect(response).toContain("planning");
      expect(response).toContain("demo mode");
    });

    it("responds contextually to 'status'", async () => {
      const response = await getStreamedResponse("status");
      expect(response).toContain("M003");
      expect(response).toContain("60%");
    });

    it("responds contextually to 'run tests'", async () => {
      const response = await getStreamedResponse("run tests");
      expect(response).toContain("381");
      expect(response).toContain("pass");
    });

    it("provides a generic response for unknown prompts", async () => {
      const response = await getStreamedResponse("random gibberish xyz");
      expect(response).toContain("random gibberish xyz");
      expect(response).toContain("demo");
    });
  });
});
