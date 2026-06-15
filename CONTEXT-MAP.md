# Context map

This repo has two contexts. Read the `CONTEXT.md` for the context you're about to work in.

## Frontend (Vue 3 + Vite)

- Path: `src/`
- Owns: task state composable, view filtering, dialogs, page shells, theme
- Entry: [`src/CONTEXT.md`](./src/CONTEXT.md)
- ADRs: [`src/docs/adr/`](./src/docs/adr/)

## Shell (Tauri + Rust)

- Path: `src-tauri/`
- Owns: window lifecycle, native shell around the webview
- Entry: [`src-tauri/CONTEXT.md`](./src-tauri/CONTEXT.md)
- ADRs: [`src-tauri/docs/adr/`](./src-tauri/docs/adr/)
