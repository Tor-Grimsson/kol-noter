# 2026-02-08: TipTap WYSIWYG Editor

## Problem
Standard note editor used a plain `<textarea>` for raw markdown. No visual formatting while editing — bold, italic, headings all just show as syntax characters. Toolbar buttons double-wrapped instead of toggling. No inline code button. Images only visible in preview mode.

## Solution
Replaced the textarea with a TipTap v2 WYSIWYG editor using `tiptap-markdown` for bidirectional markdown conversion.

## Changes

### New files
- `src/components/note-editor/standard/WysiwygPane.tsx` — TipTap editor component with:
  - StarterKit (bold, italic, code, headings, lists, blockquote, code block, history)
  - Image extension for inline images
  - Link extension
  - Placeholder extension
  - Markdown extension (tiptap-markdown) for md↔ProseMirror conversion
  - Obsidian `![[image]]` pre/post-processing (converts to standard img syntax for TipTap, restores on save)
  - Image paste handler ported from EditPane
- `src/components/note-editor/standard/wysiwyg-styles.css` — Typography matching PreviewPane styles

### Modified files
- `src/components/note-editor/standard/Toolbar.tsx` — New view mode system (wysiwyg/source/split), TipTap command integration with toggle state, inline code button
- `src/components/note-editor/standard/index.tsx` — Wires WysiwygPane as default, keeps EditPane for source mode, manages TipTap editor instance

### Kept files
- `EditPane.tsx` — retained as "source" view for raw markdown editing
- `PreviewPane.tsx` — no longer used by standard editor, kept for `Docs.tsx`

## Packages added
- `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`
- `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`
- `tiptap-markdown`

## View modes
- **WYSIWYG** (default, Eye icon): rich editing, headings/bold/italic rendered visually
- **Source** (FileCode icon): raw markdown textarea with line numbers
- **Split** (Columns icon): WYSIWYG + source side by side

## Architecture notes
- Content flow: markdown string → `obsidianToStandard()` → TipTap → `editor.storage.markdown.getMarkdown()` → `standardToObsidian()` → markdown string
- TipTap editor instance created in WysiwygPane, passed to parent via `onEditorReady` callback, then to Toolbar
- Toolbar uses `editor.chain().focus().toggle*().run()` for formatting, `editor.isActive()` for toggle state
- Image paste: ProseMirror `handlePaste` in editorProps, same timestamp filename logic as before
