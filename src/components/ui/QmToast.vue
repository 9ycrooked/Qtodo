<script setup lang="ts">
import type { ToastMessage } from "../../composables/useNotifications";

defineProps<{
  toast: ToastMessage;
  index: number;
}>();

defineEmits<{
  close: [string];
}>();

const typeIcon: Record<ToastMessage["type"], string> = {
  success: "check_circle",
  info: "info",
  warning: "warning",
  error: "error",
};

function ariaRole(type: ToastMessage["type"]) {
  return type === "error" ? "alert" : "status";
}

function ariaLive(type: ToastMessage["type"]) {
  return type === "error" ? "assertive" : "polite";
}
</script>

<template>
  <article
    :class="['toast-item', 'toast-' + toast.type]"
    :style="{ '--toast-index': index }"
    :role="ariaRole(toast.type)"
    :aria-live="ariaLive(toast.type)"
  >
    <span class="toast-stripe" aria-hidden="true"></span>
    <i class="toast-type-icon">{{ typeIcon[toast.type] }}</i>
    <p class="toast-message">{{ toast.message }}</p>
    <button class="toast-close" type="button" aria-label="关闭通知" @click="$emit('close', toast.id)">
      <i>close</i>
    </button>
  </article>
</template>

<style scoped>
.toast-item {
  position: absolute;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: 3px auto minmax(0, 1fr) 24px;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: 36px;
  padding: 6px 6px 6px 0;
  border: 1px solid var(--outline-variant);
  border-radius: 12px;
  color: var(--on-surface);
  background: var(--surface-container-high);
  box-shadow: 0 6px 16px -4px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
  z-index: calc(10 - var(--toast-index));
  opacity: calc(1 - (var(--toast-index) * 0.16));
  transform:
    translate(
      calc(var(--toast-index) * 6px),
      calc(var(--toast-index) * -8px)
    )
    scale(calc(1 - (var(--toast-index) * 0.015)));
  transition:
    transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 160ms ease,
    border-color 160ms ease,
    background 160ms ease;
}

.toast-stripe {
  align-self: stretch;
  border-radius: 12px 0 0 12px;
  background: var(--outline-variant);
}

.toast-success .toast-stripe {
  background: var(--primary);
}

.toast-info .toast-stripe {
  background: var(--secondary);
}

.toast-warning .toast-stripe {
  background: var(--tertiary);
}

.toast-error .toast-stripe {
  background: var(--error);
}

.toast-type-icon {
  font-size: 16px;
  line-height: 1;
}

.toast-success .toast-type-icon {
  color: var(--primary);
}

.toast-info .toast-type-icon {
  color: var(--secondary);
}

.toast-warning .toast-type-icon {
  color: var(--tertiary);
}

.toast-error .toast-type-icon {
  color: var(--error);
}

.toast-message {
  min-width: 0;
  color: var(--on-surface);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.3;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.toast-close {
  width: 24px;
  min-width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  color: var(--on-surface-variant);
  background: transparent;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.toast-close i {
  font-size: 14px;
  line-height: 1;
}

.toast-close:hover:not(:disabled) {
  color: var(--on-surface);
  background: var(--surface-container-highest);
}

.toast-close:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.toast-stack-enter-active {
  transition:
    opacity 240ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-stack-leave-active {
  pointer-events: none;
  transition:
    opacity 180ms ease-in,
    transform 180ms ease-in;
}

.toast-item.toast-stack-enter-from {
  opacity: 0;
  transform: translate(28px, 18px) scale(0.96);
}

.toast-item.toast-stack-leave-to {
  opacity: 0;
  transform: translate(26px, 8px) scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .toast-item,
  .toast-stack-enter-active,
  .toast-stack-leave-active {
    transition: opacity 80ms ease;
  }

  .toast-stack-enter-from,
  .toast-stack-leave-to {
    transform: none;
  }
}
</style>
