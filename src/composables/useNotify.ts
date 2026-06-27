import { sendNotification } from "@tauri-apps/plugin-notification";
import { useNotifications, type ToastType } from "./useNotifications";

/**
 * 焦点感知双通道通知。
 * - app 有焦点 → in-app toast（useNotifications.add）
 * - app 失去焦点 → 系统通知（sendNotification）
 *
 * @param type   toast 类型（success / info / warning / error）
 * @param title  通知标题（仅系统通知使用）
 * @param body   通知正文（toast 和系统通知共用）
 */
export function notify(type: ToastType, title: string, body: string): void {
  if (document.hasFocus()) {
    const { add } = useNotifications();
    add(type, body);
  } else {
    sendNotification({ title, body });
  }
}
