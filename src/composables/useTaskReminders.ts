import { watch, onUnmounted, type Ref } from "vue";
import { notify } from "./useNotify";
import { currentDate } from "../utils/currentDate";
import { loadGlobalReminderMinutes } from "./useReminderSetting";
import type { TodoTask } from "../types/todo";

export function useTaskReminders(tasks: Ref<TodoTask[]>) {
  const notifiedToday = new Set<string>();
  let lastDate = currentDate();
  let globalAdvanceMinutes = 5;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  async function loadGlobalAdvance() {
    globalAdvanceMinutes = Number(await loadGlobalReminderMinutes());
  }

  function checkReminders() {
    const now = Date.now();
    const today = currentDate();

    if (today !== lastDate) {
      notifiedToday.clear();
      lastDate = today;
    }

    const activeTasks = tasks.value.filter((t) => !t.completed && !t.archived);

    // ── due-time tasks ──
    for (const task of activeTasks) {
      if (!task.dueTime) continue;
      if (notifiedToday.has(task.id)) continue;

      const advance =
        task.reminderMinutes !== undefined
          ? task.reminderMinutes
          : globalAdvanceMinutes;
      if (advance < 0) continue;

      const dueMs = new Date(`${task.dueDate}T${task.dueTime}:00`).getTime();
      const reminderMs = dueMs - advance * 60_000;

      if (now >= reminderMs && now < dueMs) {
        const time = `${task.dueDate} ${task.dueTime}`;
        const label = task.title ?? task.description;
        notify("warning", "任务到期 · Qtodo", `「${label}」${time}`);
        notifiedToday.add(task.id);
      } else if (now >= dueMs) {
        const time = `${task.dueDate} ${task.dueTime}`;
        const label = task.title ?? task.description;
        notify("error", "任务到期 · Qtodo", `「${label}」已过期（${time}）`);
        notifiedToday.add(task.id);
      }
    }

    // ── due-date-only tasks (grouped) ──
    if (!notifiedToday.has("__date_only__")) {
      const dueDateOnly = activeTasks.filter(
        (t) => !t.dueTime && t.dueDate === today,
      );
      if (dueDateOnly.length > 0) {
        const names = dueDateOnly
          .slice(0, 3)
          .map((t) => t.title ?? t.description);
        const extra =
          dueDateOnly.length > 3 ? `等 ${dueDateOnly.length} 个` : "";
        notify(
          "info",
          "今日任务 · Qtodo",
          `今日有 ${dueDateOnly.length} 个任务到期：${names.join("、")}${extra}`,
        );
        notifiedToday.add("__date_only__");
      }
    }
  }

  function start() {
    loadGlobalAdvance();
    checkReminders();
    intervalId = setInterval(checkReminders, 60_000);
  }

  // Watch task changes: if dueTime or reminderMinutes changed, allow re-notification
  watch(
    tasks,
    (newTasks, oldTasks) => {
      if (!oldTasks) return;
      const oldMap = new Map(oldTasks.map((t) => [t.id, t]));
      for (const task of newTasks) {
        const old = oldMap.get(task.id);
        if (
          old &&
          (old.dueTime !== task.dueTime ||
            old.reminderMinutes !== task.reminderMinutes)
        ) {
          notifiedToday.delete(task.id);
        }
      }
    },
    { deep: false },
  );

  onUnmounted(() => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  });

  return { start, checkReminders };
}
