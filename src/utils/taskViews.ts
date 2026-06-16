import type { TodoTask, TodoViewKey } from "../types/todo";
import { currentDate, DEFAULT_DUE_TIME } from "./currentDate";

const dueTimeValue = (task: TodoTask) => task.dueTime ?? DEFAULT_DUE_TIME;

const compareDueSoonest = (a: TodoTask, b: TodoTask) => {
  const dateCompare = a.dueDate.localeCompare(b.dueDate);

  if (dateCompare !== 0) {
    return dateCompare;
  }

  const timeCompare = dueTimeValue(a).localeCompare(dueTimeValue(b));

  if (timeCompare !== 0) {
    return timeCompare;
  }

  return a.createdAt.localeCompare(b.createdAt);
};

const compareNewestOptionalDate = (
  getDate: (task: TodoTask) => string | undefined,
) => (a: TodoTask, b: TodoTask) => {
  const aDate = getDate(a) ?? a.updatedAt;
  const bDate = getDate(b) ?? b.updatedAt;
  const dateCompare = bDate.localeCompare(aDate);

  if (dateCompare !== 0) {
    return dateCompare;
  }

  return b.createdAt.localeCompare(a.createdAt);
};

const compareManualFirst = (
  viewKey: TodoViewKey,
  defaultCompare: (a: TodoTask, b: TodoTask) => number,
) => (a: TodoTask, b: TodoTask) => {
  const aOrder = a.viewOrders?.[viewKey];
  const bOrder = b.viewOrders?.[viewKey];

  if (aOrder !== undefined && bOrder !== undefined) {
    return aOrder - bOrder;
  }

  if (aOrder !== undefined) {
    return -1;
  }

  if (bOrder !== undefined) {
    return 1;
  }

  return defaultCompare(a, b);
};

export const getTasksForView = (
  tasks: TodoTask[],
  viewKey: TodoViewKey,
  todayDate = currentDate(),
) => {
  const activeTasks = tasks.filter((task) => !task.archived);

  if (viewKey === "today") {
    const viewTasks = activeTasks.filter((task) => task.dueDate === todayDate);

    return [...viewTasks].sort(compareManualFirst("today", compareDueSoonest));
  }

  if (viewKey === "upcoming") {
    const viewTasks = activeTasks.filter((task) => !task.completed);

    return [...viewTasks].sort(compareManualFirst("upcoming", compareDueSoonest));
  }

  if (viewKey === "completed") {
    const viewTasks = activeTasks.filter((task) => task.completed);

    return [...viewTasks].sort(compareNewestOptionalDate((task) => task.completedAt));
  }

  const viewTasks = tasks.filter((task) => task.archived);

  return [...viewTasks].sort(compareNewestOptionalDate((task) => task.archivedAt));
};

export const getTaskViewCounts = (tasks: TodoTask[], todayDate = currentDate()) => ({
  today: getTasksForView(tasks, "today", todayDate).length,
  upcoming: getTasksForView(tasks, "upcoming", todayDate).length,
  completed: getTasksForView(tasks, "completed", todayDate).length,
  archive: getTasksForView(tasks, "archive", todayDate).length,
});

export const reorderTasksForView = (
  allTasks: TodoTask[],
  viewKey: Extract<TodoViewKey, "today" | "upcoming">,
  orderedViewTasks: TodoTask[],
  nowIso: string,
) => {
  const orderById = new Map(orderedViewTasks.map((task, index) => [task.id, index + 1]));

  return allTasks.map((task) => {
    const nextOrder = orderById.get(task.id);

    if (nextOrder === undefined) {
      return task;
    }

    return {
      ...task,
      updatedAt: nowIso,
      viewOrders: {
        ...task.viewOrders,
        [viewKey]: nextOrder,
      },
    };
  });
};
