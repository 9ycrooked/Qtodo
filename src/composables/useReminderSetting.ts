import { invoke } from "@tauri-apps/api/core";

export interface ReminderOption {
  value: string;
  label: string;
}

export const reminderOptions: ReminderOption[] = [
  { value: "5", label: "5 分钟" },
  { value: "10", label: "10 分钟" },
  { value: "15", label: "15 分钟" },
  { value: "30", label: "30 分钟" },
  { value: "60", label: "1 小时" },
  { value: "0", label: "准时" },
  { value: "-1", label: "关闭" },
];

const labelMap: Record<string, string> = Object.fromEntries(
  reminderOptions.map((o) => [o.value, o.label]),
);

export function getReminderLabel(value: string): string {
  return labelMap[value] ?? "5 分钟";
}

/**
 * Load the global default reminder minutes from the backend.
 * Returns the string value (e.g. "5", "10", "-1").
 * Falls back to "5" if the setting is missing or the call fails.
 */
export async function loadGlobalReminderMinutes(): Promise<string> {
  try {
    const val = await invoke<string | null>("get_setting", {
      key: "default_reminder_minutes",
    });
    return val ?? "5";
  } catch {
    return "5";
  }
}
