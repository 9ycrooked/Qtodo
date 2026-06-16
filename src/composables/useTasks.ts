import { computed, ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import type { TodoTask, TodoTaskEditInput, TodoTaskInput, TodoViewKey } from "../types/todo";
import { reorderTasksForView } from "../utils/taskViews";

const REORDER_WRITE_DEBOUNCE_MS = 200;

/**
 * Module-level singleton promise so that multiple `useTasks()` calls
 * within the same app session only trigger one `load_all_tasks` invoke.
 */
let initPromise: Promise<void> | null = null;
const ensureLoaded = (tasks: ReturnType<typeof ref<TodoTask[]>>) => {
  if (!initPromise) {
    initPromise = invoke<TodoTask[]>("load_all_tasks")
      .then((loaded) => {
        tasks.value = loaded;
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[qtodo] load_all_tasks failed:", err);
      });
  }
  return initPromise;
};

/**
 * Debounced reorder write state. Each `reorder` transition collects tasks
 * into the pending map and resets the 200ms timer. When the timer fires
 * (or `flushPendingWrites()` is called), every pending task's `viewOrders`
 * is written to SQLite via the dedicated `save_view_orders` command.
 */
let pendingViewOrdersWrites: Map<string, TodoTask> = new Map();
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Immediately fire all pending `save_view_orders` invokes and clear the
 * timer. Safe to call when nothing is pending (no-op). Exposed so that
 * `App.vue` can call it in `onBeforeUnmount` to avoid losing sort order
 * on app close.
 */
export const flushPendingWrites = () => {
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  for (const task of pendingViewOrdersWrites.values()) {
    invoke("save_view_orders", {
      id: task.id,
      viewOrders: task.viewOrders ?? {},
      updatedAt: task.updatedAt,
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[qtodo] save_view_orders failed:", err);
    });
  }
  pendingViewOrdersWrites.clear();
};

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
  const tasks = ref<TodoTask[]>([]);
  const selectedTaskId = ref<string | null>(null);
  const nextTaskId = ref(1);

  // Load tasks from SQLite on first use (module-level singleton guard).
  ensureLoaded(tasks);

  // Verify the backend SQLite storage path on first use. Issue #7 plumbing:
  // the Tauri command returns the absolute path of qtodo.db so the frontend
  // can confirm the storage layer is wired up. Result is logged for visibility
  // but not consumed by the UI.
  invoke<string>("get_db_path")
    .then((path) => {
      // eslint-disable-next-line no-console
      console.log("[qtodo] db path:", path);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[qtodo] get_db_path failed:", err);
    });

  const selectedTask = computed(
    () => tasks.value.find((task) => task.id === selectedTaskId.value) ?? null,
  );

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
        // Fire-and-forget: persist toggled state to SQLite
        const toggled = tasks.value.find((t) => t.id === id);
        if (toggled) {
          invoke("save_task", { task: toggled }).catch((err) => {
            // eslint-disable-next-line no-console
            console.error("[qtodo] save_task (toggle) failed:", err);
          });
        }
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
        // Fire-and-forget: persist new task to SQLite
        invoke("save_task", { task }).catch((err) => {
          // eslint-disable-next-line no-console
          console.error("[qtodo] save_task (create) failed:", err);
        });
        return;
      }

      case "delete": {
        const { id } = event;
        tasks.value = tasks.value.filter((task) => task.id !== id);
        if (selectedTaskId.value === id) {
          clearSelectedTask();
        }
        // Fire-and-forget: delete from SQLite
        invoke("delete_task", { id }).catch((err) => {
          // eslint-disable-next-line no-console
          console.error("[qtodo] delete_task failed:", err);
        });
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
        // Fire-and-forget: persist archived state to SQLite
        const archived = tasks.value.find((t) => t.id === id);
        if (archived) {
          invoke("save_task", { task: archived }).catch((err) => {
            // eslint-disable-next-line no-console
            console.error("[qtodo] save_task (archive) failed:", err);
          });
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
        // Fire-and-forget: persist updated task to SQLite
        const updated = tasks.value.find((t) => t.id === payload.id);
        if (updated) {
          invoke("save_task", { task: updated }).catch((err) => {
            // eslint-disable-next-line no-console
            console.error("[qtodo] save_task (update) failed:", err);
          });
        }
        return;
      }

      case "reorder": {
        const { viewKey, ordered } = event;
        tasks.value = reorderTasksForView(tasks.value, viewKey, ordered, nowIso);

        // Collect each reordered task's latest state into the pending queue
        for (const task of ordered) {
          pendingViewOrdersWrites.set(task.id, task);
        }

        // Reset the debounce timer (200ms after the last call → flush)
        if (pendingTimer) clearTimeout(pendingTimer);
        pendingTimer = setTimeout(flushPendingWrites, REORDER_WRITE_DEBOUNCE_MS);
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

  return {
    tasks,
    selectedTask,
    transition,
    clearSelectedTask,
    reorderTasks,
    selectTask,
    flushPendingWrites,
  };
};
