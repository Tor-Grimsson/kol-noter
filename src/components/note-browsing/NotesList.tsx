import { useState, useEffect, useRef } from "react";
import { Search, Plus, GripVertical, FileText, Network, Boxes, X } from "lucide-react";
import { NoteCard } from "./NoteCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui-elements/atoms/Button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNotesStore, EditorType } from "@/store/NotesContext";
import { NotesListSkeleton } from "@/components/app-shell/LoadingStates";

interface NotesListProps {
  onNoteSelect: (noteId: string, type?: EditorType) => void;
  selectedNoteId?: string;
  onCardFlip?: (isFlipped: boolean, noteId: string | undefined) => void;
  filterSystemId?: string | "all";
  filterProjectId?: string;
}

export const NotesList = ({ onNoteSelect, selectedNoteId, onCardFlip, filterSystemId = "all", filterProjectId }: NotesListProps) => {
  const { notes, addNote, updateNote, deleteNote, isLoading } = useNotesStore();

  const handleRename = (id: string, newTitle: string) => {
    updateNote(id, { title: newTitle });
  };

  const handleColorChange = (id: string, color: string) => {
    updateNote(id, { color });
  };

  const handleIconChange = (id: string, icon: string | null) => {
    updateNote(id, { icon });
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
  };
  const [width, setWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const MIN_WIDTH = 200;
  const MAX_WIDTH = 600;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const unifiedSidebarWidth = document.querySelector('.unified-sidebar')?.getBoundingClientRect().width || 0;
      const newWidth = e.clientX - unifiedSidebarWidth;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing]);


  // Handle scroll to show/hide search
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const newScrollTop = target.scrollTop;
    setScrollTop(newScrollTop);

    // Show search when scrolled to top (overscroll effect)
    if (newScrollTop <= 0 && !searchVisible) {
      setSearchVisible(true);
    }
  };

  // Filter notes based on selected system, project, and search query
  const filteredNotes = notes.filter(note => {
    // System/project filter
    if (filterSystemId !== "all") {
      if (filterProjectId) {
        if (note.systemId !== filterSystemId || note.projectId !== filterProjectId) {
          return false;
        }
      } else if (note.systemId !== filterSystemId) {
        return false;
      }
    }
    // Search filter
    if (searchQuery) {
      return note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             note.preview.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  }).sort((a, b) => b.updatedAt - a.updatedAt);

  const handleCreateNote = (type: EditorType) => {
    // Use current filter context, fallback to defaults
    const systemId = filterSystemId !== "all" ? filterSystemId : "system-1";
    const projectId = filterProjectId || "project-1";
    const newNote = addNote(systemId, projectId, type);
    onNoteSelect(newNote.id, type);
  };

  // Show skeleton while loading
  if (isLoading) {
    return <NotesListSkeleton count={5} />;
  }

  return (
    <div className="border-r border-border bg-list-bg flex flex-col relative" style={{ width: `${width}px` }}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-foreground">Notes</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="w-8 h-8 hover:bg-list-item">
                <Plus className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-background border-border z-50">
              <DropdownMenuItem
                className="flex items-start gap-3 p-3 cursor-pointer"
                onClick={() => handleCreateNote("standard")}
              >
                <FileText className="w-4 h-4 text-foreground mt-0" />
                <div className="flex-1">
                  <div className="font-medium text-xs">Standard</div>
                  <div className="text-xs text-muted-foreground">Markdown editor</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-start gap-3 p-3 cursor-pointer"
                onClick={() => handleCreateNote("modular")}
              >
                <Boxes className="w-4 h-4 text-foreground mt-0" />
                <div className="flex-1">
                  <div className="font-medium text-xs">Modular</div>
                  <div className="text-xs text-muted-foreground">Rearrangeable blocks</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-start gap-3 p-3 cursor-pointer"
                onClick={() => handleCreateNote("visual")}
              >
                <Network className="w-4 h-4 text-foreground mt-0" />
                <div className="flex-1">
                  <div className="font-medium text-xs">Visual</div>
                  <div className="text-xs text-muted-foreground">Node-based flowchart</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ScrollArea className="flex-1" onScrollCapture={handleScroll}>
        <div className="p-2 space-y-2">
          {/* Pull-to-reveal search */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-out",
              searchVisible ? "max-h-12 opacity-100 mb-2" : "max-h-0 opacity-0"
            )}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-8 bg-input border-input-border h-8 text-xs focus-visible:ring-primary"
              />
              {(searchQuery || searchVisible) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchVisible(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              selectedNoteId={selectedNoteId}
              onSelect={onNoteSelect}
              onFlip={onCardFlip}
              onRename={handleRename}
              onDelete={handleDelete}
              onColorChange={handleColorChange}
              onIconChange={handleIconChange}
            />
          ))}
          {filteredNotes.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-xs">No notes found</p>
            </div>
          )}
        </div>
      </ScrollArea>

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
