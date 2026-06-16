# Qtodo 持久化设计 — 决策记录与 issue 原始 body

> 2026-06-16 由 Mavis (`mavis`) 协助产出的 Qtodo 持久化方案。
> GitHub issue 已发到 `9ycrooked/Qtodo#7` ~ `#10`（编码 `[P1]` ~ `[P4]`）。
> 本文件保留当时发 issue 前的"决策原始 body"+ 关键决策背后的理由，方便未来回溯。
>
> **注意**：以下四个 issue body 是发到 GitHub 时的原文快照。如果 GitHub issue 有更新，以 GitHub 为准；本文件只做"当初为什么这样拆"的考古用途。

---

## TL;DR — 这一轮的关键决策

| 决策点 | 结论 | 为什么 |
|---|---|---|
| 痛点 | 冷启动丢 Task | 用户原话"打开就是空的、Task 容易丢"，反复确认 = 重启后数据消失 |
| 存储方案 | **SQLite** (rusqlite, bundled) | 不选 JSON：并发写会丢数据、schema 演进要手写迁移；不选 localStorage：5MB 上限；不选 IndexedDB：桌面 app 用浏览器存储 = 找麻烦 |
| 数据位置 | **系统默认应用数据目录** + 设置面板允许改 | macOS `~/Library/Application Support/<bundle-id>/`，Windows `%APPDATA%\<bundle-id>\`，Linux `~/.local/share/<bundle-id>/` |
| 改路径时旧数据 | **完整复制到新位置**（选项 A，用户拍板） | 不复制 = 改路径等于清空；B 选项"只切不迁"等于自杀 |
| viewOrders 存法 | **JSON 塞 `tasks` 表** | 用户不懂 viewOrders 拆表的设计；当前 view 只有 4 个，sort key 最多 2 个，JSON 字段足够；过早拆表是 YAGNI |
| 写策略 | **单 Task 操作立即写** + **拖拽防抖 200ms** | Task 操作低频写盘开销忽略；拖拽高频必须防抖 |
| 冷启动恢复 | **全量加载到内存** | 普通人 todo list < 1000 条，全量内存读 < 1ms；懒加载复杂度不值 |
| Tauri 侧架构 | Rust 侧管 DB + Tauri command 暴露，前端 invoke | 不让前端直连 DB；不引入 SQL 框架给前端用（Drizzle/Prisma 桌面 app 多此一举） |
| 测试策略 | TDD（红绿重构） | 用户原话 |
| Issue 跟踪 | GitHub issue (`gh issue create`) | 已有 6 个 open issue 在用同一跟踪系统 |
| PR 策略 | 多个 PR | 用户原话；本目录对应 4 个 PR（P1/P2/P3/P4） |
| Rust 熟度 | 用户 B 级（看过没写过） | 代码给行内注释 |

### 不做的事（明确砍掉）

砍掉是为了保护精力。下面这些**当时讨论过、最后没排进 P0**：

- **Inbox** —— 用户提了"为什么"，被 Mavis push back 后用户没坚持。理由：用户痛点是 A 冷启动丢，不是 C 脑子里冒出来的事没记，Inbox 不解决 A
- **JSON 文件持久化** —— 上述表格理由
- **云同步 / 协作** —— "实用产品"目标但单机优先；先做本地，后续再说
- **拆表存 viewOrders** —— YAGNI
- **自然语言日期 / Smart 建议** —— 不在 P0 范围
- **Quick Capture 全局快捷键** —— 解决 C 类痛，不在 P0
- **Tags / Subtask / Recurring** —— schema 演进留接口（`app_meta.schema_version`）但不预先加字段

---

## Issue #7 [P1] — 持久化基础：SQLite 骨架 + Tauri command

## What to build

Tauri 侧接入 SQLite，建立"应用数据目录 → `qtodo.db` 文件"的物理链路。完成此 issue 后：

- 首次启动 app 时，应用数据目录出现 `qtodo.db` 文件
- `qtodo.db` 包含建表 SQL（空数据）
- 暴露一个 `get_db_path` Tauri command，前端调用能拿到绝对路径字符串
- 数据库 schema 写入 `app_meta` 表的 `schema_version` 字段（初始 `1`），给以后迁移留接口

**此 issue 不动任何业务逻辑、不改 `useTasks`、不改任何 View**。纯 plumbing：连库、初始化 schema、暴露一个 command。

## Acceptance criteria

- [ ] `src-tauri/Cargo.toml` 加入 `rusqlite` 依赖（`bundled` feature 避免系统库依赖）
- [ ] `src-tauri/src/db.rs`（或 `db/mod.rs`）实现：
  - `pub fn init(app_data_dir: &Path) -> Result<Connection>`，用 `Connection::open` 打开 `qtodo.db` 并执行 `CREATE TABLE IF NOT EXISTS`
  - 至少包含两个表：`tasks`（全字段建表）、`app_meta(key TEXT PRIMARY KEY, value TEXT)`
  - 写入 `app_meta: schema_version = 1`
- [ ] `src-tauri/src/lib.rs`（或 `main.rs`）在 `setup` hook 里调用 `db::init`
- [ ] 暴露 Tauri command `get_db_path() -> String`，从内存里取已打开的 Connection 路径并返回
- [ ] 前端 `useTasks.ts` 启动时 `invoke<string>('get_db_path')` 拿到路径（不消费，只调用、打印一次到 console 验证）
- [ ] **测试**：
  - Rust 单元测试：`init` 在临时目录创建 db 后，`tasks` 表存在、`app_meta.schema_version == "1"`
  - 集成测试：构建并启动 app 后，`%APPDATA%\<bundle-id>\qtodo.db`（Windows）或 `~/Library/Application Support/<bundle-id>/qtodo.db`（macOS）确实存在

## Blocked by

None — can start immediately.

## Notes for implementer

- `rusqlite = { version = "0.31", features = ["bundled"] }` 是当前推荐配置
- Tauri 2.x 用 `app.path().app_data_dir()?` 拿目录
- Tauri 2.x 暴露 command 用 `#[tauri::command]` + `tauri::generate_handler!`
- 此 issue 完成后，下游 issue 才能开始；它本身就是 plumbing，不演示任何业务功能
- 写测试用 `tempfile` crate 拿临时目录

