<script setup lang="ts">
import type { ToastMessage } from "../../composables/useNotifications";
import QmToast from "./QmToast.vue";

defineProps<{
  toasts: ToastMessage[];
}>();

defineEmits<{
  close: [string];
  pause: [];
  resume: [];
}>();
</script>

<template>
  <TransitionGroup
    tag="section"
    class="toast-viewport"
    name="toast-stack"
    aria-label="应用通知"
    @mouseenter="$emit('pause')"
    @mouseleave="$emit('resume')"
  >
    <QmToast
      v-for="(toast, index) in toasts"
      :key="toast.id"
      :toast="toast"
      :index="index"
      @close="$emit('close', $event)"
    />
  </TransitionGroup>
</template>

<style scoped>
.toast-viewport {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 100;
  width: min(260px, calc(100vw - 48px));
  min-height: 36px;
  pointer-events: none;
}

.toast-viewport:hover :deep(.toast-item),
.toast-viewport:focus-within :deep(.toast-item) {
  opacity: 1;
  transform: translateY(calc(var(--toast-index) * -42px)) scale(1);
}
</style>
