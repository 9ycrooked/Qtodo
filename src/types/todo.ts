export type TodoPriority = "low" | "medium" | "high";
export type TodoViewKey = "today" | "upcoming" | "completed" | "archive";

export interface TodoTask {
  id: string;
  title?: string;
  description: string;
  completed: boolean;
  archived: boolean;
  priority: TodoPriority;
  dueDate: string;
  dueTime?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  archivedAt?: string;
  viewOrders?: Partial<Record<TodoViewKey, number>>;
  reminderMinutes?: number;
}

export interface TodoTaskInput {
  title?: string;
  description: string;
  priority: TodoPriority;
  dueDate: string;
  dueTime?: string;
}

export interface TodoTaskEditInput extends TodoTaskInput {
  id: string;
}
