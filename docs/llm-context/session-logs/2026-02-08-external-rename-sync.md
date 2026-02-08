# 2026-02-08: External .md Rename Sync

## Problem
When user renames a `.md` file in Finder, the app title doesn't update because:
1. No watcher callback was subscribed — `VaultProvider` starts the file watcher but nobody handled events.
2. Title comes from `# heading` inside the file, not the filename. A pure rename (no content change) wouldn't update the title.

## Changes

### 1. `src/lib/serialization/note-serializer.ts`
- Added `deslugify()` private static helper: converts `my-cool-note` → `My Cool Note`
- Added optional `filename?: string` param to `deserialize()`
- All three editor type branches now fall back to `deslugify(filename)` when no `# heading` found

### 2. `src/lib/persistence/filesystem-adapter.ts`
- `loadNotesFromDirectory()` now passes `removeExtension(entry.name)` to `NoteSerializer.deserialize()`

### 3. `src/store/NotesContext.tsx`
- Added `useEffect` subscribing to `onFileChange()` from the watcher module
- On any external change: full reload from disk → `fullReindex` SQLite → `invalidateQueries()` to refresh UI
- Proper cleanup: stores unsubscribe fn returned by `onFileChange()` and calls it on unmount

## Design Decisions
- **# heading is primary title**, filename is only a fallback when no heading found
- Full reload on any external change (simple, correct — rename is a delete+create pair and idMap needs rebuilding)
- Used `onFileChange()` directly (returns unsub fn) instead of `fileWatcher.subscribe()` (doesn't return unsub fn)
