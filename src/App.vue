<script setup lang="ts">
import { useTheme } from "./composables/useTheme";
import QmIconButton from "./components/ui/QmIconButton.vue";
import QmTitleBar from "./components/ui/QmTitleBar.vue";
const { cycleMode, themeMode } = useTheme();
// 临时简化，验证 Beercss 样式
</script>

<template>
  <main class="app-shell">
    <QmTitleBar title="Qtodo" show-left-action left-action-icon="menu" left-action-label="菜单">
    <template #actions>
        <QmIconButton
        :icon="themeMode === 'auto' ? 'brightness_auto' : themeMode === 'light' ? 'dark_mode' : 'light_mode'"
        @click="cycleMode" />
    </template>
    </QmTitleBar>

    <div class="app-body">
      <div class="app-content">
        <h1>Qtodo</h1>
        <p>这是一个使用 Vue 3 和 TypeScript 构建的待办事项应用程序。</p>
        <p>当前主题模式：{{ themeMode }}</p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.app-shell {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;

  display: flex;
  flex-direction: column;

  /* background: var(--background);
  color: var(--on-background); */
}

.app-content {
  flex: 1;
  min-height: 0;
  padding: 12px;
  overflow: auto;
}
</style>
