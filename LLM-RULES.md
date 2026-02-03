# LLM Rules — KOL-Noter

> **Read this file first.** This initializes your context for working on this project.

## Project Overview

**KOL-Noter** is a multi-view note-taking and project management app built with Lovable.

- **Stack:** React 18 + TypeScript + Vite (port 8080) + Tailwind CSS + shadcn/ui
- **State:** Local state (useState), React Query configured but minimal
- **Routing:** React Router DOM
- **Drag & Drop:** @dnd-kit

## Quick Context Files

| File | Purpose |
|------|---------|
| `docs/llm-context/MEMORY.md` | Living knowledge base — decisions, patterns, gotchas |
| `docs/llm-context/CODEBASE.md` | Architecture reference — structure, data flow, key files |
| `docs/llm-context/PREFERENCES.md` | Coding style and conventions |
| `docs/llm-context/session-logs/` | Work session history |

## Hard Rules

### Code Style
- [ ] Use TypeScript (`.tsx` / `.ts`) — owner is learning TS, keep types simple
- [ ] Prefer `any` over complex generics when stuck
- [ ] Use existing shadcn/ui components from `src/components/ui/`
- [ ] Follow existing patterns in the codebase

### File Organization
- [ ] Pages go in `src/pages/`
- [ ] Reusable components go in `src/components/`
- [ ] UI primitives stay in `src/components/ui/`
- [ ] Hooks go in `src/hooks/`

### Forbidden
- [ ] Don't create new files unless necessary — prefer editing existing
- [ ] Don't add dependencies without asking
- [ ] Don't refactor code that isn't related to the current task
- [ ] Don't over-engineer — keep it simple

### Session Protocol
1. On session start: Read this file
2. Check `docs/llm-context/session-logs/` for recent context
3. Update MEMORY.md when discovering important patterns/decisions
4. End sessions by updating or creating a session log

## Current State

- **Status:** Initial setup, exploring codebase
- **Last Session:** 2026-02-03
- **Active Work:** Setting up LLM context system

## Data Hierarchy (Important)

The app uses a 5-level hierarchy:
```
System (Work, Personal)
└── Project (Engineering, Product, etc.)
    └── Note (individual documents)
        └── Page (subdivisions)
            └── Section (detailed content)
```

## Editor Types

1. **Block Editor** — Drag-and-drop modular blocks
2. **Standard Editor** — Markdown with toolbar
3. **Visual Editor** — Flowchart/diagrams
4. **Typography Editor** — Font showcase
