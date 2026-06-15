<script setup lang="ts">
import { computed } from "vue";
import type { TodoTask } from "../../types/todo";
import { formatDueText } from "../../utils/formatDueText";

const props = withDefaults(
  defineProps<{
    task: TodoTask;
    canArchive?: boolean;
    canDelete?: boolean;
    canEdit?: boolean;
    canToggleComplete?: boolean;
    draggable?: boolean;
    dragging?: boolean;
    dragOver?: boolean;
  }>(),
  {
    canArchive: true,
    canDelete: true,
    canEdit: false,
    canToggleComplete: true,
    draggable: true,
    dragging: false,
    dragOver: false,
  },
);

const emit = defineEmits<{
  (event: "toggle-complete", id: string, completed: boolean): void;
  (event: "select", id: string): void;
  (event: "edit", id: string): void;
  (event: "delete", id: string): void;
  (event: "archive", id: string): void;
  (event: "reorder-start", id: string, pointerEvent: PointerEvent): void;
}>();

const priorityMeta = computed(() => {
  if (props.task.priority === "high") {
    return { label: "高", className: "priority-high" };
  }

  if (props.task.priority === "medium") {
    return { label: "中", className: "priority-medium" };
  }

  return { label: "低", className: "priority-low" };
});

const taskMeta = computed(() => {
  const dueText = formatDueText(props.task.dueDate, props.task.dueTime);
  const meta = [];

  if (props.task.title) {
    meta.push(props.task.title);
  }

  if (dueText) {
    meta.push(dueText);
  }

  return meta.join(" · ");
});

const descriptionId = computed(() => `task-${props.task.id}-description`);
const hasMenuActions = computed(() => props.canEdit || props.canArchive || props.canDelete);

const onCompleteChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!props.canToggleComplete) {
    input.checked = props.task.completed;
    return;
  }

  emit("toggle-complete", props.task.id, input.checked);
};

const onReorderPointerDown = (event: PointerEvent) => {
  if (!props.draggable) {
    event.preventDefault();
    return;
  }

  emit("reorder-start", props.task.id, event);
};
</script>

<template>
  <li
    :class="[
      'task-item',
      {
        'is-completed': task.completed,
        'is-dragging': dragging,
        'is-drag-over': dragOver,
      },
    ]"
    :data-task-id="task.id"
    @click.stop="emit('select', task.id)"
  >
    <label :class="['task-complete-area', { disabled: !canToggleComplete }]" @click.stop>
      <input
        class="task-checkbox"
        type="checkbox"
        :checked="task.completed"
        :disabled="!canToggleComplete"
        :aria-label="task.completed ? '标记为未完成' : '标记为已完成'"
        @change="onCompleteChange"
      >
      <span class="task-checkmark" aria-hidden="true"></span>
    </label>

    <div
      class="max task-main"
      role="button"
      tabindex="0"
      :aria-describedby="taskMeta ? descriptionId : undefined"
      @keydown.enter.prevent="emit('select', task.id)"
      @keydown.space.prevent="emit('select', task.id)"
    >
      <strong>{{ task.description }}</strong>
      <p v-if="taskMeta" :id="descriptionId">{{ taskMeta }}</p>
    </div>

    <div class="task-actions" @click.stop>
      <span :class="['chip task-priority', priorityMeta.className]">
        {{ priorityMeta.label }}
      </span>

      <div v-if="hasMenuActions" class="task-menu-anchor">
        <button type="button" class="circle transparent task-menu-button slow-ripple" aria-label="任务操作">
          <i>more_horiz</i>
        </button>

        <menu class="task-menu no-wrap">
          <li v-if="canEdit" @click="emit('edit', task.id)">
            <i>edit</i>
            <span>编辑</span>
          </li>
          <li v-if="canArchive" @click="emit('archive', task.id)">
            <i>archive</i>
            <span>归档</span>
          </li>
          <li v-if="canDelete" class="danger" @click="emit('delete', task.id)">
            <i>delete</i>
            <span>删除</span>
          </li>
        </menu>
      </div>

      <button
        v-if="draggable"
        type="button"
        class="circle transparent task-drag-handle slow-ripple"
        aria-label="拖拽排序"
        title="拖拽排序"
        @click.stop
        @pointerdown.stop.prevent="onReorderPointerDown"
      >
        <i>drag_indicator</i>
      </button>
    </div>
  </li>
