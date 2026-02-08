# 2026-02-08: Fix missing sql:allow-execute capability

## Problem
Vault data never loaded from disk. App showed "Loading your notes..." then empty state. DevTools console error:
```
sql.execute not allowed. Permissions associated with this command: sql:allow-execute
```

## Root Cause
`src-tauri/capabilities/default.json` only had `"sql:default"`, which grants `allow-close`, `allow-load`, `allow-select` — but NOT `allow-execute`. Every `db.execute()` call failed (CREATE TABLE, INSERT, UPDATE, DELETE), so:
1. SQLite schema never created (CREATE TABLE failed)
2. `fullReindex()` INSERT calls failed → SQLite stayed empty
3. React Query hooks SELECT from empty tables → UI showed no data
4. Persist operations also failed → new items not saved

## Fix
Added `"sql:allow-execute"` to the permissions array in `src-tauri/capabilities/default.json`.

One-line change.

## Files Changed
- `src-tauri/capabilities/default.json` — added `"sql:allow-execute"` permission

## Verification
- `cargo check` passes
- App loads vault data correctly on launch
