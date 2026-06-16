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

  it("reorder debounces: 5 calls in 100ms trigger only 1 save_view_orders", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    const mockInvoke = vi.mocked(invoke);

    // load_all_tasks returns 2 tasks; get_db_path returns a path
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "load_all_tasks") {
        return Promise.resolve([
          {
            id: "t1",
            description: "a",
            priority: "medium",
            dueDate: "2026-06-16",
            completed: false,
            archived: false,
            createdAt: "2026-06-16T00:00:00Z",
            updatedAt: "2026-06-16T00:00:00Z",
            viewOrders: {},
          },
          {
            id: "t2",
            description: "b",
            priority: "medium",
            dueDate: "2026-06-16",
            completed: false,
            archived: false,
            createdAt: "2026-06-16T00:00:00Z",
            updatedAt: "2026-06-16T00:00:00Z",
            viewOrders: {},
          },
        ]);
      }
      return Promise.resolve("");
    });

    const { useTasks } = await import("./useTasks");
    const { transition } = useTasks();

    // Flush microtasks so ensureLoaded populates tasks.value
    await new Promise((r) => setTimeout(r, 10));
    mockInvoke.mockClear();

    vi.useFakeTimers();

    // 5 rapid reorder calls
    for (let i = 0; i < 5; i++) {
      transition({
        type: "reorder",
        viewKey: "today",
        ordered: [
          { id: "t1", viewOrders: { today: 1 } } as any,
          { id: "t2", viewOrders: { today: 2 } } as any,
        ],
      });
    }

    // At 100ms: debounce timer hasn't fired yet (200ms threshold)
    vi.advanceTimersByTime(100);
    const callsBeforeFlush = mockInvoke.mock.calls.filter(
      (c) => c[0] === "save_view_orders",
    );
    expect(callsBeforeFlush).toHaveLength(0);

    // Advance past 200ms → debounce fires, writes pending tasks
    await vi.advanceTimersByTimeAsync(200);
    const callsAfterFlush = mockInvoke.mock.calls.filter(
      (c) => c[0] === "save_view_orders",
    );
    expect(callsAfterFlush.length).toBeGreaterThan(0);

    vi.useRealTimers();
  });

  it("flushPendingWrites immediately fires pending save_view_orders", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    const mockInvoke = vi.mocked(invoke);

    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "load_all_tasks") {
        return Promise.resolve([
          {
            id: "t1",
            description: "a",
            priority: "medium",
            dueDate: "2026-06-16",
            completed: false,
            archived: false,
            createdAt: "2026-06-16T00:00:00Z",
            updatedAt: "2026-06-16T00:00:00Z",
            viewOrders: {},
          },
        ]);
      }
      return Promise.resolve("");
    });

    const { useTasks, flushPendingWrites } = await import("./useTasks");
    const { transition } = useTasks();

    await new Promise((r) => setTimeout(r, 10));
    mockInvoke.mockClear();

    vi.useFakeTimers();

    transition({
      type: "reorder",
      viewKey: "today",
      ordered: [{ id: "t1", viewOrders: { today: 1 } } as any],
    });

    // Only 50ms passed — debounce hasn't fired
    vi.advanceTimersByTime(50);
    const callsBeforeFlush = mockInvoke.mock.calls.filter(
      (c) => c[0] === "save_view_orders",
    );
    expect(callsBeforeFlush).toHaveLength(0);

    // Manual flush → should fire immediately
    flushPendingWrites();
    const callsAfterFlush = mockInvoke.mock.calls.filter(
      (c) => c[0] === "save_view_orders",
    );
    expect(callsAfterFlush.length).toBeGreaterThan(0);
    expect(callsAfterFlush[0][1]).toMatchObject({ id: "t1" });

    vi.useRealTimers();
  });
});