</template>

<style scoped>
.task-item {
  min-height: 52px;
  padding: 9px 12px;
  border: 1px solid var(--outline-variant);
  border-radius: 18px;
  background-color: var(--surface);
  color: var(--on-surface);
  gap: 10px;
  white-space: normal;
}

.task-item:hover {
  border-color: var(--outline);
  background-color: var(--surface-container-low);
}

.task-item.is-dragging {
  opacity: 0.56;
}

.task-item.is-drag-over {
  border-color: var(--primary);
  background-color: var(--primary-container);
}

.task-item.is-completed .task-main {
  opacity: 0.62;
}

.task-item.is-completed .task-main strong {
  text-decoration: line-through;
}

.task-complete-area {
  position: relative;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  min-width: 32px;
  cursor: pointer;
}

.task-complete-area.disabled {
  cursor: default;
}

.task-complete-area.disabled .task-checkmark {
  opacity: 0.72;
}

.task-checkbox {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.task-checkmark {
  position: relative;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 3px solid var(--primary);
  border-radius: 50%;
  color: var(--on-primary);
  background-color: transparent;
}

.task-checkbox:checked + .task-checkmark {
  border-color: var(--primary);
  background-color: var(--primary);
}

.task-checkbox:checked + .task-checkmark::before {
  content: "";
  width: 8px;
  height: 4px;
  border-left: 2px solid var(--on-primary);
  border-bottom: 2px solid var(--on-primary);
  transform: rotate(-45deg) translate(1px, -1px);
}

.task-checkbox:focus-visible + .task-checkmark {
  outline: 2px solid var(--primary-container);
  outline-offset: 2px;
}

.task-main {
  min-width: 0;
  cursor: pointer;
}

.task-main:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: 8px;
}

.task-main strong {
  display: block;
  overflow-wrap: anywhere;
  color: var(--on-surface);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.25;
}

.task-main p {
  margin: 2px 0 0;
  overflow-wrap: anywhere;
  color: var(--on-surface-variant);
  font-size: 12px;
  line-height: 1.25;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
}

.task-priority {
  min-width: 44px;
  height: 26px;
  min-height: 26px;
  padding: 0 12px;
  font-size: 12px;
  border: none;
}

.priority-high {
  background-color: #5a3d18;
  color: #ffd875;
}

.priority-medium {
  background-color: var(--secondary-container);
  color: var(--on-secondary-container);
}

.priority-low {
  background-color: var(--surface-container-high);
  color: var(--on-surface-variant);
}

.task-menu-anchor {
  position: relative;
}

.task-menu-button {
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  padding: 0;
  color: var(--on-surface-variant);
}

.task-menu-button i {
  font-size: 20px;
}

.task-menu {
  left: auto;
  right: 0;
  width: max-content;
  min-width: 112px;
  z-index: 8;
}

.task-menu li {
  gap: 8px;
  min-block-size: 2.25rem;
  padding: 0.375rem 0.75rem;
}

.task-menu li.danger {
  color: var(--error);
}

.task-drag-handle {
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  padding: 0;
  color: var(--on-surface-variant);
  cursor: grab;
  touch-action: none;
}

.task-drag-handle i {
  font-size: 20px;
}

.task-drag-handle:active {
  cursor: grabbing;
}

@media (max-width: 720px) {
  .task-item {
    align-items: flex-start;
    gap: 10px;
  }

  .task-actions {
    flex-direction: column;
    align-items: flex-end;
  }

  .task-priority {
    min-width: 56px;
  }
}
</style>
