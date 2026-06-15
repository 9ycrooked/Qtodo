export type NavItemKey =
  | "add"
  | "today-todo"
  | "upcoming"
  | "completed"
  | "archive"
  | "settings";

export interface NavItem {
  key: NavItemKey;
  icon: string;
  label: string;
}

export const navItems: NavItem[] = [
  { key: "add", icon: "add", label: "新建" },
  { key: "today-todo", icon: "today", label: "今日" },
  { key: "upcoming", icon: "event_upcoming", label: "待办" },
  { key: "completed", icon: "task_alt", label: "已完成" },
  { key: "archive", icon: "archive", label: "归档" },
  { key: "settings", icon: "settings", label: "设置" },
];
