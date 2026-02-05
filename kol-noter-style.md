# Kol-Noter Design System

## Typography

### Primary Font
- **Font Family**: JetBrains Mono
- **Weights**: 400 (Regular), 500 (Medium), 700 (Bold)
- **Styles**: Normal, Italic, Bold Italic, Medium Italic
- **Usage**: Applied to all text elements by default

### Font Sizes
| Token | Size | Usage |
|-------|------|-------|
| `text-[10px]` | 10px | Labels, section headers, metadata |
| `text-xs` | 12px | Values, inputs, content |
| `text-sm` | 14px | Body text |
| `text-base` | 16px | Standard body |
| `text-lg` | 18px | Section titles |
| `text-xl` | 20px | Page titles |
| `text-2xl` | 24px | Major headings |

## Color Palette

### Tag/Note Colors
| Name | Hex | Text Color (on light) | Text Color (on dark) |
|------|-----|----------------------|---------------------|
| Blue | `#49a0a2` | Black | White |
| Green | `#66a44c` | Black | White |
| Yellow | `#ffe32e` | Black | White |
| Red | `#ce4646` | White | White |
| Orange | `#db8000` | Black | White |
| Purple | `#9437ff` | White | White |
| Warm | `#d0d79d` | Black | White |
| Dark | `#121215` | White | White |

### Surface Colors
| Token | HSL | Usage |
|-------|-----|-------|
| `--background` | 240 8% 7% | Main app background |
| `--card` | 240 6% 10% | Card backgrounds |
| `--sidebar-bg` | 240 10% 5% | Sidebar background |
| `--editor-bg` | 240 7% 9% | Editor panel |
| `--list-bg` | 240 6% 8% | List panel |
| `--input` | 240 6% 12% | Input field background |
| `--cell` | 240 6% 14% | Data cell background (`#1e1e24`) |

### Accent Colors
| Token | HSL | Usage |
|-------|-----|-------|
| `--primary` | 0 0% 100% | Primary buttons (white) |
| `--primary-foreground` | 0 0% 0% | Primary button text (black) |
| `--secondary` | 240 5% 15% | Secondary elements |
| `--accent` | 240 5% 18% | Accent highlights |
| `--muted` | 240 5% 18% | Muted backgrounds |
| `--muted-foreground` | 240 5% 64% | Muted text |

### Semantic Colors
| Token | HSL | Usage |
|-------|-----|-------|
| `--success` | 142 76% 56% | Completed items |
| `--warning` | 38 92% 50% | Important items |
| `--destructive` | 0 72% 51% | Delete actions |

## Border Radius

### Rules
- **4px (0.25rem)**: All cells, inputs, buttons, cards, badges
- **Full (9999px)**: Tags/pills ONLY

### CSS Classes
```css
.rounded-[4px]  /* Standard radius - USE EVERYWHERE except tags */
.rounded-full    /* Pill shape - TAGS ONLY */
```

## Spacing

### Grid Gaps
| Token | Value | Usage |
|-------|-------|-------|
| `gap-x-4` | 1rem (16px) | Grid column gap |
| `gap-y-3` | 0.75rem (12px) | Grid row gap |

### Padding
| Token | Value | Usage |
|-------|-------|-------|
| `p-2` | 0.5rem (8px) | Cell padding |
| `p-1.5` | 0.375rem (6px) | List item padding |

## Icon Sizes
| Token | Value | Usage |
|-------|-------|-------|
| `w-3 h-3` | 12px | All icons in headers and cells |

## Component Patterns

### Fixed Height Rule
All interactive elements align to **h-6 (24px)** height for visual consistency:
- Inputs
- Badges
- Action buttons
- Cells
- Link items

This creates a clean horizontal rhythm when elements appear on the same row.

### Section Width
Form sections and panels use `max-w-lg` (512px) for readable content width.

```html
<div class="max-w-lg space-y-4">
  <!-- Section content -->
</div>
```

### Data Cell
```html
<div class="bg-[#1e1e24] p-2 rounded-[4px]">
  <span class="text-[10px] text-muted-foreground">Label</span>
  <span class="text-xs text-foreground">Value</span>
</div>
```

### Section Header
SectionHeader component has built-in `mb-2` for spacing when content follows.

```html
<div class="text-[10px] font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-between mb-2">
  <span class="flex items-center gap-2">
    <Icon class="w-3 h-3" />
    TITLE
  </span>
  <Badge variant="outline">Action</Badge>
</div>
```

**Stacking multiple headers**: Override margin with `className="mb-0"` and use `space-y-2`:
```html
<div class="space-y-2">
  <SectionHeader title="Files" className="mb-0" />
  <SectionHeader title="Photos" className="mb-0" />
</div>
```

### Preview Toggle
Use Eye/EyeOff icons to toggle between file list and image preview views.

```html
<button class="p-1 hover:bg-white/5 rounded" title="Show preview">
  <Eye class="w-3 h-3 text-muted-foreground" />   <!-- Preview off -->
  <EyeOff class="w-3 h-3 text-muted-foreground" /> <!-- Preview on -->
</button>
```

