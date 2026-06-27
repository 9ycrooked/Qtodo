import { computed, ref, shallowRef, markRaw } from "vue";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

const LAST_CHECKED_KEY = "qtodo.updater.lastCheckedAt";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export type DownloadState = "idle" | "downloading" | "downloaded" | "error";

/**
 * 模块级 ref -- 所有调用 useUpdater() 的组件共享同一个状态
 */
const updateAvailable = ref(false);
const pendingUpdate = shallowRef<Update | null>(null);
const lastCheckedAt = ref<string | null>(null);

const downloadedBytes = ref(0);
const totalBytes = ref(0);
const downloadState = ref<DownloadState>("idle");
const checkMessage = ref<string | null>(null);
const checkSource = ref<"auto" | "manual">("auto");
const isChecking = ref(false);

const progressPercent = computed(() => {
  if (!totalBytes.value) return 0;
  return Math.min(100, Math.round((downloadedBytes.value / totalBytes.value) * 100));
});

export const useUpdater = () => {
  /**
   * 检查更新。
   * - manual: true 时绕过 24h 缓存，直接请求服务端。
   * - 手动检查的结果通过 checkMessage 反馈（"已是最新"或报错）。
   * - 自动检查失败时静默，不设置 checkMessage。
   */
  const runCheck = async (options: { manual?: boolean } = {}): Promise<void> => {
    const manual = Boolean(options.manual);
    checkSource.value = manual ? "manual" : "auto";

    // 24h cache: 仅自动检查时生效
    if (!manual) {
      const cached = localStorage.getItem(LAST_CHECKED_KEY);
      if (cached) {
        const elapsed = Date.now() - new Date(cached).getTime();
        if (elapsed < CACHE_DURATION_MS) {
          return;
        }
      }
    }

    try {
      isChecking.value = true;
      const result = await check();
      localStorage.setItem(LAST_CHECKED_KEY, new Date().toISOString());
      lastCheckedAt.value = new Date().toISOString();

      if (result) {
        updateAvailable.value = true;
        pendingUpdate.value = markRaw(result);
        if (manual) {
          checkMessage.value = "发现新版本";
        }
      } else if (manual) {
        checkMessage.value = "当前已是最新版本";
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[qtodo] updater check failed:", err);
      if (manual) {
        const message = err instanceof Error ? err.message : "检查更新失败";
        checkMessage.value = `检查更新失败：${message}`;
      }
      // 自动检查失败：静默
    } finally {
      isChecking.value = false;
    }
  };

  /**
   * 开始下载更新（仅下载，不安装）。
   * 下载进度通过 downloadedBytes / totalBytes / progressPercent 追踪。
   * 下载完成后 downloadState 变为 "downloaded"，需要单独调用 installUpdate() 安装。
   */
  const downloadUpdate = async (): Promise<void> => {
    if (!pendingUpdate.value) return;
    if (downloadState.value === "downloading") return;

    downloadState.value = "downloading";
    downloadedBytes.value = 0;
    totalBytes.value = 0;

    try {
      await pendingUpdate.value.download((event) => {
        if (event.event === "Started") {
          totalBytes.value = event.data.contentLength ?? 0;
        }
        if (event.event === "Progress") {
          downloadedBytes.value += event.data.chunkLength;
        }
      });
      downloadState.value = "downloaded";
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[qtodo] updater download failed:", err);
      downloadState.value = "error";
    }
  };

  /**
   * 安装已下载的更新并重启应用。
   * 仅在 downloadState === "downloaded" 时有效。
   */
  const installUpdate = async (): Promise<void> => {
    if (!pendingUpdate.value || downloadState.value !== "downloaded") return;
    await pendingUpdate.value.install();
    await relaunch();
  };

  return {
    updateAvailable,
    pendingUpdate,
    lastCheckedAt,
    downloadedBytes,
    totalBytes,
    progressPercent,
    downloadState,
    checkMessage,
    checkSource,
    isChecking,
    runCheck,
    downloadUpdate,
    installUpdate,
  };
};
