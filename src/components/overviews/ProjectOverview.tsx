import { useState, useRef, useEffect } from "react";
import { Network, Folder, FileText, Calendar, Tag, Paperclip, Image as ImageIcon, LayoutGrid, List, Plus, X, ChevronRight, Table2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNotesStore, Note, EditorType, ItemMetrics } from "@/store/notesStore";
import { cn } from "@/lib/utils";
import { MetricsTable } from "./MetricsTable";
import { TagsEditor } from "./TagsEditor";

interface ProjectOverviewProps {
  systemId: string;
  projectId: string;
  onNoteSelect?: (noteId: string, editorType: EditorType) => void;
  onSystemSelect?: (systemId: string) => void;
  onRootSelect?: () => void;
  onClose?: () => void;
}

export const ProjectOverview = ({
  systemId,
  projectId,
  onNoteSelect,
  onSystemSelect,
  onRootSelect,
  onClose,
}: ProjectOverviewProps) => {
  const {
    systems, notes, getSystem, getProject, updateProjectMetadata, getNotesByProject,
    getAggregatedTags, updateProjectTagColor, updateNoteMetrics
  } = useNotesStore();
  const system = getSystem(systemId);
  const project = getProject(systemId, projectId);
  const projectNotes = getNotesByProject(systemId, projectId);

  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [showMetrics, setShowMetrics] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(project?.name || "");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState(project?.description || "");
  const [newTag, setNewTag] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (project) {
      setEditTitle(project.name);
      setEditDescription(project.description || "");
    }
  }, [project]);

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

  if (!system || !project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  const handleTitleSave = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== project.name) {
      updateProjectMetadata(systemId, projectId, { name: trimmed });
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    updateProjectMetadata(systemId, projectId, { description: editDescription });
    setIsEditingDescription(false);
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      const currentTags = project.tags || [];
      if (!currentTags.includes(newTag.trim())) {
        updateProjectMetadata(systemId, projectId, { tags: [...currentTags, newTag.trim()] });
      }
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = project.tags || [];
    updateProjectMetadata(systemId, projectId, { tags: currentTags.filter(t => t !== tagToRemove) });
  };

  const getEditorTypeIcon = (type: EditorType) => {
    return <FileText className="w-4 h-4 text-primary" />;
  };

  const getEditorTypeLabel = (type: EditorType) => {
    switch (type) {
      case "modular": return "Block";
      case "standard": return "Markdown";
      case "visual": return "Visual";
      case "typography": return "Typography";
      default: return type;
    }
  };

  return (
    <div className="flex-1 overflow-hidden bg-background">
      <div className="flex h-full">
        {/* Left Panel - Notes List */}
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
            <button
              onClick={() => onSystemSelect?.(systemId)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {system.name}
            </button>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{project.name}</span>
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
                        setEditTitle(project.name);
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
                    {project.name}
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
              Project overview - notes and project-level metadata
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
            <div className="ml-auto">
              <Button
                variant={showMetrics ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowMetrics(!showMetrics)}
                className="h-8"
              >
                <Table2 className="w-4 h-4 mr-1" />
                Metrics
              </Button>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              {/* Metrics Table */}
              {showMetrics && projectNotes.length > 0 && (
                <div className="mb-6">
                  <MetricsTable
                    items={projectNotes.map(note => ({
                      id: note.id,
                      name: note.title,
                      metrics: note.metrics,
                      onClick: () => onNoteSelect?.(note.id, note.editorType),
                    }))}
                    onMetricsChange={(id, metrics) => updateNoteMetrics(id, metrics)}
                  />
                </div>
              )}

              {projectNotes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No notes in this project yet</p>
                </div>
              ) : !showMetrics && viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projectNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => onNoteSelect?.(note.id, note.editorType)}
                      className="p-4 border border-border rounded-lg hover:border-primary hover:bg-accent/50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getEditorTypeIcon(note.editorType)}
                        <h3 className="font-medium group-hover:text-primary transition-colors truncate">
                          {note.title}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {note.preview}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{note.date}</span>
                        <span className="px-1.5 py-0.5 rounded bg-accent">
                          {getEditorTypeLabel(note.editorType)}
                        </span>
                      </div>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-sm rounded-full bg-primary/10 text-primary"
                            >
                              {tag}
                            </span>
                          ))}
                          {note.tags.length > 3 && (
                            <span className="text-sm text-muted-foreground">
                              +{note.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : !showMetrics ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Title</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Preview</th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Modified</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectNotes.map((note) => (
                      <tr
                        key={note.id}
                        onClick={() => onNoteSelect?.(note.id, note.editorType)}
                        className="border-b border-border hover:bg-accent/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {getEditorTypeIcon(note.editorType)}
                            <span className="font-medium truncate max-w-[150px]">{note.title}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-sm text-muted-foreground">
                          <span className="truncate block max-w-[200px]">{note.preview}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 text-sm rounded bg-accent">
                            {getEditorTypeLabel(note.editorType)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-sm text-muted-foreground">
                          {note.date}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {note.tags?.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 text-sm rounded-full bg-primary/10 text-primary"
                              >
                                {tag}
                              </span>
                            ))}
                            {(note.tags?.length || 0) > 2 && (
                              <span className="text-sm text-muted-foreground">
                                +{(note.tags?.length || 0) - 2}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Project Details */}
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
                          setEditDescription(project.description || "");
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
                      {project.description || "Click to add a description..."}
                    </p>
                  </div>
                )}
              </section>

              {/* Tags */}
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-2">Tags</h2>
                <TagsEditor
                  tags={project.tags || []}
                  tagColors={project.tagColors}
                  onAddTag={handleAddTag}
                  onRemoveTag={handleRemoveTag}
                  onRenameTag={(oldName, newName) => {
                    const currentTags = project.tags || [];
                    const newTags = currentTags.map(t => t === oldName ? newName : t);
                    updateProjectMetadata(systemId, projectId, { tags: newTags });
                  }}
                  onColorChange={(tagName, color) => updateProjectTagColor(systemId, projectId, tagName, color)}
                  aggregatedTags={getAggregatedTags('project', projectId)}
                />
              </section>

              {/* Metadata */}
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-2">Metadata</h2>
                <div className="space-y-1">
                  <div className="flex justify-between items-center p-1.5 rounded bg-accent/30">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="text-sm">
                      {project.createdAt
                        ? new Date(project.createdAt).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded bg-accent/30">
                    <span className="text-sm text-muted-foreground">Modified</span>
                    <span className="text-sm">
                      {project.updatedAt
                        ? new Date(project.updatedAt).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 rounded bg-accent/30">
                    <span className="text-sm text-muted-foreground">Notes</span>
                    <span className="text-sm">{projectNotes.length}</span>
                  </div>
                </div>
              </section>

              {/* Quick Actions */}
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-2">Quick Actions</h2>
                <div className="space-y-1">
                  <Button variant="outline" className="w-full justify-start h-7 text-sm" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Note
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
