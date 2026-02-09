# Overview Table Pattern Refactor

## Date: 2026-02-09

## Context
Refactored overview tables (Root, System, Project) to use consistent inline editing pattern.

## Changes

### Component Variants Added

#### DropdownSelect (`src/components/ui-elements/molecules/DropdownSelect.tsx`)
- Added `variant` prop with options: `"default" | "table" | "filter"`
- `variant="table"`: Simple text button that shows dropdown on click, chevron appears on hover
- `variant="filter"`: Used for filter inputs in headers

#### LabeledInput (`src/components/ui-elements/atoms/LabeledInput.tsx`)
- Added `variant` prop with options: `"default" | "table" | "filter"`
- `variant="table"`: Plain text input, no label, transparent background
- `variant="filter"`: h-8, pl-3 padding, dark bg, used for Filter inputs

### Overview Files Updated

#### OverviewRoot (`src/components/overviews/OverviewRoot.tsx`)
- Name column: Icon (clickable) + name with color
- Health: DropdownSelect (variant="table")
- Priority: DropdownSelect (variant="table")
- Lead: LabeledInput (variant="table")
- TargetDate: Popover with Calendar, formatted as "MMM d, yyyy"
- Status: DropdownSelect (variant="table")
- Filter input: LabeledInput (variant="filter")

#### OverviewSystem (`src/components/overviews/OverviewSystem.tsx`)
- Same pattern applied for projects

#### OverviewProject (`src/components/overviews/OverviewProject.tsx`)
- Same pattern applied for notes

### Pattern Elements
- Removed row hover highlight
- Click on container deselects row
- Row click uses stopPropagation to prevent container deselect
- Icons are clickable for navigation (system → project → note)
- Target dates formatted as "MMM d, yyyy" (e.g., "Feb 26, 2026")

## Files Modified
- `src/components/ui-elements/molecules/DropdownSelect.tsx`
- `src/components/ui-elements/atoms/LabeledInput.tsx`
- `src/components/overviews/OverviewRoot.tsx`
- `src/components/overviews/OverviewSystem.tsx`
- `src/components/overviews/OverviewProject.tsx`
