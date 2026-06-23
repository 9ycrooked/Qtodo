/**
 * 轻量 toast 通知
 * 使用 BeerCMS .snackbar 样式，3 秒后自动消失。
 */

const TOAST_DURATION_MS = 3000;

export function useToast() {
  const show = (message: string, durationMs = TOAST_DURATION_MS): void => {
    const el = document.createElement("div");
    el.className = "snackbar";
    el.textContent = message;
    document.body.appendChild(el);

    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity 200ms";
      setTimeout(() => el.remove(), 200);
    }, durationMs);
  };

  return { show };
}