---

## Issue #8 [P2] — Task CRUD 持久化：load / save / delete 接通

## What to build

把 `useTasks` 里的内存数据接进 SQLite。完成此 issue 后：

- 启动 app 时，前端从 db 拉全部 Task 进 `useTasks.tasks` ref（替换现在的 `initialTasks` 硬编码）
- 新建 / 编辑 / 切换 Complete / 归档 / 删除 Task 时，同步写 db
- **关掉 app 再打开，Task 还在**（冷启动恢复）
- Sort Preference 暂存 JSON 字段（`view_orders TEXT`），不在此 issue 实现拖拽持久化

## Acceptance criteria

- [ ] Tauri 侧新增三个 command（建议放 `src-tauri/src/commands/tasks.rs`）：
  - `load_all_tasks() -> Vec<TodoTask>` — 读 `tasks` 表全部行转 `TodoTask`
  - `save_task(task: TodoTask) -> ()` — UPSERT（按 `id`）
  - `delete_task(id: String) -> ()` — 按 `id` 删
- [ ] `useTasks` 启动时 `await invoke('load_all_tasks')` 填 `tasks.value`
- [ ] `useTasks` 的 `addTask` / `updateTask` / `toggleTaskComplete` / `archiveTask` / `deleteTask` 全部 await 对应 command
- [ ] 删除/归档后清空 `selectedTaskId` 的逻辑保留
- [ ] `useTasks.ts` 里**移除 `initialTasks` 硬编码**（db 为空时直接是空数组，UI 走空态）
- [ ] **TDD**（红绿重构顺序）：
  - 先写 Rust 集成测试：save 一个 task → load_all_tasks 拿回 → 字段一致
  - 再写前端测试：useTasks 单元测试覆盖"save 之后 ref 立即更新 + db 已写入"（用 vitest + mock Tauri invoke）
- [ ] 手动验证：建 3 个 Task、改其中 1 个 Priority、删 1 个、关 app、再开，剩 2 个，Priority 正确

## Blocked by

- #7（依赖 SQLite 骨架 + `get_db_path` 通路）

## Notes for implementer

- `TodoTask` 类型在 `src/types/todo.ts`，前后端需共享字段命名（snake_case ↔ camelCase 转换在 Rust 侧 `serde` 标注）
- `rusqlite` 的 `params_from_iter` 处理 Option；`due_time` / `completed_at` / `archived_at` 是 `Option<String>` 存 `NULL`
- `view_orders` 字段在 SQL 用 `TEXT` 存 JSON 字符串；本次不读写它，但表里要预留
- 别用事务包整批 `save_task` —— 单条 UPSERT 简单且 ACID；高频写盘问题（拖拽场景）由 #P3 处理
- 集成测试用 `tauri::test::mock_app()` 或直接 `tauri::Builder::default().setup(...).build(generate_context!())` —— 选你熟的

---

## Issue #9 [P3] — 拖拽排序的写盘防抖 200ms

## What to build

`useTasks.reorderTasks`（即拖拽完成后的 Sort Preference 写入）改为 200ms 防抖。完成此 issue 后：

- 拖拽排序连续触发 `reorderTasks` 时，**最后一次调用后 200ms 才真正写 db**
- 期间再次调用会重置定时器
- App 正常关闭时，未到期的防抖必须 flush（否则丢排序）

## Acceptance criteria

