<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";

const model = defineModel<boolean>({ default: false });

defineProps<{
  title?: string;
}>();

const emit = defineEmits<{
  (event: "close"): void;
}>();

const closeDialog = () => {
  if (!model.value) {
    return;
  }

  model.value = false;
  emit("close");
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    closeDialog();
  }
};

watch(
  model,
  (isOpen) => {
    if (isOpen) {
      window.addEventListener("keydown", onKeydown);
      return;
    }

    window.removeEventListener("keydown", onKeydown);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <template v-if="model">
      <div class="overlay blur active qm-dialog-overlay" @click="closeDialog"></div>
      <dialog class="active qm-dialog-surface" open role="dialog" aria-modal="true" :aria-label="title">
        <slot :close="closeDialog"></slot>
      </dialog>
    </template>
  </Teleport>
</template>

<style scoped>
.qm-dialog-overlay {
  z-index: 50;
}

.qm-dialog-surface {
  z-index: 51;
  width: min(420px, calc(100vw - 48px));
  max-height: calc(100vh - 72px);
  overflow: auto;
}
</style>
