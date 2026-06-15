# QTodo Handoff

## Context
Current workspace: `C:\Users\Y\source\tauri\Qtodo`

This handoff is for continuing QTodo development from Codex to another model.

## What Is Done
- Unified task state moved from `useTodayTasks.ts` to `src/composables/useTasks.ts`.
- Task views implemented in `src/utils/taskViews.ts`.
- Task model now includes:
  - `completed`
  - `archived`
  - `createdAt`
  - `updatedAt`
  - `completedAt?`
  - `archivedAt?`
  - `viewOrders?`
- `NewTaskDialog.vue` now supports `create` and `edit` modes.
- `DeleteTaskDialog.vue` exists and is used for true delete confirmation.
- `TaskPageView.vue` exists as a shared shell for the non-today pages.
- `TodayTodoView`, `UpcomingView`, `CompletedView`, and `ArchiveView` all use real task data.
- `TaskItem.vue` and `TodayDetailPanel.vue` were updated to use `slow-ripple` on buttons.
- `QmButton`, `QmIconButton`, and `QmTitleBar` also gained `slow-ripple`.
- `yarn build` was passing before the handoff.

## User Rules Already Locked In
- Delete is true delete, but requires confirmation.
- Only completed tasks can be archived.
- Archived tasks cannot be marked incomplete directly.
- Today page shows today-due, unarchived tasks, including completed ones.
- Upcoming page shows all incomplete, unarchived tasks.
- Completed page shows all completed, unarchived tasks.
- Archive page shows all archived tasks.
- Today and Upcoming support drag reorder.
- Drag reorder is page-specific and overrides default order for that page only.
- Default sort:
  - Today / Upcoming: due date nearest first
  - Completed: completed time newest first
  - Archive: archived time newest first
- Editing should reuse the new-task dialog.
- Editable fields: title, description, due date, due time, priority.
- Title can be empty, description cannot.
- Editing should auto-reflow tasks between views according to rules.
- No success toast after editing.

## Current Risk / Incomplete Area
- The edit flow is partly wired and needs a careful final pass.
- `App.vue` currently has edit-state plumbing and the edit dialog added, but the selection and reflow behavior should be rechecked for consistency after edit.
- `useTasks.updateTask()` should remain a pure data update; any selection cleanup should stay in `App.vue`.
- There may still be small template wiring issues around `edit` events if the latest edits were interrupted.

## Key Files
- `src/App.vue`
- `src/composables/useTasks.ts`
- `src/utils/taskViews.ts`
- `src/types/todo.ts`
- `src/components/todo/NewTaskDialog.vue`
- `src/components/todo/DeleteTaskDialog.vue`
- `src/components/todo/TaskPageView.vue`
- `src/components/todo/TaskList.vue`
- `src/components/todo/TaskItem.vue`
- `src/components/todo/TodayDetailPanel.vue`
- `src/views/TodayTodoView.vue`
- `src/views/UpcomingView.vue`
- `src/views/CompletedView.vue`
- `src/views/ArchiveView.vue`

## Suggested Skills
- `diagnose` for any edit-flow or selection bug.
- `tdd` for tightening the update-task flow before more UI work.
- `review` if you want a quick safety pass on the recent task-state refactor.
- `improve-codebase-architecture` if you want another architecture pass after edit lands cleanly.

## Suggested Next Step
Finish the edit flow end-to-end:
1. Verify `TaskPageView` and page emits still forward `edit`.
2. Make sure `App.vue` opens edit mode from today detail and task menus.
3. Confirm edited tasks reappear in the correct page(s) and selection clears only when the task leaves today.
4. Run `yarn build`.
