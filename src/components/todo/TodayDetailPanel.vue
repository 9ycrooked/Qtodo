<script setup lang="ts">
import { computed } from "vue";
import type { TodoTask, TodoPriority } from "../../types/todo";
import { formatDueText } from "../../utils/formatDueText";

const props = defineProps<{
  tasks: TodoTask[];
  selectedTask: TodoTask | null;
}>();

const emit = defineEmits<{
  (event: "clear-selection"): void;
  (event: "toggle-complete", id: string, completed: boolean): void;
  (event: "edit", id: string): void;
  (event: "archive", id: string): void;
  (event: "delete", id: string): void;
}>();

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const completedTasks = computed(() => props.tasks.filter((task) => task.completed));
const pendingTasks = computed(() => props.tasks.filter((task) => !task.completed));
const highPriorityPendingTasks = computed(() =>
  pendingTasks.value.filter((task) => task.priority === "high"),
);

const progressPercent = computed(() => {
  if (props.tasks.length === 0) {
    return 0;
  }

  return Math.round((completedTasks.value.length / props.tasks.length) * 100);
});

const progressOffset = computed(() =>
  RING_CIRCUMFERENCE - (progressPercent.value / 100) * RING_CIRCUMFERENCE,
);

const progressLabel = computed(
  () =>
    `今日任务完成进度 ${progressPercent.value}%，已完成 ${completedTasks.value.length} 个，共 ${props.tasks.length} 个`,
);

const nearestDueText = computed(() => {
  const nextTask = pendingTasks.value.find((task) => task.dueDate);

  return nextTask ? formatDueText(nextTask.dueDate, nextTask.dueTime) : "暂无截止时间";
});

const priorityLabelMap: Record<TodoPriority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const selectedPriorityLabel = computed(() => {
  if (!props.selectedTask) {
    return "";
  }

  return priorityLabelMap[props.selectedTask.priority];
});

const selectedDueText = computed(() => {
  if (!props.selectedTask) {
    return "暂无截止时间";
  }

  return formatDueText(props.selectedTask.dueDate, props.selectedTask.dueTime) || "暂无截止时间";
});
</script>

<template>
  <section class="today-detail-content" aria-label="今日详情">
    <template v-if="selectedTask">
      <header class="detail-header selected-detail-header">
        <div>
          <p class="detail-eyebrow">任务详情</p>
          <h3>{{ selectedTask.description }}</h3>
        </div>

        <button
          type="button"
          class="circle transparent detail-close-button slow-ripple"
          aria-label="返回今日总览"
          title="返回今日总览"
          @click="emit('clear-selection')"
        >
          <i>close</i>
        </button>
      </header>

      <div class="selected-task-panel">
        <div v-if="selectedTask.title" class="selected-task-topic" role="group" aria-label="任务主题">
          <span>主题</span>
          <p>{{ selectedTask.title }}</p>
        </div>

        <div class="task-meta-grid">
          <div class="task-meta-item">
            <span>状态</span>
            <strong>{{ selectedTask.completed ? "已完成" : "进行中" }}</strong>
          </div>
          <div class="task-meta-item">
            <span>优先级</span>
            <strong>{{ selectedPriorityLabel }}</strong>
          </div>
          <div class="task-meta-item full">
            <span>截止</span>
            <strong>{{ selectedDueText }}</strong>
          </div>
        </div>

        <button
          type="button"
          class="responsive complete-toggle-button slow-ripple"
          @click="emit('toggle-complete', selectedTask.id, !selectedTask.completed)"
        >
          <i>{{ selectedTask.completed ? "undo" : "done" }}</i>
          <span>{{ selectedTask.completed ? "标记为未完成" : "标记为已完成" }}</span>
        </button>

        <div class="detail-action-row">
          <button
            type="button"
            class="circle transparent slow-ripple"
            aria-label="编辑任务"
            title="编辑任务"
            @click="emit('edit', selectedTask.id)"
          >
            <i>edit</i>
          </button>
          <button
            v-if="selectedTask.completed"
            type="button"
            class="circle transparent slow-ripple"
            aria-label="归档任务"
            title="归档任务"
            @click="emit('archive', selectedTask.id)"
          >
            <i>archive</i>
          </button>
          <button type="button" class="circle transparent danger slow-ripple" aria-label="删除任务" title="删除任务" @click="emit('delete', selectedTask.id)">
            <i>delete</i>
          </button>
        </div>
      </div>
    </template>

    <template v-else>
      <header class="detail-header">
        <div>
          <p class="detail-eyebrow">今日总览</p>
          <h3>今日进度</h3>
        </div>
      </header>

      <section class="progress-card" :aria-label="progressLabel">
        <div class="progress-ring-wrap" role="img" :aria-label="progressLabel">
          <svg class="progress-ring" viewBox="0 0 132 132" aria-hidden="true">
            <circle
              class="progress-ring-track"
              cx="66"
              cy="66"
              :r="RING_RADIUS"
              fill="none"
            />
            <circle
              class="progress-ring-value"
              cx="66"
              cy="66"
              :r="RING_RADIUS"
              fill="none"
              :stroke-dasharray="RING_CIRCUMFERENCE"
              :stroke-dashoffset="progressOffset"
            />
          </svg>

          <div class="progress-ring-label">
            <strong>{{ progressPercent }}%</strong>
            <span>已完成 {{ completedTasks.length }} / {{ tasks.length }}</span>
          </div>
        </div>
      </section>

      <section class="overview-stats" aria-label="今日任务统计">
        <div class="overview-stat-item compact">
          <span>待完成</span>
          <strong>{{ pendingTasks.length }}</strong>
        </div>
        <div class="overview-stat-item compact">
          <span>高优先级</span>
          <strong>{{ highPriorityPendingTasks.length }}</strong>
        </div>
        <div class="overview-stat-item full">
          <span>最近截止</span>
          <strong>{{ nearestDueText }}</strong>
        </div>
      </section>

      <p v-if="tasks.length === 0" class="empty-overview-text">
        今天还没有任务。
      </p>
    </template>
  </section>
