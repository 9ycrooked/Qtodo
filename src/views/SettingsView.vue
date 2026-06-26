<script setup lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { open } from "@tauri-apps/plugin-dialog";
import { computed, onMounted, ref } from "vue";
import { useUpdater } from "../composables/useUpdater";
import { useTheme } from "../composables/useTheme";
import type { ThemeMode } from "../composables/useTheme";
import QmButton from "../components/ui/QmButton.vue";
import QmIconButton from "../components/ui/QmIconButton.vue";

const { runCheck, isChecking } = useUpdater();
const { themeMode, setMode } = useTheme();

type SettingsPage = "main" | "theme";
const currentPage = ref<SettingsPage>("main");

const themeOptions: { mode: ThemeMode; icon: string; label: string }[] = [
  { mode: "auto", icon: "brightness_auto", label: "自动" },
  { mode: "light", icon: "light_mode", label: "亮色" },
  { mode: "dark", icon: "dark_mode", label: "暗色" },
];

const currentThemeLabel = computed(() => themeOptions.find((o) => o.mode === themeMode.value)?.label ?? "");

function selectTheme(mode: ThemeMode) {
  setMode(mode);
}

function onTriggerKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    (e.currentTarget as HTMLElement).click();
  }
}

const dbPath = ref("");
const copying = ref(false);
const error = ref("");
const appVersion = ref("");

const displayPath = computed(() => {
  const path = dbPath.value;
  if (path.length <= 50) return path;
  return path.slice(0, 20) + "..." + path.slice(-20);
});

async function loadPath() {
  try {
    error.value = "";
    dbPath.value = await invoke<string>("get_db_path");
  } catch (e) {
    error.value = typeof e === "string" ? e : String(e);
  }
}

async function changePath() {
  try {
    error.value = "";

    const selected = await open({ directory: true, multiple: false });
    if (!selected) return;

    copying.value = true;
    await invoke("set_db_path", { newDir: selected });
    await loadPath();
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
      <h3 id="settings-title" class="page-name small">
        {{ currentPage === 'theme' ? '主题' : '设置' }}
      </h3>
      <QmIconButton v-if="currentPage !== 'main'" icon="arrow_back" style="margin-left: auto" @click="currentPage = 'main'" />
    </header>

    <div v-if="currentPage === 'main'" class="settings-content">
      <article class="card settings-card clickable" @click="currentPage = 'theme'">
        <nav>
          <i>palette</i>
          <div class="card-desc-wrap">
            <h6>主题</h6>
            <span class="card-desc">设置主题模式，调整色彩</span>
          </div>
          <i class="chevron">chevron_right</i>
        </nav>
      </article>

      <article class="card settings-card">
        <nav>
          <i>folder</i>
          <h6 class="max">数据存储位置</h6>
        </nav>

        <nav v-if="copying" class="status-row">
          <i class="secondary-text">hourglass_empty</i>
          <span class="secondary-text">正在复制数据库…</span>
        </nav>
        <nav v-else-if="error" class="status-row">
          <i class="error-text">error</i>
          <span class="error-text">{{ error }}</span>
        </nav>

        <nav class="path-row">
          <span class="path-display" :title="dbPath">{{ displayPath || '加载中…' }}</span>
          <QmButton variant="tonal" size="small" icon="edit" :loading="copying" :disabled="copying" @click.stop="changePath">
            更改位置
          </QmButton>
        </nav>
      </article>

      <article class="card settings-card">
        <nav class="update-row">
          <i>upgrade</i>
          <h6 class="max">检查更新</h6>
          <span class="secondary-text">v{{ appVersion || '…' }}</span>
          <QmButton
            class="qm-update-btn"
            variant="tonal"
            size="small"
            :icon="isChecking ? 'progress_activity' : 'cloud_download'"
            :loading="isChecking"
            :disabled="isChecking"
            @click.stop="() => runCheck({ manual: true })"
          >
            {{ isChecking ? '正在检查…' : '检查更新' }}
          </QmButton>
        </nav>
      </article>
    </div>

    <div v-else-if="currentPage === 'theme'" class="settings-content">
      <article class="card settings-card">
        <nav>
          <i>palette</i>
          <h6 class="max">主题外观</h6>
          <div class="theme-dropdown">
            <QmButton variant="tonal" size="small" data-ui="#theme-menu" @keydown="onTriggerKeydown">
              <i>{{ themeOptions.find(o => o.mode === themeMode)?.icon }}</i>
              {{ currentThemeLabel }}
              <i>arrow_drop_down</i>
            </QmButton>
            <menu id="theme-menu" class="no-wrap">
              <li
                v-for="opt in themeOptions"
                :key="opt.mode"
                @click="selectTheme(opt.mode)"
              >
                <i>{{ opt.icon }}</i>
                <div class="max">
                  <div>{{ opt.label }}</div>
                </div>
                <i v-if="themeMode === opt.mode" class="check-icon">check</i>
              </li>
            </menu>
          </div>
        </nav>
      </article>
    </div>
  </section>
</template>

<style scoped>
.page-view {
  width: 100%;
  min-width: 0;
  padding: 16px;
  overflow-y: auto;
}

.page-header {
  display: flex;
  gap: 4px;
  align-items: center;
  min-height: 44px;
}

.page-name {
  margin: 0;
  color: var(--primary);
  font-weight: 600;
  font-size: 20px;
  line-height: 2rem;
}

.settings-content {
  margin-top: 10px;
}

.settings-card {
  padding: 12px;
  border-radius: 12px;
  background-color: var(--surface-container-low);
}

.settings-card.clickable {
  cursor: pointer;
  transition: background-color 120ms ease;
}

.settings-card.clickable:hover {
  background-color: var(--surface-container);
}

.settings-card nav:first-child > i {
  color: var(--primary);
  font-size: 20px;
}

.settings-card nav:first-child h6 {
  font-size: 14px;
  font-weight: 600;
}

.chevron {
  margin-left: auto;
  color: var(--on-surface-variant);
  font-size: 20px;
}

.card-desc-wrap {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.card-desc {
  color: var(--on-surface-variant);
  font-size: 12px;
}

.check-icon {
  color: var(--primary);
  font-size: 20px;
}

.path-row {
  margin-top: 6px;
  gap: 8px;
  align-items: center;
}

.path-display {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  border-radius: 8px;
  background-color: var(--surface-container);
  font-size: 13px;
  font-weight: 500;
  font-family: monospace;
  word-break: break-all;
  line-height: 1.4;
  color: var(--on-surface-variant);
}

.status-row {
  margin-top: 2px;
}

.status-row i {
  font-size: 16px;
}

.secondary-text {
  color: var(--on-surface-variant);
  font-size: 12px;
}

.error-text {
  color: var(--error);
  font-size: 12px;
}

.update-row {
  gap: 12px;
  align-items: center;
}

.update-row .secondary-text {
  margin-left: auto;
  font-size: 12px;
}

.update-row .qm-update-btn {
  min-width: 100px;
}

.theme-dropdown {
  position: relative;
}

.theme-dropdown menu {
  right: 0;
  left: auto;
}

.theme-dropdown menu li {
  cursor: pointer;
}

</style>
