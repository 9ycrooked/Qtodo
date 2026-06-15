<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import TaskItem from "./TaskItem.vue";
import type { TodoTask } from "../../types/todo";

const props = withDefaults(
  defineProps<{
    tasks: TodoTask[];
    canArchive?: boolean;
    canDelete?: boolean;
    canEdit?: boolean;
    canToggleComplete?: boolean;
    draggable?: boolean;
  }>(),
  {
    canArchive: true,
    canDelete: true,
    canEdit: false,
    canToggleComplete: true,
    draggable: true,
  },
);

const emit = defineEmits<{
  (event: "reorder", tasks: TodoTask[]): void;
  (event: "toggle-complete", id: string, completed: boolean): void;
  (event: "select", id: string): void;
  (event: "edit", id: string): void;
  (event: "delete", id: string): void;
  (event: "archive", id: string): void;
}>();

const draggingTaskId = ref<string | null>(null);
const dragOverTaskId = ref<string | null>(null);

const findTaskIdFromPoint = (event: PointerEvent) => {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  const taskElement = element?.closest<HTMLElement>("[data-task-id]");

  return taskElement?.dataset.taskId ?? null;
};

const reorderTasks = (sourceId: string, targetId: string) => {
  if (sourceId === targetId) {
    return;
  }

  const sourceIndex = props.tasks.findIndex((task) => task.id === sourceId);
  const targetIndex = props.tasks.findIndex((task) => task.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1) {
    return;
  }

  const nextTasks = [...props.tasks];
  const [movedTask] = nextTasks.splice(sourceIndex, 1);
  nextTasks.splice(targetIndex, 0, movedTask);

  emit("reorder", nextTasks);
};

const cleanupPointerListeners = () => {
  window.removeEventListener("pointermove", onWindowPointerMove);
  window.removeEventListener("pointerup", onWindowPointerUp);
  window.removeEventListener("pointercancel", onWindowPointerCancel);
};

const resetDragState = () => {
  draggingTaskId.value = null;
  dragOverTaskId.value = null;
  cleanupPointerListeners();
};

const onWindowPointerMove = (event: PointerEvent) => {
  if (!draggingTaskId.value) {
    return;
  }

  const targetId = findTaskIdFromPoint(event);
  dragOverTaskId.value = targetId && targetId !== draggingTaskId.value ? targetId : null;
};

const onWindowPointerUp = (event: PointerEvent) => {
  const sourceId = draggingTaskId.value;
  const targetId = findTaskIdFromPoint(event);
  resetDragState();

  if (!sourceId || !targetId) {
    return;
  }

  reorderTasks(sourceId, targetId);
};

const onWindowPointerCancel = () => {
  resetDragState();
};

const onReorderStart = (id: string, event: PointerEvent) => {
  event.preventDefault();
  draggingTaskId.value = id;
  dragOverTaskId.value = null;

  cleanupPointerListeners();
  window.addEventListener("pointermove", onWindowPointerMove);
  window.addEventListener("pointerup", onWindowPointerUp);
  window.addEventListener("pointercancel", onWindowPointerCancel);
};

onBeforeUnmount(cleanupPointerListeners);
</script>

<template>
  <ul class="list task-list" aria-label="任务列表">
    <li v-if="tasks.length === 0" class="task-empty">
      暂时没有任务
    </li>

    <TaskItem
      v-for="task in tasks"
      :key="task.id"
      :task="task"
      :can-archive="canArchive"
      :can-delete="canDelete"
      :can-edit="canEdit"
      :can-toggle-complete="canToggleComplete"
      :draggable="draggable"
      :dragging="draggingTaskId === task.id"
      :drag-over="dragOverTaskId === task.id"
      @toggle-complete="(id, completed) => emit('toggle-complete', id, completed)"
      @select="emit('select', $event)"
      @edit="emit('edit', $event)"
      @delete="emit('delete', $event)"
      @archive="emit('archive', $event)"
      @reorder-start="onReorderStart"
    />
  </ul>
</template>

<style scoped>
.task-list {
  gap: 8px;
  width: 100%;
}

.task-empty {
  justify-content: center;
  min-height: 52px;
  border: 1px dashed var(--outline-variant);
  border-radius: 18px;
  color: var(--on-surface-variant);
  background-color: var(--surface-container-low);
}
</style>
