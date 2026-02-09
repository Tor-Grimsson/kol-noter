# 2026-02-08: Syntax Reveal Plugin & Image Focus

## Problem
The previous TipTap session left several issues:
1. CustomHeading React NodeView rendered `#` markers on a separate line (ReactNodeViewRenderer wraps in div)
2. The `#` marker didn't reactively show/hide — reading `editor.state.selection` in React render isn't reactive
3. Images weren't selectable/clickable
4. Editor content didn't fill its container
5. Note titles included raw markdown syntax (e.g. `**Bingo**` instead of `Bingo`)

## Solution

### Syntax Reveal — ProseMirror Decoration Plugin
Replaced the broken React NodeView (`CustomHeading.tsx` — deleted) with a ProseMirror plugin in `extensions/syntax-reveal-plugin.ts`. The plugin's `props.decorations(state)` runs on every state change, so it naturally reacts to cursor movement.

**Heading reveal:** Walks up from `selection.$from` to find if cursor is inside a `heading` node. If yes, places a `Decoration.widget` with `#`/`##`/etc. before the heading content.

**Inline mark reveal:** When cursor is inside bold, italic, underline, or inline code, shows the syntax characters (`**`, `*`, `<u></u>`, backticks) at the mark boundaries. Uses `findMarkRange()` to locate the contiguous range of a mark across multiple text nodes.

### Image Focus — Custom NodeView
Initial attempts used `Image.extend({ selectable: true })` which triggered ProseMirror's `NodeSelection`, causing the browser to highlight the entire editor (known ProseMirror/browser incompatibility with block-level node selections).

**Final approach:** Custom ProseMirror NodeView on the Image extension (defined inline in `WysiwygPane.tsx`):
- Renders a wrapper div containing an `<img>` and a hidden `<input>`
- **Click image** → shows the input with `![[filename.png]]`, yellow outline on image, cursor at end of input (unselected)
- **Edit input** → change filename to swap image, clear to delete
- **Blur / Enter** → hides input, applies changes (resolves new filename to URL)
- **Escape** → cancels without changes
- `stopEvent()` returns true while editing so ProseMirror doesn't intercept keyboard input
- No `NodeSelection` is ever created — avoids the browser selection bug entirely

Key detail: `requestAnimationFrame` after `input.focus()` to collapse selection, preventing browsers from auto-selecting input content.

### Title Extraction Fix
`NoteSerializer.extractTitleFromMarkdown()` now strips `**`, `*`, `__`, `_`, `~~`, and backtick syntax before returning the title.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `extensions/CustomHeading.tsx` | DELETED | Broken React NodeView approach |
| `extensions/syntax-reveal-plugin.ts` | CREATED | ProseMirror decoration plugin for heading `#` and inline mark syntax reveal |
| `WysiwygPane.tsx` | MODIFIED | Removed CustomHeading, added SyntaxReveal extension, custom Image NodeView with editable path input |
| `wysiwyg-styles.css` | MODIFIED | Padding fix, syntax-marker styles (inherit size, reset bold/italic/underline), image editing styles |
| `src/lib/serialization/note-serializer.ts` | MODIFIED | Strip markdown syntax from extracted title |

## Architecture Notes
- Syntax reveal uses widget decorations (`Decoration.widget`) — these are DOM elements injected at positions without wrapper divs
- Image focus is entirely self-contained in the NodeView — no plugin state, no NodeSelection, no decorations
- The `MARK_SYNTAX` map (`bold: ["**","**"]`, etc.) makes it easy to add more mark types
- Image NodeView closes over `noteAssetBasePathRef`, `attachmentsRef`, `photosRef` to resolve filenames to URLs
