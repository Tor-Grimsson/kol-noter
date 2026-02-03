import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Code, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { Block } from "./BlockEditor";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BlockItemProps {
  block: Block;
  onUpdate: (id: string, content: string, metadata?: Block["metadata"]) => void;
  onDelete: (id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const BlockItem = ({ block, onUpdate, onDelete, isCollapsed, onToggleCollapse }: BlockItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getBlockTypeLabel = () => {
    const labels = {
      heading: `H${block.metadata?.level || 1}`,
      paragraph: "Paragraph",
      code: "Code",
      list: "List",
      image: "Image",
      section: "Section"
    };
    return labels[block.type];
  };

  const getBlockPreview = () => {
    if (block.type === "section") return block.content || "Section Divider";
    return block.content.slice(0, 50) + (block.content.length > 50 ? "..." : "") || `Empty ${getBlockTypeLabel()}`;
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case "section":
        return (
          <div className="py-2">
            <div className="flex items-center gap-3">
              <Separator className="flex-1 bg-primary/30" />
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-primary" />
                <Input
                  value={block.content}
                  onChange={(e) => onUpdate(block.id, e.target.value)}
                  placeholder="Section name..."
                  className="w-auto text-center border-0 bg-transparent focus-visible:ring-0 font-semibold text-primary text-xs px-3"
                />
              </div>
              <Separator className="flex-1 bg-primary/30" />
            </div>
          </div>
        );

      case "heading":
        return (
          <div className="space-y-2">
            <Select
              value={block.metadata?.level?.toString() || "1"}
              onValueChange={(value) =>
                onUpdate(block.id, block.content, { ...block.metadata, level: parseInt(value) })
              }
            >
              <SelectTrigger className="w-32 h-8 bg-transparent border border-border/50 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="1">Heading 1</SelectItem>
                <SelectItem value="2">Heading 2</SelectItem>
                <SelectItem value="3">Heading 3</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={block.content}
              onChange={(e) => onUpdate(block.id, e.target.value)}
              placeholder="Enter heading..."
              className={cn(
                "bg-transparent border-0 focus-visible:ring-0 px-0 text-xs",
                block.metadata?.level === 1 && "font-bold",
                block.metadata?.level === 2 && "font-semibold",
                block.metadata?.level === 3 && "font-medium"
              )}
            />
          </div>
        );

      case "paragraph":
        return (
          <Textarea
            value={block.content}
            onChange={(e) => onUpdate(block.id, e.target.value)}
            placeholder="Start writing..."
            className="bg-transparent !border-0 !rounded-none focus-visible:!ring-0 focus:!ring-0 focus:!outline-none !shadow-none px-0 min-h-[100px] resize-none text-xs ring-0 ring-offset-0"
          />
        );

      case "code":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-muted-foreground" />
              <Select
                value={block.metadata?.language || "javascript"}
                onValueChange={(value) =>
                  onUpdate(block.id, block.content, { ...block.metadata, language: value })
                }
              >
                <SelectTrigger className="w-40 h-8 bg-transparent border border-border/50 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={block.content}
              onChange={(e) => onUpdate(block.id, e.target.value)}
              placeholder="// Enter your code..."
              className="bg-code-bg border border-code-border font-mono text-xs min-h-[200px] resize-none"
            />
          </div>
        );

      case "list":
        return (
          <Textarea
            value={block.content}
            onChange={(e) => onUpdate(block.id, e.target.value)}
            placeholder="- Item 1&#10;- Item 2&#10;- Item 3"
            className="bg-transparent !border-0 !rounded-none focus-visible:!ring-0 focus:!ring-0 focus:!outline-none !shadow-none px-0 min-h-[100px] resize-none text-xs ring-0 ring-offset-0"
          />
        );

      case "image":
        return (
          <div className="space-y-2">
            <Input
              value={block.content}
              onChange={(e) => onUpdate(block.id, e.target.value)}
              placeholder="Enter image URL..."
              className="bg-transparent border border-border/50 text-xs"
            />
            {block.content && (
              <div className="rounded-lg overflow-hidden border border-border">
                <img
                  src={block.content}
                  alt="Block content"
                  className="w-full h-auto"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-card border border-border rounded-lg p-4 transition-all duration-200 animate-fade-in",
        isDragging && "opacity-50 shadow-lg scale-105",
        !isDragging && "hover:border-primary/50 hover:shadow-md"
      )}
    >
      <div className="absolute left-0 top-4 -ml-6 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 cursor-grab active:cursor-grabbing hover:bg-primary/10 transition-all"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>

      <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1">
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 hover:bg-accent/10 transition-all hover:scale-110"
            onClick={onToggleCollapse}
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-destructive hover:bg-destructive/10 transition-all hover:scale-110"
          onClick={() => onDelete(block.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {isCollapsed ? (
        <div className="flex items-center gap-2 text-muted-foreground animate-fade-in">
          <span className="text-xs font-medium bg-muted px-2 py-1 rounded transition-colors">
            {getBlockTypeLabel()}
          </span>
          <span className="text-xs truncate">{getBlockPreview()}</span>
        </div>
      ) : (
        <div className="animate-fade-in">{renderBlockContent()}</div>
      )}
    </div>
  );
};
