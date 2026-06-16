<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import TaskPageView from "../components/todo/TaskPageView.vue";
import type { TodoTask } from "../types/todo";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    tasks: TodoTask[];
    canEdit?: boolean;
  }>(),
  {
    canEdit: true,
  },
);

const emit = defineEmits<{
  (event: "reorder", tasks: TodoTask[]): void;
  (event: "toggle-complete", id: string, completed: boolean): void;
  (event: "select", id: string): void;
  (event: "clear-selection"): void;
  (event: "edit", id: string): void;
  (event: "delete", id: string): void;
  (event: "archive", id: string): void;
}>();

const pendingTaskCount = computed(() =>
  props.tasks.filter((task) => !task.completed).length,
);

const now = ref(new Date());
let dateTimer: number | undefined;

const todayLabel = computed(() => {
  const current = now.value;
  const weekdayNames = ["星期天", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const hours = String(current.getHours()).padStart(2, "0");
  const minutes = String(current.getMinutes()).padStart(2, "0");

  return `${current.getMonth() + 1}月${current.getDate()}日 ${weekdayNames[current.getDay()]} ${hours}:${minutes}`;
});

onMounted(() => {
  dateTimer = window.setInterval(() => {
    now.value = new Date();
  }, 1_000);
});

onBeforeUnmount(() => {
  if (dateTimer !== undefined) {
    window.clearInterval(dateTimer);
  }
});
</script>

<template>
  <TaskPageView
    title="今日"
    title-id="today-todo-title"
    :tasks="tasks"
    :can-archive="false"
    :can-delete="true"
    :can-edit="canEdit"
    :can-toggle-complete="true"
    :draggable="true"
    @click="emit('clear-selection')"
    @reorder="emit('reorder', $event)"
    @toggle-complete="(id, completed) => emit('toggle-complete', id, completed)"
    @select="emit('select', $event)"
    @edit="emit('edit', $event)"
    @delete="emit('delete', $event)"
    @archive="emit('archive', $event)"
  >
    <template #header>
      <span class="current-time">{{ todayLabel }} 今日待办 {{ pendingTaskCount }} 个</span>
    </template>
  </TaskPageView>
</template>

<style scoped>
.current-time {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
}
</style>
