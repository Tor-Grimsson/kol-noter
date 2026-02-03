import { useState, useMemo, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { BlockItem } from "./BlockItem";
import { Button } from "@/components/ui/button";
import { Plus, Code, Type, ListTodo, Image as ImageIcon, Columns2, Minus, List } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Block } from "@/store/notesStore";

interface BlockEditorProps {
  initialBlocks?: Block[];
  onChange?: (blocks: Block[]) => void;
  focusMode?: boolean;
}

export const BlockEditor = ({ initialBlocks = [], onChange, focusMode = false }: BlockEditorProps) => {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);

  // Sync blocks when initialBlocks changes (e.g., switching notes)
  useEffect(() => {
    setBlocks(initialBlocks);
  }, [JSON.stringify(initialBlocks)]);
  const [columnLayout, setColumnLayout] = useState<1 | 2>(1);
  const [showTOC, setShowTOC] = useState(false);
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());

  const toc = useMemo(() => {
    const items: { id: string; title: string; level: number; type: 'heading' | 'section' }[] = [];
    blocks.forEach((block) => {
      if (block.type === "heading" && block.content) {
        items.push({
          id: block.id,
          title: block.content,
          level: block.metadata?.level || 1,
          type: 'heading'
        });
      } else if (block.type === "section" && block.content) {
        items.push({
          id: block.id,
          title: block.content,
          level: 0,
          type: 'section'
        });
      }
    });
    return items;
  }, [blocks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newBlocks = arrayMove(items, oldIndex, newIndex);
        onChange?.(newBlocks);
        return newBlocks;
      });
    }
  };

  const addBlock = (type: Block["type"]) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: "",
      metadata: type === "heading" ? { level: 1 } : type === "code" ? { language: "javascript" } : undefined,
    };
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    onChange?.(newBlocks);
  };

  const updateBlock = (id: string, content: string, metadata?: Block["metadata"]) => {
    const newBlocks = blocks.map((block) =>
      block.id === id ? { ...block, content, metadata: metadata || block.metadata } : block
    );
    setBlocks(newBlocks);
    onChange?.(newBlocks);
  };

  const deleteBlock = (id: string) => {
    const newBlocks = blocks.filter((block) => block.id !== id);
    setBlocks(newBlocks);
    onChange?.(newBlocks);
  };

  const scrollToBlock = (blockId: string) => {
    const element = document.getElementById(`block-${blockId}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const toggleBlockCollapse = (id: string) => {
    setCollapsedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="flex-1 bg-editor-bg flex flex-col overflow-hidden">
      {/* Toolbar */}
      {!focusMode && (
      <div className="border-b border-border px-6 py-3 flex items-center gap-2 bg-card/50 backdrop-blur-sm shadow-sm text-xs">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTOC(!showTOC)}
          className="gap-2 text-xs"
        >
          <List className="w-4 h-4" />
          TOC
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <span className="text-xs text-muted-foreground">Columns</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setColumnLayout(1)}
          className="h-8 w-8 p-0 text-xs"
        >
          <Minus className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setColumnLayout(2)}
          className="h-8 w-8 p-0 text-xs"
        >
          <Plus className="w-4 h-4" />
        </Button>
        
        {/* Add Block Dropdown - Moved to top right */}
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-xs">
                <Plus className="w-4 h-4" />
                Add Block
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 animate-scale-in">
              <DropdownMenuItem onClick={() => addBlock("heading")} className="gap-3 cursor-pointer transition-colors">
                <Type className="w-4 h-4" />
                <div>
                  <div className="text-xs font-medium">Heading</div>
                  <div className="text-xs text-muted-foreground">Section title</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addBlock("paragraph")} className="gap-3 cursor-pointer transition-colors">
                <Type className="w-4 h-4" />
                <div>
                  <div className="text-xs font-medium">Paragraph</div>
                  <div className="text-xs text-muted-foreground">Plain text</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addBlock("code")} className="gap-3 cursor-pointer transition-colors">
                <Code className="w-4 h-4" />
                <div>
                  <div className="text-xs font-medium">Code Block</div>
                  <div className="text-xs text-muted-foreground">Syntax highlighted</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addBlock("list")} className="gap-3 cursor-pointer transition-colors">
                <ListTodo className="w-4 h-4" />
                <div>
                  <div className="text-xs font-medium">List</div>
                  <div className="text-xs text-muted-foreground">Bullet points</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addBlock("image")} className="gap-3 cursor-pointer">
                <ImageIcon className="w-4 h-4" />
                <div>
                  <div className="text-xs font-medium">Image</div>
                  <div className="text-xs text-muted-foreground">Embed image</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addBlock("section")} className="gap-3 cursor-pointer">
                <Minus className="w-4 h-4" />
                <div>
                  <div className="text-xs font-medium">Section Divider</div>
                  <div className="text-xs text-muted-foreground">Organize content</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      )}

      <div className={`flex-1 overflow-auto ${focusMode ? 'px-12 py-12' : 'px-6 py-6'}`}>
        {/* TOC */}
        {!focusMode && showTOC && toc.length > 0 && (
          <div className="mb-6 p-4 bg-card border border-border rounded-lg">
            <h3 className="text-xs font-semibold mb-3 text-foreground">Table of Contents</h3>
            <div className="space-y-1">
              {toc.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToBlock(item.id)}
                  className="block w-full text-left text-xs hover:text-primary transition-colors"
                  style={{
                    paddingLeft: item.type === 'heading' ? `${item.level * 12}px` : '0px',
                    fontWeight: item.type === 'section' ? 600 : item.level === 1 ? 500 : 400,
                    color: item.type === 'section' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
                  }}
                >
                  {item.type === 'section' ? '📑 ' : ''}{item.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className={`w-full ${columnLayout === 2 ? 'grid grid-cols-2 gap-4' : ''}`}>
              {columnLayout === 1 ? (
                <div className="space-y-2">
                  {blocks.map((block) => (
                    <div key={block.id} id={`block-${block.id}`}>
                      <BlockItem
                        block={block}
                        onUpdate={updateBlock}
                        onDelete={deleteBlock}
                        isCollapsed={collapsedBlocks.has(block.id)}
                        onToggleCollapse={() => toggleBlockCollapse(block.id)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {blocks.filter((_, i) => i % 2 === 0).map((block) => (
                      <div key={block.id} id={`block-${block.id}`}>
                        <BlockItem
                          block={block}
                          onUpdate={updateBlock}
                          onDelete={deleteBlock}
                          isCollapsed={collapsedBlocks.has(block.id)}
                          onToggleCollapse={() => toggleBlockCollapse(block.id)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {blocks.filter((_, i) => i % 2 === 1).map((block) => (
                      <div key={block.id} id={`block-${block.id}`}>
                        <BlockItem
                          block={block}
                          onUpdate={updateBlock}
                          onDelete={deleteBlock}
                          isCollapsed={collapsedBlocks.has(block.id)}
                          onToggleCollapse={() => toggleBlockCollapse(block.id)}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </SortableContext>
        </DndContext>

        {blocks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-xs mb-4">No blocks yet. Add your first block to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};
