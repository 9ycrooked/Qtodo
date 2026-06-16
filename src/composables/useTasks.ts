import { computed, ref } from "vue";
import type { TodoTask, TodoTaskEditInput, TodoTaskInput, TodoViewKey } from "../types/todo";
import { getTaskViewCounts, getTasksForView, reorderTasksForView } from "../utils/taskViews";

const initialTasks: TodoTask[] = [
  {
    id: "task-1",
    title: "界面设计",
    description: "在 Illustrator 中设计 BeerCSS 待办看板",
    dueDate: "2026-06-14",
    dueTime: "15:00",
    completed: false,
    archived: false,
    priority: "high",
    createdAt: "2026-06-14T08:00:00.000Z",
    updatedAt: "2026-06-14T08:00:00.000Z",
  },
  {
    id: "task-2",
    title: "整理 QTodo 首页任务列表组件",
    description: "组件封装",
    dueDate: "2026-06-14",
    dueTime: "18:00",
    completed: true,
    archived: false,
    priority: "medium",
    createdAt: "2026-06-14T09:00:00.000Z",
    updatedAt: "2026-06-14T10:00:00.000Z",
    completedAt: "2026-06-14T10:00:00.000Z",
  },
  {
    id: "task-3",
    title: "检查深色主题下的任务条可读性",
    description: "视觉检查",
    dueDate: "2026-06-14",
    completed: true,
    archived: true,
    priority: "low",
    createdAt: "2026-06-14T09:30:00.000Z",
    updatedAt: "2026-06-14T11:00:00.000Z",
    completedAt: "2026-06-14T10:30:00.000Z",
    archivedAt: "2026-06-14T11:00:00.000Z",
  },
];

/**
 * Lifecycle transition events.
 * Single source of truth for all task state mutations. Every public mutation
 * (addTask / updateTask / archiveTask / deleteTask / toggleTaskComplete) and
 * the private reorder path funnel through `transition()` so that invariants
 * (e.g. ADR-0001 "archive only from complete") live in one place.
 */
type TransitionEvent =
  | { type: "create"; payload: TodoTaskInput }
  | { type: "update"; payload: TodoTaskEditInput }
  | { type: "archive"; id: string }
  | { type: "delete"; id: string }
  | { type: "toggle-complete"; id: string; completed: boolean }
  | {
      type: "reorder";
      viewKey: Extract<TodoViewKey, "today" | "upcoming">;
      ordered: TodoTask[];
    };

export const useTasks = () => {
  const tasks = ref<TodoTask[]>([...initialTasks]);
  const selectedTaskId = ref<string | null>(null);
  const nextTaskId = ref(initialTasks.length + 1);

  const selectedTask = computed(
    () => tasks.value.find((task) => task.id === selectedTaskId.value) ?? null,
  );
  const todayTasks = computed(() => getTasksForView(tasks.value, "today"));
  const upcomingTasks = computed(() => getTasksForView(tasks.value, "upcoming"));
  const completedTasks = computed(() => getTasksForView(tasks.value, "completed"));
  const archivedTasks = computed(() => getTasksForView(tasks.value, "archive"));
  const navCounts = computed(() => getTaskViewCounts(tasks.value));

  const clearSelectedTask = () => {
    selectedTaskId.value = null;
  };

  const selectTask = (id: string) => {
    selectedTaskId.value = id;
  };

  /**
   * Single seam for all task lifecycle mutations. Encodes the state-machine
   * invariants once (see ADR-0001: archive only from complete; no mutation of
   * archived tasks; updatedAt refreshed on every write).
   *
   * Public mutation functions (addTask / updateTask / archiveTask / deleteTask
   * / toggleTaskComplete) are thin delegates that route through this function
   * so the rules live in one place. #5 will fold the public surface into a
   * single `transition(event)` export; for #1 we keep the existing public API
   * intact and only consolidate the *implementation*.
   */
  const transition = (event: TransitionEvent): void => {
    const nowIso = new Date().toISOString();

    switch (event.type) {
      case "toggle-complete": {
        const { id, completed } = event;
        tasks.value = tasks.value.map((task) => {
          if (task.id !== id || task.archived) {
            return task;
          }
          return {
            ...task,
            completed,
            completedAt: completed ? nowIso : undefined,
            updatedAt: nowIso,
          };
        });
        return;
      }

      case "create": {
        const { payload } = event;
        const id = `task-${Date.now()}-${nextTaskId.value}`;
        nextTaskId.value += 1;

        const task: TodoTask = {
          id,
          title: payload.title,
          description: payload.description,
          dueDate: payload.dueDate,
          dueTime: payload.dueTime,
          completed: false,
          archived: false,
          priority: payload.priority,
          createdAt: nowIso,
          updatedAt: nowIso,
          viewOrders: {},
        };

        tasks.value = [task, ...tasks.value];
        selectedTaskId.value = id;
        return;
      }

      case "delete": {
        const { id } = event;
        tasks.value = tasks.value.filter((task) => task.id !== id);
        if (selectedTaskId.value === id) {
          clearSelectedTask();
        }
        return;
      }

      case "archive": {
        const { id } = event;
        tasks.value = tasks.value.map((task) => {
          // ADR-0001: only Complete sub-state can be Archived.
          if (task.id !== id || !task.completed || task.archived) {
            return task;
          }
          return {
            ...task,
            archived: true,
            archivedAt: nowIso,
            updatedAt: nowIso,
          };
        });

        if (selectedTaskId.value === id) {
          clearSelectedTask();
        }
        return;
      }

      case "update": {
        const { payload } = event;
        tasks.value = tasks.value.map((task) => {
          if (task.id !== payload.id) {
            return task;
          }
          return {
            ...task,
            title: payload.title,
            description: payload.description,
            dueDate: payload.dueDate,
            dueTime: payload.dueTime,
            priority: payload.priority,
            updatedAt: nowIso,
            viewOrders: task.viewOrders,
          };
        });
        return;
      }

      case "reorder": {
        const { viewKey, ordered } = event;
        tasks.value = reorderTasksForView(tasks.value, viewKey, ordered, nowIso);
        return;
      }
    }
  };

  const reorderTasks = (
    viewKey: Extract<TodoViewKey, "today" | "upcoming">,
    orderedViewTasks: TodoTask[],
  ) => {
    transition({ type: "reorder", viewKey, ordered: orderedViewTasks });
  };

  const toggleTaskComplete = (id: string, completed: boolean) => {
    transition({ type: "toggle-complete", id, completed });
  };

  const addTask = (input: TodoTaskInput) => {
    transition({ type: "create", payload: input });
  };

  const deleteTask = (id: string) => {
    transition({ type: "delete", id });
  };

  const archiveTask = (id: string) => {
    transition({ type: "archive", id });
  };

  const updateTask = (input: TodoTaskEditInput) => {
    transition({ type: "update", payload: input });
  };

  return {
    tasks,
    todayTasks,
    upcomingTasks,
    completedTasks,
    archivedTasks,
    selectedTask,
    navCounts,
    addTask,
    archiveTask,
    clearSelectedTask,
    deleteTask,
    reorderTasks,
    selectTask,
    updateTask,
    toggleTaskComplete,
  };
};
