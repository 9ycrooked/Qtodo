import { ref, watch, onMounted, onBeforeMount } from "vue";

/**
 * 主题模式
 * -- auto: 跟随系统
 * -- light: 亮色
 * -- dark: 暗色
 */

export type ThemeMode = "auto" | "light" | "dark";

/**
 * 模块级 ref -- 所有调用 useTheme() 的组件共享同一个 themeMode
 */

const themeMode = ref<ThemeMode>("auto");

/** 系统当前是不是暗色 */
function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * 把主题模式应用到 body class
 * BeerCSS 的主题机制：<body class="light|dark">
 */

function applyMod(mode: ThemeMode) {
    const body = document.body;
    body.classList.remove("light", "dark");

    const actualMode = mode === "auto" ? (systemPrefersDark() ? "dark" : "light") : mode;
    body.classList.add(actualMode);
}

export function useTheme() {
    let mq: MediaQueryList | null = null;
    onMounted(() => {
        // 初始化把当前主题应用到 body
        applyMod(themeMode.value);
        // 监听系统主题变化
        mq = window.matchMedia("(prefers-color-scheme: dark)");
        mq.addEventListener("change", () => {
            if (themeMode.value === "auto") {
                applyMod("auto");
            }
        });
    });
    onBeforeMount(() => {
        mq?.removeEventListener("change", () => {});
    });

    // 监听 themeMode 变化，把新的主题应用到 body
    watch(themeMode, (newMode) => {
        applyMod(newMode);
    });

    // 循环切换主题模式Auto -> Dark -> Light -> Auto
    function cycleMode() {
        const order: ThemeMode[] = ["auto", "dark", "light"];
        const idx = order.indexOf(themeMode.value);
        themeMode.value = order[(idx + 1) % order.length];
    }

    // 直接设置主题模式 -- 主要给设置界面用
    function setMode(mode: ThemeMode) {
        themeMode.value = mode;
    }
    return {
        themeMode,
        cycleMode,
        setMode,
    };
}