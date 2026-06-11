<script setup lang="ts">
import { useTheme } from "./composables/useTheme";
import QmIconButton from "./components/ui/QmIconButton.vue";
import QmTitleBar from "./components/ui/QmTitleBar.vue";
import { ref } from "vue";

// 当前选中的侧边栏导航项。
// 这个值只用来判断哪个按钮需要追加 archive 选中态 class。
const activeNav = ref("");

// 侧边栏是否收起：
// false = 展开完整侧栏；true = 收成只显示头像和图标的窄栏。
const sidebarCollapsed = ref(false);

const { cycleMode, themeMode } = useTheme();

// 侧栏导航数据集中维护：
// 展开态的完整按钮和收起态的 QmIconButton 共用这一份配置。
const navItems = [
  { key: "today-todo", icon: "today", label: "今日", count: 1 },
  { key: "upcoming", icon: "event_upcoming", label: "待办", count: 1 },
  { key: "today", icon: "today", label: "已完成", count: 1 },
  { key: "archive", icon: "archive", label: "归档", count: 1 },
  { key: "settings", icon: "settings", label: "设置", count: 1 },
];

// 标题栏最左侧按钮的点击行为。
// 点击时只切换 sidebarCollapsed，按钮图标和侧栏样式都通过这个状态自动联动。
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};
</script>

<template>
  <div class="app-shell">
    <!-- icon="checklist" title="Qtodo" -->
    <QmTitleBar class="app-title-bar"> 
      <template #left-action>
        <!-- 展开时显示 menu，收起时显示 sort，让按钮图标表达当前侧栏状态。 -->
        <QmIconButton
          class="title-left-action"
          :icon="sidebarCollapsed ? 'sort' : 'menu'"
          @click="toggleSidebar"
        />
      </template>

      <template #actions>
        <!-- 这里显示的是当前主题模式对应的图标。 -->
        <QmIconButton class="theme-mode"
          :icon="themeMode === 'auto' ? 'brightness_auto' : themeMode === 'light' ? 'light_mode' : 'dark_mode'"
          @click="cycleMode" />
      </template>
    </QmTitleBar>

    <!--
      app-body 是三栏 grid 容器。
      collapsed-sidebar class 加在这里，是为了让 CSS 同时控制：
      1. grid 第一列宽度
      2. 侧栏内部内容显隐
      3. 侧栏按钮对齐方式
    -->
    <div :class="['app-body', { 'collapsed-sidebar': sidebarCollapsed }]">
      <div class="app-sidebar">
        <div class="sidebar-profile">
          <!-- 收起时头像从 small 切到 tiny，避免 48px 窄栏里显得拥挤。 -->
          <img :class="['circle', sidebarCollapsed ? 'tiny' : 'small']" src="./images/Y.jpg" alt="">
          <!-- 收起时这块文字会被 CSS 隐藏，只保留头像图片。 -->
          <div class="sidebar-profile-text">
            <strong>QTodo</strong>
            <div></div>
          </div>
        </div>
        <nav class="sidebar-nav group ">
          <template v-for="item in navItems" :key="item.key">
            <!-- 收起态使用真正的 icon-only 组件，避免 BeerCSS medium 文字按钮撑开窄栏。 -->
            <QmIconButton
              v-if="sidebarCollapsed"
              class="sidebar-icon-action"
              :class="{ archive: activeNav === item.key }"
              :icon="item.icon"
              :active="activeNav === item.key"
              :aria-label="item.label"
              :title="item.label"
              @click="activeNav = item.key"
            />

            <!-- 展开态保留完整按钮，显示 icon、文字和 badge。 -->
            <button
              v-else
              type="button"
              :class="['no-round', activeNav === item.key && 'archive', 'medium']"
              @click="activeNav = item.key"
            >
              <i>{{ item.icon }}</i>
              <span class="nav-label">{{ item.label }}</span>
              <span class="badge none">{{ item.count }}</span>
            </button>
          </template>
        </nav>
        <!-- 侧边栏内容 -->
      </div>
      <div class="app-main-panel">

      </div>
      <div class="app-detail-panel">

      </div>

    </div>
  </div>
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
  background-color: var(--app-background);
}

.app-shell .title-left-action {
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  padding: 0;
}

.app-shell .theme-mode {
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  padding: 0;
}

