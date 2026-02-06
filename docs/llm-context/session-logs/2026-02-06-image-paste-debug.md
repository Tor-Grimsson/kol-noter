# 2026-02-06: Image Paste Debugging Session

## Problem
Image paste (Ctrl+V) creates an attachment file in `_assets/` folder, but:
1. Image doesn't display in Preview mode
2. "Image not found: filename.png" shows instead
3. Attachment doesn't appear in note metadata

## Root Cause Found
**Stale closure in React state management**

The `saveAttachment` function had a closure that captured the original `notes` array reference. When `setNotes(newNotes)` was called, React scheduled the state update, but the closure in `saveAttachment` (and any functions defined in the same scope) still referenced the OLD `notes` array.

### Evidence
- `[NotesStore] After setNotes, note has attachment: false` - even though localStorage had the correct data
- The state update was scheduled but the closure wasn't updated
- Other components reading `notes` from the store context got stale data

## Solutions Attempted

### 1. Functional State Update
```typescript
setNotes(prevNotes => {
  const newNotes = prevNotes.map(n => {
    // ... update attachment
  });
  return newNotes;
});
```
- This correctly updates the state
- But closures in other functions still captured old `notes`

### 2. notesRef
Added a ref to track latest notes:
```typescript
const notesRef = useRef<Note[]>([]);
useEffect(() => {
  notesRef.current = notes;
}, [notes]);
```
- Helped with async operations
- But didn't fix the core re-render issue

### 3. Force Re-render in Index
```typescript
const [, setTick] = useState(0);
useEffect(() => {
  setTick(t => t + 1);
}, [notes]);
```
- Forced Index to re-render when notes changed
- But `getNote()` still returned stale data due to closure

## Key Learning
The store context creates closures at render time. Any function defined inside `NotesProvider` captures the `notes` variable from that render. When state updates, subsequent renders create NEW closures, but OLD functions still use OLD closures.

**Solution**: Use functional state updates and ensure consumers read from the current state reference, not cached closures.

## Files Modified
- `src/store/NotesContext.tsx` - store implementation
- `src/pages/Index.tsx` - main page consuming store
- `src/components/note-editor/standard/EditPane.tsx` - paste handler
- `src/components/note-editor/standard/PreviewPane.tsx` - preview renderer

## Test Note Added
Created `image-test-001` note in dummy data with hardcoded 1x1 PNG to verify preview rendering works:
```typescript
{
  id: "image-test-001",
  title: "Image Test",
  attachments: {
    "test-image.png": "data:image/png;base64,..."
  },
  content: "# Image Test\n\nHere is a test image:\n\n![[test-image.png]]"
}
```

This test note renders correctly (shows 1 green pixel), proving the preview component works. The issue is purely in the paste → save → state update flow.

## Status
**UNRESOLVED** - The core issue persists despite multiple debugging attempts. The state appears to update (localStorage verified), but components don't receive the updated data.