### Input Field
Inputs have invisible borders by default - borders only appear on hover/focus for a cleaner look.

```html
<input
  type="text"
  class="h-6 px-2 rounded-[4px] bg-[#1e1e24] border border-transparent text-xs text-foreground placeholder:text-muted-foreground/50 hover:border-white/10 focus:outline-none focus:border-white/15"
/>
```

### Labeled Input
Use `LabeledInput` component for form fields with labels.

```html
<div>
  <label class="text-[10px] text-muted-foreground block mb-1">Label</label>
  <input class="w-full h-6 px-2 rounded-[4px] bg-[#1e1e24] border border-transparent text-xs hover:border-white/10 focus:border-white/15" />
</div>
```

### Textarea
Same border behavior as inputs - transparent by default, visible on hover/focus.

```html
<textarea class="min-h-[80px] w-full rounded-[4px] bg-[#1e1e24] border border-transparent p-2 text-xs placeholder:text-muted-foreground/50 hover:border-white/10 focus:outline-none focus:border-white/15 resize-none" />
```

### Inline Add Pattern
Input + Badge action button with `gap-x-4` spacing. Use `Badge variant="outline"` for add actions, not Button.

```html
<div class="flex items-end gap-x-4">
  <LabeledInput label="Add Tag" ... class="flex-1" />
  <Badge variant="outline" class="h-6 px-2 cursor-pointer hover:bg-white/5">
    <Plus class="w-3 h-3 mr-1" />Add
  </Badge>
</div>
```

### Tag/Pill
```html
<span class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium" style="background: #color20; color: #color; border: transparent;">
  #label
</span>
```

### Button Variants
| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| `default` | White (`#fff`) | Black | None |
| `outline` | `#1e1e24` | White | `white/10` |
| `secondary` | HSL secondary | White | None |
| `ghost` | Transparent | White | None |
| `destructive` | Red | White | None |

### Link Item
```html
<div class="flex items-center gap-2 h-6 px-2 rounded-[4px] bg-[#1e1e24] text-xs hover:bg-white/5">
  <LinkIcon class="w-3 h-3 shrink-0 text-muted-foreground" />
  <span class="truncate">link-url.com</span>
</div>
```

### Contact Card (Compact)
Editable contact form with avatar, inline name/title, and detail fields.

```html
<div class="space-y-2">
  <!-- Header: Avatar + Name/Title + Delete -->
  <div class="flex items-center gap-2">
    <div class="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-medium text-black">
      JD
    </div>
    <div class="flex flex-col min-w-0 flex-1">
      <input class="text-xs font-medium bg-transparent border-none p-0" placeholder="Name" />
      <input class="text-[10px] text-muted-foreground bg-transparent border-none p-0" placeholder="Title" />
    </div>
    <button class="p-1 hover:bg-white/10 rounded text-white/30 hover:text-white/50">
      <X class="w-3 h-3" />
    </button>
  </div>
  <!-- Detail fields -->
  <div class="grid grid-cols-2 gap-x-4 gap-y-2">
    <LabeledInput label="Email" ... />
    <LabeledInput label="Phone" ... />
    <LabeledInput label="Socials" ... class="col-span-2" />
  </div>
</div>
```

**Delete button style**: Use `text-white/30 hover:text-white/50`, not red, for subtle delete actions in compact views.

## Focus States

### Focus Ring
```css
*:focus-visible {
  outline: 2px solid hsl(0 0% 100% / 0.15);
  outline-offset: 2px;
}
```

## Transitions
- **Smooth**: `all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`
- **Bounce**: `all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)`

## File Structure
```
src/
├── components/
│   ├── ui-elements/
│   │   ├── atoms/          # Primitive components
│   │   │   ├── Badge.tsx
│   │   │   ├── Tag.tsx
│   │   │   ├── SectionHeader.tsx
│   │   │   └── LabeledInput.tsx
│   │   └── molecules/       # Composite components
│   │       ├── MediaItem.tsx
│   │       └── ContactCard.tsx
│   └── detail-view/
│       └── sections/       # Organism components
│           ├── MetadataSection.tsx
│           ├── MetricsSection.tsx
│           ├── MediaSection.tsx
│           └── ConnectionsSection.tsx
└── index.css               # Design system tokens
```

## Design Principles

1. **Consistency**: Use predefined tokens, never hardcode values
2. **Hierarchy**: Labels are always `text-[10px]`, values are `text-xs`
3. **Spacing**: 4px grid, 8px base unit
4. **Radius**: 4px everywhere, full only for tags
5. **Font**: JetBrains Mono everywhere
6. **Focus**: White 15% ring, no yellow
7. **Fixed height**: All interactive elements h-6 (24px) for alignment
8. **Invisible borders**: Inputs/textareas use transparent borders, visible only on hover/focus
9. **Section width**: max-w-lg (512px) for form content
10. **Subtle actions**: Use white/30 for secondary delete buttons, not red
