import {
  sendNotification,
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";
import { useNotifications, type ToastType } from "./useNotifications";

const { add } = useNotifications();

/** 权限缓存，启动时请求一次即可 */
let permissionGranted = false;

/** 启动时检查/请求通知权限，应在 App 初始化时调用一次 */
export async function initNotificationPermission(): Promise<void> {
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      const result = await requestPermission();
      granted = result === "granted";
    }
    permissionGranted = granted;
  } catch (e) {
    console.warn("[notify] 通知权限初始化失败，系统通知将被禁用:", e);
    permissionGranted = false;
  }
}

/**
 * 焦点感知双通道通知。
 * - app 有焦点 → in-app toast（useNotifications.add）
 * - app 失去焦点 → 系统通知（sendNotification），需权限已授权
 *
 * @param type   toast 类型（success / info / warning / error）
 * @param title  通知标题（仅系统通知使用）
 * @param body   通知正文（toast 和系统通知共用）
 */
export function notify(type: ToastType, title: string, body: string): void {
  if (document.hasFocus()) {
    add(type, body);
  } else if (permissionGranted) {
    sendNotification({ title, body });
  }
}