</template>

<style scoped>
.today-detail-content {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  height: 100%;
  min-width: 0;
  padding: 16px 12px;
  overflow-x: hidden;
  overflow-y: auto;
  color: var(--on-surface);
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin: 0;
  padding: 0;
}

.detail-header > div {
  min-width: 0;
  margin: 0;
  padding: 0;
}

.detail-eyebrow {
  margin: 0 0 4px;
  color: var(--on-surface-variant);
  font-size: 10px;
  line-height: 1.25;
}

.detail-header h3 {
  margin: 0;
  color: var(--on-surface);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.18;
  overflow-wrap: anywhere;
}

.selected-detail-header h3 {
  font-size: 13px;
  font-weight: 650;
  line-height: 1.18;
}

.detail-close-button {
  width: 26px;
  height: 26px;
  min-width: 26px;
  min-height: 26px;
  padding: 0;
  color: var(--on-surface-variant);
}

.detail-close-button i {
  font-size: 19px;
}

.progress-card {
  display: grid;
  place-items: center;
  min-height: 130px;
}

.progress-ring-wrap {
  position: relative;
  width: min(138px, 100%);
  aspect-ratio: 1;
}

.progress-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-ring-track,
.progress-ring-value {
  stroke-width: 14;
}

.progress-ring-track {
  stroke: var(--surface-container-high);
}

.progress-ring-value {
  stroke: var(--primary);
  stroke-linecap: round;
  transition: stroke-dashoffset 220ms ease;
}

.progress-ring-label {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 2px;
  text-align: center;
}

.progress-ring-label strong {
  color: var(--on-surface);
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.progress-ring-label span {
  color: var(--on-surface);
  font-size: 12px;
  line-height: 1.25;
}

.overview-stats,
.task-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}

.overview-stat-item,
.task-meta-item {
  min-width: 0;
  padding: 8px 9px;
  border: 1px solid var(--outline-variant);
  border-radius: 10px;
  background-color: var(--surface-container-low);
}

.overview-stat-item.full,
.task-meta-item.full {
  grid-column: 1 / -1;
}

.overview-stat-item.compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.overview-stat-item.compact span {
  margin-bottom: 0;
}

.overview-stat-item span,
.task-meta-item span {
  display: block;
  margin-bottom: 2px;
  color: var(--on-surface-variant);
  font-size: 11px;
  line-height: 1.25;
}

.overview-stat-item strong,
.task-meta-item strong {
  display: block;
  color: var(--on-surface);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.empty-overview-text {
  margin: 0;
  color: var(--on-surface-variant);
  font-size: 11px;
  line-height: 1.3;
}

.selected-task-topic {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  margin: 0;
  padding: 0;
}

.selected-task-topic span {
  color: var(--on-surface-variant);
  font-size: 10px;
  line-height: 1.25;
}

.selected-task-topic p {
  margin: 0;
  color: var(--on-surface);
  font-size: 12px;
  font-weight: 650;
  line-height: 1.28;
  overflow-wrap: anywhere;
}

.selected-task-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-task-panel .task-meta-grid {
  gap: 6px;
}

.complete-toggle-button {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  justify-content: center;
  min-height: 32px;
  padding: 0 10px;
  border-radius: 999px;
  background-color: var(--primary);
  color: var(--on-primary);
  font-size: 12px;
}

.complete-toggle-button i {
  font-size: 16px;
}

.detail-action-row {
  display: flex;
  gap: 4px;
}

.detail-action-row .circle {
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  padding: 0;
  color: var(--on-surface-variant);
}

.detail-action-row .circle i {
  font-size: 18px;
}

.detail-action-row .danger {
  color: var(--error);
}

@media (max-width: 980px) {
  .today-detail-content {
    padding: 14px 10px;
  }

  .progress-ring-label strong {
    font-size: 24px;
  }

  .overview-stats,
  .task-meta-grid {
    grid-template-columns: 1fr;
  }

  .overview-stat-item.full,
  .task-meta-item.full {
    grid-column: auto;
  }
}
</style>
