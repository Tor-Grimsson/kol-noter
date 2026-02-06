import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  RotateCcw, Star, Calendar, Paperclip, Image as ImageIcon, FileText, Pencil, Trash2, Circle,
  Target, Lightbulb, CheckCircle, Bookmark, Heart, Flag, Tag as TagIcon
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";

const CARD_COLORS = [
  { name: "blue", value: "#49a0a2" },
  { name: "green", value: "#66a44c" },
  { name: "yellow", value: "#ffe32e" },
  { name: "red", value: "#ce4646" },
  { name: "orange", value: "#db8000" },
  { name: "purple", value: "#9437ff" },
  { name: "dark", value: "#121215" },
  { name: "warm", value: "#d0d79d" },
];

interface Note {
  id: string;
  title: string;
  preview: string;
  date: string;
  tags: string[];
  favorite?: boolean;
  color?: string;
  /** Custom icon to display on card, null = hidden, string = icon name */
  icon?: string | null;
  createdAt: number;
  updatedAt: number;
  attachments?: { [filename: string]: string };
  photos?: { id: string; name: string; dataUrl: string; addedAt: number }[];
}

// Icon options for the picker
const ICON_OPTIONS = [
  { name: "Note", icon: FileText, key: "note" },
  { name: "Target", icon: Target, key: "target" },
  { name: "Star", icon: Star, key: "star" },
  { name: "Lightbulb", icon: Lightbulb, key: "lightbulb" },
  { name: "Check", icon: CheckCircle, key: "check" },
  { name: "Bookmark", icon: Bookmark, key: "bookmark" },
  { name: "Heart", icon: Heart, key: "heart" },
  { name: "Flag", icon: Flag, key: "flag" },
];

interface NoteCardProps {
  note: Note;
  selectedNoteId?: string;
  onSelect: (id: string) => void;
  onFlip?: (isFlipped: boolean, noteId: string | undefined) => void;
  onRename?: (id: string, newTitle: string) => void;
  onDelete?: (id: string) => void;
  onColorChange?: (id: string, color: string) => void;
  onIconChange?: (id: string, icon: string | null) => void;
}

