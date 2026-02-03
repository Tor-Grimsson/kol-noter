# Memory — KOL-Noter

> Living document. Update this when discovering patterns, making decisions, or learning gotchas.

## Decisions Log

| Date | Decision | Reasoning |
|------|----------|-----------|
| 2026-02-03 | Keep TypeScript | Owner learning TS, better to adapt than convert 80+ files to JSX |
| 2026-02-03 | LLM context in `docs/llm-context/` | Clean organization, separate from code |
| 2026-02-03 | Local Storage for persistence | Simple start, no backend needed. Supabase planned for multi-device later |
| 2026-02-03 | React Context for state | Centralized store in `src/store/notesStore.tsx`, simpler than Redux |

## Discovered Patterns

### Component Patterns
- shadcn/ui components are in `src/components/ui/` — use these, don't reinvent
- Page components manage layout and state, delegate to feature components
- Editors are polymorphic — selected via `editorType` state

### Data Patterns
- Mock data is inline in components (no backend yet)
- 5-level hierarchy: System → Project → Note → Page → Section
- Each note can have different editor types per tab

### Styling Patterns
- Tailwind utility classes throughout
- CSS variables for theming (see `src/index.css`)
- Dark mode via class strategy
- Glass morphism: `backdrop-blur-sm`, translucent backgrounds

## Gotchas

- **None documented yet** — add issues as they're discovered

## TODO / Future Considerations

- [x] ~~Backend integration (currently all mock data)~~ → Local Storage done, Supabase later
- [x] ~~State management solution~~ → React Context store implemented
- [ ] Supabase migration for multi-device sync (owner has 3 computers)
- [ ] Authentication system

## Useful Commands

```bash
npm run dev      # Start dev server on port 8080
npm run build    # Production build
npm run lint     # Run ESLint
```
