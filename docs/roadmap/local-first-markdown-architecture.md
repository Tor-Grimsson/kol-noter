# Local-First Markdown Architecture — Progress

> Transforming KOL-Noter from localStorage to file-based persistence with Obsidian compatibility.

## Status Overview

| Phase | Description | Status | Hours Est. |
|-------|-------------|--------|------------|
| 0 | Tauri Foundation | ✅ Complete | ~6 |
| 1 | Persistence Abstraction | ✅ Complete | ~10 |
| 2 | File Serialization | ✅ Complete | ~14 |
| 3 | Attachment Handling | ✅ Complete | ~8 |
| 4 | File Watcher | ✅ Complete | ~10 |
| 5 | Search Index | ✅ Complete | ~7 |
| 6 | Migration Wizard | ✅ Complete | ~5 |
| 7 | Polish & Production | ✅ Complete | ~10 |

**Total Progress: 8/8 phases complete (~70 hours) - ARCHITECTURE COMPLETE**

---

## Phase 0: Tauri Foundation ✅

**Goal:** App launches as native Mac app, can select vault folder

### Completed
- [x] Installed `@tauri-apps/api` and `@tauri-apps/cli`
- [x] Created `src-tauri/` directory structure
- [x] Configured `tauri.conf.json` with app metadata
- [x] Added `tauri-plugin-fs` for file system access
- [x] Added `tauri-plugin-dialog` for folder picker
- [x] Created `src/lib/tauri-bridge.ts` TypeScript API

### Files Created
```
src-tauri/
├── Cargo.toml
├── tauri.conf.json
├── capabilities/default.json
├── src/lib.rs
└── src/main.rs

src/lib/tauri-bridge.ts
```

### Prerequisites Installed
- [x] Xcode Command Line Tools
- [x] Rust (rustc 1.93.0, cargo 1.93.0)

---

## Phase 1: Persistence Abstraction ✅

**Goal:** Swap between localStorage and file system via adapter pattern

### Completed
- [x] Created `IPersistenceAdapter` interface
- [x] Implemented `LocalStorageAdapter` (browser fallback)
- [x] Implemented `FilesystemAdapter` (Tauri native)
- [x] Created `usePersistence` React hook
- [x] Environment detection (Tauri vs browser)

### Files Created
```
src/lib/persistence/
├── types.ts              # Interface definitions
├── localStorage-adapter.ts
├── filesystem-adapter.ts
└── index.ts              # Main entry point

src/hooks/usePersistence.ts
```

### Interface
```typescript
interface IPersistenceAdapter {
  loadAll(): Promise<VaultData>;
  saveNote(note: Note): Promise<void>;
  deleteNote(noteId: string): Promise<void>;
  saveSystem(system: System): Promise<void>;
  saveProject(systemId: string, project: Project): Promise<void>;
  // ... more methods
}
```

---

## Phase 2: File Serialization ✅

**Goal:** All note types can round-trip to/from markdown files

### Completed
- [x] `NoteSerializer` - Standard/modular/visual formats
- [x] `SystemSerializer` - System metadata (`_system.md`)
- [x] `ProjectSerializer` - Project metadata (`_project.md`)
- [x] Slug generation with conflict handling
- [x] YAML frontmatter parsing (gray-matter)

### Files Created
```
src/lib/serialization/
└── note-serializer.ts
```

### Vault Structure
```
~/Documents/KOL-Noter-Vault/
├── .kol-noter/              # App config
│   ├── config.json
│   ├── id-map.json
│   └── search-index.json
├── Work/                    # System
│   ├── _system.md
│   └── Engineering/         # Project
│       ├── _project.md
│       ├── router-config.md
│       └── assets/
└── Personal/
    └── Learning/
        ├── flowchart.md
        └── flowchart.visual.json
```

### Note Formats

**Standard Editor** → Pure markdown with YAML frontmatter
```markdown
---
id: "1704067890123-abc"
editorType: "standard"
tags: [config, work]
created: 2024-02-05T10:30:00Z
---

# Router Config

Content here...
```

**Modular Editor** → Markdown with HTML comment markers
```markdown
---
editorType: "modular"
---

<!-- block:heading:1:abc123 -->
# Title

<!-- block:paragraph:def456 -->
Content here...
```

**Visual Editor** → Markdown stub + `.visual.json` sidecar

---

## Phase 3: Attachment Handling ✅

**Goal:** Binary files on disk instead of base64 in JSON

### Completed
- [x] Created `AttachmentManager` class for saving/loading attachments
- [x] Binary file writing via Tauri (`writeDataUrlAsFile`)
- [x] Binary file reading as data URL (`readFileAsDataUrl`)
- [x] MIME type detection from file extension
- [x] `useAttachments` React hook for components
- [x] Image resolution for Obsidian-style `![[image]]` syntax
- [x] Migration helper for base64 → file conversion

