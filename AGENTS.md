# AGENTS

## Agent skills

### Issue tracker

Issues and PRDs live in GitHub Issues for this repo. Use the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The canonical five roles — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix` — map 1:1 to GitHub labels of the same name. See `docs/agents/triage-labels.md`.

### Domain docs

This is a multi-context repo: a Vue 3 frontend (`src/`) and a Tauri/Rust shell (`src-tauri/`). Each context has its own `CONTEXT.md` and `docs/adr/`. The root `CONTEXT-MAP.md` points at them. See `docs/agents/domain.md`.

### Branching and merge flow

All work happens on `agent/*` branches (one per worktree/agent). Agent branches
**never** merge directly to `main`. The flow is:

```
agent/*  →  develop  →  main
```

- `agent/*` (e.g. `agent/mavis`, `agent/qoder`) — work happens here, one branch per agent/worktree
- `develop` — integration branch; agent branches land here first, get reviewed and tested together
- `main` — only the integration branch (`develop`) lands here; main is always clean and releasable

Rationale: keeps main releasable, gives a place to integrate multiple parallel
agent branches and resolve cross-branch conflicts before they hit production.
