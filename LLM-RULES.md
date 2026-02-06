# LLM Rules — KOL-Noter

> **MANDATORY: Read this file + latest session log before doing anything else.**

## Session Protocol (REQUIRED)

1. **Read this file** — initializes your context
2. **Read the latest session log** — `docs/llm-context/session-logs/` (sort by filename, read the most recent)
3. **Update MEMORY.md** — when discovering important patterns/decisions
4. **End sessions** — by updating or creating a session log

**Do not start working until steps 1-2 are complete.**

## Current State

- **Status:** Implementing Local-First Markdown Architecture
- **Last Session:** 2026-02-05
- **Active Work:** Tauri integration (Phases 0-2 complete, 3-7 pending)
- **Roadmap:** See `docs/roadmap/local-first-markdown-architecture.md`

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
