# Codebase Reference — KOL-Noter

> Static architecture reference. Update when structure changes significantly.

## Directory Structure

```
kol-noter/
├── src/
│   ├── pages/                    # Route-level components
│   │   ├── Index.tsx             # Main editor view (home route: /)
│   │   ├── Projects.tsx          # Project table/timeline (/projects)
│   │   ├── ProjectView.tsx       # Project cards grid (/projects-view)
│   │   ├── Hierarchy.tsx         # System documentation (/hierarchy)
│   │   └── NotFound.tsx          # 404 page
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives (50+ components)
│   │   │
│   │   ├── BlockEditor.tsx       # Drag-drop block editor
│   │   ├── StandardEditor.tsx    # Markdown text editor
│   │   ├── VisualEditor.tsx      # Flowchart/diagram editor
│   │   ├── TypographyEditor.tsx  # Typography showcase
│   │   ├── Editor.tsx            # Editor type dispatcher
│   │   │
│   │   ├── UnifiedSidebar.tsx    # Main navigation sidebar
│   │   ├── NotesList.tsx         # Notes list panel
│   │   ├── NoteCard.tsx          # Flip card component
│   │   ├── NoteTabs.tsx          # Tab bar for notes
│   │   ├── Breadcrumbs.tsx       # Navigation breadcrumbs
│   │   │
│   │   ├── VoiceRecorder.tsx     # Audio recording
│   │   └── UserProfile.tsx       # User avatar/menu
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx        # Mobile viewport detection
│   │   └── use-toast.ts          # Toast notification hook
│   │
│   ├── lib/
│   │   └── utils.ts              # cn() class merge utility
│   │
│   ├── App.tsx                   # Router setup
│   ├── main.tsx                  # React DOM entry
│   └── index.css                 # Tailwind + CSS variables
│
├── public/                       # Static assets
├── vite.config.ts               # Vite config (port 8080)
├── tailwind.config.ts           # Tailwind theme
├── tsconfig.json                # TypeScript config
└── components.json              # shadcn/ui config
```

## Key Files Deep Dive

### `src/pages/Index.tsx`
Main view. Manages:
- Sidebar visibility state
- Notes list visibility
- Active note selection
- Editor type per tab
- Focus mode toggle

### `src/components/UnifiedSidebar.tsx`
Primary navigation. Features:
- 5-level hierarchy tree
- Resizable (56-480px)
- Search functionality
- System/Project filtering

### `src/components/BlockEditor.tsx`
Most complex editor. Features:
- @dnd-kit drag-drop
- Block types: heading, paragraph, code, list, image, section
- Table of contents generation
- Collapsible blocks
- 1-2 column layouts

## Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | Index | Main editor workspace |
| `/projects` | Projects | Table/timeline view |
| `/projects-view` | ProjectView | Card grid view |
| `/hierarchy` | Hierarchy | Documentation |
| `*` | NotFound | 404 |

## Data Flow

```
User selects in UnifiedSidebar
    ↓
Updates activeSystem/activeProject/activeNote state
    ↓
NotesList filters based on selection
    ↓
User clicks note → opens in NoteTabs
    ↓
Editor renders based on editorType state
```

## Styling System

### CSS Variables (src/index.css)
- `--background`, `--foreground` — base colors
- `--primary`, `--secondary` — accent colors
- `--sidebar-*` — sidebar-specific colors
- `--editor-*` — editor-specific colors

### Tailwind Extensions
- Custom colors mapped to CSS variables
- Animation utilities (fade-in, slide-in, scale-in)
- Dark mode: `darkMode: ["class"]`
