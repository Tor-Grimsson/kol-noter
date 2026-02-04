# Auto-Extraction & Editable Metadata View Plan

## Problem Statement
The NoteDetailsView (flipped card/metadata view) is currently completely static with hardcoded placeholder data. It does not:
- Connect to actual note data from the store
- Auto-extract tags from `#tagname` patterns in note content
- Auto-extract URLs/links from note content
- Allow editing any section
- Support file uploads (photos, attachments, voice recordings)

## Requirements

### 1. Auto-Extraction from Note Content
| Pattern | Action |
|---------|--------|
| `#tagname` | Auto-extract and add to note's tags array |
| `https://...` or `http://...` | Auto-extract and show in Saved Links |

### 2. Editable Sections in NoteDetailsView

| Section | Functionality |
|---------|---------------|
| **Notes** | Editable textarea for additional comments |
| **Tags** | Display all tags (manual + auto-extracted). Right-click menu: Change color, Rename, Remove from note |
| **Saved Links** | Display extracted + manual links. Add link button. @mention support. Delete link. |
| **Voice Recordings** | Upload audio file, Download, Delete |
| **Photos** | Upload image, View, Download, Delete |
| **Attachments** | Upload file, Download, Delete |
| **Metadata** | Created/Modified dates (read-only), Type (editable dropdown) |

---

## Implementation Plan

### Phase 1: Update Data Model in `notesStore.tsx`

**Add new fields to Note interface:**
```typescript
export interface Note {
  // ... existing fields ...

  // Additional notes/comments (editable text in metadata view)
  detailNotes?: string;

  // Saved links (manual + auto-extracted flag)
  links?: NoteLink[];

  // Voice recordings
  voiceRecordings?: VoiceRecording[];

  // Photos (separate from general attachments)
  photos?: NotePhoto[];

  // Custom metadata fields
  customType?: string; // "Work Document", "Personal", etc.
}

export interface NoteLink {
  id: string;
  url: string;
  title?: string;
  addedAt: number;
  autoExtracted: boolean; // true if extracted from content
}

export interface VoiceRecording {
  id: string;
  name: string;
  dataUrl: string;
  duration?: string;
  addedAt: number;
}

export interface NotePhoto {
  id: string;
  name: string;
  dataUrl: string;
  addedAt: number;
}
```

**Add new store methods:**
```typescript
// Content extraction
extractTagsFromContent(noteId: string): string[];  // Already exists, enhance
extractLinksFromContent(noteId: string): string[]; // NEW
syncAutoExtractedData(noteId: string): void;       // NEW - syncs tags & links

// Note detail notes
updateNoteDetailNotes(noteId: string, text: string): void;

// Links management
addNoteLink(noteId: string, url: string, title?: string): void;
removeNoteLink(noteId: string, linkId: string): void;
updateNoteLink(noteId: string, linkId: string, updates: Partial<NoteLink>): void;

// Voice recordings
addVoiceRecording(noteId: string, name: string, dataUrl: string, duration?: string): void;
removeVoiceRecording(noteId: string, recordingId: string): void;
downloadVoiceRecording(noteId: string, recordingId: string): void; // trigger download

// Photos
addNotePhoto(noteId: string, name: string, dataUrl: string): void;
removeNotePhoto(noteId: string, photoId: string): void;

// Attachments (enhance existing)
removeAttachment(noteId: string, filename: string): void;

// Custom metadata
updateNoteCustomType(noteId: string, type: string): void;
```

---

### Phase 2: Auto-Sync Tags & Links on Content Change

**In `updateNoteContent()` method:**
1. After updating content, call `syncAutoExtractedData(noteId)`
2. `syncAutoExtractedData` does:
   - Extract `#tagname` patterns → merge with existing tags (don't duplicate)
   - Extract URL patterns → merge with existing links (mark `autoExtracted: true`)
   - Remove auto-extracted items that no longer exist in content

**URL Regex Pattern:**
```typescript
const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
```

**Tag Regex Pattern (already exists):**
```typescript
const tagRegex = /#(\w+)/g;
```

---

### Phase 3: Rewrite `NoteDetailsView.tsx`

**New Props:**
```typescript
interface NoteDetailsViewProps {
  noteId: string;
  onClose?: () => void;
}
```

**Connect to Store:**
- Use `useNotesStore()` to get note data and methods
- Display actual data instead of hardcoded placeholders

**Section Implementations:**

#### 3a. Notes Section
- `<Textarea>` component
- Value from `note.detailNotes`
- On blur/change → `updateNoteDetailNotes(noteId, text)`

#### 3b. Tags Section
- Display tags with colors from `note.tagColors`
- Each tag has context menu (right-click):
  - "Change Color" → color picker submenu
  - "Rename Tag" → inline edit mode
  - "Remove from Note" → removes tag from this note only
- "Add Tag" input at bottom

#### 3c. Saved Links Section
- Display `note.links` array
- Each link shows URL + title (editable) + delete button
- Auto-extracted links have subtle indicator
- "Add Link" button → input for URL
- Clicking link opens in new tab

#### 3d. Voice Recordings Section
- Display `note.voiceRecordings` array
- Each recording: name, duration, play button, download button, delete button
- "Upload Recording" button → file input (accept audio/*)
- Convert to base64 dataUrl for storage

#### 3e. Photos Section
- Grid display of `note.photos`
- Each photo: thumbnail, view (modal), download, delete
- "Upload Photo" button → file input (accept image/*)
- Convert to base64 dataUrl for storage

#### 3f. Attachments Section
- Display `note.attachments` (already exists)
- Each file: icon, name, size, download, delete
- "Upload File" button → file input
- Convert to base64 dataUrl for storage

#### 3g. Metadata Section
- Created: Display `note.createdAt` formatted (read-only)
- Modified: Display `note.updatedAt` formatted (read-only)
- Type: Dropdown select with options ["Work Document", "Personal", "Reference", "Meeting Notes", etc.]

---

### Phase 4: Update NoteCard Back Side

The small flipped card should also show real data:
- Show actual tags from note
- Show actual attachment count
- Show actual photo count
- Connect to store

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/store/notesStore.tsx` | Add interfaces, fields, methods |
| `src/components/NoteDetailsView.tsx` | Complete rewrite to connect to store |
| `src/components/NoteCard.tsx` | Update back side to use real data |
| `src/pages/Index.tsx` | Pass noteId to NoteDetailsView |

---

## Implementation Order

1. **Store updates** - Add data model and methods
2. **Auto-extraction logic** - Implement tag/link extraction
3. **NoteDetailsView rewrite** - Connect to store, make editable
4. **File upload utilities** - Handle photos/recordings/attachments
5. **NoteCard back side** - Use real data
6. **Testing** - Verify all interactions work

---

## Verification Checklist

- [ ] Typing `#tagging` in editor auto-creates tag visible in metadata view
- [ ] Typing a URL in editor auto-adds to Saved Links
- [ ] Notes section is editable (textarea)
- [ ] Tags: right-click shows color picker, rename, remove options
- [ ] Saved Links: can add/remove links manually
- [ ] Voice Recordings: can upload, play, download, delete
- [ ] Photos: can upload, view, download, delete
- [ ] Attachments: can upload, download, delete
- [ ] Metadata shows real created/modified dates
- [ ] Type field is editable dropdown
