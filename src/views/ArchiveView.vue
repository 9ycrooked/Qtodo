<script setup lang="ts">
import TaskPageView from "../components/todo/TaskPageView.vue";
import type { TodoTask } from "../types/todo";

defineProps<{
  tasks: TodoTask[];
}>();

const emit = defineEmits<{
  (event: "delete", id: string): void;
}>();
</script>

<template>
  <TaskPageView
    title="归档"
    title-id="archive-title"
    :tasks="tasks"
    :can-archive="false"
    :can-delete="true"
    :can-toggle-complete="false"
    :draggable="false"
    empty-text="暂时没有归档任务"
    @delete="emit('delete', $event)"
  />
</template>
