<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { invoke } from "@tauri-apps/api/core";
import QmDialog from "../ui/QmDialog.vue";
import type { TodoPriority, TodoTask, TodoTaskInput } from "../../types/todo";

const model = defineModel<boolean>({ default: false });

const props = withDefaults(
  defineProps<{
    mode?: "create" | "edit";
    task?: TodoTask | null;
  }>(),
  {
    mode: "create",
    task: null,
  },
);

const emit = defineEmits<{
  (event: "create", input: TodoTaskInput): void;
  (event: "update", input: TodoTaskInput): void;
}>();

const form = reactive({
  title: "",
  description: "",
  dueDate: "",
  dueTime: "",
  priority: "medium" as TodoPriority,
  reminderMinutes: undefined as number | undefined,
});
const dueDateInput = ref<HTMLInputElement | null>(null);
const dueTimeInput = ref<HTMLInputElement | null>(null);

const globalReminderMinutes = ref<string>("5");

async function loadGlobalReminder() {
  try {
    const val = await invoke<string | null>("get_setting", { key: "default_reminder_minutes" });
    globalReminderMinutes.value = val ?? "5";
  } catch {
    globalReminderMinutes.value = "5";
  }
}

const globalReminderLabel = computed(() => {
  const labelMap: Record<string, string> = {
    "5": "5 分钟", "10": "10 分钟", "15": "15 分钟",
    "30": "30 分钟", "60": "1 小时", "0": "准时", "-1": "关闭",
  };
  return labelMap[globalReminderMinutes.value] ?? "5 分钟";
});

function onReminderChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value;
  form.reminderMinutes = val === "" ? undefined : Number(val);
}

const isEditMode = computed(() => props.mode === "edit");
const dialogTitle = computed(() => (isEditMode.value ? "编辑任务" : "新建任务"));
const submitLabel = computed(() => (isEditMode.value ? "保存" : "确认"));
const canSubmit = computed(() => form.description.trim().length > 0 && form.dueDate.length > 0);

const dueDateButtonLabel = computed(() => {
  if (!form.dueDate) {
    return "选择日期";
  }

  return `${Number(form.dueDate.slice(5, 7))}月${Number(form.dueDate.slice(8, 10))}日`;
});

const dueTimeButtonLabel = computed(() => form.dueTime || "选择时间");

const resetForm = () => {
  form.title = "";
  form.description = "";
  form.dueDate = "";
  form.dueTime = "";
  form.priority = "medium";
  form.reminderMinutes = undefined;
};

const fillForm = (task: TodoTask) => {
  form.title = task.title ?? "";
  form.description = task.description;
  form.dueDate = task.dueDate;
  form.dueTime = task.dueTime ?? "";
  form.priority = task.priority;
  form.reminderMinutes = task.reminderMinutes;
};

const closeDialog = () => {
  model.value = false;
};

const openPicker = (input: HTMLInputElement | null) => {
  if (!input) {
    return;
  }

  const picker = (input as HTMLInputElement & { showPicker?: () => void }).showPicker;

  if (typeof picker === "function") {
    picker.call(input);
    return;
  }

  input.focus();
};

const submitTask = () => {
  if (!canSubmit.value) {
    return;
  }

  const payload: TodoTaskInput = {
    title: form.title.trim() || undefined,
    description: form.description.trim(),
    dueDate: form.dueDate,
    dueTime: form.dueTime || undefined,
    priority: form.priority,
    reminderMinutes: form.reminderMinutes,
  };

  if (isEditMode.value) {
    emit("update", payload);
  } else {
    emit("create", payload);
  }

  closeDialog();
  resetForm();
};

watch(
  [model, () => props.task, () => props.mode],
  ([isOpen]) => {
    if (!isOpen) {
      resetForm();
      return;
    }

    loadGlobalReminder();

    if (isEditMode.value && props.task) {
      fillForm(props.task);
      return;
    }

    resetForm();
  },
  { immediate: true },
);
</script>

