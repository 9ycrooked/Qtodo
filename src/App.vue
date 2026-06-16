<script setup lang="ts">
import { useTheme } from "./composables/useTheme";
import DeleteTaskDialog from "./components/todo/DeleteTaskDialog.vue";
import NewTaskDialog from "./components/todo/NewTaskDialog.vue";
import TodayDetailPanel from "./components/todo/TodayDetailPanel.vue";
import QmIconButton from "./components/ui/QmIconButton.vue";
import QmTitleBar from "./components/ui/QmTitleBar.vue";
import { navItems, type NavItemKey } from "./config/navItems";
import { useTasks } from "./composables/useTasks";
import type { TodoTask, TodoTaskInput } from "./types/todo";
import { currentDate } from "./utils/currentDate";
import { getTaskViewCounts, getTasksForView } from "./utils/taskViews";
import ArchiveView from "./views/ArchiveView.vue";
import CompletedView from "./views/CompletedView.vue";
import SettingsView from "./views/SettingsView.vue";
import TodayTodoView from "./views/TodayTodoView.vue";
import UpcomingView from "./views/UpcomingView.vue";
import { computed, onBeforeUnmount, ref } from "vue";

type NavItemWithCount = (typeof navItems)[number] & { count?: number };

const DEFAULT_DETAIL_PANEL_WIDTH = 220;
const MIN_DETAIL_PANEL_WIDTH = 180;
const MIN_RESPONSIVE_DETAIL_PANEL_WIDTH = 96;
const MAX_DETAIL_PANEL_WIDTH = 420;
const APP_HORIZONTAL_PADDING = 48;
const PANEL_GAP = 24;
const MAIN_PANEL_MIN_WIDTH = 360;
const SIDEBAR_EXPANDED_WIDTH = 140;
const SIDEBAR_COLLAPSED_WIDTH = 48;

// 当前选中的侧边栏导航项。
// 这个值只用来判断哪个按钮需要追加 archive 选中态 class。
const activeNav = ref<NavItemKey>("today-todo");

// 侧边栏是否收起：
// false = 展开完整侧栏；true = 收成只显示头像和图标的窄栏。
const sidebarCollapsed = ref(false);

const { cycleMode, themeMode } = useTheme();
const {
  tasks,
  selectedTask,
  reorderTasks,
  toggleTaskComplete,
  selectTask,
  clearSelectedTask,
  addTask,
  updateTask,
  deleteTask,
  archiveTask,
} = useTasks();
const isNewTaskDialogOpen = ref(false);
const isEditTaskDialogOpen = ref(false);
const isDeleteTaskDialogOpen = ref(false);
const taskPendingEdit = ref<TodoTask | null>(null);
const taskIdPendingDelete = ref<string | null>(null);
const detailPanelWidth = ref(DEFAULT_DETAIL_PANEL_WIDTH);
const showDetailPanel = computed(() => activeNav.value === "today-todo");
const todayTasks = computed(() => getTasksForView(tasks.value, "today"));
const upcomingTasks = computed(() => getTasksForView(tasks.value, "upcoming"));
const completedTasks = computed(() => getTasksForView(tasks.value, "completed"));
const archivedTasks = computed(() => getTasksForView(tasks.value, "archive"));
const navCounts = computed(() => getTaskViewCounts(tasks.value));
const navItemsWithCounts = computed<NavItemWithCount[]>(() =>
  navItems.map((item) => {
    if (item.key === "today-todo") {
      return { ...item, count: navCounts.value.today };
    }

    if (item.key === "upcoming") {
      return { ...item, count: navCounts.value.upcoming };
    }

    if (item.key === "completed") {
      return { ...item, count: navCounts.value.completed };
    }

    if (item.key === "archive") {
      return { ...item, count: navCounts.value.archive };
    }

    return item;
  }),
);
const taskPendingDelete = computed(() =>
  taskIdPendingDelete.value
    ? tasks.value.find((task) => task.id === taskIdPendingDelete.value) ?? null
    : null,
);
const isResizingDetailPanel = ref(false);
const windowWidth = ref(window.innerWidth);
const currentSidebarWidth = computed(() =>
  sidebarCollapsed.value ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH,
);
const maxResponsiveDetailPanelWidth = computed(() => {
  const availableWidth =
    windowWidth.value -
    APP_HORIZONTAL_PADDING -
    currentSidebarWidth.value -
    MAIN_PANEL_MIN_WIDTH -
    PANEL_GAP * 2;

  return Math.max(MIN_RESPONSIVE_DETAIL_PANEL_WIDTH, Math.min(availableWidth, MAX_DETAIL_PANEL_WIDTH));
});
const resolvedDetailPanelWidth = computed(() =>
  Math.max(
    MIN_RESPONSIVE_DETAIL_PANEL_WIDTH,
    Math.min(detailPanelWidth.value, maxResponsiveDetailPanelWidth.value),
  ),
);
const detailPanelWidthStyle = computed(() => `${resolvedDetailPanelWidth.value}px`);

