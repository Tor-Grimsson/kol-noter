# Session: Image Preview Fix — convertFileSrc Resolution

**Date:** 2026-02-08
**Status:** Complete — verified working at runtime

## Problem

Pasted images land in `_assets/` and `![[filename]]` appears in markdown, but preview shows "Image not found" because:
- `NoteSerializer` never persists `attachments` to YAML frontmatter
- The in-memory `attachments` map (data URLs) is lost between renders/restarts
- Loading all images as base64 data URLs on startup is slow and memory-intensive

## Solution: Convention-Based Asset Resolution via `convertFileSrc()`

Instead of pre-loading data URLs, resolve `![[filename]]` references at render time using Tauri v2's `convertFileSrc()`, which converts a file path to an `http://asset.localhost/...` URL the webview can load directly from disk.

## Changes Made

### 1. `src-tauri/tauri.conf.json` — Asset protocol configuration
- `app.security.assetProtocol.enable: true` — activates `asset://` protocol
- `app.security.assetProtocol.scope: ["$HOME/**/*"]` — allows reading vault files
- Updated CSP to include `asset: http://asset.localhost` in `img-src` and `data: blob:` for paste fallback

**Important lesson:** `core:asset:default` does NOT exist as a Tauri v2 capability permission. The asset protocol is configured via `tauri.conf.json` `app.security.assetProtocol`, not via capabilities.

### 2. `src/lib/persistence/asset-resolver.ts` (new)
- `resolveAssetUrl(noteAssetBasePath, filename)` → calls `convertFileSrc()`
- `getNoteAssetBasePath(vaultPath, noteRelativePath)` → builds the absolute `_assets/` path

### 3. `src/components/note-editor/standard/PreviewPane.tsx`
- Added `noteAssetBasePath?: string` prop
- `ObsidianImage`: when `noteAssetBasePath` provided, uses `resolveAssetUrl()` (asset protocol)
- Falls back to `attachments[filename]` data URL (immediate paste), then `photos` array (legacy)
- `onError` handler tries fallbacks before showing "Image not found"

### 4. `src/components/note-editor/standard/index.tsx` (UnifiedMarkdownEditor)
- Added `noteAssetBasePath?: string` prop, passed through to PreviewPane

### 5. `src/pages/Index.tsx`
- Imports `useVault`, `getNoteAssetBasePath`, `filesystemAdapter`
- Computes `noteAssetBasePath` from vault context + filesystem adapter idMap
- Passes to UnifiedMarkdownEditor

### 6. `src/lib/persistence/filesystem-adapter.ts`
- Added `getNoteRelativePath(noteId)` public method to expose idMap lookup
- Replaced `readFileAsDataUrl` loop in `loadNotesFromDirectory` with lightweight filename scan (stores empty strings as placeholders — actual resolution happens via convertFileSrc at render time)

### 7. `src/store/NotesContext.tsx`
- No changes needed — `saveAttachment` already provides good optimistic data URL fallback for immediate paste preview

## Verification Checklist
- [x] `npx tsc --noEmit` — passes
- [x] `npx vite build` — passes
- [x] `cargo check` — passes
- [x] Runtime: `npm run tauri dev` → open note with `![[image]]` → image renders
- [x] Runtime: image logged in metadata