export const NoteCard = ({ note, selectedNoteId, onSelect, onFlip, onRename, onDelete, onColorChange, onIconChange }: NoteCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset flip state when card is no longer selected
  const isSelected = selectedNoteId === note.id;
  const displayIsFlipped = isSelected ? isFlipped : false;

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
    onFlip?.(newFlipped, newFlipped ? note.id : undefined);
  };

  // Helper to render icon by key
  const renderIconByKey = (key: string) => {
    const option = ICON_OPTIONS.find(o => o.key === key);
    if (!option) return null;
    const IconComponent = option.icon;
    return <IconComponent className="w-4 h-4" />;
  };

  // Get the current icon to display
  const displayIcon = note.icon ? renderIconByKey(note.icon) : null;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className={cn("perspective-1000 w-full relative isolate overflow-hidden rounded-[4px]")}>
          <div
            className={cn(
              "relative w-full transition-transform duration-500 preserve-3d",
              displayIsFlipped && "rotate-y-180"
            )}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front of card */}
            <div
              onClick={() => onSelect(note.id)}
              className={cn(
                "w-full p-3 rounded-[4px] text-left transition-all group relative backface-hidden cursor-pointer",
                "hover:bg-list-hover",
                "border",
                selectedNoteId === note.id
                  ? "bg-list-active border-border"
                  : "border-border/60",
                displayIsFlipped && "opacity-0 pointer-events-none"
              )}
              style={{
                borderLeft: note.color ? `4px solid ${note.color}` : undefined
              }}
            >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {displayIcon && (
                <span className="text-muted-foreground shrink-0">{displayIcon}</span>
              )}
              <h3 className="text-sm font-medium text-foreground line-clamp-1">
                {note.title}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              {selectedNoteId === note.id && (
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 bg-[#ffe32e]"
                  title="Active"
                />
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
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{note.preview}</p>
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
            <span className="text-sm text-muted-foreground">{note.date}</span>
          </div>
        </div>

            {/* Back of card */}
            <div
              className={cn(
                "absolute inset-0 z-10 w-full rounded-[4px] border border-warning backface-hidden rotate-y-180 shadow-md overflow-hidden",
                !displayIsFlipped && "opacity-0 pointer-events-none"
              )}
              style={{
                backgroundColor: "#18181B",
                transformStyle: "preserve-3d"
              }}
            >
              <div className="h-full overflow-y-auto p-3">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span className="text-foreground">{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Modified:</span>
                  <span className="text-foreground">{note.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Type:</span>
                  <span className="text-foreground capitalize">{note.tags[0] || "General"}</span>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <div className="text-sm uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                Attachments ({Object.keys(note.attachments || {}).length})
              </div>
              <div className="space-y-1">
                {Object.keys(note.attachments || {}).slice(0, 2).map((filename) => (
                  <div key={filename} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 transition-colors">
                    <FileText className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm text-foreground truncate flex-1">{filename}</span>
                  </div>
                ))}
                {Object.keys(note.attachments || {}).length === 0 && (
                  <span className="text-sm text-muted-foreground">No attachments</span>
                )}
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <div className="text-sm uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                Photos ({(note.photos || []).length})
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(note.photos || []).slice(0, 4).map((photo) => (
                  <div key={photo.id} className="aspect-video bg-muted rounded border border-border overflow-hidden">
                    <img src={photo.dataUrl} alt={photo.name} className="w-full h-full object-cover" />
                  </div>
                ))}
                {(note.photos || []).length === 0 && (
                  <div className="col-span-2 aspect-video bg-muted rounded border border-border flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

              {/* Tags */}
              <div className="space-y-2">
                <div className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">
                  Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                  {note.tags.length === 0 && (
                    <span className="text-sm text-muted-foreground">No tags</span>
                  )}
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </ContextMenuTrigger>
    <ContextMenuContent className="w-56">
      <ContextMenuItem
        onClick={handleFlip}
        className="gap-2 cursor-pointer"
      >
        <RotateCcw className="w-3 h-3" />
        View metadata
      </ContextMenuItem>
      <ContextMenuSub>
        <ContextMenuSubTrigger className="gap-2 cursor-pointer">
          <Circle className="w-3 h-3" />
          Change color
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="grid grid-cols-4 gap-1 p-1.5">
          {CARD_COLORS.map((color) => (
            <button
              key={color.name}
              className={cn(
                "w-6 h-6 rounded-md border-2 transition-transform hover:scale-110",
                note.color === color.value ? "border-white" : "border-transparent"
              )}
              style={{ backgroundColor: color.value }}
              onClick={() => onColorChange?.(note.id, color.value)}
              title={color.name}
            />
          ))}
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuSub>
        <ContextMenuSubTrigger className="gap-2 cursor-pointer">
          {displayIcon || <Target className="w-3 h-3" />}
          Change icon
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="grid grid-cols-4 gap-1 p-1.5">
          {/* Hide icon option */}
          <button
            className={cn(
              "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-transform hover:scale-110",
              note.icon === null ? "border-white" : "border-transparent"
            )}
            onClick={() => onIconChange?.(note.id, null)}
            title="Hide icon"
          >
            <span className="text-xs">✕</span>
          </button>
          {/* Icon options */}
          {ICON_OPTIONS.map((option) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.key}
                className={cn(
                  "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-transform hover:scale-110",
                  note.icon === option.key ? "border-white" : "border-transparent"
                )}
                onClick={() => onIconChange?.(note.id, option.key)}
                title={option.name}
              >
                <IconComponent className="w-4 h-4" />
              </button>
            );
          })}
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuSeparator />
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
