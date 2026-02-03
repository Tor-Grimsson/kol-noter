# Preferences — KOL-Noter

> Owner's coding style and conventions. AI assistants should follow these.

## General

- **Experience Level:** Familiar with React/JSX, new to TypeScript
- **Preferred Complexity:** Keep it simple, avoid over-engineering
- **Communication Style:** Casual, direct

## TypeScript Preferences

- Use simple types, avoid complex generics
- `any` is acceptable when types get complicated
- Don't spend time perfecting type definitions
- Inline types preferred over separate interface files (for now)

```tsx
// Preferred: simple and readable
const handleClick = (item: any) => { ... }

// Avoid: overly complex
const handleClick = <T extends BaseItem & { id: string }>(item: T) => { ... }
```

## React Patterns

- Functional components only
- useState for local state
- Keep components focused — split when they get long
- Props destructuring in function signature

```tsx
// Preferred
const Button = ({ label, onClick }) => {
  return <button onClick={onClick}>{label}</button>
}

// Avoid
const Button = (props) => {
  return <button onClick={props.onClick}>{props.label}</button>
}
```

## Naming Conventions

- **Components:** PascalCase (`NoteCard.tsx`)
- **Hooks:** camelCase with `use` prefix (`useToast.ts`)
- **Utilities:** camelCase (`utils.ts`)
- **Constants:** SCREAMING_SNAKE_CASE for true constants
- **Variables/Functions:** camelCase

## File Organization

- One component per file (usually)
- Related components can share a file if small
- Keep imports organized: React, external libs, internal modules, styles

## Comments

- Only when logic isn't obvious
- No redundant comments explaining obvious code
- TODO comments are fine for future work

## CSS/Styling

- Tailwind utility classes preferred
- Use existing design tokens from shadcn/ui
- Avoid inline style objects unless dynamic

## Git

- Descriptive commit messages
- Small, focused commits when possible
