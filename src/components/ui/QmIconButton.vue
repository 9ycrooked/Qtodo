<script lang="ts" setup>
/**
 * QmIconButton.vue -- 这是一个应用程序图标按钮组件，使用了 Beercss 的样式类来实现不同的外观和功能。
 * 包装 Beercss 的 .circle + .transparent 按钮
 * 
 * 组件接受以下 props：
 */

// inheritAttrs: false 让 $attrs 透传可控
defineOptions({
    name: "QmIconButton",
    inheritAttrs: false,
})

interface Props {
    /**
     * 图标名称，使用 Material Icons 字体图标
     */
    icon: string;
    /** 禁用 */
    disabled?: boolean;
    /** 
     * 激活态（按下）
    */
    active?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
    icon: "",
    disabled: false,
    active: false,
})

const emit = defineEmits<{
    (e: "click", event: MouseEvent): void;
}>();
function onClick(event: MouseEvent) {
    if (props.disabled) return;
    emit("click", event);
}
</script>

<template>
    <button :class="['circle', 'transparent', active && 'active']" :disabled="disabled" @click="onClick" v-bind="$attrs">
        <i v-if="icon">{{ icon }}</i>
        <slot />
    </button>
</template>

<style>

</style>