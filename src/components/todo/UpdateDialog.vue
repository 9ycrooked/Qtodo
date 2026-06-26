<script setup lang="ts">
import { computed } from "vue";
import type { Update } from "@tauri-apps/plugin-updater";
import type { DownloadState } from "../../composables/useUpdater";
import QmDialog from "../ui/QmDialog.vue";

const model = defineModel<boolean>({ default: false });

const props = defineProps<{
  pendingUpdate: Update | null;
  downloadState: DownloadState;
  downloadedBytes: number;
  totalBytes: number;
  progressPercent: number;
}>();

const emit = defineEmits<{
  (event: "dismiss"): void;
  (event: "install"): void;
}>();

const version = computed(() => props.pendingUpdate?.version ?? "");
const body = computed(() => props.pendingUpdate?.body ?? "");
const hasTotalBytes = computed(() => props.totalBytes > 0);

const closeDialog = () => {
  model.value = false;
};

const handleDismiss = () => {
  emit("dismiss");
  closeDialog();
};

const handleInstall = () => {
  emit("install");
};

const dismissLabel = computed(() => {
  if (props.downloadState === "downloading") return "后台下载";
  return "稍后";
});

const installLabel = computed(() => {
  if (props.downloadState === "downloaded") return "立即安装";
  return "立即更新";
});
const showInstallButton = computed(() =>
  props.downloadState === "idle" ||
  props.downloadState === "error" ||
  props.downloadState === "downloaded",
);
const showDismissButton = computed(() => props.downloadState !== "downloaded");
const showProgressBar = computed(() => props.downloadState === "downloading");
const showDownloadComplete = computed(() => props.downloadState === "downloaded");
const showError = computed(() => props.downloadState === "error");
</script>

<template>
  <QmDialog v-model="model" title="检查更新">
    <div class="update-dialog">
      <header class="dialog-header">
        <div>
          <h5>Qtodo v{{ version }} 可用</h5>
          <p>新版本已发布，建议更新以获得最佳体验。</p>
        </div>

        <button
          type="button"
          class="circle transparent dialog-close-button slow-ripple"
          aria-label="关闭"
          @click="closeDialog"
        >
          <i>close</i>
        </button>
      </header>

      <div v-if="body" class="release-notes">
        <pre class="release-notes-content">{{ body }}</pre>
      </div>

      <!-- 下载进度条 -->
      <div v-if="showProgressBar" class="download-progress">
        <div class="progress-bar" aria-hidden="true">
          <div
            class="progress-bar-fill"
            :style="{ width: hasTotalBytes ? `${progressPercent}%` : '35%' }"
            :class="{ indeterminate: !hasTotalBytes }"
          ></div>
        </div>
        <p class="progress-text">
          {{ hasTotalBytes ? `${progressPercent}%` : '正在下载更新…' }}
        </p>
      </div>

      <!-- 下载完成提示 -->
      <p v-if="showDownloadComplete" class="status-text complete">
        下载完成，是否立即安装？
      </p>

      <!-- 下载错误 -->
      <p v-if="showError" class="status-text error">
        下载失败，请重试。
      </p>

      <nav class="right-align no-space dialog-actions">
        <!-- dismiss 按钮：稍后 / 后台下载 -->
        <button
          v-if="showDismissButton"
          type="button"
          class="transparent link slow-ripple"
          @click="handleDismiss"
        >
          {{ dismissLabel }}
        </button>

        <!-- 更新/安装按钮：idle/error 时触发下载，downloaded 时触发安装 -->
        <button
          v-if="showInstallButton"
          type="button"
          class="fill slow-ripple"
          @click="handleInstall"
        >
          {{ installLabel }}
        </button>
      </nav>
    </div>
  </QmDialog>
</template>

<style scoped>
.update-dialog {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.dialog-header h5 {
  margin: 0;
  color: var(--on-surface);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
}

.dialog-header p {
  margin: 6px 0 0;
  color: var(--on-surface-variant);
  font-size: 13px;
  line-height: 1.35;
}

.dialog-close-button {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  padding: 0;
  color: var(--on-surface-variant);
}

.release-notes {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--outline-variant);
  border-radius: 14px;
  background-color: var(--surface-container-low);
}

.release-notes-content {
  margin: 0;
  padding: 12px 14px;
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.5;
  color: var(--on-surface);
}

/* 进度条 */
.download-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background-color: var(--surface-container-high);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 3px;
  background-color: var(--primary);
  transition: width 200ms ease;
}

.progress-bar-fill.indeterminate {
  animation: indeterminate 1.5s ease-in-out infinite;
}

@keyframes indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(300%);
  }
}

.progress-text {
  margin: 0;
  font-size: 13px;
  color: var(--on-surface-variant);
}

/* 状态文案 */
.status-text {
  margin: 0;
  font-size: 13px;
  color: var(--on-surface-variant);
}

.status-text.complete {
  color: var(--primary);
}

.status-text.error {
  color: var(--error);
}

.dialog-actions {
  margin-top: 2px;
}
</style>
