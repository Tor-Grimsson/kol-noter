# Roadmap: Local-First Markdown App Architecture (Containerized)

## 1. Architecture Visualized

This diagram illustrates the "Sidecar" relationship between your local machine and the containerized app.


```

+-------------------------------------------------------+       +-------------------------------------------------------+
|            HOST MACHINE (Your Computer)               |       |                  DOCKER CONTAINER                     |
|                                                       |       |                                                       |
|   +-------------------+       +-------------------+   |       |   +---------------------+    +--------------------+   |
|   |                   |       |                   |   |       |   |                     |    |                    |   |
|   |   External Apps   |       |   Local Vault     |   |       |   |   Node.js Backend   |    |   React Frontend   |   |
|   | (Obsidian/Git/VS) |<----->|  (Markdown Files) |<==BIND===>|   (File System API) |<---|   (Web Interface)  |   |
|   |                   |       |                   |   | MOUNT |   |                     |    |                    |   |
|   +-------------------+       +-------------------+   |       |   +----------+----------+    +----------+---------+   |
|                                                       |       |              |                          ^             |
|                                                       |       |              v                          |             |
|                                                       |       |   +---------------------+               |             |
|                                                       |       |   |                     |               |             |
|                                                       |       |   |   Watcher / Index   |---------------|             |
|                                                       |       |   |                     |    WebSockets               |
|                                                       |       |   +---------------------+                             |
+-------------------------------------------------------+       +-------------------------------------------------------+

```

**Diagram Summary:** The architecture relies on a **Docker Bind Mount** to act as a bridge between the Host Machine and the Container. The **Local Vault** (your actual files on disk) acts as the single source of truth. External apps like Obsidian or VS Code edit these files directly. Inside the container, a **Node.js Backend** reads and writes to this mounted path using standard file system APIs. Crucially, a **Watcher** service detects changes made by those external tools and immediately pushes updates to the **React Frontend** via WebSockets, ensuring the browser interface never displays stale data.

**Strategic Reasoning:** The inclusion of external apps (Obsidian, Git) validates the **"No Vendor Lock-in"** philosophy. This architecture ensures your data is never trapped inside the custom application. It allows you to leverage existing mobile apps (e.g., Obsidian Mobile synced via iCloud) for on-the-go editing while using your custom Dockerized app for specialized desktop workflows. If the custom app is down or incomplete, the user can instantly fall back to standard tools without migration.

_*User note: Apps to look at: Logseq, SilverBullet, Foam (VS Code)_

## 2. Project Objective

**Goal:** Create a "Local-First" Knowledge Management System (KMS) that runs in a Docker container but feels like a native desktop app. **Core Philosophy:** "The File System is the Database." The app must read/write directly to a user's local disk, maintaining compatibility with external tools (Obsidian, Git, VS Code).

## 3. Architectural Pattern: The "Sidecar" Bridge

Since browsers (and by extension, the React frontend) cannot access the file system directly, we must implement a **Backend Bridge**.

### The Flow

`[React Frontend]` <---> `[Node.js API Bridge]` <---> `[Docker Volume Bind]` <---> `[Host File System]`

### Core Components (The "Missing" Pieces)

To make this performant and reliable, the following "Pro" components are mandatory:

1. **File Watcher (The "Pulse"):**
    
    - **Problem:** If you edit a file in VS Code/Obsidian, the web app won't know.
        
    - **Solution:** Implement `chokidar` in the Node.js backend to watch the vault directory. Push updates to the frontend via **WebSockets (Socket.io)** or Server-Sent Events (SSE).
        
2. **In-Memory Search Index:**
    
    - **Problem:** `grep` or iterating files on every search is too slow.
        
    - **Solution:** On container startup, scan all `.md` files and build an index using **FlexSearch** or **MiniSearch**. Keep this index in RAM and update it incrementally when `chokidar` detects changes.
        
