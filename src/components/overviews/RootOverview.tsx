import { useState, useRef, useEffect } from "react";
import { Network, Calendar, Tag, Paperclip, Image as ImageIcon, FileText, LayoutGrid, List, Plus, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNotesStore, System, TAG_COLOR_PRESETS } from "@/store/notesStore";
import { cn } from "@/lib/utils";

interface RootOverviewProps {
  onSystemSelect?: (systemId: string) => void;
  onClose?: () => void;
}

export const RootOverview = ({ onSystemSelect, onClose }: RootOverviewProps) => {
  const { systems, notes, getAggregatedTags } = useNotesStore();
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [rootTitle, setRootTitle] = useState(() => {
    return localStorage.getItem("kol-noter-root-title") || "Root";
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSave = () => {
    const trimmed = rootTitle.trim() || "Root";
    setRootTitle(trimmed);
    localStorage.setItem("kol-noter-root-title", trimmed);
    setIsEditingTitle(false);
  };

  // Count notes per system
  const getSystemNoteCount = (systemId: string) => {
    return notes.filter(n => n.systemId === systemId).length;
  };

  // Count projects per system
  const getProjectCount = (systemId: string) => {
    const system = systems.find(s => s.id === systemId);
    return system?.projects.length || 0;
  };

  return (
    <div className="flex-1 overflow-hidden bg-background">
      <div className="flex h-full">
        {/* Left Panel - System List */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {isEditingTitle ? (
                  <Input
                    ref={titleInputRef}
                    value={rootTitle}
                    onChange={(e) => setRootTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleSave();
                      if (e.key === "Escape") {
                        setRootTitle(localStorage.getItem("kol-noter-root-title") || "Root");
                        setIsEditingTitle(false);
                      }
                    }}
                    className="text-2xl font-bold h-auto py-0 px-1 bg-transparent border-none focus-visible:ring-1 max-w-[300px]"
                  />
                ) : (
                  <h1
                    className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setIsEditingTitle(true)}
                    title="Click to edit"
                  >
                    {rootTitle}
                  </h1>
                )}
              </div>
              {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Vault overview - all systems, total projects, notes, and storage
            </p>
          </div>

          {/* View Toggle */}
          <div className="px-6 py-3 border-b border-border flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">View:</span>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8"
            >
              <LayoutGrid className="w-4 h-4 mr-1" />
              Grid
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8"
            >
              <List className="w-4 h-4 mr-1" />
              Table
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {systems.map((system) => (
                    <button
                      key={system.id}
                      onClick={() => onSystemSelect?.(system.id)}
                      className="p-4 border border-border rounded-lg hover:border-primary hover:bg-accent/50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Network className="w-4 h-4 text-primary" />
                        <h3 className="font-medium group-hover:text-primary transition-colors">
                          {system.name}
                        </h3>
                      </div>
                      {system.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {system.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{getProjectCount(system.id)} projects</span>
                        <span>{getSystemNoteCount(system.id)} notes</span>
                      </div>
                      {system.tags && system.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {system.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-sm rounded-full bg-primary/10 text-primary"
                            >
                              {tag}
                            </span>
                          ))}
                          {system.tags.length > 3 && (
                            <span className="text-sm text-muted-foreground">
                              +{system.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Description</th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">Projects</th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">Notes</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systems.map((system) => (
                      <tr
                        key={system.id}
                        onClick={() => onSystemSelect?.(system.id)}
                        className="border-b border-border hover:bg-accent/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <Network className="w-4 h-4 text-primary" />
                            <span className="font-medium">{system.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-sm text-muted-foreground">
                          {system.description || "-"}
                        </td>
                        <td className="py-3 px-3 text-center text-sm">
                          {getProjectCount(system.id)}
                        </td>
                        <td className="py-3 px-3 text-center text-sm">
                          {getSystemNoteCount(system.id)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {system.tags?.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 text-sm rounded-full bg-primary/10 text-primary"
                              >
                                {tag}
                              </span>
                            ))}
                            {(system.tags?.length || 0) > 2 && (
                              <span className="text-sm text-muted-foreground">
                                +{(system.tags?.length || 0) - 2}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Summary */}
        <div className="w-72 flex flex-col overflow-hidden bg-card">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Summary Stats */}
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-2">Summary</h2>
                <div className="space-y-1">
                  <div className="flex justify-between items-center p-1.5 rounded bg-accent/50">
                    <span className="text-sm">Total Systems</span>
                    <span className="text-sm font-medium">{systems.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded bg-accent/50">
                    <span className="text-sm">Total Projects</span>
                    <span className="text-sm font-medium">
                      {systems.reduce((acc, s) => acc + s.projects.length, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded bg-accent/50">
                    <span className="text-sm">Total Notes</span>
                    <span className="text-sm font-medium">{notes.length}</span>
                  </div>
                </div>
              </section>

              {/* All Tags */}
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-2">All Tags</h2>
                <div className="flex flex-wrap gap-1">
                  {getAggregatedTags('root').map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-sm rounded-full"
                      style={{
                        backgroundColor: `${TAG_COLOR_PRESETS[7].value}20`,
                        color: TAG_COLOR_PRESETS[7].value,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                  {getAggregatedTags('root').length === 0 && (
                    <p className="text-sm text-muted-foreground">No tags yet</p>
                  )}
                </div>
              </section>

              {/* Recent Activity */}
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-2">Recent Notes</h2>
                <div className="space-y-1">
                  {notes.slice(0, 5).map((note) => (
                    <div
                      key={note.id}
                      className="p-1.5 rounded bg-accent/30 hover:bg-accent/50 transition-colors"
                    >
                      <p className="text-sm font-medium truncate">{note.title}</p>
                      <p className="text-sm text-muted-foreground">{note.date}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Quick Actions */}
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-2">Quick Actions</h2>
                <div className="space-y-1">
                  <Button variant="outline" className="w-full justify-start h-7 text-sm" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New System
                  </Button>
                </div>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
