import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { RotateCcw, Star, Calendar, Paperclip, Image as ImageIcon, FileText, Pencil, Trash2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";

interface Note {
  id: string;
  title: string;
  preview: string;
  date: string;
  tags: string[];
  favorite?: boolean;
  color?: string;
}

interface NoteCardProps {
  note: Note;
  selectedNoteId?: string;
  onSelect: (id: string) => void;
  onFlip?: (isFlipped: boolean, noteTitle: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onDelete?: (id: string) => void;
}

export const NoteCard = ({ note, selectedNoteId, onSelect, onFlip, onRename, onDelete }: NoteCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync editTitle when note.title changes
  useEffect(() => {
    setEditTitle(note.title);
  }, [note.title]);

  const handleRename = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== note.title) {
      onRename?.(note.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setEditTitle(note.title);
      setIsEditing(false);
    }
  };

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newFlipped = !isFlipped;
    setIsFlipped(newFlipped);
    onFlip?.(newFlipped, note.title);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className={cn("perspective-1000 w-full relative isolate overflow-hidden rounded-[4px]")}>
          <div
            className={cn(
              "relative w-full transition-transform duration-500 preserve-3d",
              isFlipped && "rotate-y-180"
            )}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front of card */}
            <button
              onClick={() => onSelect(note.id)}
              className={cn(
                "w-full p-3 rounded-[4px] text-left transition-all group relative backface-hidden",
                "hover:bg-list-hover",
                "border",
                selectedNoteId === note.id
                  ? "bg-list-active border-border"
                  : "border-border/60",
                isFlipped && "opacity-0 pointer-events-none"
              )}
              style={note.color ? {
                borderLeft: selectedNoteId === note.id ? `3px solid hsl(var(--${note.color}))` : undefined
              } : undefined}
            >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {note.title}
            </h3>
            <div className="flex items-center gap-1">
              {note.favorite && (
                <div className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />
              )}
              <button
                onClick={handleFlip}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                title="Flip card"
              >
                <RotateCcw className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{note.preview}</p>
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {note.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{note.date}</span>
          </div>
        </button>

            {/* Back of card */}
            <div
              className={cn(
                "absolute inset-0 z-10 w-full rounded-[4px] border border-warning backface-hidden rotate-y-180 bg-card/90 shadow-md overflow-hidden"
              )}
              style={{
                transformStyle: "preserve-3d"
              }}
            >
              <div className="h-full overflow-y-auto p-3">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-warning">
                  METADATA
                </h3>
                <button
                  onClick={handleFlip}
                  className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
                  title="Flip back"
                >
                  <RotateCcw className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>

          <div className="space-y-3">
            {/* Details */}
            <div className="space-y-2">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span className="text-foreground">Jan 15, 2025</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Star className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Modified:</span>
                  <span className="text-foreground">{note.date}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <FileText className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Type:</span>
                  <span className="text-foreground capitalize">{note.tags[0] || "General"}</span>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                Attachments (3)
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 transition-colors">
                  <FileText className="w-3 h-3 text-primary" />
                  <span className="text-xs text-foreground">document.pdf</span>
                  <span className="text-xs text-muted-foreground ml-auto">2.4 MB</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 transition-colors">
                  <FileText className="w-3 h-3 text-primary" />
                  <span className="text-xs text-foreground">notes.txt</span>
                  <span className="text-xs text-muted-foreground ml-auto">12 KB</span>
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                Photos (2)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-video bg-muted rounded border border-border flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="aspect-video bg-muted rounded border border-border flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>

              {/* Tags */}
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </ContextMenuTrigger>
    <ContextMenuContent className="w-40">
      <ContextMenuItem
        onClick={handleFlip}
        className="gap-2 cursor-pointer"
      >
        <RotateCcw className="w-3 h-3" />
        View metadata
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => onDelete?.(note.id)}
        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
      >
        <Trash2 className="w-3 h-3" />
        Delete note
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
  );
};
