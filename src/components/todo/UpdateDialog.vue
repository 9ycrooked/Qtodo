<script setup lang="ts">
import { computed } from "vue";
import type { Update } from "@tauri-apps/plugin-updater";
import { getCurrentWindow } from "@tauri-apps/api/window";
import QmDialog from "../ui/QmDialog.vue";

const model = defineModel<boolean>({ default: false });

const props = defineProps<{
  pendingUpdate: Update | null;
  installState: "idle" | "installing" | "error";
}>();

const emit = defineEmits<{
  (event: "later"): void;
  (event: "install"): void;
}>();

const version = computed(() => props.pendingUpdate?.version ?? "");
const body = computed(() => props.pendingUpdate?.body ?? "");

const closeDialog = () => {
  model.value = false;
};

const handleLater = () => {
  emit("later");
  closeDialog();
};

const handleInstall = () => {
  emit("install");
};

const handleExit = () => {
  getCurrentWindow().close();
};
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

      <p v-if="installState === 'installing'" class="status-text">
        正在下载并安装更新…
      </p>
      <p v-else-if="installState === 'error'" class="status-text error">
        下载失败，请重试。
      </p>

      <nav class="right-align no-space dialog-actions">
        <button
          type="button"
          class="transparent link slow-ripple"
          :disabled="installState === 'installing'"
          @click="handleLater"
        >
          稍后
        </button>
        <button
          type="button"
          class="transparent link slow-ripple"
          :disabled="installState === 'installing'"
          @click="handleExit"
        >
          退出
        </button>
        <button
          type="button"
          class="fill slow-ripple"
          :disabled="installState === 'installing'"
          @click="handleInstall"
        >
          {{ installState === 'installing' ? '安装中…' : '立即安装' }}
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

.status-text {
  margin: 0;
  font-size: 13px;
  color: var(--on-surface-variant);
}

.status-text.error {
  color: var(--error);
}

.dialog-actions {
  margin-top: 2px;
}
</style>
