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
      body: "New features",
      download: vi.fn(),
      install: vi.fn(),
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

  it("24h cache: second auto runCheck within 24h skips the network call", async () => {
    const { check } = await import("@tauri-apps/plugin-updater");
    const mockCheck = vi.mocked(check);
    mockCheck.mockResolvedValue(null as any);

    const { useUpdater } = await import("./useUpdater");
    const { runCheck } = useUpdater();

    await runCheck();
    expect(mockCheck).toHaveBeenCalledTimes(1);

    // Second auto call within 24h — should not check again
    await runCheck();
    expect(mockCheck).toHaveBeenCalledTimes(1);
  });

  it("manual check bypasses 24h cache", async () => {
    const { check } = await import("@tauri-apps/plugin-updater");
    const mockCheck = vi.mocked(check);
    mockCheck.mockResolvedValue(null as any);

    const { useUpdater } = await import("./useUpdater");
    const { runCheck } = useUpdater();

    await runCheck();
    expect(mockCheck).toHaveBeenCalledTimes(1);

    // Manual check should bypass cache
    await runCheck({ manual: true });
    expect(mockCheck).toHaveBeenCalledTimes(2);
  });

  it("manual check with no update sets checkMessage", async () => {
    const { check } = await import("@tauri-apps/plugin-updater");
    const mockCheck = vi.mocked(check);
    mockCheck.mockResolvedValue(null as any);

    const { useUpdater } = await import("./useUpdater");
    const { runCheck, checkMessage } = useUpdater();

    await runCheck({ manual: true });

    expect(checkMessage.value).toBe("当前已是最新版本");
  });

  it("manual check failure sets checkMessage", async () => {
    const { check } = await import("@tauri-apps/plugin-updater");
    const mockCheck = vi.mocked(check);
    mockCheck.mockRejectedValue(new Error("Network error"));

    const { useUpdater } = await import("./useUpdater");
    const { runCheck, checkMessage } = useUpdater();

    await runCheck({ manual: true });

    expect(checkMessage.value).toContain("检查更新失败");
    expect(checkMessage.value).toContain("Network error");
  });

  it("auto check failure does not set checkMessage (silent)", async () => {
    const { check } = await import("@tauri-apps/plugin-updater");
    const mockCheck = vi.mocked(check);
    mockCheck.mockRejectedValue(new Error("Network error"));

    const { useUpdater } = await import("./useUpdater");
    const { runCheck, checkMessage } = useUpdater();

    await runCheck();

    expect(checkMessage.value).toBeNull();
  });

  it("downloadUpdate calls download() and sets progress", async () => {
    const { check } = await import("@tauri-apps/plugin-updater");
    const mockCheck = vi.mocked(check);
    const mockDownload = vi.fn().mockImplementation(async (callback) => {
      callback({ event: "Started", data: { contentLength: 1000 } });
      callback({ event: "Progress", data: { chunkLength: 500 } });
      callback({ event: "Progress", data: { chunkLength: 500 } });
    });
    mockCheck.mockResolvedValue({
      version: "0.2.0",
      download: mockDownload,
      install: vi.fn(),
    } as any);

    const { useUpdater } = await import("./useUpdater");
    const { runCheck, downloadUpdate, downloadState, downloadedBytes, totalBytes, progressPercent } =
      useUpdater();

    await runCheck();
    expect(downloadState.value).toBe("idle");

    await downloadUpdate();

    expect(mockDownload).toHaveBeenCalledTimes(1);
    expect(downloadState.value).toBe("downloaded");
    expect(totalBytes.value).toBe(1000);
    expect(downloadedBytes.value).toBe(1000);
    expect(progressPercent.value).toBe(100);
  });

  it("downloadUpdate error sets downloadState to error", async () => {
    const { check } = await import("@tauri-apps/plugin-updater");
    const mockCheck = vi.mocked(check);
    const mockDownload = vi.fn().mockRejectedValue(new Error("Download failed"));
    mockCheck.mockResolvedValue({
      version: "0.2.0",
      download: mockDownload,
      install: vi.fn(),
    } as any);

    const { useUpdater } = await import("./useUpdater");
    const { runCheck, downloadUpdate, downloadState } = useUpdater();

    await runCheck();
    await downloadUpdate();

    expect(downloadState.value).toBe("error");
  });

  it("installUpdate calls install() then relaunch()", async () => {
    const { check } = await import("@tauri-apps/plugin-updater");
    const { relaunch } = await import("@tauri-apps/plugin-process");
    const mockInstall = vi.fn().mockResolvedValue(undefined);
    const mockDownload = vi.fn().mockResolvedValue(undefined);
    const mockCheck = vi.mocked(check);
    mockCheck.mockResolvedValue({
      version: "0.2.0",
      download: mockDownload,
      install: mockInstall,
    } as any);
    const mockRelaunch = vi.mocked(relaunch);

    const { useUpdater } = await import("./useUpdater");
    const { runCheck, downloadUpdate, installUpdate, downloadState } = useUpdater();

    await runCheck();
    await downloadUpdate();
    expect(downloadState.value).toBe("downloaded");

    await installUpdate();

    expect(mockInstall).toHaveBeenCalledTimes(1);
    expect(mockRelaunch).toHaveBeenCalledTimes(1);
  });
});