// 标题栏最左侧按钮的点击行为。
// 点击时只切换 sidebarCollapsed，按钮图标和侧栏样式都通过这个状态自动联动。
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

const selectNavItem = (key: NavItemKey) => {
  if (key === "add") {
    isNewTaskDialogOpen.value = true;
    return;
  }

  activeNav.value = key;
};

const createTodayTask = (input: TodoTaskInput) => {
  addTask(input);
  activeNav.value = "today-todo";
};

const requestEditTask = (id: string) => {
  taskPendingEdit.value = tasks.value.find((task) => task.id === id) ?? null;
  if (!taskPendingEdit.value) {
    return;
  }

  isEditTaskDialogOpen.value = true;
};

const updateTaskFromDialog = (input: TodoTaskInput) => {
  if (!taskPendingEdit.value) {
    return;
  }

  const editingTaskId = taskPendingEdit.value.id;
  const wasSelectedTodayTask = selectedTask.value?.id === editingTaskId;
  const wasTodayPage = activeNav.value === "today-todo";
  updateTask({
    id: editingTaskId,
    ...input,
  });

  const nextTask = tasks.value.find((task) => task.id === editingTaskId) ?? null;

  taskPendingEdit.value = nextTask;

  if (!nextTask) {
    isEditTaskDialogOpen.value = false;
    clearSelectedTask();
    return;
  }

  if (wasSelectedTodayTask) {
    // Today 视图规则（见 taskViews.ts）：today-due、unarchived 的任务都留在 today，
    // 包括已完成的。所以判断"是否仍属于 today"只需看 dueDate + archived，
    // 不需要排除 completed 任务。
    const staysInToday = nextTask.dueDate === currentDate() && !nextTask.archived;

    if (wasTodayPage && staysInToday) {
      selectTask(editingTaskId);
    } else {
      clearSelectedTask();
    }
  }
};

const requestDeleteTask = (id: string) => {
  taskIdPendingDelete.value = id;
  isDeleteTaskDialogOpen.value = true;
};

const confirmDeleteTask = () => {
  if (!taskIdPendingDelete.value) {
    return;
  }

  deleteTask(taskIdPendingDelete.value);
  taskIdPendingDelete.value = null;
};

const updateDetailPanelWidth = (clientX: number) => {
  const availableRightSpace = window.innerWidth - clientX - 24;
  const nextWidth = Math.min(
    Math.max(availableRightSpace, MIN_DETAIL_PANEL_WIDTH),
    maxResponsiveDetailPanelWidth.value,
  );

  detailPanelWidth.value = nextWidth;
};

const stopResizeDetailPanel = () => {
  if (!isResizingDetailPanel.value) {
    return;
  }

  isResizingDetailPanel.value = false;
  window.removeEventListener("pointermove", onResizeDetailPanelMove);
  window.removeEventListener("pointerup", stopResizeDetailPanel);
  window.removeEventListener("pointercancel", stopResizeDetailPanel);
};

const onResizeDetailPanelMove = (event: PointerEvent) => {
  if (!isResizingDetailPanel.value) {
    return;
  }

  updateDetailPanelWidth(event.clientX);
};

const startResizeDetailPanel = (event: PointerEvent) => {
  event.preventDefault();
  isResizingDetailPanel.value = true;
  updateDetailPanelWidth(event.clientX);

  window.addEventListener("pointermove", onResizeDetailPanelMove);
  window.addEventListener("pointerup", stopResizeDetailPanel);
  window.addEventListener("pointercancel", stopResizeDetailPanel);
};

const onWindowResize = () => {
  windowWidth.value = window.innerWidth;
};

window.addEventListener("resize", onWindowResize);

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", onResizeDetailPanelMove);
  window.removeEventListener("pointerup", stopResizeDetailPanel);
  window.removeEventListener("pointercancel", stopResizeDetailPanel);
  window.removeEventListener("resize", onWindowResize);
});
</script>

