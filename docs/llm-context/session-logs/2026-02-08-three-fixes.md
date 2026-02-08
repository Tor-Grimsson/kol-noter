# Session: Three Fixes (Duplicate Metadata, Disk Rename, Frontmatter Serialization)

**Date:** 2026-02-08

## Changes

### Issue 1: Fix duplicate attachment from paste handler
- **`src/components/note-editor/standard/EditPane.tsx`** — Removed the `onSaveAttachment()` call from the paste handler. `addNotePhoto()` already writes the file to `_assets/` via `filesystemAdapter.saveAttachment()`. This prevents the pasted image from appearing in both "Files" and "Photos" metadata sections.

### Issue 3: Serialize photos/files in YAML frontmatter
- **`src/lib/persistence/types.ts`** — Added `photos?: string[]` and `files?: string[]` to `NoteFrontmatter` interface.
- **`src/lib/serialization/note-serializer.ts`** — Serialize: `photos` → `note.photos.map(p => p.name)`, `files` → `Object.keys(note.attachments)` minus photo filenames. Deserialize: reconstruct `Photo[]` and `attachments` dict from filename arrays with empty `dataUrl` (resolved at render time via `convertFileSrc`).
- **`src/lib/persistence/filesystem-adapter.ts`** — Updated `_assets` scan in `loadNotesFromDirectory` to only discover **unlisted** files not already in frontmatter, merging them into `note.attachments` as fallback.

### Issue 2: Rename files/folders on disk
- **`src/lib/persistence/filesystem-adapter.ts`** — Added three methods:
  - `renameSystem(systemId, newName)` — Renames system folder, updates all child project and note paths in idMap.
  - `renameProject(projectId, newName)` — Renames project folder, updates all child note paths in idMap.
  - `renameNote(noteId, newTitle)` — Renames `.md` file and `.visual.json` sidecar if present.
- **`src/store/NotesContext.tsx`** — Wired rename into `updateSystem`, `updateProject`, `updateNote`, and `updateNoteContent`. Rename completes before persist to ensure idMap is up to date.

## Verification
- `npx tsc --noEmit` — clean
- `npx vite build` — clean
