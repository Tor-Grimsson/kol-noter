# 2026-02-08: SQLite Index Layer

## Problem
Stale closure bug in `NotesContext.tsx` (identified 2026-02-06, unresolved). 60+ methods closed over `notes[]`/`systems[]` arrays at render time. When state updated, old closures still referenced stale data. This prevented image paste from working — attachments were overwritten by stale state.

## Solution
Replaced React `useState` arrays with a SQLite index + React Query:
- **SQLite** (via `tauri-plugin-sql`) stores an index of all vault data
- **React Query** hooks SELECT from SQLite — always fresh, no closures over state
- **Writes** go through filesystem adapter → SQLite upsert → `queryClient.invalidateQueries()` → React Query refetches

No more shared mutable state in React = no more stale closures.

## Architecture
```
Markdown files on disk (source of truth)
    ↕ write/read
Filesystem Adapter (unchanged)
    ↕ index after write / bulk index on startup
SQLite index (.kol-noter/index.db)
    ↕ SELECT queries
React Query hooks (replace useState arrays)
    ↕ data
NotesContext (same interface, 60+ methods preserved)
    ↕
Components (no changes needed)
```

## Files Created
- `src/lib/db/schema.ts` — CREATE TABLE SQL (systems, projects, notes, trash, entity_tags)
- `src/lib/db/client.ts` — `getDb()` singleton, WAL mode, auto-creates schema
- `src/lib/db/indexer.ts` — upsert/delete helpers + `fullReindex()` for startup
- `src/lib/db/query-keys.ts` — React Query key factory
- `src/lib/db/hooks/useSystems.ts` — `useSystems()`, `useSystem(id)`
- `src/lib/db/hooks/useProjects.ts` — `useProjects(systemId)`, `useProject()`
- `src/lib/db/hooks/useNotes.ts` — `useNotes()`, `useNote(id)`, `useNotesByProject()`, `useNotesBySystem()`
- `src/lib/db/hooks/useTrash.ts` — `useTrash()`
- `src/lib/db/hooks/useTags.ts` — `useAggregatedTags(level, id)`
- `src/lib/db/index.ts` — barrel export

## Files Modified
- `src-tauri/Cargo.toml` — added `tauri-plugin-sql` with sqlite feature
- `src-tauri/src/lib.rs` — registered `.plugin(tauri_plugin_sql::Builder::new().build())`
- `src-tauri/capabilities/default.json` — added `sql:default` permission
- `package.json` — added `@tauri-apps/plugin-sql`
- `src/store/NotesContext.tsx` — rewritten (1,777 → 1,428 lines). Removed `useState` for systems/notes/trash, uses React Query hooks for reads, `persistSystem/persistProject/persistNote` helpers for writes
- `src/components/vault-system/VaultProvider.tsx` — calls `getDb()` + `fullReindex()` after vault init (on startup, select vault, create vault)

## Key Design Decisions
- **NotesStore interface unchanged** — all 60+ methods preserved, zero consumer changes
- **SQLite is a cache/index**, not source of truth — markdown files on disk remain authoritative
- **Startup**: `filesystemAdapter.loadAll()` → `fullReindex()` populates SQLite
- **Write flow**: filesystem first → SQLite upsert → invalidate React Query
- **No macOS disk permissions needed** — DB lives inside user-selected vault under $HOME
- `notesRef` kept for backward compat (consumers needing synchronous access)

## Verification
- `tsc --noEmit` — zero errors
- `vite build` — passes cleanly
- `cargo check` — compiles with tauri-plugin-sql

## Runtime Bug Fixes (session 2)

### Bug: Image paste shows "Image not found" in preview
**Root cause**: Race condition between concurrent note updates during paste. The paste handler calls `onChange(newContent)` → `updateNoteContent` → `persistNote` AND `onSaveAttachment` → `saveAttachment` simultaneously. Both read from the stale `notes` closure (same render cycle), make independent changes, and the last write clobbers the other:
- `persistNote` writes note with new content but NO attachments
- `saveAttachment` writes note with attachments but OLD content

Additionally, `NoteSerializer` never serialized/deserialized the `attachments` map, so after restart the map was always empty.

**Fixes applied**:
1. `saveAttachment` — uses updater function `(old) => old.map(...)` for optimistic update (reads from current cache, not stale `notes`). Async persist reads latest from cache before SQLite write.
2. `addNotePhoto` — same fix as saveAttachment.
3. `persistNote` — reads latest note from query cache before `upsertNote` to preserve concurrent attachment/photo updates.
4. `Index.tsx` `onAddPhoto` — removed redundant `saveAttachment` call (was writing file 3x).
5. `filesystem-adapter.ts` `loadNotesFromDirectory` — scans `_assets` directory on note load and populates `attachments` map with data URLs. Ensures attachments persist across restarts.

### Bug: File/folder rename doesn't update files on disk
**Status**: Pre-existing issue (not introduced by SQLite changes). `saveSystem`/`saveProject`/`saveNote` use cached folder/file names from idMap and never rename. `renamePath` exists in tauri-bridge.ts but is never called.

## Verification
- `tsc --noEmit` — zero errors
- `vite build` — passes cleanly
- `cargo check` — compiles with tauri-plugin-sql

## Status
**COMPLETE** — SQLite index layer + image paste race condition fixes. Ready for runtime testing (`npm run tauri dev`).
