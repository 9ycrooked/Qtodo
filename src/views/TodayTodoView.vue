<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import TaskList from "../components/todo/TaskList.vue";
import type { TodoTask } from "../types/todo";

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
  <section class="page-view" aria-labelledby="today-todo-title" @click="emit('clear-selection')">
    <header class="page-header">
      <h3 id="today-todo-title" class="page-name small">今日</h3>
      <span class="current-time">{{ todayLabel }} 今日待办 {{ pendingTaskCount }} 个</span>
    </header>

    <!-- <div class="input-tasks">
      <div class="field label border round fill">
        <input type="text">
        <label>输入任务</label>
        <button type="button" class="add-task-button slow-ripple" aria-label="新增任务">
          <i>add</i>
        </button>
      </div>
    </div> -->

    <div class="task-section">
      <TaskList
        :tasks="tasks"
        :can-archive="false"
        :can-delete="true"
        :can-edit="canEdit"
        :can-toggle-complete="true"
        :draggable="true"
        @reorder="emit('reorder', $event)"
        @toggle-complete="(id, completed) => emit('toggle-complete', id, completed)"
        @select="emit('select', $event)"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @archive="emit('archive', $event)"
      />
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

.current-time {
  /* color: var(--primary); */
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
}

.input-tasks {
  width: 100%;
}

.input-tasks .field {
  position: relative;
  min-width: 0;
  margin: 0;
}

.input-tasks input {
  padding-right: 56px;
}

.add-task-button {
  position: absolute;
  top: 50%;
  right: 6px;
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  padding: 0;
  transform: translateY(-50%);
}

.task-section {
  margin-top: 16px;
}
</style>
