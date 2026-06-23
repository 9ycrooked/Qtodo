<script setup lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { open } from "@tauri-apps/plugin-dialog";
import { computed, onMounted, ref } from "vue";
import { useUpdater } from "../composables/useUpdater";

const { runCheck } = useUpdater();

const dbPath = ref("");
const copying = ref(false);
const error = ref("");
const successMessage = ref("");
const appVersion = ref("");

const displayPath = computed(() => {
  const path = dbPath.value;
  if (path.length <= 50) return path;
  return path.slice(0, 20) + "..." + path.slice(-20);
});

async function loadPath() {
  try {
    error.value = "";
    successMessage.value = "";
    dbPath.value = await invoke<string>("get_db_path");
  } catch (e) {
    error.value = typeof e === "string" ? e : String(e);
  }
}

async function changePath() {
  try {
    error.value = "";
    successMessage.value = "";

    const selected = await open({ directory: true, multiple: false });
    if (!selected) return;

    copying.value = true;
    await invoke("set_db_path", { newDir: selected });
    await loadPath();
    successMessage.value = "存储位置已更改";
  } catch (e) {
    error.value = typeof e === "string" ? e : String(e);
  } finally {
    copying.value = false;
  }
}

async function resetPath() {
  try {
    error.value = "";
    successMessage.value = "";
    copying.value = true;
    await invoke("set_db_path", { newDir: null });
    await loadPath();
    successMessage.value = "已恢复为默认位置";
  } catch (e) {
    error.value = typeof e === "string" ? e : String(e);
  } finally {
    copying.value = false;
  }
}

onMounted(async () => {
  await loadPath();
  appVersion.value = await getVersion();
});
</script>

<template>
  <section class="page-view" aria-labelledby="settings-title">
    <header class="page-header">
      <h3 id="settings-title" class="page-name small">设置</h3>
    </header>

    <div class="settings-content">
      <div class="settings-section">
        <h4 class="section-title">数据存储位置</h4>

        <p class="path-display" :title="dbPath">{{ displayPath || "加载中…" }}</p>

        <p v-if="copying" class="status copying">正在复制数据库…</p>
        <p v-else-if="error" class="status error">{{ error }}</p>
        <p v-else-if="successMessage" class="status success">{{ successMessage }}</p>

        <div class="actions">
          <button
            type="button"
            class="slow-ripple"
            :disabled="copying"
            @click="changePath"
          >
            更改位置
          </button>
          <button
            type="button"
            class="slow-ripple"
            :disabled="copying"
            @click="resetPath"
          >
            重置为默认
          </button>
        </div>
      </div>

      <div class="settings-section">
        <h4 class="section-title">检查更新</h4>
        <div class="update-row">
          <span class="version-label">v{{ appVersion || '…' }}</span>
          <button
            type="button"
            class="slow-ripple"
            @click="() => runCheck({ manual: true })"
          >
            检查更新
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page-view {
  width: 100%;
  min-width: 0;
  padding: 24px;
}

.page-header {
  display: grid;
  gap: 6px;
  align-content: start;
  min-height: 58px;
}

.page-name {
  margin: 0;
  color: var(--primary);
  font-weight: 600;
  font-size: 24px;
  line-height: 1.2;
}

.settings-content {
  margin-top: 16px;
}

.settings-section {
  padding: 18px;
  border-radius: 20px;
  background-color: var(--surface-container);
  color: var(--on-surface);
}

.section-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
}

.path-display {
  margin: 0 0 16px;
  padding: 10px 14px;
  border-radius: 12px;
  background-color: var(--surface-container-low);
  font-size: 13px;
  font-family: monospace;
  word-break: break-all;
  line-height: 1.5;
}

.status {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.4;
}

.status.copying {
  color: var(--on-surface-variant);
}

.status.error {
  color: var(--error, #b3261e);
}

.status.success {
  color: var(--primary);
}

.actions {
  display: flex;
  gap: 12px;
}

.actions button {
  padding: 8px 20px;
  border-radius: 20px;
  border: none;
  background-color: var(--surface-container-high);
  color: var(--on-surface);
  font-size: 14px;
  cursor: pointer;
}

.actions button:hover:not(:disabled) {
  background-color: var(--primary-container);
}

.actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.update-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.version-label {
  font-size: 14px;
  color: var(--on-surface-variant);
}

.update-row button {
  padding: 8px 20px;
  border-radius: 20px;
  border: none;
  background-color: var(--surface-container-high);
  color: var(--on-surface);
  font-size: 14px;
  cursor: pointer;
}

.update-row button:hover {
  background-color: var(--primary-container);
}

.settings-section + .settings-section {
  margin-top: 16px;
}
</style>