3. **Atomic Writes:**
    
    - **Problem:** Writing to a file while Dropbox is syncing it can cause corruption.
        
    - **Solution:** Use `write-file-atomic` to ensure file integrity.
        

## 4. Implementation Options

### Option A: Docker + PWA (Recommended for "Containerized" Goal)

_Best balance of isolation and local access._

- **Stack:** Node.js (Express/Fastify) + React + Vite.
    
- **Deployment:** Docker Compose.
    
- **Browserless Feel:** Add `manifest.json` for PWA installation OR use Chrome App Mode (`--app=...`).
    

**Critical Docker Challenge: Permissions**

- **Risk:** Docker containers run as `root` by default. Files created by the app will be owned by `root` on your host machine, making them uneditable by you.
    
- **Fix:** passing `PUID` and `PGID` environment variables and using `usermod` in the Docker entrypoint to match the container user to the host user.
    

### Option B: Tauri (Alternative)

- _Discarded for this roadmap based on "Containerize" preference, but remains the superior choice for pure desktop performance._
    

## 5. Technical Specifications for Agent

### A. Data Structure Standard (Obsidian Compatibility)

- **Links:** Support WikiLinks `[[My Note]]`. Use a parser like `remark-wiki-link`.
    
- **Attachments:**
    
    - **Storage:** Store images in a relative `attachments/` subfolder or the root `assets/` folder.
        
    - **Reference:** Relative paths `![](../assets/image.png)`.
        
- **Frontmatter:** Use `gray-matter` to parse YAML headers without destroying them during edits.
    

### B. API Contract (Node.js Backend)

The backend is a thin translation layer.

- `GET /api/tree`: Returns nested JSON directory structure.
    
- `GET /api/file?path=...`: Returns raw content + parsed frontmatter.
    
- `POST /api/file`: Saves content (Atomic write).
    
- `POST /api/upload`: Handles multipart form data for images -> saves to `./assets`.
    
- `WS /socket`: Emits `file:change`, `file:unlink`, `file:add` events.
    

### C. Docker Compose Configuration (Template)

```
services:
  notes-app:
    build: .
    user: "${UID}:${GID}" # Critical for file permissions
    volumes:
      - ./my-local-vault:/app/data # The Bind Mount
    environment:
      - VAULT_ROOT=/app/data
      - CHOKIDAR_USEPOLLING=true # Often needed for Docker bind mounts across OS
    ports:
      - "3000:3000"
```

## 6. Implementation Roadmap (Step-by-Step)

### Phase 1: The "Humble" Bridge

1. **Scaffold Node.js Server:** Install `express`, `fs-extra`, `cors`.
    
2. **Mount Test:** Create a Dockerfile that mounts a folder and successfully reads `index.md`.
    
3. **Permission Check:** Verify files created inside Docker are editable on the host.
    

### Phase 2: The Frontend Connection

1. **Hydration:** React app fetches file tree on load.
    
2. **Routing:** Map URL routes to file paths (e.g., `localhost:3000/notes/ideas/start` -> loads `/data/ideas/start.md`).
    
3. **Editor:** Integrate a markdown editor (Monaco or specialized MD editor).
    

### Phase 3: The "Pro" Features

1. **Watcher:** Add `chokidar`. When a file changes on disk, the UI should auto-refresh (or show a "Content Updated" toast).
    
2. **Search:** Implement `MiniSearch`.
    
3. **Media:** Build the image upload pipeline.
    

## 7. Known Risks & Mitigations

|   |   |   |
|---|---|---|
|**Risk**|**Impact**|**Mitigation**|
|**Sync Conflicts**|File corruption if edited locally + Cloud sync simultaneously.|Reload file from disk before saving. Use Atomic Writes.|
|**Large Vaults**|Slow startup if scanning 10k+ files.|Cache the search index to a JSON file; only re-scan modified files on startup.|
|**Docker Polling**|High CPU usage on some systems (Windows/Mac).|Configure `CHOKIDAR_INTERVAL` or use active polling only when tab is focused.|








