# Full Integration Plan: File-Based Persistence

> Transform KOL-Noter from localStorage-backed state to filesystem-backed state, making markdown files the source of truth.

## Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Create persistence context & hooks | ✅ Done |
| 2 | Refactor notesStore to use adapter | ✅ Done |
| 3 | Wire up VaultProvider with NotesProvider | ✅ Done |
| 4 | Add loading states | Pending |
| 5 | Test & verify file creation | Pending |

---

## Current State

### How It Works Now
```
React State ←→ localStorage (via useLocalStorage hook)
```

- `notesStore.tsx` uses `useLocalStorage` hooks for `systems`, `notes`, `trash`
- All CRUD operations directly manipulate state
- State auto-persists to localStorage synchronously
- Migration can export to files, but day-to-day operations stay in localStorage

### Problem
- Notes are not saved as markdown files during normal use
- Files only created during one-time migration
- App doesn't read from files on startup

---

## Target State

### How It Should Work
```
Filesystem (.md files)
       ↓ Load on startup
   React State
       ↓ Save on mutation
Filesystem (.md files)
```

- On app load: Read systems/projects/notes from vault folder
- On create/update: Write markdown file immediately
- On delete: Move to trash folder
- localStorage only used as fallback when running in browser (non-Tauri)

---

## Architecture

### Key Components

| Component | Role |
|-----------|------|
| `VaultProvider` | Manages vault path, initialization |
| `NotesProvider` | Manages app state (systems, notes, trash) |
| `filesystemAdapter` | Reads/writes files via Tauri |
| `localStorageAdapter` | Fallback for browser mode |

### Data Flow

```
App Start
    ↓
VaultProvider initializes
    ↓
Check: isTauri() && vaultPath exists?
    ↓ YES                    ↓ NO
filesystemAdapter      localStorageAdapter
    ↓                        ↓
loadAll() → systems, notes, trash
    ↓
NotesProvider receives initial data
    ↓
User creates/edits note
    ↓
adapter.saveNote(note)
    ↓
Update React state
```

---

## Phase 1: Create Persistence Context

### Goal
Create a React context that provides the active persistence adapter to the entire app.

### Tasks
- [x] Create `PersistenceContext` with adapter instance
- [x] Create `usePersistence` hook to access adapter
- [x] Expose `isFilesystem`, `isLoading`, `error` states

### Files Created/Modified
- `src/components/VaultProvider.tsx`
- `src/hooks/usePersistence.ts`
- `src/lib/persistence/filesystem-adapter.ts`
- `src/lib/persistence/localStorage-adapter.ts`
- `src/lib/persistence/types.ts`
- `src/lib/serialization/note-serializer.ts`

---

## Phase 2: Refactor notesStore

### Goal
Replace `useLocalStorage` with adapter-backed state management.

### Tasks
- [x] Replace `useLocalStorage` hooks with `useState`
- [x] Add `useEffect` to load initial data from adapter
- [x] Make mutation functions async
- [x] Call adapter methods before updating state
- [x] Handle both filesystem and localStorage modes

### Functions Updated
All ~35 mutation functions in `notesStore.tsx` now call filesystem adapter:
- System operations: updateSystemMetrics, updateSystemColorIcon, add/removeSystemAttachment, add/removeSystemPhoto, add/removeSystemVoiceRecording, add/remove/updateSystemLink, updateSystemDetailNotes, add/removeSystemTag
- Project operations: updateProjectMetrics, updateProjectColorIcon, add/removeProjectAttachment, add/removeProjectPhoto, add/removeProjectVoiceRecording, add/remove/updateProjectLink, updateProjectDetailNotes, add/removeProjectTag
- Note operations: updateNoteMetrics, add/removeNotePhoto, add/removeNoteVoiceRecording, add/remove/updateNoteLink, add/remove/renameNoteTag, updateNoteCustomType, updateNoteDetailNotes

### Key Changes

```typescript
// BEFORE (sync, localStorage)
const [notes, setNotes] = useLocalStorage<Note[]>('kol-noter-notes', []);

const addNote = (...) => {
  const newNote = { ... };
  setNotes([newNote, ...notes]); // Auto-saves to localStorage
  return newNote;
};

// AFTER (async, adapter)
const [notes, setNotes] = useState<Note[]>([]);
const { adapter, isFilesystem } = usePersistence();

const addNote = async (...) => {
  const newNote = { ... };
  if (isFilesystem) {
    await adapter.saveNote(newNote); // Write .md file
  }
  setNotes([newNote, ...notes]);
  return newNote;
};
```

### Files to Modify
- `src/store/notesStore.tsx`

---

## Phase 3: Wire Up Providers

### Goal
Ensure VaultProvider and NotesProvider work together correctly.

### Tasks
- [x] Pass vault state from VaultProvider to NotesProvider
- [x] NotesProvider waits for vault to be ready before loading
- [x] Handle mode switching (browser ↔ filesystem)

### Provider Hierarchy
```tsx
<VaultProvider>           // Manages vault path
  <NotesProvider>         // Uses adapter based on vault state
    <App />
  </NotesProvider>
</VaultProvider>
```

### Files to Modify
- `src/App.tsx`
- `src/store/notesStore.tsx`
- `src/components/VaultProvider.tsx`

---

## Phase 4: Add Loading States

### Goal
Show appropriate UI while data loads from filesystem.

### Tasks
- [ ] Add loading state to NotesProvider
- [ ] Show skeleton loaders in sidebar/notes list
- [ ] Handle empty vault (new user) vs populated vault

### Files to Modify
- `src/store/notesStore.tsx`
- `src/pages/Index.tsx` (conditionally show loading)

---

## Phase 5: Test & Verify

### Goal
Confirm files are created/updated/deleted correctly.

### Test Cases
- [ ] Create new note → .md file appears in vault
- [ ] Edit note → .md file content updates
- [ ] Delete note → file moves to .kol-noter/trash
- [ ] Create system → folder created with _system.md
- [ ] Create project → subfolder created with _project.md
- [ ] Restart app → all data loads from files
- [ ] Run in browser (no Tauri) → falls back to localStorage

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data loss during refactor | Keep localStorage as fallback, don't delete it |
| Async race conditions | Use proper loading states, disable UI during saves |
| File write failures | Catch errors, show user-friendly messages |
| Large vaults slow to load | Future: lazy loading, but not for MVP |

---

## Dependencies

Already installed and working:
- `@tauri-apps/plugin-fs` - File system access
- `@tauri-apps/plugin-dialog` - Folder picker
- `gray-matter` - YAML frontmatter parsing
- `buffer` - Polyfill for gray-matter

---

## Success Criteria

1. Create a note in the app → See `.md` file in Finder
2. Edit the file in VS Code → Changes appear in app (after reload)
3. Delete note → File moves to trash folder
4. Close and reopen app → All notes persist
5. Run `npm run dev` in browser → Still works with localStorage
