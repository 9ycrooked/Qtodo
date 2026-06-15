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

  const reorderTasks = (
    viewKey: Extract<TodoViewKey, "today" | "upcoming">,
    orderedViewTasks: TodoTask[],
  ) => {
    tasks.value = reorderTasksForView(tasks.value, viewKey, orderedViewTasks, new Date().toISOString());
  };

  const toggleTaskComplete = (id: string, completed: boolean) => {
    const nowIso = new Date().toISOString();

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
  };

  const addTask = (input: TodoTaskInput) => {
    const nowIso = new Date().toISOString();
    const id = `task-${Date.now()}-${nextTaskId.value}`;
    nextTaskId.value += 1;

    const task: TodoTask = {
      id,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      dueTime: input.dueTime,
      completed: false,
      archived: false,
      priority: input.priority,
      createdAt: nowIso,
      updatedAt: nowIso,
      viewOrders: {},
    };

    tasks.value = [task, ...tasks.value];
    selectedTaskId.value = id;
  };

  const deleteTask = (id: string) => {
    tasks.value = tasks.value.filter((task) => task.id !== id);

    if (selectedTaskId.value === id) {
      clearSelectedTask();
    }
  };

  const archiveTask = (id: string) => {
    const nowIso = new Date().toISOString();

    tasks.value = tasks.value.map((task) => {
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
  };

  const updateTask = (input: TodoTaskEditInput) => {
    const nowIso = new Date().toISOString();

    tasks.value = tasks.value.map((task) => {
      if (task.id !== input.id) {
        return task;
      }

      const nextTask: TodoTask = {
        ...task,
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
        dueTime: input.dueTime,
        priority: input.priority,
        updatedAt: nowIso,
        viewOrders: task.viewOrders,
      };

      return nextTask;
    });
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
