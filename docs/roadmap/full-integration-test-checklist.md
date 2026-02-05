# Full Integration Test Checklist

## Phase 4-5: Loading States & File Creation Verification

### Pre-Flight Checklist
- [ ] Run `npm run tauri dev` to start the application
- [ ] Verify no TypeScript/compiler errors

---

## Test Case 1: Loading States

### Expected Behavior
1. App shows initial loader while vault initializes
2. After vault ready, shows skeleton loaders in sidebar and notes list
3. Data loads and skeletons disappear

### Verification Steps
1. Open app - should see "Loading KOL Noter..." spinner
2. After vault setup, should see sidebar skeleton → notes list skeleton
3. After data loads, actual content appears

---

## Test Case 2: Create New Note → File Creation

### Expected Behavior
- Creating a note should create a `.md` file in the vault folder

### Verification Steps
1. Click `+` button in Notes sidebar
2. Select note type (Standard/Modular/Visual)
3. New note appears in list
4. Open vault folder in file explorer
5. Verify file exists at: `vault/path/system-name/project-name/note-title.md`
6. Verify file contains YAML frontmatter + markdown content

---

## Test Case 3: Edit Note → File Updates

### Expected Behavior
- Editing a note should update the corresponding `.md` file

### Verification Steps
1. Open an existing note
2. Make changes to content
3. Save/close note
4. Open the `.md` file in external editor
5. Verify changes are reflected in file

---

## Test Case 4: Delete Note → Trash

### Expected Behavior
- Deleting a note should move the file to `.kol-noter/trash`

### Verification Steps
1. Select a note
2. Delete note (via card flip or context menu)
3. Note disappears from list
4. Check vault folder: `.kol-noter/trash/` directory
5. Verify `.md` file exists in trash folder

---

## Test Case 5: Create System → Folder Structure

### Expected Behavior
- Creating a system should create a folder with `_system.md`

### Verification Steps
1. Right-click on [Root] in sidebar
2. Create New System
3. Open vault folder
4. Verify new folder exists: `vault/path/system-name/`
5. Verify `_system.md` file exists in folder
6. Verify `_system.md` contains system metadata

---

## Test Case 6: Create Project → Subfolder Structure

### Expected Behavior
- Creating a project should create a subfolder with `_project.md`

### Verification Steps
1. Right-click on a system in sidebar
2. Create New Project
3. Open vault folder → system folder
4. Verify new subfolder exists: `vault/path/system-name/project-name/`
5. Verify `_project.md` file exists in subfolder
6. Verify `_project.md` contains project metadata

---

## Test Case 7: Persistence → Restart & Reload

### Expected Behavior
- All data should persist across app restarts

### Verification Steps
1. Create several notes/systems/projects
2. Close app completely
3. Reopen app with `npm run tauri dev`
4. Verify all data is loaded from files
5. Verify folder structure matches what was created

---

## Test Case 8: Browser Mode Fallback

### Expected Behavior
- Running in browser (no Tauri) should fall back to localStorage

### Verification Steps
1. Run `npm run dev` (not tauri)
2. App should load without vault setup
3. Create some notes
4. Refresh browser
5. Verify data persists in localStorage
6. Check browser DevTools → Application → LocalStorage

---

## File Structure Verification

After testing file creation, your vault folder should look like:

```
kol-noter-vault/
├── .kol-noter/
│   ├── trash/
│   │   └── deleted-note-id.md
│   └── config.json
├── Work/                          # System folder
│   ├── _system.md                 # System metadata
│   ├── Engineering/              # Project folder
│   │   ├── _project.md           # Project metadata
│   │   ├── Note Title 1.md       # Note files
│   │   └── Note Title 2.md
│   └── Product/
│       ├── _project.md
│       └── Note Title 3.md
└── Personal/
    ├── _system.md
    ├── Learning/
    │   ├── _project.md
    │   └── Note Title 4.md
    └── Note Title 5.md           # Notes at system root (if allowed)
```

---

## Expected File Format

### Note File (.md)
```markdown
---
id: note-uuid
title: Note Title
created: 2024-01-01T00:00:00.000Z
updated: 2024-01-01T00:00:00.000Z
tags: [tag1, tag2]
---

# Note Title

Content here...
```

### System File (_system.md)
```markdown
---
id: system-uuid
name: System Name
type: system
created: 2024-01-01T00:00:00.000Z
updated: 2024-01-01T00:00:00.000Z
---

# System Name

Optional description...
```

### Project File (_project.md)
```markdown
---
id: project-uuid
name: Project Name
type: project
systemId: system-uuid
created: 2024-01-01T00:00:00.000Z
updated: 2024-01-01T00:00:00.000Z
---

# Project Name

Optional description...
```

---

## Debug Commands

```bash
# View vault folder contents
ls -la /path/to/vault

# Watch for file changes
ls -la /path/to/vault | tail -f

# Check localStorage (in browser console)
localStorage.getItem('kol-noter-systems')
localStorage.getItem('kol-noter-notes')
```

---

## Known Issues / Edge Cases

- [ ] Long note titles may exceed filesystem filename limits
- [ ] Special characters in titles need sanitization
- [ ] Concurrent edits (multi-app) not supported
- [ ] File watcher may miss changes from external editors
