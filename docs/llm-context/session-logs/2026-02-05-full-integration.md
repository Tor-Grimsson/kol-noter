# Session Log — 2026-02-05 (Full Integration Planning)

## Session Summary

Continued from Tauri architecture session. Fixed remaining issues with Tauri permissions and migration, then outlined plan for full filesystem integration.

## What Was Done

### 1. Fixed Tauri v2 Detection

**Problem:** App showed "Browser Storage" even when running in Tauri.

**Cause:** Tauri v2 uses `__TAURI_INTERNALS__` instead of `__TAURI__`.

**Fix:** Updated `src/lib/tauri-bridge.ts`:
```typescript
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' &&
    ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);
};
```

### 2. Fixed Filesystem Permissions

**Problem:** "forbidden path" error when creating vault.

**Cause:** Multiple issues with Tauri v2 fs plugin permissions:
1. Scopes needed explicit path patterns
2. Hidden files (starting with `.`) blocked by default on Unix

**Fix:** Updated `src-tauri/capabilities/default.json` with explicit scopes:
```json
{
  "identifier": "fs:allow-mkdir",
  "allow": [{ "path": "$HOME" }, { "path": "$HOME/**/*" }]
}
```

And added to `src-tauri/tauri.conf.json`:
```json
"plugins": {
  "fs": {
    "requireLiteralLeadingDot": false
  }
}
```

### 3. Fixed ID Map Initialization

**Problem:** Migration failed with "undefined is not an object (evaluating 'this.idMap.systems')".

**Cause:** `initializeVault()` created empty `{}` for ID map instead of proper structure.

**Fix:** Updated `src/lib/tauri-bridge.ts`:
```typescript
// Create empty ID map with proper structure
await writeFile(
  joinPath(configDir, VAULT_ID_MAP_FILE),
  JSON.stringify({ notes: {}, systems: {}, projects: {} }, null, 2)
);
```

### 4. Fixed Buffer Polyfill

**Problem:** Migration failed with "Can't find variable: Buffer".

**Cause:** `gray-matter` library uses Node.js `Buffer` which isn't available in browser/Tauri WebView.

**Fix:**
1. Installed `buffer` package
2. Added polyfill to `src/main.tsx`:
```typescript
import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;
```

### 5. Created Full Integration Plan

Created comprehensive plan for replacing localStorage with filesystem adapter:
- `docs/roadmap/full-integration/full-int-plan.md`

## Files Modified

| File | Change |
|------|--------|
| `src/lib/tauri-bridge.ts` | Fixed isTauri detection, ID map initialization |
| `src-tauri/capabilities/default.json` | Added explicit fs scopes for all operations |
| `src-tauri/tauri.conf.json` | Added `requireLiteralLeadingDot: false` |
| `src/main.tsx` | Added Buffer polyfill |
| `vite.config.ts` | Added global polyfill config |

## Files Created

| File | Purpose |
|------|---------|
| `docs/roadmap/full-integration/full-int-plan.md` | Full integration plan |
| `docs/llm-context/session-logs/2026-02-05-full-integration.md` | This session log |

## Current State

### Working
- Tauri detection (isTauri returns true in native app)
- Vault creation with proper folder structure
- Migration from localStorage to files
- Files created in vault during migration
- App remembers vault path

### Not Working (Pending Full Integration)
- New note creation doesn't write .md files
- Edits don't update .md files
- App still uses localStorage for day-to-day operations
- notesStore.tsx not connected to filesystem adapter

## Key Learnings

### Tauri v2 Permissions
- Must use explicit `allow` arrays with path patterns
- `$HOME/**/*` pattern (not `$HOME/**`) for recursive access
- `requireLiteralLeadingDot: false` needed for hidden folders
- Permissions go in `capabilities/*.json`, not `tauri.conf.json`

### Browser Polyfills
- `gray-matter` requires `Buffer` polyfill
- Import and attach to window before other imports
- Vite's `define: { global: 'globalThis' }` helps but not sufficient alone

## Next Steps

Full integration phases:
1. Create PersistenceContext
2. Refactor notesStore to use adapter
3. Wire up providers
4. Add loading states
5. Test file creation

## Architecture Overview

```
CURRENT:
┌─────────────┐     ┌──────────────┐
│ notesStore  │ ←→  │ localStorage │
└─────────────┘     └──────────────┘

AFTER FULL INTEGRATION:
┌─────────────┐     ┌────────────────────┐     ┌─────────────┐
│ notesStore  │ ←→  │ filesystemAdapter  │ ←→  │ .md files   │
└─────────────┘     └────────────────────┘     └─────────────┘
                              ↓ (fallback)
                    ┌────────────────────┐
                    │ localStorageAdapter│
                    └────────────────────┘
```

## Commands Reference

```bash
# Run Tauri dev (requires Rust in PATH)
export PATH="$HOME/.cargo/bin:$PATH" && npm run tauri:dev

# Build DMG
export PATH="$HOME/.cargo/bin:$PATH" && npm run tauri:build
```
