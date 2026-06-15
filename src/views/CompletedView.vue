<script setup lang="ts">
import TaskPageView from "../components/todo/TaskPageView.vue";
import type { TodoTask } from "../types/todo";

defineProps<{
  tasks: TodoTask[];
}>();

const emit = defineEmits<{
  (event: "toggle-complete", id: string, completed: boolean): void;
  (event: "edit", id: string): void;
  (event: "delete", id: string): void;
  (event: "archive", id: string): void;
}>();
</script>

<template>
  <TaskPageView
    title="已完成"
    title-id="completed-title"
    :tasks="tasks"
    :can-archive="true"
    :can-delete="true"
    :can-toggle-complete="true"
    :draggable="false"
    empty-text="暂时没有已完成任务"
    @toggle-complete="(id, completed) => emit('toggle-complete', id, completed)"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
    @archive="emit('archive', $event)"
  />
</template>
