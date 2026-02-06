import { useState, useMemo, useEffect, useRef } from "react";
import { UnifiedSidebar, Breadcrumbs, StatusBar, PageLoader, EmptyState } from "@/components/app-shell";
import type { HierarchySelectInfo } from "@/components/app-shell";
import { NotesList, NoteTabs } from "@/components/note-browsing";
import { BlockEditor, UnifiedMarkdownEditor, VisualEditor } from "@/components/note-editor";
import { MetadataNote } from "@/components/metadata/MetadataNote";
import { OverviewRoot, OverviewSystem, OverviewProject } from "@/components/overviews";
import { Button } from "@/components/ui-elements/atoms/Button";
import { Eye, Moon, Folder, FolderX } from "lucide-react";
import { useNotesStore, Block, VisualNode, EditorType } from "@/store/NotesContext";

const Index = () => {
  const { systems, notes, getNote, updateNoteContent, updateNote, addNote, deleteNote, saveAttachment, addNotePhoto, notesRef, isLoading } = useNotesStore();

  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notesVisible, setNotesVisible] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [invertColors, setInvertColors] = useState(false);
  const [showNoteDetails, setShowNoteDetails] = useState(false);
  const [editorType, setEditorType] = useState<EditorType>("modular");
  const [selectedSystemId, setSelectedSystemId] = useState<string | "all">("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'editor' | 'overview'>('overview');
  const [overviewTarget, setOverviewTarget] = useState<HierarchySelectInfo | null>({ level: 'root' });
  const [previousOverviewTarget, setPreviousOverviewTarget] = useState<HierarchySelectInfo | null>(null);

  const [openTabs, setOpenTabs] = useState<{ id: string; title: string; type: EditorType }[]>([]);
  const [activeTabId, setActiveTabId] = useState("");

  // Sync tab titles with store notes when notes change
  useEffect(() => {
    setOpenTabs(prevTabs =>
      prevTabs.map(tab => {
        const note = notes.find(n => n.id === tab.id);
        if (note && note.title !== tab.title) {
          return { ...tab, title: note.title };
        }
        return tab;
      })
    );
  }, [notes]);

  const handleTabClose = (tabId: string) => {
    const newTabs = openTabs.filter(tab => tab.id !== tabId);
    setOpenTabs(newTabs);
    if (activeTabId === tabId && newTabs.length > 0) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const handleTabRename = (tabId: string, newTitle: string) => {
    // Update tab title in local state
    setOpenTabs(openTabs.map(tab =>
      tab.id === tabId ? { ...tab, title: newTitle } : tab
    ));
    // Update note title in store
    updateNote(tabId, { title: newTitle });
  };

  const handleNoteSelect = (noteId: string, type: EditorType = "modular") => {
    setSelectedNoteId(noteId);
    setActiveTabId(noteId);
    setEditorType(type);
    setShowNoteDetails(false); // Close metadata view when selecting another note

    const note = getNote(noteId);
    const title = note?.title || `Note ${noteId}`;
    const noteType = note?.editorType || type;

    if (!openTabs.find(tab => tab.id === noteId)) {
      setOpenTabs([...openTabs, { id: noteId, title, type: noteType }]);
    }
  };

  const handleSystemProjectSelect = (systemId: string | "all", projectId?: string) => {
    setSelectedSystemId(systemId);
    setSelectedProjectId(projectId);
    setSelectedNoteId(undefined);
  };

  const handleHierarchySelect = (info: HierarchySelectInfo) => {
    // For root, system, and project levels, show overview
    if (info.level === 'root' || info.level === 'system' || info.level === 'project') {
      // Check if clicking the same item again - if so, return to editor
      if (
        viewMode === 'overview' &&
        overviewTarget?.level === info.level &&
        overviewTarget?.id === info.id
      ) {
        setViewMode('editor');
        setOverviewTarget(null);
        return;
      }

      setPreviousOverviewTarget(overviewTarget);
      setViewMode('overview');
      setOverviewTarget(info);
      setShowNoteDetails(false);
      setSelectedNoteId(undefined);
    } else {
      // For note, page, and section levels, show editor
      setViewMode('editor');
      setOverviewTarget(null);
    }
  };

  // Handle content changes from editors
  const handleContentChange = (content: Block[] | string | VisualNode[]) => {
    if (activeTabId) {
      updateNoteContent(activeTabId, content);
    }
  };

  // Build breadcrumb path dynamically
  const breadcrumbItems = useMemo(() => {
    const items: { label: string; href?: string }[] = [];

    if (viewMode === 'overview' && overviewTarget) {
      if (overviewTarget.level === 'system' && overviewTarget.id) {
        const system = systems.find(s => s.id === overviewTarget.id);
        if (system) items.push({ label: system.name });
      } else if (overviewTarget.level === 'project' && overviewTarget.id) {
        const sysId = overviewTarget.parentIds?.systemId;
        if (sysId) {
          const system = systems.find(s => s.id === sysId);
          if (system) {
            items.push({ label: system.name, href: `/systems/${system.id}` });
            const project = system.projects.find(p => p.id === overviewTarget.id);
            if (project) items.push({ label: project.name });
          }
        }
      }
    } else if (viewMode === 'editor' && activeTabId) {
      const currentNote = getNote(activeTabId);
      if (currentNote) {
        const system = systems.find(s => s.id === currentNote.systemId);
        if (system) {
          items.push({ label: system.name, href: `/systems/${system.id}` });
          const project = system.projects.find(p => p.id === currentNote.projectId);
          if (project) items.push({ label: project.name, href: `/projects/${project.id}` });
        }
        items.push({ label: currentNote.title });
      }
    }

    return items;
  }, [viewMode, overviewTarget, activeTabId, systems, notes]);

  const renderEditor = () => {
    if (showNoteDetails && selectedNoteId) {
      return (
        <MetadataNote
          noteId={selectedNoteId}
          onClose={() => setShowNoteDetails(false)}
        />
      );
    }

    if (openTabs.length === 0) {
      return <EmptyState title="No note open" description="Select a note from the sidebar or create a new one." />;
    }

    const activeTab = openTabs.find(tab => tab.id === activeTabId);
    const currentEditorType = activeTab?.type || editorType;
    const currentNote = getNote(activeTabId);

    // Get content from store, with fallbacks
    const getBlockContent = (): Block[] => {
      if (currentNote?.content && Array.isArray(currentNote.content)) {
        // Check if it's block content (has 'type' property with block types)
        const first = currentNote.content[0] as any;
        if (first && first.type && ["heading", "paragraph", "code", "list", "image", "section"].includes(first.type)) {
          return currentNote.content as Block[];
        }
      }
      return [
        { id: "1", type: "heading", content: "New Note", metadata: { level: 1 } },
        { id: "2", type: "paragraph", content: "Start writing here..." },
      ];
    };

    const getTextContent = (): string => {
      if (currentNote?.content && typeof currentNote.content === "string") {
        return currentNote.content;
      }
      return "# New Note\n\nStart writing here...";
    };

    const getVisualContent = (): VisualNode[] => {
      if (currentNote?.content && Array.isArray(currentNote.content)) {
        const first = currentNote.content[0] as any;
        if (first && first.type && ["start", "process", "decision", "end"].includes(first.type)) {
          return currentNote.content as VisualNode[];
        }
      }
      return [{ id: "1", type: "start", label: "Start", x: 200, y: 100 }];
    };

    // Create a handler for saving attachments for the current note
    const handleSaveAttachment = (filename: string, dataUrl: string) => {
      if (activeTabId) {
        saveAttachment(activeTabId, filename, dataUrl);
      }
    };

    switch (currentEditorType) {
      case "standard":
        return (
          <UnifiedMarkdownEditor
            focusMode={focusMode}
            content={getTextContent()}
            onChange={(content) => handleContentChange(content)}
            attachments={currentNote?.attachments}
            photos={currentNote?.photos}
            onSaveAttachment={handleSaveAttachment}
            onAddPhoto={(name, dataUrl) => {
              // Save attachment to _assets folder first, then add photo reference
              saveAttachment(activeTabId, name, dataUrl);
              addNotePhoto(activeTabId, name, dataUrl);
            }}
          />
        );
      case "visual":
        return (
          <VisualEditor
            focusMode={focusMode}
            nodes={getVisualContent()}
            onChange={(nodes) => handleContentChange(nodes)}
          />
        );
      case "modular":
      default:
        return (
          <BlockEditor
            initialBlocks={getBlockContent()}
            focusMode={focusMode}
            onChange={(blocks) => handleContentChange(blocks)}
          />
        );
    }
  };

  const renderOverview = () => {
    if (!overviewTarget) return null;

    switch (overviewTarget.level) {
      case 'root':
        return (
          <OverviewRoot
            onSystemSelect={(systemId) => {
              setSelectedSystemId(systemId);
              setSelectedProjectId(undefined);
              handleHierarchySelect({ level: 'system', id: systemId });
            }}
            onClose={handleOverviewClose}
          />
        );
      case 'system':
        return (
          <OverviewSystem
            systemId={overviewTarget.id || ''}
            onProjectSelect={(projectId) => {
              setSelectedProjectId(projectId);
              handleHierarchySelect({
                level: 'project',
                id: projectId,
                parentIds: { systemId: overviewTarget.id }
              });
            }}
            onRootSelect={() => {
              setSelectedSystemId("all");
              setSelectedProjectId(undefined);
              handleHierarchySelect({ level: 'root' });
            }}
            onClose={handleOverviewClose}
          />
        );
      case 'project':
        const projectSystemId = overviewTarget.parentIds?.systemId || (selectedSystemId !== 'all' ? selectedSystemId : '');
        return (
          <OverviewProject
            systemId={projectSystemId}
            projectId={overviewTarget.id || ''}
            onNoteSelect={(noteId, editorType) => {
              handleNoteSelect(noteId, editorType);
              setViewMode('editor');
              setOverviewTarget(null);
            }}
            onSystemSelect={(systemId) => {
              setSelectedSystemId(systemId);
              setSelectedProjectId(undefined);
              handleHierarchySelect({ level: 'system', id: systemId });
            }}
            onRootSelect={() => {
              setSelectedSystemId("all");
              setSelectedProjectId(undefined);
              handleHierarchySelect({ level: 'root' });
            }}
            onClose={handleOverviewClose}
          />
        );
      default:
        return null;
    }
  };

  const renderMainContent = () => {
    if (viewMode === 'overview' && overviewTarget) {
      return renderOverview();
    }
    return renderEditor();
  };

  // Handler to close overview and return to editor
  const handleOverviewClose = () => {
    setViewMode('editor');
    setOverviewTarget(null);
  };

  // Show loading state while data is loading
  if (isLoading) {
    return <PageLoader message="Loading your notes..." />;
  }

  return (
    <div
      className="flex flex-col h-screen w-full overflow-hidden bg-background text-foreground"
      style={invertColors ? { filter: 'invert(1) hue-rotate(180deg)' } : {}}
    >
      <div className="flex flex-1 overflow-hidden">
      {!focusMode && (
        <UnifiedSidebar
          collapsed={sidebarCollapsed}
          onNoteSelect={(noteId, type) => {
            handleNoteSelect(noteId, type);
            // When clicking a note directly, switch to editor mode
            setViewMode('editor');
            setOverviewTarget(null);
          }}
          selectedNoteId={selectedNoteId}
          onSystemProjectSelect={handleSystemProjectSelect}
          onHierarchySelect={handleHierarchySelect}
          overviewTarget={viewMode === 'overview' ? overviewTarget : null}
        />
      )}

      {/* Notes Sidebar - hidden when in overview mode */}
      {notesVisible && !focusMode && viewMode === 'editor' && (
        <NotesList
          onNoteSelect={(noteId, type) => {
            handleNoteSelect(noteId, type);
            setViewMode('editor');
            setOverviewTarget(null);
          }}
          selectedNoteId={selectedNoteId}
          filterSystemId={selectedSystemId}
          filterProjectId={selectedProjectId}
          onCardFlip={(isFlipped, noteId) => {
            setShowNoteDetails(isFlipped);
            if (noteId) {
              setSelectedNoteId(noteId);
            }
            setViewMode('editor');
            setOverviewTarget(null);
          }}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Exit Focus Mode Button */}
        {focusMode && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-50 gap-2"
            onClick={() => setFocusMode(false)}
          >
            <Eye className="w-4 h-4" />
            Exit Focus Mode
          </Button>
        )}

        {/* Top Bar with Breadcrumbs and View Controls */}
        {!focusMode && (
          <div className="h-12 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 shadow-sm">
            <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              <Breadcrumbs items={breadcrumbItems} />
            </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => setNotesVisible(!notesVisible)}
              title={notesVisible ? "Hide Notes Sidebar" : "Show Notes Sidebar"}
            >
              {notesVisible ? (
                <Folder className="w-4 h-4" />
              ) : (
                <FolderX className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => setFocusMode(!focusMode)}
              title="Focus Mode"
            >
              <Eye className={`w-4 h-4 ${focusMode ? 'text-primary' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => setInvertColors(!invertColors)}
              title="Invert Colors"
            >
              <Moon className={`w-4 h-4 ${invertColors ? 'text-primary' : ''}`} />
            </Button>
          </div>
        </div>
        )}

        {/* Tabs - only show when in editor mode */}
        {!focusMode && openTabs.length > 0 && viewMode === 'editor' && (
          <NoteTabs
            tabs={openTabs}
            activeTabId={activeTabId}
            onTabSelect={(tabId) => {
              setActiveTabId(tabId);
              setSelectedNoteId(tabId);
              setShowNoteDetails(false); // Close metadata view when switching tabs
              setViewMode('editor');
              setOverviewTarget(null);
            }}
            onTabClose={handleTabClose}
            onTabRename={handleTabRename}
          />
        )}

        {renderMainContent()}
      </div>
      </div>

      {/* Status Bar */}
      {!focusMode && <StatusBar />}
    </div>
  );
};

export default Index;
