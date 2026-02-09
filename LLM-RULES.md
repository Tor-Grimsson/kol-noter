# LLM Rules — KOL-Noter

> **MANDATORY: Read this file + latest session log before doing anything else.**

## Session Protocol (REQUIRED)

When the user says "read LLM-RULES" (or similar):

1. **Read this file**
2. **Read the latest session log(s)** — `docs/llm-context/session-logs/` (sort by filename, read the most recent)
3. **Confirm context loaded** — do NOT summarize what you read, do NOT add commentary, do NOT ask what to do next. Just confirm you're up to speed and ready for a task.

During/after work:
- **Update MEMORY.md** — when discovering important patterns/decisions
- **End sessions** — by updating or creating a session log

## Current State

- **Status:** TipTap WYSIWYG with syntax reveal and image focus
- **Last Session:** 2026-02-08
- **Active Work:** Syntax reveal plugin (headings, bold, italic, underline, code). Image click-to-edit path via custom NodeView. Title extraction strips markdown syntax.
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
