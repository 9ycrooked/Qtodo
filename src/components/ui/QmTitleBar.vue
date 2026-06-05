<script setup lang="ts">
import { getCurrentWindow } from "@tauri-apps/api/window"

defineOptions({
    name: "QmTitleBar",
    inheritAttrs: false,
})

interface QmTitleBarProps {
    // 标题
    title?: string;
    // 标题前的图标
    icon?: string;
    // 是否显示窗口控制按钮
    showControls?: boolean;
    // 是否启用标题左侧按钮button
    showLeftAction?: boolean;
    leftActionIcon?: string;
    leftActionLabel?: string;
}

withDefaults(defineProps<QmTitleBarProps>(), {
    title: "",
    icon: "",
    showControls: true,
    showLeftAction:false,
    leftActionIcon: "menu",
    leftActionLabel: "菜单",
})

const emit = defineEmits<{
    (e: "left-action-click", event: MouseEvent): void;
}>()

const onLeftActionClick = (event: MouseEvent) => {
    emit("left-action-click", event)
}


const appWindow = getCurrentWindow()

const minimizeWindow = () => {
    appWindow.minimize()
}

const toggleMaximizeWindow = () => {
    appWindow.toggleMaximize()
}

const closeWindow = () => {
    appWindow.close()
}

const startDragging = async (event: MouseEvent) => {
    if (event.button !== 0) return; // 仅响应左键
    await appWindow.startDragging()
}

</script>

<template>
    <div class="titlebar" v-bind="$attrs">
        <div class="titlebar-left">
            <slot name="left-action">
                <button v-if="showLeftAction" class="circle transparent" type="button" :aria-label="leftActionLabel"
                    @click="onLeftActionClick">
                    <i>{{ leftActionIcon }}</i>
                </button>
            </slot>

            <div class="drag-region" @mousedown="startDragging">
                <slot name="left">
                    <i v-if="icon">{{ icon }}</i>
                    <h7 v-if="title">{{ title }}</h7>
                </slot>
            </div>
        </div>

        <div class="drag-region flex" @mousedown="startDragging"></div>

        <div class="window-actions">
            <slot name="actions" />
        </div>

        <div v-if="showControls" class="window-controls">
            <button class="circle transparent" type="button" aria-label="最小化" @click="minimizeWindow">
                <i>remove</i>
            </button>

            <button class="circle transparent" type="button" aria-label="最大化或还原" @click="toggleMaximizeWindow">
                <i>crop_square</i>
            </button>

            <button class="circle transparent close-button" type="button" aria-label="关闭" @click="closeWindow">
                <i>close</i>
            </button>
        </div>
    </div>
</template>

<style scoped>
.titlebar {
    height: 40px;
    min-height: 40px;
    max-height: 40px;
    box-sizing: border-box;

    display: flex;
    align-items: center;
    gap: 8px;
    padding-inline: 8px;

    user-select: none;
    background: var(--surface);
    color: var(--on-surface);
    border-bottom: 1px solid var(--outline-variant);
}

.titlebar i {
    font-size: 20px;
    line-height: 1;
}

.titlebar-left {
    height: 100%;
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
}

.drag-region {
    height: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    cursor: default;
}

.flex {
    flex: 1;
}

.window-actions,
.window-controls {
    height: 100%;
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
}

.titlebar h7 {
    margin: 0;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.titlebar button {
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    padding: 0;
    margin: 0;
    -webkit-app-region: no-drag;
}
.titlebar .window-controls .close-button:hover {
    background-color: var(--error-container, #ffdad6) !important;
    color: var(--on-error-container, #410002);
}

.titlebar .window-controls .close-button:hover i {
    color: var(--on-error-container, #410002);
}

.titlebar .window-controls .close-button:hover::before,
.titlebar .window-controls .close-button:hover::after {
    background-color: transparent !important;
}
</style>
