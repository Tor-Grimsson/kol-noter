import { useState, useEffect } from "react";
import { Search, Plus, GripVertical, FileText, Network, Type, Boxes } from "lucide-react";
import { NoteCard } from "@/components/NoteCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNotesStore, EditorType } from "@/store/notesStore";

interface NotesListProps {
  onNoteSelect: (noteId: string, type?: EditorType) => void;
  selectedNoteId?: string;
  onCardFlip?: (isFlipped: boolean, noteTitle: string) => void;
  filterSystemId?: string | "all";
  filterProjectId?: string;
}

export const NotesList = ({ onNoteSelect, selectedNoteId, onCardFlip, filterSystemId = "all", filterProjectId }: NotesListProps) => {
  const { notes, addNote, updateNote, deleteNote } = useNotesStore();

  const handleRename = (id: string, newTitle: string) => {
    updateNote(id, { title: newTitle });
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
  };
  const [width, setWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
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


  // Filter notes based on selected system and project
  const filteredNotes = notes.filter(note => {
    if (filterSystemId === "all") return true;
    if (filterProjectId) {
      return note.systemId === filterSystemId && note.projectId === filterProjectId;
    }
    return note.systemId === filterSystemId;
  });

  const handleCreateNote = (type: EditorType) => {
    // Use current filter context, fallback to defaults
    const systemId = filterSystemId !== "all" ? filterSystemId : "system-1";
    const projectId = filterProjectId || "project-1";
    const newNote = addNote(systemId, projectId, type);
    onNoteSelect(newNote.id, type);
  };

  return (
    <div className="border-r border-border bg-list-bg flex flex-col relative" style={{ width: `${width}px` }}>
      <div className="p-4 border-b border-border space-y-3">
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
                onClick={() => handleCreateNote("modular")}
              >
                <Boxes className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-xs">Modular</div>
                  <div className="text-xs text-muted-foreground">Rearrangeable blocks</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-start gap-3 p-3 cursor-pointer"
                onClick={() => handleCreateNote("standard")}
              >
                <FileText className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-xs">Standard</div>
                  <div className="text-xs text-muted-foreground">Markdown editor</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-start gap-3 p-3 cursor-pointer"
                onClick={() => handleCreateNote("visual")}
              >
                <Network className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-xs">Visual</div>
                  <div className="text-xs text-muted-foreground">Node-based flowchart</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-start gap-3 p-3 cursor-pointer"
                onClick={() => handleCreateNote("typography")}
              >
                <Type className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-xs">Typography</div>
                  <div className="text-xs text-muted-foreground">Text styles showcase</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-9 bg-input border-input-border h-9 text-xs focus-visible:ring-primary"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              selectedNoteId={selectedNoteId}
              onSelect={onNoteSelect}
              onFlip={onCardFlip}
              onRename={handleRename}
              onDelete={handleDelete}
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
