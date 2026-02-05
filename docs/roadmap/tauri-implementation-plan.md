# Tauri Implementation Plan

> **Status:** Planning (Feb 2026)
> **Approach:** Tauri primary, Docker auxiliary
> **Estimated Effort:** ~70 hours over 10-16 weeks

## Overview

Transform KOL-Noter from localStorage-based persistence to a **Local-First Markdown Architecture** where files on disk are the source of truth, enabling Obsidian compatibility and external editing.

---

## Architecture Decision

| Factor | Tauri (Primary) | Docker (Auxiliary) |
|--------|-----------------|---------------------|
| **File Access** | Native, direct | Bind mount + polling |
| **App Size** | ~5-10MB | ~500MB+ |
| **macOS Feel** | Native menu, notifications | Browser-based |
| **Use Case** | Primary desktop app | Local network hosting |
| **iOS Later** | Tauri 2.0 supports iOS | Separate approach needed |

**Decision:** Tauri as primary, Docker as optional post-MVP for network access.

---

## File Format Strategy

### Vault Structure
```
~/Documents/KOL-Noter-Vault/
├── .kol-noter/                    # App config (hidden)
│   ├── config.json
│   ├── search-index.json
│   └── id-map.json
├── Work/                          # System
│   ├── _system.md                 # System metadata
│   └── Engineering/               # Project
│       ├── _project.md
│       ├── router-config.md       # Standard note
│       └── assets/
└── Personal/
    └── Learning/
        ├── flowchart.md           # Visual note stub
        └── flowchart.visual.json  # Visual node data
```

### Note Formats

| Editor Type | Format | Obsidian Compatible |
|-------------|--------|---------------------|
| Standard | `.md` with YAML frontmatter | Yes |
| Modular | `.md` with HTML comment markers | Yes (readable) |
| Visual | `.md` stub + `.visual.json` sidecar | Partial |

---

## Dependencies to Add

### Production (free/MIT)
| Package | Purpose |
|---------|---------|
| `@tauri-apps/api` | File system, dialogs, native APIs |
| `gray-matter` | Parse/stringify YAML frontmatter |
| `minisearch` | In-memory full-text search |
| `slugify` | Title → filename conversion |
| `remark-wiki-link` | Parse `[[WikiLinks]]` |

### Prerequisites
```bash
xcode-select --install  # Xcode CLI tools
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh  # Rust
```

---

## Implementation Phases

### Phase 0: Tauri Foundation (1-2 weeks, ~6 hrs)
- [ ] Initialize `src-tauri/`
- [ ] Configure file system permissions
- [ ] Create vault folder picker
- [ ] Verify file read/write

### Phase 1: Persistence Abstraction (1-2 weeks, ~10 hrs)
- [ ] Create `IPersistenceAdapter` interface
- [ ] Implement localStorage adapter (wrap existing)
- [ ] Implement filesystem adapter (Tauri)
- [ ] Refactor `notesStore.tsx` to use adapter

### Phase 2: File Serialization (2-3 weeks, ~14 hrs)
- [ ] `NoteSerializer` for all editor types
- [ ] `SystemSerializer` and `ProjectSerializer`
- [ ] Slug generation with conflict handling
- [ ] ID mapping system

### Phase 3: Attachments (1-2 weeks, ~8 hrs)
- [ ] Convert base64 → actual files in `assets/`
- [ ] Update `StandardEditor.tsx` paste handler
- [ ] Relative path references

### Phase 4: File Watcher (1-2 weeks, ~10 hrs)
- [ ] Tauri `watch` API integration
- [ ] External change notifications
- [ ] Conflict resolution UI

### Phase 5: Search Index (1-2 weeks, ~7 hrs)
- [ ] MiniSearch index on startup
- [ ] Incremental updates
- [ ] Cache to `.kol-noter/search-index.json`

### Phase 6: Migration Tool (1 week, ~5 hrs)
- [ ] Export wizard component
- [ ] Integrity validation
- [ ] localStorage cleanup

### Phase 7: Polish (1-2 weeks, ~10 hrs)
- [ ] Error handling
- [ ] Loading states
- [ ] macOS code signing
- [ ] Auto-updater

### Phase 8: Docker (Optional, ~12 hrs)
- [ ] Dockerfile + docker-compose.yml
- [ ] Express/Fastify API layer
- [ ] WebSocket for file events

---

## Timeline

| Phase | Duration | Hours |
|-------|----------|-------|
| 0-1: Foundation + Abstraction | 2-4 weeks | ~16 |
| 2: Serialization | 2-3 weeks | ~14 |
| 3-5: Attachments + Watcher + Search | 3-5 weeks | ~25 |
| 6-7: Migration + Polish | 2-3 weeks | ~15 |

**MVP: 10-16 weeks, ~70 hours**

---

## Critical Files

| File | Change |
|------|--------|
| `src/store/notesStore.tsx` | Refactor to use persistence adapter |
| `src/hooks/useLocalStorage.ts` | Replace with `usePersistence` |
| `src/components/StandardEditor.tsx` | File-based attachments |
| `src/components/BlockEditor.tsx` | Understand for serialization |
| `src/components/VisualEditor.tsx` | JSON sidecar approach |

---

## Risks

| Risk | Mitigation |
|------|------------|
| Tauri learning curve | JS API first, Rust optional |
| Serialization edge cases | Tests + localStorage backup |
| Large vault slow startup | Lazy loading, cached index |
| File conflicts | Backup before overwrite, conflict UI |
