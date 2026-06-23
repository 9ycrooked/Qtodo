import { ref, shallowRef, markRaw } from "vue";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

const LAST_CHECKED_KEY = "qtodo.updater.lastCheckedAt";
const LAST_FAILURE_KEY = "qtodo.updater.lastFailureAt";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * 模块级 ref -- 所有调用 useUpdater() 的组件共享同一个状态
 */
const updateAvailable = ref(false);
const pendingUpdate = shallowRef<Update | null>(null);
const lastCheckedAt = ref<string | null>(null);

export const useUpdater = () => {
  const runCheck = async (): Promise<void> => {
    // 24h cache: skip if we checked recently
    const cached = localStorage.getItem(LAST_CHECKED_KEY);
    if (cached) {
      const elapsed = Date.now() - new Date(cached).getTime();
      if (elapsed < CACHE_DURATION_MS) {
        return;
      }
    }

    try {
      const result = await check();
      localStorage.setItem(LAST_CHECKED_KEY, new Date().toISOString());
      lastCheckedAt.value = new Date().toISOString();

      if (result) {
        updateAvailable.value = true;
        pendingUpdate.value = markRaw(result);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[qtodo] updater check failed:", err);
      localStorage.setItem(LAST_FAILURE_KEY, new Date().toISOString());
    }
  };

  const installUpdate = async (): Promise<void> => {
    if (!pendingUpdate.value) return;
    await pendingUpdate.value.downloadAndInstall();
    await relaunch();
  };

  return {
    updateAvailable,
    pendingUpdate,
    lastCheckedAt,
    runCheck,
    installUpdate,
  };
};
