# Qtodo

一款基于 Tauri v2 + Vue 3 的桌面任务管理应用。

## 功能特性

- **任务管理** — 创建、编辑、删除、归档任务，支持优先级（高/中/低）
- **到期提醒** — 支持按时间精确提醒和按日期当天提醒，60 秒轮询 + 去重 + 补弹机制
- **双通道通知** — app 有焦点时走应用内 Toast，失去焦点时走 Windows 系统通知，自动切换
- **多视图** — Today / Upcoming / Completed / Archive 四种视图
- **拖拽排序** — 支持按视图手动排列任务，200ms 防抖写盘
- **主题切换** — 浅色 / 深色 / 跟随系统三种模式
- **自动更新** — 内置 tauri-plugin-updater，支持后台下载 + 签名验证
- **数据存储** — SQLite 本地持久化，支持自定义存储路径

## 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | Vue 3 (Composition API + `<script setup>`) |
| UI 组件 | BeerCMS (Material Design 3) |
| 构建工具 | Vite 6 |
| 桌面壳 | Tauri v2 |
| 后端 | Rust (rusqlite + SQLite) |
| 测试 | Vitest (前端) + cargo test (后端) |
| 包管理 | Yarn 4 Berry (PnP) |

## 开发环境

### 前置要求

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) 1.75+
- [Yarn 4](https://yarnpkg.com/getting-started/install) (通过 Corepack)

### 安装依赖

```bash
yarn install
```

### 启动开发服务器

```bash
yarn tauri dev
```

### 运行测试

```bash
# 前端测试
yarn test

# 后端测试
cd src-tauri && cargo test
```

### 构建发布版本

```bash
yarn tauri build
```

产物位于 `src-tauri/target/release/bundle/`。

## 项目结构

```
Qtodo/
├── src/                      # Vue 3 前端
│   ├── components/           # UI 组件
│   ├── composables/          # 组合式函数
│   ├── views/                # 页面视图
│   ├── types/                # TypeScript 类型
│   ├── utils/                # 工具函数
│   └── CONTEXT.md            # 前端领域术语表
├── src-tauri/                # Tauri/Rust 后端
│   ├── src/                  # Rust 源码
│   ├── capabilities/         # Tauri 权限配置
│   └── Cargo.toml
├── docs/
│   ├── adr/                  # 架构决策记录
│   └── agents/               # Agent 工作流文档
├── AGENTS.md                 # Agent 工作手册
└── CONTEXT-MAP.md            # 多上下文架构映射
```

## 分支策略

```
agent/*  →  develop  →  main
```

- `agent/*` — 各 agent 的工作分支（一个 worktree 一个分支）
- `develop` — 集成测试分支，agent 分支合并到此
- `main` — 仅接受 develop 的 PR，始终保持可发布状态

## License

[MIT](LICENSE)