<template>
  <div class="app-shell">
    <!-- icon="checklist" title="Qtodo" -->
    <QmTitleBar class="app-title-bar">
      <template #left-action>
        <!-- 展开时显示 menu，收起时显示 sort，让按钮图标表达当前侧栏状态。 -->
        <QmIconButton class="title-left-action slow-ripple" :icon="sidebarCollapsed ? 'sort' : 'menu'" @click="toggleSidebar" />
      </template>

      <template #actions>
        <!-- 这里显示的是当前主题模式对应的图标。 -->
        <QmIconButton class="theme-mode slow-ripple"
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
    <div
      :class="[
        'app-body',
        {
          'collapsed-sidebar': sidebarCollapsed,
          'with-detail-panel': showDetailPanel,
        },
      ]"
      :style="{ '--detail-panel-width': detailPanelWidthStyle }"
    >
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
          <template v-for="item in navItemsWithCounts" :key="item.key">
            <!-- 收起态使用真正的 icon-only 组件，避免 BeerCSS medium 文字按钮撑开窄栏。 -->
            <QmIconButton v-if="sidebarCollapsed" class="sidebar-icon-action slow-ripple"
              :class="{ archive: activeNav === item.key }" :icon="item.icon" :active="activeNav === item.key"
              :aria-label="item.label" :title="item.label" @click="selectNavItem(item.key)" />

            <!-- 展开态保留完整按钮，显示 icon、文字和 badge。 -->
            <button v-else type="button" :class="['no-round slow-ripple', activeNav === item.key && 'archive', 'medium']"
              @click="selectNavItem(item.key)">
              <i>{{ item.icon }}</i>
              <span class="nav-label">{{ item.label }}</span>
              <span v-if="item.count !== undefined" class="badge none">{{ item.count }}</span>
            </button>
          </template>
        </nav>
        <!-- 侧边栏内容 -->
      </div>
      <div class="app-main-panel">
        <TodayTodoView
          v-if="activeNav === 'today-todo'"
          :tasks="todayTasks"
          :can-edit="true"
          @reorder="reorderTasks('today', $event)"
          @toggle-complete="toggleTaskComplete"
          @select="selectTask"
          @clear-selection="clearSelectedTask"
          @edit="requestEditTask"
          @delete="requestDeleteTask"
          @archive="archiveTask"
        />
        <UpcomingView
          v-else-if="activeNav === 'upcoming'"
          :tasks="upcomingTasks"
          :can-edit="true"
          @reorder="reorderTasks('upcoming', $event)"
          @toggle-complete="toggleTaskComplete"
          @edit="requestEditTask"
          @delete="requestDeleteTask"
        />
        <CompletedView
          v-else-if="activeNav === 'completed'"
          :tasks="completedTasks"
          :can-edit="true"
          @toggle-complete="toggleTaskComplete"
          @edit="requestEditTask"
          @delete="requestDeleteTask"
          @archive="archiveTask"
        />
        <ArchiveView
          v-else-if="activeNav === 'archive'"
          :tasks="archivedTasks"
          @delete="requestDeleteTask"
        />
        <SettingsView v-else-if="activeNav === 'settings'" />
      </div>
      <div
        v-if="showDetailPanel"
        :class="['app-resize-handle', { active: isResizingDetailPanel }]"
        role="separator"
        aria-orientation="vertical"
        aria-label="调整详情栏宽度"
        :aria-valuemin="MIN_DETAIL_PANEL_WIDTH"
        :aria-valuemax="MAX_DETAIL_PANEL_WIDTH"
        :aria-valuenow="resolvedDetailPanelWidth"
        @pointerdown="startResizeDetailPanel"
      ></div>
      <div v-if="showDetailPanel" class="app-detail-panel">
        <TodayDetailPanel
          :tasks="todayTasks"
          :selected-task="selectedTask"
          @clear-selection="clearSelectedTask"
          @toggle-complete="toggleTaskComplete"
          @edit="requestEditTask"
          @archive="archiveTask"
          @delete="requestDeleteTask"
        />
      </div>

    </div>

    <NewTaskDialog
      v-model="isNewTaskDialogOpen"
      mode="create"
      @create="createTodayTask"
    />
    <NewTaskDialog
      v-model="isEditTaskDialogOpen"
      mode="edit"
      :task="taskPendingEdit"
      @update="updateTaskFromDialog"
    />
    <DeleteTaskDialog
      v-model="isDeleteTaskDialogOpen"
      :task-description="taskPendingDelete?.description"
      @confirm="confirmDeleteTask"
    />
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

.app-shell:has(.app-resize-handle.active) {
  cursor: col-resize;
  user-select: none;
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
  /* 默认：左侧栏 + 主内容。只有今日页会追加详情栏。 */
  grid-template-columns: 140px minmax(360px, 1fr);
  min-height: 0;
  overflow: hidden;
  column-gap: 24px;

  padding-top: 5px;
  padding-bottom: 32px;
  padding-left: 24px;
  padding-right: 24px;
}

.app-body.with-detail-panel {
  position: relative;
  grid-template-columns: 140px minmax(360px, 1fr) var(--detail-panel-width);
}

.app-body.collapsed-sidebar {
  /* 收起状态：只把左侧栏压到 48px，中间栏会自动获得释放出来的空间。 */
  grid-template-columns: 48px minmax(360px, 1fr);
}

.app-body.collapsed-sidebar.with-detail-panel {
  grid-template-columns: 48px minmax(360px, 1fr) var(--detail-panel-width);
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
.app-resize-handle {
  position: absolute;
  top: 5px;
  right: calc(var(--detail-panel-width) + 30px);
  bottom: 32px;
  width: 12px;
  border-radius: 999px;
  background-color: transparent;
  cursor: col-resize;
  touch-action: none;
  z-index: 2;
}

.app-resize-handle::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  border-radius: 999px;
  background-color: transparent;
  transform: translateX(-50%);
}

.app-resize-handle:hover::before,
.app-resize-handle.active::before {
  background-color: color-mix(in srgb, var(--outline-variant) 72%, transparent);
}

.app-detail-panel {
  display: flex;
  overflow: hidden;
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