- [ ] `useTasks.reorderTasks` 用 lodash `debounce` 或手写 setTimeout/clearTimeout 包装写盘逻辑
- [ ] 防抖时长 200ms（写进常量 `REORDER_WRITE_DEBOUNCE_MS`，便于调）
- [ ] Tauri 侧新增 command `save_view_orders(id: String, view_orders: serde_json::Value) -> ()` —— 单独的 command 避免跟整个 `save_task` 混
- [ ] 拖拽操作**只写 `view_orders` JSON 字段**，不重写整个 Task 行
- [ ] **测试**：
  - 单测：连续 5 次调用 `reorderTasks` 在 100ms 内，只触发 1 次 `save_view_orders`
  - 单测：调用 `reorderTasks` 后等 250ms，触发 1 次
  - 单测：模拟"app 关闭时 flush" —— 调用 `useTasks.flushPendingWrites()` 立即触发未到期的写
- [ ] `App.vue` 的 `onBeforeUnmount`（或对应生命周期）调用 `flushPendingWrites()`

## Blocked by

- #8（依赖 #P2 提供的 Task CRUD 持久化通路）

## Notes for implementer

- 此 issue 是 #P2 的"补丁" —— #P2 把 `reorderTasks` 的写盘路径铺好（直接调 `save_task`），本 issue 改成调 `save_view_orders` + 防抖
- 防抖函数必须可 cancel（卸载时清 timer）和可 flush（立即触发）
- 200ms 是经验值，用户拖拽时不会感知到；如果觉得不稳可改 100ms 或 300ms
- 别把 `addTask` / `updateTask` / `deleteTask` 套防抖 —— 单 Task 操作是低频事件，立即写就行

---

## Issue #10 [P4] — 设置面板：允许改存储路径（带数据复制）

## What to build

在 `SettingsView.vue` 加一个"数据存储位置"项，允许用户改 db 文件路径。完成此 issue 后：

- 设置面板显示当前 db 路径（默认隐藏，点击展开）
- 用户可点"更改位置" → 弹原生目录选择对话框 → 选新路径
- 改路径时：**旧 db 文件完整复制到新位置**（不丢数据）
- app 重启后从新位置加载
- 路径持久化存在 `app_meta` 表（key = `db_path`，value = 新路径字符串）
- 启动时如果 `app_meta.db_path` 存在，用它；否则用 `app_data_dir`

## Acceptance criteria

- [ ] Tauri 侧新增 command `set_db_path(new_dir: String) -> Result<()>`：
  - 复制旧 `qtodo.db` 到 `new_dir/qtodo.db`（用 `std::fs::copy`）
  - 写入 `app_meta: db_path = new_dir`
  - 更新内存里的 Connection 句柄路径
- [ ] Tauri 侧新增 command `get_current_db_path() -> String`（封装现有路径状态）
- [ ] Tauri 侧在 `setup` hook 里读 `app_meta.db_path` —— 存在则用，否则 fallback `app_data_dir`
- [ ] `SettingsView.vue` 加"数据存储位置"区块：
  - 显示当前路径（truncate 中间，前 20 + ... + 后 20 字符）
  - "更改" 按钮 → 调 Tauri 的 `@tauri-apps/plugin-dialog` 选目录
  - "重置为默认" 按钮 → 删 `app_meta.db_path` + 复制回 `app_data_dir/qtodo.db`
- [ ] **改路径时复制是阻塞操作**：UI 要 disable 按钮 + 显示 loading
- [ ] **测试**：
  - 单测：`set_db_path` 复制后新文件存在、内容与旧一致
  - 单测：`set_db_path` 后 `get_current_db_path` 返回新路径
  - 单测：重置路径后回到 `app_data_dir`
  - 手动：建 5 个 Task → 改路径 → 重启 → 5 个 Task 还在 + 路径是新的
- [ ] 路径不存在或无写权限时给用户友好错误（"无法访问此目录"）

## Blocked by

- #7（依赖 #P1 提供的 SQLite 骨架 + `app_meta` 表，可与 #P2/#P3 并行）

## Notes for implementer

- 数据复制策略是**用户拍板的选项 A**（复制到新位置）—— 见对话记录
- 改路径的 command 要在 db 没有任何 in-flight 写时执行 —— 用 `Mutex<Connection>` 锁保护
- `@tauri-apps/plugin-dialog` 需要 `tauri.conf.json` 加 `dialog` 权限
- 复制完后**不要**自动删旧文件（用户后悔了还能找回）—— 但在 UI 提示"旧位置仍有完整副本"
- 别做"路径不存在自动创建目录"——给用户报错比默默创建父目录更安全

---

## 后续可能的 follow-up（**不在本轮 4 个 issue 内**，留作未来讨论）

- Q1.2 痛点 = 淹没丢 → 全局搜索（已留 schema 接口）
- Q1.2 痛点 = 遗忘丢 → Quick Capture（Cmd+Shift+N 全局弹窗）
- Q1.2 痛点 = 误删丢 → Undo / 回收站
- 协作 / 云同步 — 单机实用产品先不做
- 自然语言日期 / Smart 建议 — 不在 P0
- Tags / Subtask / Recurring — schema 演进留 `app_meta.schema_version` 接口
- Daily Review / Stale Task 提醒 — 可在 P3 之后单独开 issue

> 脑暴原文（30+ 项功能方向）见对话上下文，当时 grill 把范围砍到了"先做持久化"。
