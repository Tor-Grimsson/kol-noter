# Session: Sidebar project highlight persistence fix

**Date:** 2026-02-08
**Status:** Complete

## Problem

When clicking "Add Note" in the **OverviewProject** detail view, the new note opened in the editor but the **project stayed highlighted** in the sidebar. The sidebar context menu "Create Note" worked fine because it directly clears local state.

## Root Cause

In `src/components/app-shell/ExplorerSidebar.tsx`, the `overviewTarget` useEffect had an early return when `overviewTarget` was `null`:

```tsx
if (!overviewTarget) return;
```

This meant when `Index.tsx` set `overviewTarget = null` (after note creation), the local sidebar state (`selectedSystemId`, `selectedProjectId`) was never cleared, so the project remained highlighted.

## Fix

Replaced the early return with a branch that clears local selection state before returning:

```tsx
if (!overviewTarget) {
  setSelectedSystemId(null);
  setSelectedProjectId(undefined);
  return;
}
```

## Files Changed

- `src/components/app-shell/ExplorerSidebar.tsx` — clear local selection state when `overviewTarget` becomes null
