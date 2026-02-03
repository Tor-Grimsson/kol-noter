import { Star, Folder, Tag, Plus, ChevronRight, ChevronDown, Target } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FolderItem {
  id: string;
  name: string;
  type: "folder" | "tag";
  count?: number;
  children?: FolderItem[];
}

interface FolderSidebarProps {
  collapsed?: boolean;
}

export const FolderSidebar = ({ collapsed = false }: FolderSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["favorites"]));
  const [selectedItem, setSelectedItem] = useState<string>("all");

  const folders: FolderItem[] = [
    { id: "all", name: "All Notes", type: "folder", count: 12 },
    { id: "favorites", name: "Favorites", type: "folder", count: 3 },
    {
      id: "projects",
      name: "Projects",
      type: "folder",
      children: [
        { id: "work", name: "Work", type: "folder", count: 5 },
        { id: "personal", name: "Personal", type: "folder", count: 4 },
      ],
    },
  ];

  const tags = [
    { id: "tag-urgent", name: "Urgent", type: "tag" as const, count: 2 },
    { id: "tag-ideas", name: "Ideas", type: "tag" as const, count: 7 },
    { id: "tag-learning", name: "Learning", type: "tag" as const, count: 3 },
  ];

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolderItem = (item: FolderItem, level: number = 0) => {
    const isExpanded = expandedFolders.has(item.id);
    const isSelected = selectedItem === item.id;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="w-full">
        <button
          onClick={() => {
            setSelectedItem(item.id);
            if (hasChildren) toggleFolder(item.id);
          }}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors group",
            "hover:bg-sidebar-item",
            isSelected && "bg-sidebar-active text-foreground font-medium"
          )}
          style={{ paddingLeft: `${0.75 + level * 0.75}rem` }}
        >
          {hasChildren && (
            <div className="flex items-center justify-center w-4 h-4">
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
          )}
          {!hasChildren && item.id === "favorites" && (
            <Star className="w-4 h-4 text-warning fill-warning" />
          )}
          {!hasChildren && item.id !== "favorites" && (
            <Folder className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          )}
          <span className="flex-1 text-left truncate">{item.name}</span>
          {item.count !== undefined && (
            <span className="text-xs text-muted-foreground">{item.count}</span>
          )}
        </button>
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderFolderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (collapsed) {
    return (
      <div className="w-14 border-r border-sidebar-border bg-sidebar-bg flex flex-col items-center py-4 gap-2">
        <Button size="icon" variant="ghost" className="w-10 h-10">
          <Star className="w-5 h-5" />
        </Button>
        <Button size="icon" variant="ghost" className="w-10 h-10">
          <Folder className="w-5 h-5" />
        </Button>
        <Button size="icon" variant="ghost" className="w-10 h-10">
          <Tag className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-sidebar-border bg-sidebar-bg flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Journal</h2>
          <Button size="icon" variant="ghost" className="w-8 h-8 hover:bg-sidebar-item">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <button
          onClick={() => navigate("/projects")}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
            "hover:bg-sidebar-item",
            location.pathname === "/projects" && "bg-sidebar-active text-foreground font-medium"
          )}
        >
          <Target className="w-4 h-4 text-muted-foreground" />
          <span className="flex-1 text-left">Projects</span>
        </button>
      </div>

      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-1">
          {folders.map((folder) => renderFolderItem(folder))}
        </div>

        <div className="mt-6 px-3">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tags
            </h3>
          </div>
          <div className="space-y-1">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedItem(tag.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  "hover:bg-sidebar-item",
                  selectedItem === tag.id && "bg-sidebar-active text-foreground font-medium"
                )}
              >
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="flex-1 text-left truncate">{tag.name}</span>
                {tag.count !== undefined && (
                  <span className="text-xs text-muted-foreground">{tag.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
