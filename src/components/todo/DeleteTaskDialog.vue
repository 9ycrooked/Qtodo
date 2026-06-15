<script setup lang="ts">
import QmDialog from "../ui/QmDialog.vue";

const model = defineModel<boolean>({ default: false });

defineProps<{
  taskDescription?: string;
}>();

const emit = defineEmits<{
  (event: "confirm"): void;
}>();

const closeDialog = () => {
  model.value = false;
};

const confirmDelete = () => {
  emit("confirm");
  closeDialog();
};
</script>

<template>
  <QmDialog v-model="model" title="删除任务">
    <div class="delete-task-dialog">
      <header class="dialog-header">
        <div>
          <h5>删除任务？</h5>
          <p>删除后无法恢复。</p>
        </div>

        <button type="button" class="circle transparent dialog-close-button slow-ripple" aria-label="关闭" @click="closeDialog">
          <i>close</i>
        </button>
      </header>

      <p v-if="taskDescription" class="delete-task-name">{{ taskDescription }}</p>

      <nav class="right-align no-space dialog-actions">
        <button type="button" class="transparent link slow-ripple" @click="closeDialog">取消</button>
        <button type="button" class="transparent link danger-action slow-ripple" @click="confirmDelete">删除</button>
      </nav>
    </div>
  </QmDialog>
</template>

<style scoped>
.delete-task-dialog {
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

.delete-task-name {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid var(--outline-variant);
  border-radius: 14px;
  color: var(--on-surface);
  background-color: var(--surface-container-low);
  font-size: 13px;
  font-weight: 650;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.dialog-actions {
  margin-top: 2px;
}

.danger-action {
  color: var(--error);
}
</style>