<template>
  <QmDialog v-model="model" :title="dialogTitle" @close="resetForm">
    <form class="new-task-dialog" @submit.prevent="submitTask">
      <header class="dialog-header">
        <div>
          <h5>{{ dialogTitle }}</h5>
        </div>

        <button type="button" class="circle transparent dialog-close-button slow-ripple" aria-label="关闭" @click="closeDialog">
          <i>close</i>
        </button>
      </header>

      <div class="field label border round fill">
        <input v-model="form.description" type="text" autocomplete="off" required autofocus>
        <label>任务详情</label>
      </div>

      <div class="field label border round fill">
        <input v-model="form.title" type="text" autocomplete="off">
        <label>主题（可选）</label>
      </div>

      <div class="datetime-fields">
        <div class="date-time-picker">
          <button type="button" class="slow-ripple" aria-label="选择日期" @click="openPicker(dueDateInput)">
            <i>today</i>
            <span>{{ dueDateButtonLabel }}</span>
          </button>
          <input ref="dueDateInput" v-model="form.dueDate" type="date" aria-label="截止日期">
        </div>

        <div class="date-time-picker">
          <button type="button" class="slow-ripple" aria-label="选择时间" @click="openPicker(dueTimeInput)">
            <i>schedule</i>
            <span>{{ dueTimeButtonLabel }}</span>
          </button>
          <input ref="dueTimeInput" v-model="form.dueTime" type="time" aria-label="截止时间">
        </div>
      </div>

      <div class="reminder-field">
        <label class="reminder-label">提前提醒</label>
        <select :value="form.reminderMinutes ?? ''" class="reminder-select" @change="onReminderChange">
          <option value="">使用默认（{{ globalReminderLabel }}）</option>
          <option value="5">5 分钟</option>
          <option value="10">10 分钟</option>
          <option value="15">15 分钟</option>
          <option value="30">30 分钟</option>
          <option value="60">1 小时</option>
          <option value="0">准时</option>
          <option value="-1">关闭</option>
        </select>
      </div>

      <fieldset class="priority-field">
        <legend>优先级</legend>
        <div class="priority-options">
          <label class="radio">
            <input v-model="form.priority" type="radio" value="low">
            <span>低</span>
          </label>
          <label class="radio">
            <input v-model="form.priority" type="radio" value="medium">
            <span>中</span>
          </label>
          <label class="radio">
            <input v-model="form.priority" type="radio" value="high">
            <span>高</span>
          </label>
        </div>
      </fieldset>

      <nav class="right-align no-space dialog-actions">
        <button type="button" class="transparent link slow-ripple" @click="closeDialog">取消</button>
        <button type="submit" class="transparent link slow-ripple" :disabled="!canSubmit">{{ submitLabel }}</button>
      </nav>
    </form>
  </QmDialog>
</template>

<style scoped>
.new-task-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.dialog-close-button {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  padding: 0;
  color: var(--on-surface-variant);
}

.new-task-dialog .field {
  margin: 0;
}

.datetime-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.date-time-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.date-time-picker button {
  flex: 0 0 auto;
}

.date-time-picker input {
  min-width: 0;
  width: 100%;
}

.priority-field {
  display: grid;
  gap: 8px;
  min-width: 0;
  margin: 0;
  padding: 10px 12px;
  border: 1px solid var(--outline-variant);
  border-radius: 18px;
}

.priority-field legend {
  padding: 0 4px;
  color: var(--on-surface-variant);
  font-size: 12px;
}

.priority-options {
  display: flex;
  gap: 10px;
}

.priority-options .radio {
  flex: 1;
  min-width: 0;
  margin: 0;
}

.dialog-actions {
  margin-top: 4px;
}

.dialog-actions button:disabled {
  opacity: 0.42;
}

.reminder-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reminder-label {
  font-size: 12px;
  color: var(--on-surface-variant);
  padding-left: 4px;
}

.reminder-select {
  appearance: none;
  border: 1px solid var(--outline-variant);
  border-radius: 18px;
  padding: 10px 36px 10px 14px;
  font-size: 14px;
  color: var(--on-surface);
  background-color: transparent;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'%3E%3Cpath fill='%23888' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  cursor: pointer;
  outline: none;
  transition: border-color 200ms;
}

.reminder-select:hover {
  border-color: var(--on-surface-variant);
}

.reminder-select:focus {
  border-color: var(--primary);
}
</style>
