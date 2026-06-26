import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useNotifications } from "./useNotifications";

describe("useNotifications", () => {
  let notifications: ReturnType<typeof useNotifications>;

  beforeEach(() => {
    vi.useFakeTimers();
    notifications = useNotifications();
    notifications.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("adds a toast and returns its id", () => {
    const id = notifications.success("操作成功");
    expect(id).toBeTruthy();
    expect(notifications.toasts.value).toHaveLength(1);
    expect(notifications.toasts.value[0].message).toBe("操作成功");
    expect(notifications.toasts.value[0].type).toBe("success");
  });

  it("removes a toast by id", () => {
    const id = notifications.info("消息");
    expect(notifications.toasts.value).toHaveLength(1);

    notifications.remove(id!);
    expect(notifications.toasts.value).toHaveLength(0);
  });

  it("rejects empty messages", () => {
    const id = notifications.success("   ");
    expect(id).toBeNull();
    expect(notifications.toasts.value).toHaveLength(0);
  });

  it("trims queue to MAX_TOASTS (4)", () => {
    notifications.info("msg 1");
    notifications.info("msg 2");
    notifications.info("msg 3");
    notifications.info("msg 4");
    notifications.info("msg 5");

    expect(notifications.toasts.value).toHaveLength(4);
    expect(notifications.toasts.value[0].message).toBe("msg 5");
  });

  it("newest toast is first", () => {
    notifications.info("first");
    notifications.info("second");
    notifications.info("third");

    expect(notifications.toasts.value[0].message).toBe("third");
    expect(notifications.toasts.value[1].message).toBe("second");
    expect(notifications.toasts.value[2].message).toBe("first");
  });

  it("auto-removes toast after duration", () => {
    notifications.success("will disappear");
    expect(notifications.toasts.value).toHaveLength(1);

    vi.advanceTimersByTime(3000);
    expect(notifications.toasts.value).toHaveLength(0);
  });

  it("pause prevents auto-removal and resume restarts it", () => {
    notifications.success("paused toast");
    expect(notifications.toasts.value).toHaveLength(1);

    notifications.pause();
    vi.advanceTimersByTime(5000);
    expect(notifications.toasts.value).toHaveLength(1);

    notifications.resume();
    vi.advanceTimersByTime(3000);
    expect(notifications.toasts.value).toHaveLength(0);
  });

  it("pause tracks remaining time correctly", () => {
    notifications.success("partial pause");

    vi.advanceTimersByTime(1000);
    notifications.pause();
    const remaining = notifications.toasts.value[0].remainingMs;
    expect(remaining).toBeLessThanOrEqual(2000);
    expect(remaining).toBeGreaterThan(0);

    notifications.resume();
    vi.advanceTimersByTime(remaining);
    expect(notifications.toasts.value).toHaveLength(0);
  });

  it("clear removes all toasts", () => {
    notifications.info("a");
    notifications.info("b");
    notifications.info("c");
    expect(notifications.toasts.value).toHaveLength(3);

    notifications.clear();
    expect(notifications.toasts.value).toHaveLength(0);
  });

  it("shorthand methods create correct types", () => {
    notifications.success("s");
    notifications.info("i");
    notifications.warning("w");
    notifications.error("e");

    expect(notifications.toasts.value).toHaveLength(4);
    expect(notifications.toasts.value.find((t) => t.type === "error")?.message).toBe("e");
    expect(notifications.toasts.value.find((t) => t.type === "warning")?.message).toBe("w");
    expect(notifications.toasts.value.find((t) => t.type === "success")?.message).toBe("s");
    expect(notifications.toasts.value.find((t) => t.type === "info")?.message).toBe("i");
  });

  it("error toasts have longer default duration", () => {
    notifications.error("slow error");
    expect(notifications.toasts.value[0].durationMs).toBe(8000);
  });

  it("warning toasts have 5s default duration", () => {
    notifications.warning("warn");
    expect(notifications.toasts.value[0].durationMs).toBe(5000);
  });
});
