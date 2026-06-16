# Due Date validation lives in the data layer

A Task is required to have a Due Date. The validation that enforces this currently lives in `NewTaskDialog.vue` (the create and edit dialogs disable submission until `form.dueDate` is non-empty). `useTasks.addTask` and `useTasks.updateTask` do not re-check, on the assumption that the only entry point is the dialog.

Considered alternatives:

- **Validate only at the UI layer** — current state. Cheap, but if any other entry point is added later (import, API, migration, scripted seeding), Tasks without a Due Date can land in the store and break Today/Upcoming view logic, which assumes every Active Task has a Due Date.
- **Validate at the data layer** — `addTask` and `updateTask` throw or return an error if `dueDate` is empty. Slightly more code, but the invariant becomes locally provable from the store and survives new entry points.
- **Make Due Date optional everywhere** — would let users add Tasks without a deadline (notes-style). Out of scope; would require reworking view filters and sort rules.

This ADR does not yet mandate which layer should hold the check; it records that the check is currently UI-only and the trade-off is known. The fix is small (one line per mutation in `useTasks.ts`) and worth doing when the next non-dialog entry point shows up.
