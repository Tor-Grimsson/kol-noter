# 2026-02-06: NotesContext Rename

## Summary
Renamed `notesStore.tsx` to `NotesContext.tsx` (PascalCase convention) while keeping the `store/` folder.

## Changes

### File Rename
- `src/store/notesStore.tsx` → `src/store/NotesContext.tsx`

### Import Updates (28 files)
Updated all imports from `@/store/notesStore` to `@/store/NotesContext`:

**Pages (3)**
- `src/pages/Trash.tsx`
- `src/pages/Index.tsx`
- `src/pages/component-test.tsx`

**App Shell (1)**
- `src/components/app-shell/UnifiedSidebar.tsx`

**Components (16)**
- `src/components/note-browsing/NotesList.tsx`
- `src/components/note-editor/modular/BlockEditor.tsx`
- `src/components/note-editor/visual/VisualEditor.tsx`
- `src/components/overviews/OverviewRoot.tsx`
- `src/components/overviews/OverviewSystem.tsx`
- `src/components/overviews/OverviewProject.tsx`
- `src/components/metadata/MetadataRoot.tsx`
- `src/components/metadata/MetadataSystem.tsx`
- `src/components/metadata/MetadataProject.tsx`
- `src/components/metadata/MetadataNote.tsx`
- `src/components/ui-elements/atoms/Tag.tsx`
- `src/components/metadata/sections/SectionConnections.tsx`
- `src/components/metadata/sections/SectionMetrics.tsx`
- `src/components/metadata/sections/SectionMedia.tsx`
- `src/components/metadata/sections/SectionMetadata.tsx`

**Library Files (7)**
- `src/hooks/useSearch.ts`
- `src/lib/migration/exporter.ts`
- `src/lib/search/search-index.ts`
- `src/lib/serialization/note-serializer.ts`
- `src/lib/persistence/types.ts`
- `src/lib/persistence/localStorage-adapter.ts`
- `src/lib/persistence/filesystem-adapter.ts`

**App Entry (1)**
- `src/App.tsx`

**Documentation (1)**
- `docs/documentation/1.0-project-conventions.md`

## Verification
- Build passes: `npm run build` successful (3025 modules transformed)
