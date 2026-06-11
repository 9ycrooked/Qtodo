# QmButton 组件文档

`QmButton` 是一个基于 Vue 3 `<script setup>` 和 Beer CSS class 体系封装的按钮组件。它支持多种按钮风格、颜色、尺寸、形状、加载态、禁用态、图标、图片按钮，以及原生 `<button>` 属性透传。

## 引入

```ts
import QmButton from "@/components/ui/QmButton.vue"
```

## 基础用法

```vue
<QmButton @click="handleClick">
  保存
</QmButton>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `variant` | `"filled" \| "tonal" \| "outlined" \| "text" \| "elevated" \| "floating" \| "extended"` | `"filled"` | 按钮视觉样式 |
| `color` | `"primary" \| "secondary" \| "tertiary" \| "error"` | `"primary"` | 按钮颜色 |
| `size` | `"small" \| "medium" \| "large" \| "extra"` | `"medium"` | 按钮尺寸 |
| `shape` | `"default" \| "circle" \| "square" \| "round"` | `"default"` | 按钮形状 |
| `responsive` | `boolean` | `false` | 添加 `responsive` class |
| `block` | `boolean` | `false` | 添加 `block` class，使按钮撑满父容器 |
| `loading` | `boolean` | `false` | 加载状态，显示加载图标并禁止点击 |
| `disabled` | `boolean` | `false` | 禁用状态，禁止点击 |
| `icon` | `string` | `""` | Material Symbols 图标名称 |
| `image` | `string` | `undefined` | 图片地址，存在时优先渲染图片 |
| `type` | `"button" \| "submit" \| "reset"` | `"button"` | 原生按钮类型 |

## Events

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `click` | `MouseEvent` | 点击按钮时触发。`loading` 或 `disabled` 为 `true` 时不会触发 |

## Slots

| 插槽名 | 说明 |
| --- | --- |
| `default` | 按钮文本或自定义内容 |

## 常见示例

### 不同风格

```vue
<QmButton variant="filled">Filled</QmButton>
<QmButton variant="tonal">Tonal</QmButton>
<QmButton variant="outlined">Outlined</QmButton>
<QmButton variant="text">Text</QmButton>
<QmButton variant="elevated">Elevated</QmButton>
```

### 不同颜色

```vue
<QmButton color="primary">Primary</QmButton>
<QmButton color="secondary">Secondary</QmButton>
<QmButton color="tertiary">Tertiary</QmButton>
<QmButton color="error">Delete</QmButton>
```

### 不同尺寸

```vue
<QmButton size="small">Small</QmButton>
<QmButton size="medium">Medium</QmButton>
<QmButton size="large">Large</QmButton>
<QmButton size="extra">Extra</QmButton>
```

### 图标按钮

```vue
<QmButton icon="add">新增</QmButton>
<QmButton icon="delete" color="error" variant="outlined">
  删除
</QmButton>
```

### 悬浮按钮

```vue
<QmButton variant="floating" icon="add" />
```

### 扩展按钮

```vue
<QmButton variant="extended" icon="edit">
  编辑
</QmButton>
```

### 加载和禁用

```vue
<QmButton loading>保存中</QmButton>
<QmButton disabled>不可点击</QmButton>
```

### 表单提交

```vue
<form @submit.prevent="submit">
  <QmButton type="submit" icon="check">
    提交
  </QmButton>
</form>
```

## 属性透传

组件设置了 `inheritAttrs: false`，并通过 `v-bind="$attrs"` 将未声明属性透传到根元素 `<button>` 上。

```vue
<QmButton aria-label="提交表单" title="提交">
  提交
</QmButton>
```

## Class 映射规则

组件最终会生成 Beer CSS class 字符串，基础 class 为 `button`。

| 输入 | 追加 class |
| --- | --- |
| `variant="tonal"` | `fill` |
| `variant="outlined"` | `border` |
| `variant="text"` | `transparent` |
| `variant="elevated"` | `shadow` |
| `variant="floating"` | `circle extra` |
| `variant="extended"` | `extend circle` |
| `color="secondary"` | `secondary` |
| `color="tertiary"` | `tertiary` |
| `color="error"` | `error` |
| `size="small"` | `small` |
| `size="large"` | `large` |
| `size="extra"` | `extra` |
| `shape="circle"` | `circle` |
| `shape="square"` | `square` |
| `shape="round"` | `round` |
| `responsive` | `responsive` |
| `block` | `block` |
| `loading` 或 `disabled` | `disabled`，并设置原生 `disabled` 属性 |

## 注意事项

- `loading` 和 `disabled` 都会让按钮进入不可交互状态。
- 当 `image` 存在时，组件会优先渲染图片，不再渲染 `icon` 和默认插槽。
- `icon` 使用 Beer CSS / Material Symbols 的图标文本写法，需要确保项目已引入对应图标字体。
- `type` 默认是 `"button"`，避免在表单中误触发提交。
