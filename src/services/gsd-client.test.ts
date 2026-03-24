import { describe, it, expect } from "vitest";
import { createGsdClient } from "@/services/gsd-client";
import type { GsdClient } from "@/services/gsd-client";

describe("gsd-client", () => {
  it("createGsdClient() returns an object with all expected methods", () => {
    const client: GsdClient = createGsdClient();
    expect(typeof client.startSession).toBe("function");
    expect(typeof client.stopSession).toBe("function");
    expect(typeof client.sendCommand).toBe("function");
    expect(typeof client.queryState).toBe("function");
    expect(typeof client.listProjects).toBe("function");
  });

  it("startSession() resolves with a session object", async () => {
    const client = createGsdClient();
    const session = await client.startSession();
    expect(session).toHaveProperty("id");
    expect(typeof session.id).toBe("string");
    expect(session).toHaveProperty("startedAt");
    expect(typeof session.startedAt).toBe("string");
  });

  it("stopSession() resolves without error", async () => {
    const client = createGsdClient();
    await expect(client.stopSession()).resolves.toBeUndefined();
  });

  it("sendCommand() resolves with a result object", async () => {
    const client = createGsdClient();
    const result = await client.sendCommand("test");
    expect(result).toHaveProperty("success");
    expect(typeof result.success).toBe("boolean");
    expect(result).toHaveProperty("data");
  });

  it("sendCommand() accepts optional args", async () => {
    const client = createGsdClient();
    const result = await client.sendCommand("build", { target: "release" });
    expect(result.success).toBe(true);
  });

  it("queryState() resolves with a default state object", async () => {
    const client = createGsdClient();
    const state = await client.queryState();
    expect(state).toHaveProperty("currentMilestone");
    expect(state.currentMilestone).toBeNull();
    expect(state).toHaveProperty("activeTasks");
    expect(state.activeTasks).toBe(0);
    expect(state).toHaveProperty("totalCost");
    expect(state.totalCost).toBe(0);
  });

  it("listProjects() resolves with an empty array", async () => {
    const client = createGsdClient();
    const projects = await client.listProjects();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects).toHaveLength(0);
  });
});
