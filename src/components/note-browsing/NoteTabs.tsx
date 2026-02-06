import { useState, useRef, useEffect } from "react";
import { X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui-elements/atoms/Button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface Tab {
  id: string;
  title: string;
}

interface NoteTabsProps {
  tabs: Tab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabRename?: (tabId: string, newTitle: string) => void;
}

export const NoteTabs = ({ tabs, activeTabId, onTabSelect, onTabClose, onTabRename }: NoteTabsProps) => {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTabId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabId]);

  const handleStartRename = (tab: Tab) => {
    setEditingTabId(tab.id);
    setEditTitle(tab.title);
  };

  const handleFinishRename = () => {
    if (editingTabId && editTitle.trim()) {
      onTabRename?.(editingTabId, editTitle.trim());
    }
    setEditingTabId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFinishRename();
    } else if (e.key === "Escape") {
      setEditingTabId(null);
    }
  };

  return (
    <ScrollArea className="w-full border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-1 px-2 py-1">
        {tabs.map((tab) => (
          <ContextMenu key={tab.id}>
            <ContextMenuTrigger asChild>
              <div
                className={cn(
                  "group flex items-center gap-2 px-3 py-1.5 rounded-t-md transition-all duration-200 ease-smooth cursor-pointer min-w-[120px] max-w-[200px]",
                  activeTabId === tab.id
                    ? "bg-background border-b-2 border-primary shadow-sm"
                    : "bg-card/80 hover:bg-muted hover:shadow-sm hover:scale-[1.02]"
                )}
                onClick={() => onTabSelect(tab.id)}
              >
                {editingTabId === tab.id ? (
                  <Input
                    ref={inputRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleFinishRename}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="h-5 text-xs font-medium px-1 py-0 flex-1 bg-transparent border-none focus-visible:ring-0 focus:ring-0 focus:outline-none"
                  />
                ) : (
                  <span className={cn(
                    "text-xs font-medium truncate flex-1 transition-colors",
                    activeTabId === tab.id ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {tab.title}
                  </span>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-4 h-4 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-40">
              <ContextMenuItem
                onClick={() => handleStartRename(tab)}
                className="gap-2 cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                Rename note
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
