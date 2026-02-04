import { useState, useRef, useEffect } from "react";
import { Network, Folder, Calendar, Tag, Paperclip, Image as ImageIcon, FileText, LayoutGrid, List, Plus, X, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNotesStore, System } from "@/store/notesStore";
import { cn } from "@/lib/utils";
import { TagsEditor } from "./TagsEditor";

interface SystemOverviewProps {
  systemId: string;
  onProjectSelect?: (projectId: string) => void;
  onRootSelect?: () => void;
  onClose?: () => void;
}

export const SystemOverview = ({ systemId, onProjectSelect, onRootSelect, onClose }: SystemOverviewProps) => {
  const { systems, notes, getSystem, updateSystemMetadata, getAggregatedTags, updateSystemTagColor } = useNotesStore();
  const system = getSystem(systemId);

  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(system?.name || "");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState(system?.description || "");
  const [newTag, setNewTag] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (system) {
      setEditTitle(system.name);
      setEditDescription(system.description || "");
    }
  }, [system]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [isEditingDescription]);

  if (!system) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">System not found</p>
      </div>
    );
  }

  // Count notes per project
  const getProjectNoteCount = (projectId: string) => {
    return notes.filter(n => n.systemId === systemId && n.projectId === projectId).length;
  };

  const handleTitleSave = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== system.name) {
      updateSystemMetadata(systemId, { name: trimmed });
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    updateSystemMetadata(systemId, { description: editDescription });
    setIsEditingDescription(false);
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      const currentTags = system.tags || [];
      if (!currentTags.includes(newTag.trim())) {
        updateSystemMetadata(systemId, { tags: [...currentTags, newTag.trim()] });
      }
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = system.tags || [];
    updateSystemMetadata(systemId, { tags: currentTags.filter(t => t !== tagToRemove) });
  };

  return (
    <div className="flex-1 overflow-hidden bg-background">
      <div className="flex h-full">
        {/* Left Panel - Project List */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
          {/* Breadcrumb */}
          <div className="px-6 py-2 border-b border-border flex items-center gap-1 text-sm">
            <button
              onClick={onRootSelect}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              [Root]
            </button>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{system.name}</span>
          </div>

          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {isEditingTitle ? (
                  <Input
                    ref={titleInputRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleSave();
                      if (e.key === "Escape") {
                        setEditTitle(system.name);
                        setIsEditingTitle(false);
                      }
                    }}
                    className="text-2xl font-bold h-auto py-0 px-1 bg-transparent border-none focus-visible:ring-1"
                  />
                ) : (
                  <h1
                    className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setIsEditingTitle(true)}
                    title="Click to edit"
                  >
                    {system.name}
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
              System overview - projects and aggregate stats
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
                  {system.projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => onProjectSelect?.(project.id)}
                      className="p-4 border border-border rounded-lg hover:border-primary hover:bg-accent/50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Folder className="w-4 h-4 text-primary" />
                        <h3 className="font-medium group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                      </div>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{getProjectNoteCount(project.id)} notes</span>
                      </div>
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-sm rounded-full bg-primary/10 text-primary"
                            >
                              {tag}
                            </span>
                          ))}
                          {project.tags.length > 3 && (
                            <span className="text-sm text-muted-foreground">
                              +{project.tags.length - 3}
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
                      <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">Notes</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {system.projects.map((project) => (
                      <tr
                        key={project.id}
                        onClick={() => onProjectSelect?.(project.id)}
                        className="border-b border-border hover:bg-accent/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-primary" />
                            <span className="font-medium">{project.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-sm text-muted-foreground">
                          {project.description || "-"}
                        </td>
                        <td className="py-3 px-3 text-center text-sm">
                          {getProjectNoteCount(project.id)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {project.tags?.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 text-sm rounded-full bg-primary/10 text-primary"
                              >
                                {tag}
                              </span>
                            ))}
                            {(project.tags?.length || 0) > 2 && (
                              <span className="text-sm text-muted-foreground">
                                +{(project.tags?.length || 0) - 2}
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

        {/* Right Panel - System Details */}
        <div className="w-72 flex flex-col overflow-hidden bg-card">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Description */}
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-2">Description</h2>
                {isEditingDescription ? (
                  <div className="space-y-2">
                    <Textarea
                      ref={descriptionInputRef}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Add a description..."
                      className="min-h-[80px] resize-none text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleDescriptionSave} className="h-7 text-sm">Save</Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-sm"
                        onClick={() => {
                          setEditDescription(system.description || "");
                          setIsEditingDescription(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="p-2 rounded-lg bg-accent/30 min-h-[50px] cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    <p className="text-sm">
                      {system.description || "Click to add a description..."}
                    </p>
                  </div>
                )}
              </section>

              {/* Tags */}
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-2">Tags</h2>
                <TagsEditor
                  tags={system.tags || []}
                  tagColors={system.tagColors}
                  onAddTag={handleAddTag}
                  onRemoveTag={handleRemoveTag}
                  onRenameTag={(oldName, newName) => {
                    const currentTags = system.tags || [];
                    const newTags = currentTags.map(t => t === oldName ? newName : t);
                    updateSystemMetadata(systemId, { tags: newTags });
                  }}
                  onColorChange={(tagName, color) => updateSystemTagColor(systemId, tagName, color)}
                  aggregatedTags={getAggregatedTags('system', systemId)}
                />
              </section>

              {/* Metadata */}
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-2">Metadata</h2>
                <div className="space-y-1">
                  <div className="flex justify-between items-center p-1.5 rounded bg-accent/30">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="text-sm">
                      {system.createdAt
                        ? new Date(system.createdAt).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded bg-accent/30">
                    <span className="text-sm text-muted-foreground">Modified</span>
                    <span className="text-sm">
                      {system.updatedAt
                        ? new Date(system.updatedAt).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded bg-accent/30">
                    <span className="text-sm text-muted-foreground">Projects</span>
                    <span className="text-sm">{system.projects.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded bg-accent/30">
                    <span className="text-sm text-muted-foreground">Notes</span>
                    <span className="text-sm">
                      {notes.filter(n => n.systemId === systemId).length}
                    </span>
                  </div>
                </div>
              </section>

              {/* Quick Actions */}
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-2">Quick Actions</h2>
                <div className="space-y-1">
                  <Button variant="outline" className="w-full justify-start h-7 text-sm" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
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
