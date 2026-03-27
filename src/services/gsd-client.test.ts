import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import { setupTauriMocks } from "@/test/tauri-mock";
import { createGsdClient } from "@/services/gsd-client";
import type { GsdClient } from "@/services/gsd-client";
import type { RpcCommand, QuerySnapshot, ProjectInfo, SavedProject, MilestoneInfo } from "@/lib/types";

// vi.mock calls are hoisted — setupTauriMocks uses vi.hoisted() internally
const { mockInvoke, mockListen } = setupTauriMocks();

describe("gsd-client", () => {
  // Simulate Tauri environment so createGsdClient() returns the Tauri client
  beforeAll(() => {
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
  });
  afterAll(() => {
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  });

  beforeEach(() => {
    mockInvoke.mockReset().mockResolvedValue(undefined);
    mockListen.mockReset().mockResolvedValue(vi.fn());
  });

  // ---- factory ----

  it("createGsdClient() returns an object with all expected methods", () => {
    const client: GsdClient = createGsdClient();
    expect(typeof client.startSession).toBe("function");
    expect(typeof client.stopSession).toBe("function");
    expect(typeof client.sendCommand).toBe("function");
    expect(typeof client.queryState).toBe("function");
    expect(typeof client.listProjects).toBe("function");
    expect(typeof client.startFileWatcher).toBe("function");
    expect(typeof client.stopFileWatcher).toBe("function");
    expect(typeof client.parseProjectMilestones).toBe("function");
    expect(typeof client.onGsdEvent).toBe("function");
    expect(typeof client.onProcessExit).toBe("function");
    expect(typeof client.onProcessError).toBe("function");
    expect(typeof client.onFileChanged).toBe("function");
    expect(typeof client.getSavedProjects).toBe("function");
    expect(typeof client.addProject).toBe("function");
    expect(typeof client.removeProject).toBe("function");
  });

  // ---- invoke-based commands ----

  it("startSession() calls invoke with correct command and args", async () => {
    const client = createGsdClient();
    await client.startSession("/projects/my-app");
    expect(mockInvoke).toHaveBeenCalledWith("start_gsd_session", {
      projectPath: "/projects/my-app",
    });
  });

  it("stopSession() calls invoke with correct command", async () => {
    const client = createGsdClient();
    await client.stopSession();
    expect(mockInvoke).toHaveBeenCalledWith("stop_gsd_session");
  });

  it("sendCommand() calls invoke with stringified command", async () => {
    const client = createGsdClient();
    const command: RpcCommand = { type: "prompt", message: "hello" };
    await client.sendCommand(command);
    expect(mockInvoke).toHaveBeenCalledWith("send_gsd_command", {
      command: JSON.stringify(command),
    });
  });

  it("queryState() calls invoke and returns QuerySnapshot", async () => {
    const snapshot: QuerySnapshot = {
      currentMilestone: "M001",
      activeTasks: 3,
      totalCost: 12.5,
    };
    mockInvoke.mockResolvedValue(snapshot);
    const client = createGsdClient();
    const result = await client.queryState("/projects/my-app");
    expect(mockInvoke).toHaveBeenCalledWith("query_gsd_state", {
      projectPath: "/projects/my-app",
    });
    expect(result).toEqual(snapshot);
  });

  it("listProjects() calls invoke and returns ProjectInfo array", async () => {
    const projects: ProjectInfo[] = [
      { id: "p1", name: "Alpha", path: "/alpha" },
    ];
    mockInvoke.mockResolvedValue(projects);
    const client = createGsdClient();
    const result = await client.listProjects("/scan");
    expect(mockInvoke).toHaveBeenCalledWith("list_projects", {
      scanPath: "/scan",
    });
    expect(result).toEqual(projects);
  });

  it("startFileWatcher() calls invoke with correct args", async () => {
    const client = createGsdClient();
    await client.startFileWatcher("/projects/my-app");
    expect(mockInvoke).toHaveBeenCalledWith("start_file_watcher", {
      projectPath: "/projects/my-app",
    });
  });

  it("stopFileWatcher() calls invoke with correct command", async () => {
    const client = createGsdClient();
    await client.stopFileWatcher();
    expect(mockInvoke).toHaveBeenCalledWith("stop_file_watcher");
  });

  // ---- GSD parser commands ----

  it("parseProjectMilestones() calls invoke with correct command and project path", async () => {
    const client = createGsdClient();
    await client.parseProjectMilestones("/projects/my-app");
    expect(mockInvoke).toHaveBeenCalledWith("parse_project_milestones_cmd", {
      projectPath: "/projects/my-app",
    });
  });

  it("parseProjectMilestones() returns MilestoneInfo[]", async () => {
    const milestones: MilestoneInfo[] = [
      {
        id: "M001",
        title: "App Shell",
        status: "done",
        cost: 5.0,
        progress: 100,
        slices: [
          {
            id: "S01",
            title: "Foundation",
            status: "done",
            risk: "low",
            cost: 2.0,
            progress: 100,
            tasks: [
              { id: "T01", title: "Setup", status: "done", cost: 1.0, duration: "2h" },
            ],
            depends: [],
          },
        ],
      },
    ];
    mockInvoke.mockResolvedValue(milestones);
    const client = createGsdClient();
    const result = await client.parseProjectMilestones("/projects/my-app");
    expect(result).toEqual(milestones);
  });

  // ---- project registry commands ----

  it("getSavedProjects() calls invoke and returns SavedProject array", async () => {
    const saved: SavedProject[] = [
      { id: "p1", name: "alpha", path: "/alpha", description: null, addedAt: "123" },
    ];
    mockInvoke.mockResolvedValue(saved);
    const client = createGsdClient();
    const result = await client.getSavedProjects();
    expect(mockInvoke).toHaveBeenCalledWith("get_saved_projects");
    expect(result).toEqual(saved);
  });

  it("addProject() calls invoke with path and description", async () => {
    const saved: SavedProject = {
      id: "p1", name: "my-app", path: "/my-app", description: "desc", addedAt: "123",
    };
    mockInvoke.mockResolvedValue(saved);
    const client = createGsdClient();
    const result = await client.addProject("/my-app", "desc");
    expect(mockInvoke).toHaveBeenCalledWith("add_project", {
      projectPath: "/my-app",
      description: "desc",
    });
    expect(result).toEqual(saved);
  });

  it("addProject() passes null description when omitted", async () => {
    mockInvoke.mockResolvedValue({});
    const client = createGsdClient();
    await client.addProject("/path");
    expect(mockInvoke).toHaveBeenCalledWith("add_project", {
      projectPath: "/path",
      description: null,
    });
  });

  it("removeProject() calls invoke with project ID", async () => {
    const client = createGsdClient();
    await client.removeProject("p1");
    expect(mockInvoke).toHaveBeenCalledWith("remove_project", {
      projectId: "p1",
    });
  });

  // ---- listen-based event subscriptions ----

  it("onGsdEvent() calls listen with correct event name", async () => {
    const client = createGsdClient();
    const handler = vi.fn();
    await client.onGsdEvent(handler);
    expect(mockListen).toHaveBeenCalledWith("gsd-event", expect.any(Function));
  });

  it("onProcessExit() calls listen and returns unlisten function", async () => {
    const mockUnlisten = vi.fn();
    mockListen.mockResolvedValue(mockUnlisten);
    const client = createGsdClient();
    const unlisten = await client.onProcessExit(vi.fn());
    expect(mockListen).toHaveBeenCalledWith(
      "gsd-process-exit",
      expect.any(Function),
    );
    expect(unlisten).toBe(mockUnlisten);
  });

  it("onProcessError() calls listen with correct event name", async () => {
    const client = createGsdClient();
    const handler = vi.fn();
    await client.onProcessError(handler);
    expect(mockListen).toHaveBeenCalledWith(
      "gsd-process-error",
      expect.any(Function),
    );
  });

  it("onFileChanged() calls listen with correct event name", async () => {
    const client = createGsdClient();
    const handler = vi.fn();
    await client.onFileChanged(handler);
    expect(mockListen).toHaveBeenCalledWith(
      "gsd-file-changed",
      expect.any(Function),
    );
  });

  // ---- error propagation ----

  it("invoke failure propagates as rejected promise", async () => {
    mockInvoke.mockRejectedValue(new Error("Tauri IPC error"));
    const client = createGsdClient();
    await expect(client.startSession("/bad")).rejects.toThrow(
      "Tauri IPC error",
    );
  });

  // ---- event handler invocation ----

  it("onGsdEvent() wrapper passes event.payload to handler", async () => {
    const handler = vi.fn();
    // Capture the internal callback that listen receives
    mockListen.mockImplementation(async (_event: string, cb: Function) => {
      // Simulate Tauri calling the callback with an event envelope
      cb({ payload: { raw: '{"type":"agent_start"}', timestamp: 1000 } });
      return vi.fn();
    });
    const client = createGsdClient();
    await client.onGsdEvent(handler);
    expect(handler).toHaveBeenCalledWith({
      raw: '{"type":"agent_start"}',
      timestamp: 1000,
    });
  });
});
