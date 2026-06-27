import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ref, nextTick } from "vue";
import type { TodoTask } from "../types/todo";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(null),
}));

vi.mock("./useNotify", () => ({
  notify: vi.fn(),
}));

vi.mock("../utils/currentDate", () => ({
  currentDate: vi.fn(() => "2026-06-27"),
}));

import { useTaskReminders } from "./useTaskReminders";
import { notify } from "./useNotify";
import { currentDate } from "../utils/currentDate";
import { invoke } from "@tauri-apps/api/core";

const mockedNotify = vi.mocked(notify);
const mockedCurrentDate = vi.mocked(currentDate);
const mockedInvoke = vi.mocked(invoke);

function makeTask(overrides: Partial<TodoTask> = {}): TodoTask {
  return {
    id: "t1",
    description: "测试任务",
    completed: false,
    archived: false,
    priority: "medium",
    dueDate: "2026-06-27",
    createdAt: "2026-06-27T00:00:00Z",
    updatedAt: "2026-06-27T00:00:00Z",
    ...overrides,
  };
}

describe("useTaskReminders", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-27T10:00:00"));
    mockedNotify.mockClear();
    mockedInvoke.mockClear();
    mockedInvoke.mockResolvedValue(null);
    mockedCurrentDate.mockReturnValue("2026-06-27");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("notifies when due-time task enters reminder window", () => {
    const tasks = ref([
      makeTask({ id: "t1", dueTime: "10:10", reminderMinutes: 15 }),
    ]);
    const { checkReminders } = useTaskReminders(tasks);

    // now=10:00, due=10:10, advance=15min → reminderMs=9:55 → now >= reminderMs ✓
    checkReminders();

    expect(mockedNotify).toHaveBeenCalledTimes(1);
    expect(mockedNotify).toHaveBeenCalledWith(
      "warning",
      "任务到期 · Qtodo",
      expect.stringContaining("测试任务"),
    );
  });

  it("does not duplicate notification for same task", () => {
    const tasks = ref([
      makeTask({ id: "t1", dueTime: "10:10", reminderMinutes: 15 }),
    ]);
    const { checkReminders } = useTaskReminders(tasks);

    checkReminders();
    checkReminders();

    expect(mockedNotify).toHaveBeenCalledTimes(1);
  });

  it("does not trigger for completed tasks", () => {
    const tasks = ref([
      makeTask({ id: "t1", dueTime: "10:10", reminderMinutes: 15, completed: true }),
    ]);
    const { checkReminders } = useTaskReminders(tasks);

    checkReminders();

    expect(mockedNotify).not.toHaveBeenCalled();
  });

  it("does not trigger for archived tasks", () => {
    const tasks = ref([
      makeTask({ id: "t1", dueTime: "10:10", reminderMinutes: 15, archived: true }),
    ]);
    const { checkReminders } = useTaskReminders(tasks);

    checkReminders();

    expect(mockedNotify).not.toHaveBeenCalled();
  });

  it("skips task with reminderMinutes = -1", () => {
    const tasks = ref([
      makeTask({ id: "t1", dueTime: "10:10", reminderMinutes: -1 }),
    ]);
    const { checkReminders } = useTaskReminders(tasks);

    checkReminders();

    expect(mockedNotify).not.toHaveBeenCalled();
  });

  it("allows re-notification after dueTime is edited", async () => {
    const tasks = ref([
      makeTask({ id: "t1", dueTime: "10:10", reminderMinutes: 15 }),
    ]);
    const { checkReminders } = useTaskReminders(tasks);

    checkReminders();
    expect(mockedNotify).toHaveBeenCalledTimes(1);

    // Edit the dueTime → should be allowed to notify again
    // new due=10:08, advance=15 → reminder=9:53, now=10:00 → in window
    tasks.value = [
      makeTask({ id: "t1", dueTime: "10:08", reminderMinutes: 15 }),
    ];
    await nextTick();

    checkReminders();
    expect(mockedNotify).toHaveBeenCalledTimes(2);
  });

  it("clears notifiedToday on date change", () => {
    const tasks = ref([
      makeTask({ id: "t1", dueTime: "10:10", reminderMinutes: 15 }),
    ]);
    const { checkReminders } = useTaskReminders(tasks);

    checkReminders();
    expect(mockedNotify).toHaveBeenCalledTimes(1);

    // Advance system time to next day and update mock
    vi.setSystemTime(new Date("2026-06-28T10:00:00"));
    mockedCurrentDate.mockReturnValue("2026-06-28");

    // Update task dueDate so it still matches the new "today"
    tasks.value = [
      makeTask({ id: "t1", dueDate: "2026-06-28", dueTime: "10:10", reminderMinutes: 15 }),
    ];

    checkReminders();
    expect(mockedNotify).toHaveBeenCalledTimes(2);
  });

  it("notifies overdue task with expired wording", () => {
    // now=10:00, due=09:50 → already past due
    const tasks = ref([
      makeTask({ id: "t1", dueTime: "09:50", reminderMinutes: 5 }),
    ]);
    const { checkReminders } = useTaskReminders(tasks);

    checkReminders();

    expect(mockedNotify).toHaveBeenCalledWith(
      "error",
      "任务到期 · Qtodo",
      expect.stringContaining("已过期"),
    );
  });

  it("groups due-date-only tasks into one notification", () => {
    const tasks = ref([
      makeTask({ id: "t1", dueDate: "2026-06-27" }),
      makeTask({ id: "t2", dueDate: "2026-06-27", description: "另一个任务" }),
    ]);
    const { checkReminders } = useTaskReminders(tasks);

    checkReminders();

    expect(mockedNotify).toHaveBeenCalledTimes(1);
    expect(mockedNotify).toHaveBeenCalledWith(
      "info",
      "今日任务 · Qtodo",
      expect.stringContaining("2 个任务到期"),
    );
  });

  it("notifies date-only tasks even when global setting is -1 (关闭)", async () => {
    mockedInvoke.mockResolvedValue("-1");
    const tasks = ref([
      makeTask({ id: "t1", dueDate: "2026-06-27" }),
    ]);
    const { start, checkReminders } = useTaskReminders(tasks);

    start();
    await vi.advanceTimersByTimeAsync(0);
    checkReminders();

    expect(mockedNotify).toHaveBeenCalledTimes(1);
    expect(mockedNotify).toHaveBeenCalledWith(
      "info",
      "今日任务 · Qtodo",
      expect.stringContaining("1 个任务到期"),
    );
  });

  it("uses only title in notification body, not description", () => {
    const tasks = ref([
      makeTask({
        id: "t1",
        title: "开会",
        description: "讨论Q3计划",
        dueTime: "10:10",
        reminderMinutes: 15,
      }),
    ]);
    const { checkReminders } = useTaskReminders(tasks);

    checkReminders();

    expect(mockedNotify).toHaveBeenCalledTimes(1);
    const body = mockedNotify.mock.calls[0][2];
    expect(body).toContain("「开会」");
    expect(body).not.toContain("讨论Q3计划");
  });

  it("falls back to description when title is absent", () => {
    const tasks = ref([
      makeTask({
        id: "t1",
        description: "买牛奶",
        dueTime: "10:10",
        reminderMinutes: 15,
      }),
    ]);
    const { checkReminders } = useTaskReminders(tasks);

    checkReminders();

    expect(mockedNotify).toHaveBeenCalledTimes(1);
    const body = mockedNotify.mock.calls[0][2];
    expect(body).toContain("「买牛奶」");
  });

  it("uses global default when reminderMinutes is undefined", async () => {
    mockedInvoke.mockResolvedValue("10");
    const tasks = ref([
      makeTask({ id: "t1", dueTime: "10:05", reminderMinutes: undefined }),
    ]);
    const { start, checkReminders } = useTaskReminders(tasks);

    start();
    await vi.advanceTimersByTimeAsync(0);

    // now=10:00, due=10:05, advance=10min → reminderMs=9:55 → now >= reminderMs ✓
    checkReminders();

    expect(mockedNotify).toHaveBeenCalledTimes(1);
  });
});