### Files Created
```
src/lib/attachments/
├── attachment-manager.ts    # Main attachment handling logic
└── index.ts                 # Module exports

src/hooks/useAttachments.ts  # React hook
```

### Updated Files
- `src/lib/tauri-bridge.ts` - Added binary file read/write functions
- `src/lib/persistence/filesystem-adapter.ts` - Updated to use binary I/O

---

## Phase 4: File Watcher ✅

**Goal:** External edits appear in app

### Completed
- [x] `FileWatcher` class using Tauri's `watch` API
- [x] Debounced event processing (300ms)
- [x] Event type detection (create/update/delete for notes/systems/projects)
- [x] `useFileWatcher` React hook
- [x] `ExternalChangeNotification` component with auto-dismiss
- [x] `ConflictResolutionDialog` for merge conflicts
- [x] Keep Local / Keep External / Keep Both options

### Files Created
```
src/lib/watcher/
├── file-watcher.ts      # Core file watching logic
└── index.ts             # Module exports

src/hooks/useFileWatcher.ts

src/components/
├── ExternalChangeNotification.tsx
└── ConflictResolutionDialog.tsx
```

---

## Phase 5: Search Index ✅

**Goal:** Fast full-text search across vault

### Completed
- [x] `SearchIndex` class using MiniSearch library
- [x] Indexes notes, systems, and projects
- [x] Extracts content from all editor types (standard, modular, visual)
- [x] Fuzzy matching and prefix search
- [x] Field boosting (title > tags > content)
- [x] Cache to `.kol-noter/search-index.json`
- [x] `useSearch` React hook with debouncing
- [x] `SearchCommand` component (Cmd+K / Ctrl+K)
- [x] Autocomplete suggestions

### Files Created
```
src/lib/search/
├── search-index.ts      # MiniSearch wrapper
└── index.ts             # Module exports

src/hooks/useSearch.ts   # React hook

src/components/SearchCommand.tsx  # Command palette UI
```

---

## Phase 6: Migration Wizard ✅

**Goal:** One-click migration from localStorage

### Completed
- [x] `exportToVault()` - Exports all data to filesystem
- [x] `validateLocalStorageData()` - Pre-migration validation
- [x] Progress tracking with callbacks
- [x] Multi-step wizard UI (intro → validate → select → options → migrate → complete)
- [x] Optional localStorage cleanup after migration
- [x] Option to skip attachments for faster migration
- [x] Error handling and recovery

### Files Created
```
src/lib/migration/
├── exporter.ts          # Migration logic
└── index.ts             # Module exports

src/components/MigrationWizard.tsx  # Step-by-step wizard UI
```

---

## Phase 7: Polish & Production ✅

**Goal:** Production-ready release

### Completed
- [x] `AppError` class hierarchy (VaultError, FileSystemError, etc.)
- [x] `parseError()` / `logError()` utilities
- [x] `withRetry()` for resilient operations
- [x] `VaultProvider` - App initialization & vault management
- [x] Loading skeletons (NoteCard, NotesList, Sidebar, Editor, etc.)
- [x] `EmptyState` / `ErrorState` components
- [x] `StatusBar` showing vault mode
- [x] Updated `tauri.conf.json` with production settings
- [x] File associations for `.md` files

### Files Created
```
src/lib/errors.ts                    # Error handling utilities
src/components/VaultProvider.tsx     # Vault initialization
src/components/LoadingStates.tsx     # Skeleton loaders
src/components/StatusBar.tsx         # Status bar component
```

### Production Config
- Bundle targets: DMG + App
- File associations: `.md`, `.markdown`
- Minimum macOS: 10.15
- Drag & drop enabled

---

## Next Steps

1. **Integrate persistence into notesStore.tsx** - Replace `useLocalStorage` with adapter
2. **Test Tauri build** - Run `npm run tauri:dev`
3. **Continue Phase 3** - Attachment handling

---

## Dependencies Added

### Production
| Package | Purpose |
|---------|---------|
| `@tauri-apps/api` | Tauri core APIs |
| `@tauri-apps/plugin-fs` | File system access |
| `@tauri-apps/plugin-dialog` | Native dialogs |
| `gray-matter` | YAML frontmatter parsing |
| `minisearch` | Full-text search |
| `slugify` | Title → filename conversion |

### Development
| Package | Purpose |
|---------|---------|
| `@tauri-apps/cli` | Build tooling |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Tauri learning curve | Start with JS API, Rust optional |
| Serialization edge cases | Comprehensive tests, keep localStorage backup |
| Large vault slow startup | Lazy loading, cached index |
| File conflicts | Backup before overwrite, conflict UI |