.theme-mode :deep(i) {
  font-size: 24px;
  line-height: 1;
}

.app-title-bar {
  background-color: var(--title-bar-background);
  flex-shrink: 0;
  /* 防止标题栏被压缩 */
}

.app-body {
  flex: 1;
  display: grid;
  /* 展开状态：左侧栏 140px，中间栏自适应，右侧详情栏 180px。 */
  grid-template-columns: 140px minmax(200px, 1fr) 180px;
  min-height: 0;
  overflow: hidden;
  gap: 24px;

  padding-top: 5px;
  padding-bottom: 32px;
  padding-left: 24px;
  padding-right: 24px;
}

.app-body.collapsed-sidebar {
  /* 收起状态：只把左侧栏压到 48px，中间栏会自动获得释放出来的空间。 */
  grid-template-columns: 48px minmax(200px, 1fr) 180px;
}

/* 侧边栏内容 */
.app-sidebar {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-width: 0;
  overflow: hidden;
  padding: 16px;
  background-color: var(--panel-background);
  border-radius: 28px;
  /* 防止侧边栏被压缩 */
}

.collapsed-sidebar .app-sidebar {
  /* 窄栏里内容居中，并把 padding 归零，避免 content-box padding 把 48px 列撑偏。 */
  align-items: center;
  padding: 8px 0;
}

.sidebar-profile {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.sidebar-profile img {
  flex: 0 0 auto;
}

.sidebar-profile-text {
  margin-left: 10px;
}

.collapsed-sidebar .sidebar-profile {
  width: 48px;
  justify-content: center;
}

.collapsed-sidebar .sidebar-profile img {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
}

.collapsed-sidebar .sidebar-profile-text,
.collapsed-sidebar .nav-label,
.collapsed-sidebar .sidebar-nav button .badge {
  display: none;
}

/* 主内容区 */
.app-main-panel {
  display: flex;
  overflow: hidden;
  min-height: 0;
  min-width: 0;
  background-color: var(--panel-background);
  border-radius: 28px;
}

/* 详情面板 */
.app-detail-panel {
  min-width: 0;
  background-color: var(--panel-background);
  border-radius: 28px;
  /* 防止详情面板被压缩 */
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.collapsed-sidebar .sidebar-nav {
  width: 48px;
  align-items: center;
}

.sidebar-nav button {
  width: 100%;
  justify-content: flex-start;
  background-color: var(--panel-background) !important;
  color: var(--on-surface);
  box-shadow: none;
}

.sidebar-nav .sidebar-icon-action {
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;
  min-height: 40px !important;
  padding: 0 !important;
  margin: 0;
  display: grid !important;
  place-items: center;
  justify-content: center !important;
  align-items: center !important;
  background-color: transparent !important;
}

.sidebar-nav .sidebar-icon-action :deep(i) {
  margin: 0;
  padding: 0;
  font-size: 24px;
  line-height: 1;
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  display: grid;
  place-items: center;
  text-align: center;
}

.sidebar-nav button .badge {
  /* badge 靠右排列，并去掉 BeerCSS 默认的底色/阴影。 */
  margin-left: auto;
  background-color: transparent;
  box-shadow: none;
}

.sidebar-nav button i,
.sidebar-nav button .badge,
.sidebar-nav .sidebar-icon-action :deep(i) {
  color: var(--on-surface);
}

.sidebar-nav button i,
.sidebar-nav .sidebar-icon-action :deep(i) {
  /* 未选中时使用 Material Symbols 默认线性图标。 */
  font-variation-settings: "FILL" 0;
}

.sidebar-nav button:hover {
  background-color: var(--surface-container-high);
}

.sidebar-nav button.archive,
.sidebar-nav .sidebar-icon-action.archive {
  /* archive 是当前项目里给“选中导航项”追加的 class。 */
  background-color: var(--primary-container) !important;
  color: #b49ce4 !important;
}

.sidebar-nav button.archive i,
.sidebar-nav button.archive span,
.sidebar-nav button.archive .badge,
.sidebar-nav .sidebar-icon-action.archive :deep(i) {
  color: #b49ce4 !important;
}

.sidebar-nav button.archive i,
.sidebar-nav .sidebar-icon-action.archive :deep(i) {
  /* 选中时把 icon 从线性切换成填充效果。 */
  font-variation-settings: "FILL" 1;
}
</style>
