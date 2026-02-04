import { useState, useRef, useEffect } from "react";
import { X, Plus, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TAG_COLOR_PRESETS } from "@/store/notesStore";

interface TagsEditorProps {
  tags: string[];
  tagColors?: { [tagName: string]: string };
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onRenameTag?: (oldName: string, newName: string) => void;
  onColorChange?: (tagName: string, color: string) => void;
  aggregatedTags?: string[]; // Tags aggregated from child items (read-only)
  className?: string;
}

export const TagsEditor = ({
  tags,
  tagColors = {},
  onAddTag,
  onRemoveTag,
  onRenameTag,
  onColorChange,
  aggregatedTags = [],
  className,
}: TagsEditorProps) => {
  const [newTag, setNewTag] = useState("");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTag && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTag]);

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAddTag(trimmed);
      setNewTag("");
    }
  };

  const handleStartEdit = (tag: string) => {
    if (onRenameTag) {
      setEditingTag(tag);
      setEditValue(tag);
    }
  };

  const handleSaveEdit = () => {
    if (editingTag && editValue.trim() && onRenameTag) {
      const trimmed = editValue.trim();
      if (trimmed !== editingTag && !tags.includes(trimmed)) {
        onRenameTag(editingTag, trimmed);
      }
    }
    setEditingTag(null);
    setEditValue("");
  };

  const getTagColor = (tag: string): string => {
    return tagColors[tag] || TAG_COLOR_PRESETS[7].value; // Default to gray
  };

  const renderTag = (tag: string, isAggregated: boolean = false) => {
    const color = getTagColor(tag);
    const isEditing = editingTag === tag;

    if (isEditing) {
      return (
        <Input
          ref={editInputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSaveEdit();
            if (e.key === "Escape") {
              setEditingTag(null);
              setEditValue("");
            }
          }}
          className="h-6 w-24 text-xs px-2"
        />
      );
    }

    return (
      <Popover>
        <div
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm group",
            isAggregated && "opacity-60"
          )}
          style={{
            backgroundColor: `${color}20`,
            color: color,
          }}
        >
          <PopoverTrigger asChild>
            <button
              onClick={() => !isAggregated && handleStartEdit(tag)}
              className="hover:underline"
              disabled={isAggregated}
            >
              {tag}
            </button>
          </PopoverTrigger>
          {!isAggregated && (
            <button
              onClick={() => onRemoveTag(tag)}
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-80"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        {onColorChange && !isAggregated && (
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex flex-wrap gap-1 max-w-[160px]">
              {TAG_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onColorChange(tag, preset.value)}
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110",
                  )}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                >
                  {color === preset.value && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </button>
              ))}
            </div>
          </PopoverContent>
        )}
      </Popover>
    );
  };

  // Combine own tags and aggregated tags, deduplicating
  const allAggregatedTags = aggregatedTags.filter(t => !tags.includes(t));

  return (
    <div className={cn("space-y-2", className)}>
      {/* Tags Display */}
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag}>{renderTag(tag)}</span>
        ))}
        {allAggregatedTags.length > 0 && (
          <>
            {tags.length > 0 && <span className="text-muted-foreground text-xs self-center mx-1">|</span>}
            {allAggregatedTags.map((tag) => (
              <span key={`agg-${tag}`}>{renderTag(tag, true)}</span>
            ))}
          </>
        )}
      </div>

      {/* Add Tag Input */}
      <div className="flex gap-2">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Add tag..."
          className="h-7 text-sm flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTag();
            }
          }}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddTag}
          className="h-7 px-2"
          disabled={!newTag.trim()}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
