import { useState, useRef, useEffect } from "react";
import {
  Folder,
  ChevronRight,
  ChevronDown,
  User,
  FileText,
  Network,
  GripVertical,
  Search,
  X,
  Palette,
  TreePine,
  Trash2
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { UserProfile } from "./UserProfile";
import { useNotesStore } from "@/store/notesStore";

interface Section {
  id: string;
  title: string;
}

interface Page {
  id: string;
  title: string;
  sections: Section[];
}

interface Note {
  id: string;
  title: string;
  pages: Page[];
}

interface Project {
  id: string;
  name: string;
  notes: Note[];
}

interface System {
  id: string;
  name: string;
  projects: Project[];
}

interface UnifiedSidebarProps {
  collapsed?: boolean;
  onNoteSelect: (noteId: string, type?: "modular" | "standard" | "visual" | "typography") => void;
  selectedNoteId?: string;
  onWidthChange?: (width: number) => void;
  onSystemProjectSelect?: (systemId: string | "all", projectId?: string) => void;
}

export const UnifiedSidebar = ({
  collapsed = false,
  onNoteSelect,
  selectedNoteId,
  onWidthChange,
  onSystemProjectSelect
}: UnifiedSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { trash } = useNotesStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSystemId, setSelectedSystemId] = useState<string | "all">("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(["system-1", "project-1", "note-1"])
  );
  const [width, setWidth] = useState(288);
  const [isResizing, setIsResizing] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const MIN_WIDTH = 56; // Icon-only width
  const MAX_WIDTH = 480;
  const COLLAPSED_THRESHOLD = 100; // If dragged below this, treat as collapsed

  // Mock data with hierarchy: System > Project > Notes > Pages > Sections
  const systems: System[] = [
    {
      id: "system-1",
      name: "Work",
      projects: [
        {
          id: "project-1",
          name: "Engineering",
          notes: [
            {
              id: "note-1",
              title: "Architecture",
              pages: [
                {
                  id: "page-1",
                  title: "System Design",
                  sections: [
                    { id: "section-1", title: "Overview" },
                    { id: "section-2", title: "Components" },
                  ],
                },
                {
                  id: "page-2",
                  title: "API Documentation",
                  sections: [
                    { id: "section-3", title: "Endpoints" },
                  ],
                },
              ],
            },
            {
              id: "note-2",
              title: "Meeting Notes",
              pages: [
                {
                  id: "page-3",
                  title: "Sprint Planning",
                  sections: [],
                },
              ],
            },
          ],
        },
        {
          id: "project-2",
          name: "Product",
          notes: [
            {
              id: "note-3",
              title: "Roadmap",
              pages: [],
            },
          ],
        },
      ],
    },
    {
      id: "system-2",
      name: "Personal",
      projects: [
        {
          id: "project-3",
          name: "Learning",
          notes: [
            {
              id: "note-4",
              title: "React Notes",
              pages: [],
            },
          ],
        },
      ],
    },
  ];

  const allNotes = systems.flatMap(s => 
    s.projects.flatMap(p => 
      p.notes.map(n => ({ ...n, systemId: s.id, projectId: p.id }))
    )
  );

  const filteredNotes = allNotes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth);
        onWidthChange?.(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // If width is below threshold, collapse it
      if (width < COLLAPSED_THRESHOLD) {
        setWidth(MIN_WIDTH);
        onWidthChange?.(MIN_WIDTH);
      }
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, onWidthChange, width, COLLAPSED_THRESHOLD, MIN_WIDTH]);

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const renderSection = (section: Section, level: number) => (
    <button
      key={section.id}
      onClick={() => onNoteSelect(section.id)}
      className={cn(
        "w-full flex items-center gap-2 py-1 px-2 rounded text-left transition-colors text-xs",
        "hover:bg-sidebar-item/50",
        selectedNoteId === section.id && "bg-sidebar-active text-primary"
      )}
      style={{ paddingLeft: `${level * 0.75}rem` }}
    >
      <span className="line-clamp-1">{section.title}</span>
    </button>
  );

  const renderPage = (page: Page, level: number) => {
    const isExpanded = expandedItems.has(page.id);
    const hasChildren = page.sections.length > 0;
    
    return (
      <div key={page.id} className="w-full">
        <button
          onClick={() => {
            if (hasChildren) {
              toggleItem(page.id);
            } else {
              onNoteSelect(page.id);
            }
          }}
          className={cn(
            "w-full flex items-center gap-2 py-1 px-2 rounded text-left transition-colors text-xs",
            "hover:bg-sidebar-item",
            selectedNoteId === page.id && "bg-sidebar-active text-primary"
          )}
          style={{ paddingLeft: `${level * 0.75}rem` }}
        >
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
            )
          )}
          <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="line-clamp-1">{page.title}</span>
        </button>
        {isExpanded && hasChildren && (
          <div className="mt-0.5 space-y-0.5">
            {page.sections.map(s => renderSection(s, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderNote = (note: Note, level: number) => {
    const isExpanded = expandedItems.has(note.id);
    const hasChildren = note.pages.length > 0;
    
    return (
      <div key={note.id} className="w-full">
        <button
          onClick={() => {
            if (hasChildren) {
              toggleItem(note.id);
            } else {
              onNoteSelect(note.id);
            }
          }}
          className={cn(
            "w-full flex items-center gap-2 py-1 px-2 rounded text-left transition-colors text-xs",
            "hover:bg-sidebar-item",
            selectedNoteId === note.id && "bg-sidebar-active text-primary"
          )}
          style={{ paddingLeft: `${level * 0.75}rem` }}
        >
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
            )
          )}
          <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="line-clamp-1">{note.title}</span>
        </button>
        {isExpanded && hasChildren && (
          <div className="mt-0.5 space-y-0.5">
            {note.pages.map(p => renderPage(p, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderProject = (project: Project, level: number, systemId: string) => {
    const isExpanded = expandedItems.has(project.id);
    const isSelected = selectedProjectId === project.id;
    
    return (
      <div key={project.id} className="w-full">
        <button
          onClick={() => {
            setSelectedProjectId(project.id);
            setSelectedSystemId(systemId);
            onSystemProjectSelect?.(systemId, project.id);
            toggleItem(project.id);
          }}
          className="w-full flex items-center gap-2 py-1 px-2 rounded text-left transition-colors text-xs hover:bg-sidebar-item"
          style={{ paddingLeft: `${level * 0.75}rem` }}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
          )}
          {/* Circle indicator */}
          <div 
            className={cn(
              "w-2 h-2 rounded-full shrink-0 transition-all",
              isSelected 
                ? "bg-warning" 
                : "border border-dashed border-warning bg-transparent"
            )}
          />
          <Folder className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="line-clamp-1">{project.name}</span>
        </button>
        {isExpanded && (
          <div className="mt-0.5 space-y-0.5">
            {project.notes.map(n => renderNote(n, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderSystem = (system: System) => {
    const isExpanded = expandedItems.has(system.id);
    const isSelected = selectedSystemId === system.id && !selectedProjectId;
    
    return (
      <div key={system.id} className="w-full">
        <button
          onClick={() => {
            setSelectedSystemId(system.id);
            setSelectedProjectId(undefined);
            onSystemProjectSelect?.(system.id);
            toggleItem(system.id);
          }}
          className="w-full flex items-center gap-2 py-1.5 px-2 rounded text-left transition-colors text-xs font-medium hover:bg-sidebar-item"
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
          )}
          {/* Circle indicator */}
          <div 
            className={cn(
              "w-2 h-2 rounded-full shrink-0 transition-all",
              isSelected 
                ? "bg-warning" 
                : "border border-dashed border-warning bg-transparent"
            )}
          />
          <Network className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="line-clamp-1">{system.name}</span>
        </button>
        {isExpanded && (
          <div className="mt-0.5 space-y-0.5">
            {system.projects.map(p => renderProject(p, 1, system.id))}
          </div>
        )}
      </div>
    );
  };

  const isCollapsed = width <= MIN_WIDTH + 10;

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <div className="unified-sidebar relative">
          {/* Collapsed icons */}
          <div className="w-14 border-r border-sidebar-border bg-sidebar-bg flex flex-col items-center py-4 gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="w-10 h-10">
                  <Network className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">Systems</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="w-10 h-10">
                  <Folder className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">Projects</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="w-10 h-10">
                  <FileText className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">Notes</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Resize handle */}
          <div
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 transition-colors group"
            onMouseDown={() => setIsResizing(true)}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-3 h-3 text-primary" />
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div 
      ref={sidebarRef}
      className="unified-sidebar border-r border-sidebar-border bg-sidebar-bg flex flex-col relative"
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-foreground">
            Workspace
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 text-xs",
              location.pathname === "/projects" && "bg-primary/10 text-primary hover:bg-primary/20"
            )}
            onClick={() => {
              if (location.pathname === "/projects") {
                navigate("/");
              } else {
                navigate("/projects");
              }
            }}
          >
            Overview
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 text-xs bg-input border-input-border focus-visible:ring-primary pl-7 pr-7"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1 px-2 py-2">
        <div className="space-y-1">
          {/* All Systems Option */}
          <button
            onClick={() => {
              setSelectedSystemId("all");
              setSelectedProjectId(undefined);
              onSystemProjectSelect?.("all");
              // Optionally expand all systems
              const allSystemIds = systems.map(s => s.id);
              setExpandedItems(new Set(allSystemIds));
            }}
            className={cn(
              "w-full flex items-center gap-2 py-1.5 px-2 rounded text-left transition-colors text-xs font-medium hover:bg-sidebar-item",
              selectedSystemId === "all" && !selectedProjectId && "bg-sidebar-active"
            )}
          >
            {/* Circle indicator */}
            <div 
              className={cn(
                "w-2 h-2 rounded-full shrink-0 transition-all",
                selectedSystemId === "all" && !selectedProjectId
                  ? "bg-warning" 
                  : "border border-dashed border-warning bg-transparent"
              )}
            />
            <Network className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="line-clamp-1">All Systems</span>
          </button>
          
          {systems.map(renderSystem)}
        </div>
      </ScrollArea>

      {/* Trash */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className={cn(
            "w-full flex items-center justify-start gap-2 py-1.5 px-2 h-auto text-xs",
            location.pathname === "/trash" && "bg-sidebar-active"
          )}
          onClick={() => navigate("/trash")}
        >
          <Trash2 className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="truncate">Trash</span>
          {trash.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">{trash.length}</span>
          )}
        </Button>
      </div>

      {/* Stylesheet and Hierarchy */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-start gap-2 py-1.5 px-2 h-auto text-xs"
          onClick={() => navigate("/stylesheet")}
        >
          <Palette className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="truncate">Stylesheet</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-start gap-2 py-1.5 px-2 h-auto text-xs"
          onClick={() => navigate("/hierarchy")}
        >
          <TreePine className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="truncate">Hierarchy</span>
        </Button>
      </div>

      {/* User Profile */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-start gap-2 py-1.5 px-2 h-auto"
          onClick={() => setIsProfileOpen(true)}
        >
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <User className="w-3 h-3 text-primary" />
          </div>
          <span className="text-xs truncate">Workspace</span>
        </Button>
      </div>

      {/* User Profile Sheet */}
      <UserProfile open={isProfileOpen} onOpenChange={setIsProfileOpen} />

      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 transition-colors group"
        onMouseDown={() => setIsResizing(true)}
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3 h-3 text-primary" />
        </div>
      </div>
    </div>
  );
};
