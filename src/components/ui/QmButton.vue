<script setup lang="ts">
import { computed } from 'vue'

// 1.命名组件，启用 inheritAttrs 以便 $attrs 透传到根元素
defineOptions({
    name: "QmButton",
    inheritAttrs: false,
})

// 定义 props 类型
type Variant = "filled" | "tonal" | "outlined" | "text" | "elevated" | "floating" | "extended"

type Color = "primary" | "secondary" | "tertiary" | "error"

type Size = "small" | "medium" | "large" | "extra"

type Shape = "default" | "circle" | "square" | "round"

// 2.定义 props 接口
interface Props {
    variant?: Variant;

    color?: Color;

    size?: Size;

    shape?: Shape;

    responsive?: boolean;

    block?: boolean;

    loading?: boolean;

    disabled?: boolean;

    icon?: string;

    image?: string;
    
    type?: "button" | "submit" | "reset";
}

// 使用 withDefaults 定义 props 的默认值
const props = withDefaults(defineProps<Props>(), {
    variant: "filled",

    color: "primary",

    size: "medium",

    shape: "default",

    responsive: false,

    block: false,

    loading: false,

    disabled: false,

    icon: "",

    type: "button",
})

// 3.定义 emits
const emit = defineEmits<{
    (e: "click", event: MouseEvent): void;
}>();
// 4.状态联动（合并态）
const isInactive = computed(() => props.loading || props.disabled);

// 5.事件拦截
const onClick = (event: MouseEvent) => {
    if (isInactive.value) return;
    emit("click", event);
};

// // ========== class 映射（4 个轴向） ==========
const beercssClass = computed(() => {

    let cls = "button";

    // variant 风格
    switch (props.variant) {

        case "tonal": cls += " fill"; break

        case "outlined": cls += " border"; break

        case "text": cls += " transparent"; break

        case "elevated": cls += " shadow"; break

        case "floating": cls += " circle extra"; break

        case "extended": cls += " extend circle"; break

        case "filled":

        default: break

    }
    // color 颜色 primary默认不追加
    if (props.color === "secondary") cls += " secondary";
    else if (props.color === "tertiary") cls += " tertiary";
    else if (props.color === "error") cls += " error";

    // size 大小 medium默认不追加
    if (props.size === "small") cls += " small";
    else if (props.size === "large") cls += " large";
    else if (props.size === "extra") cls += " extra";

    // shape 形状 default默认不追加
    if (props.shape === "circle") cls += " circle";
    else if (props.shape === "square") cls += " square";
    else if (props.shape === "round") cls += " round";

    // responsive 撑满容器
    if (props.responsive) cls += " responsive";

    // block 撑满父容器
    if (props.block) cls += " block";

    return cls;
})
</script>

<template>

    <button :class="[beercssClass, 'slow-ripple', isInactive && 'disabled']" :disabled="isInactive" :type="type" @click="onClick"
        v-bind="$attrs">
        <i v-if="loading" class="spin-icon">progress_activity</i>
        <img v-else-if="image" class="responsive" :src="image" alt="" />
        <i v-else-if="icon">{{ icon }}</i>
        <span v-if="$slots.default">
            <slot />
        </span>
    </button>

</template>

<style>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spin-icon {
  animation: spin 800ms linear infinite;
}
</style>
