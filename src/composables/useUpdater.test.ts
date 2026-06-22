import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @tauri-apps/plugin-updater
vi.mock("@tauri-apps/plugin-updater", () => ({
  check: vi.fn(),
}));

// Mock @tauri-apps/plugin-process
vi.mock("@tauri-apps/plugin-process", () => ({
  relaunch: vi.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("useUpdater", () => {
  beforeEach(async () => {
    vi.resetModules();
    localStorageMock.clear();
    vi.clearAllMocks();

    vi.doMock("@tauri-apps/plugin-updater", () => ({
      check: vi.fn(),
    }));
    vi.doMock("@tauri-apps/plugin-process", () => ({
      relaunch: vi.fn(),
    }));
  });

  it("runCheck calls check() and sets updateAvailable when update found", async () => {
    const { check } = await import("@tauri-apps/plugin-updater");
    const mockCheck = vi.mocked(check);
    mockCheck.mockResolvedValue({
      available: true,
      version: "0.2.0",
      notes: "New features",
      pubDate: new Date("2026-06-22"),
      downloadAndInstall: vi.fn(),
    } as any);

    const { useUpdater } = await import("./useUpdater");
    const { updateAvailable, pendingUpdate, runCheck } = useUpdater();

    expect(updateAvailable.value).toBe(false);
    expect(pendingUpdate.value).toBeNull();

    await runCheck();

    expect(mockCheck).toHaveBeenCalledTimes(1);
    expect(updateAvailable.value).toBe(true);
    expect(pendingUpdate.value).not.toBeNull();
    expect(pendingUpdate.value!.version).toBe("0.2.0");
  });

  it("24h cache: second runCheck within 24h skips the network call", async () => {
    const { check } = await import("@tauri-apps/plugin-updater");
    const mockCheck = vi.mocked(check);
    mockCheck.mockResolvedValue(null as any);

    const { useUpdater } = await import("./useUpdater");
    const { runCheck } = useUpdater();

    await runCheck();
    expect(mockCheck).toHaveBeenCalledTimes(1);

    // Second call within 24h — should not check again
    await runCheck();
    expect(mockCheck).toHaveBeenCalledTimes(1);
  });

  it("error path: check failure does not set updateAvailable, writes lastFailureAt", async () => {
    const { check } = await import("@tauri-apps/plugin-updater");
    const mockCheck = vi.mocked(check);
    mockCheck.mockRejectedValue(new Error("Network error"));

    const { useUpdater } = await import("./useUpdater");
    const { updateAvailable, runCheck } = useUpdater();

    await runCheck();

    expect(updateAvailable.value).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "qtodo.updater.lastFailureAt",
      expect.any(String),
    );
  });

  it("installUpdate calls downloadAndInstall then relaunch", async () => {
    const { check } = await import("@tauri-apps/plugin-updater");
    const { relaunch } = await import("@tauri-apps/plugin-process");
    const mockDownloadAndInstall = vi.fn().mockResolvedValue(undefined);
    const mockCheck = vi.mocked(check);
    mockCheck.mockResolvedValue({
      available: true,
      version: "0.2.0",
      downloadAndInstall: mockDownloadAndInstall,
    } as any);
    const mockRelaunch = vi.mocked(relaunch);

    const { useUpdater } = await import("./useUpdater");
    const { runCheck, installUpdate } = useUpdater();

    await runCheck();
    await installUpdate();

    expect(mockDownloadAndInstall).toHaveBeenCalledTimes(1);
    expect(mockRelaunch).toHaveBeenCalledTimes(1);
  });
});
