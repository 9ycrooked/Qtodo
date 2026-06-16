import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @tauri-apps/api/core before any module imports
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("useTasks", () => {
  beforeEach(async () => {
    // Reset module registry so the module-level initPromise is fresh each test
    vi.resetModules();
    // Re-apply the mock after module reset
    vi.doMock("@tauri-apps/api/core", () => ({
      invoke: vi.fn(),
    }));
  });

  it("loads tasks from db on first call", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValueOnce([
      {
        id: "task-1",
        description: "test",
        priority: "high",
        dueDate: "2026-06-16",
        completed: false,
        archived: false,
        createdAt: "2026-06-16T00:00:00Z",
        updatedAt: "2026-06-16T00:00:00Z",
      },
    ]);
    // get_db_path mock (second invoke call)
    mockInvoke.mockResolvedValueOnce("/path/to/db");

    const { useTasks } = await import("./useTasks");
    const { tasks } = useTasks();

    await new Promise((r) => setTimeout(r, 10));
    expect(tasks.value).toHaveLength(1);
    expect(tasks.value[0].id).toBe("task-1");
  });

  it("create transition triggers save_task invoke", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue([]);

    const { useTasks } = await import("./useTasks");
    const { transition } = useTasks();
    await new Promise((r) => setTimeout(r, 10));
    mockInvoke.mockClear();

    transition({
      type: "create",
      payload: { description: "new", priority: "medium", dueDate: "2026-06-16" },
    });

    await new Promise((r) => setTimeout(r, 10));
    expect(mockInvoke).toHaveBeenCalledWith(
      "save_task",
      expect.objectContaining({ task: expect.any(Object) }),
    );
  });

  it("delete transition triggers delete_task invoke", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue([]);

    const { useTasks } = await import("./useTasks");
    const { transition } = useTasks();
    await new Promise((r) => setTimeout(r, 10));
    mockInvoke.mockClear();

    transition({ type: "delete", id: "task-1" });

    await new Promise((r) => setTimeout(r, 10));
    expect(mockInvoke).toHaveBeenCalledWith("delete_task", { id: "task-1" });
  });
});
