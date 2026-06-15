<script setup lang="ts">
import TaskPageView from "../components/todo/TaskPageView.vue";
import type { TodoTask } from "../types/todo";

defineProps<{
  tasks: TodoTask[];
}>();

const emit = defineEmits<{
  (event: "reorder", tasks: TodoTask[]): void;
  (event: "toggle-complete", id: string, completed: boolean): void;
  (event: "edit", id: string): void;
  (event: "delete", id: string): void;
}>();
</script>

<template>
  <TaskPageView
    title="待办"
    title-id="upcoming-title"
    :tasks="tasks"
    :can-archive="false"
    :can-delete="true"
    :can-toggle-complete="true"
    :draggable="true"
    empty-text="暂时没有待办任务"
    @reorder="emit('reorder', $event)"
    @toggle-complete="(id, completed) => emit('toggle-complete', id, completed)"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
  />
</template>
