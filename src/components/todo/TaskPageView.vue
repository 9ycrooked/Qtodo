<script setup lang="ts">
import TaskList from "./TaskList.vue";
import type { TodoTask } from "../../types/todo";

withDefaults(
  defineProps<{
    title: string;
    titleId: string;
    tasks: TodoTask[];
    canArchive?: boolean;
    canDelete?: boolean;
    canEdit?: boolean;
    canToggleComplete?: boolean;
    draggable?: boolean;
    emptyText?: string;
  }>(),
  {
    canArchive: false,
    canDelete: true,
    canEdit: true,
    canToggleComplete: true,
    draggable: false,
    emptyText: "暂时没有任务",
  },
);

const emit = defineEmits<{
  (event: "reorder", tasks: TodoTask[]): void;
  (event: "toggle-complete", id: string, completed: boolean): void;
  (event: "edit", id: string): void;
  (event: "delete", id: string): void;
  (event: "archive", id: string): void;
}>();
</script>

<template>
  <section class="page-view" :aria-labelledby="titleId">
    <header class="page-header">
      <h3 :id="titleId" class="page-name small">{{ title }}</h3>
      <span class="current-count">共 {{ tasks.length }} 个</span>
    </header>

    <div class="task-section">
      <TaskList
        v-if="tasks.length > 0"
        :tasks="tasks"
        :can-archive="canArchive"
        :can-delete="canDelete"
        :can-edit="canEdit"
        :can-toggle-complete="canToggleComplete"
        :draggable="draggable"
        @reorder="emit('reorder', $event)"
        @toggle-complete="(id, completed) => emit('toggle-complete', id, completed)"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @archive="emit('archive', $event)"
      />

      <div v-else class="page-placeholder">
        <p>{{ emptyText }}</p>
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

.current-count {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
}

.task-section {
  margin-top: 16px;
}

.page-placeholder {
  display: grid;
  place-items: center;
  min-height: 52px;
  border: 1px dashed var(--outline-variant);
  border-radius: 18px;
  color: var(--on-surface-variant);
  background-color: var(--surface-container-low);
}

.page-placeholder p {
  margin: 0;
  font-size: 13px;
}
</style>
