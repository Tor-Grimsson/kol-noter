import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Plus, User, Target as TargetIcon, Calendar as CalendarIcon, ChevronDown, GripVertical, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useNotesStore, TAG_COLOR_PRESETS } from "@/store/notesStore";
import { TagsEditor } from "./TagsEditor";

interface SystemOverviewProps {
  systemId: string;
  onProjectSelect?: (projectId: string) => void;
  onRootSelect?: () => void;
  onClose?: () => void;
}

type ColumnId = "name" | "health" | "priority" | "lead" | "targetDate" | "status";

interface Column {
  id: ColumnId;
  label: string;
  width: number;
}

export const SystemOverview = ({ systemId, onProjectSelect, onRootSelect, onClose }: SystemOverviewProps) => {
  const { systems, notes, getSystem, updateSystemMetadata, getAggregatedTags, updateSystemTagColor, addProject } = useNotesStore();
  const system = getSystem(systemId);

  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [calendarView, setCalendarView] = useState<"month" | "year" | "week">("month");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState(system?.description || "");
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const [columns, setColumns] = useState<Column[]>([
    { id: "name", label: "Name", width: 300 },
    { id: "health", label: "Health", width: 150 },
    { id: "priority", label: "Priority", width: 120 },
    { id: "lead", label: "Lead", width: 180 },
    { id: "targetDate", label: "Target date", width: 150 },
    { id: "status", label: "Status", width: 150 },
  ]);
  const [resizingColumn, setResizingColumn] = useState<ColumnId | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    if (system) {
      setEditDescription(system.description || "");
    }
  }, [system]);

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

  const systemNotes = notes.filter(n => n.systemId === systemId);

  const getHealthColor = (health?: "good" | "warning" | "critical") => {
    switch (health) {
      case "good": return "text-success";
      case "warning": return "text-warning";
      case "critical": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getPriorityBadge = (priority?: "low" | "medium" | "high") => {
    const variants = {
      low: "bg-muted text-muted-foreground",
      medium: "bg-warning/20 text-warning",
      high: "bg-destructive/20 text-destructive",
    };
    return priority ? variants[priority] : "bg-muted text-muted-foreground";
  };

  const handleResizeStart = (columnId: ColumnId, e: React.MouseEvent) => {
    e.preventDefault();
    setResizingColumn(columnId);
    startXRef.current = e.clientX;
    const column = columns.find(c => c.id === columnId);
    if (column) {
      startWidthRef.current = column.width;
    }
  };

  useEffect(() => {
    if (!resizingColumn) return;

    const handleResizeMove = (e: MouseEvent) => {
      const diff = e.clientX - startXRef.current;
      const newWidth = Math.max(80, startWidthRef.current + diff);

      setColumns(cols =>
        cols.map(col =>
          col.id === resizingColumn ? { ...col, width: newWidth } : col
        )
      );
    };

    const handleResizeEnd = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [resizingColumn]);

  const handleDescriptionSave = () => {
    updateSystemMetadata(systemId, { description: editDescription });
    setIsEditingDescription(false);
  };

  const handleAddTag = (tagName: string) => {
    const currentTags = system.tags || [];
    if (!currentTags.includes(tagName)) {
      updateSystemMetadata(systemId, { tags: [...currentTags, tagName] });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = system.tags || [];
    updateSystemMetadata(systemId, { tags: currentTags.filter(t => t !== tagToRemove) });
  };

  const handleAddProject = () => {
    const newProject = addProject(systemId, "New Project");
    if (newProject && onProjectSelect) {
      onProjectSelect(newProject.id);
    }
  };

  const renderCell = (project: typeof system.projects[0], columnId: ColumnId) => {
    switch (columnId) {
      case "name":
        return (
          <div className="flex items-center gap-2">
            <TargetIcon className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">{project.name}</span>
          </div>
        );
      case "health":
        return (
          <div className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full", getHealthColor(project.metrics?.health))}
                 style={{ backgroundColor: project.metrics?.health ? undefined : 'currentColor' }} />
            <span className="text-xs text-muted-foreground">
              {project.metrics?.health === "good" && "On track"}
              {project.metrics?.health === "warning" && "No updates"}
              {project.metrics?.health === "critical" && "At risk"}
              {!project.metrics?.health && "No updates"}
            </span>
          </div>
        );
      case "priority":
        return project.metrics?.priority ? (
          <Badge className={cn("text-[10px] px-1.5 py-0", getPriorityBadge(project.metrics.priority))}>
            {project.metrics.priority}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        );
      case "lead":
        return project.metrics?.lead ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
              <span className="text-[10px] font-medium text-accent-foreground">
                {project.metrics.lead.split(" ").map(n => n[0]).join("")}
              </span>
            </div>
            <span className="text-xs text-foreground">{project.metrics.lead}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-3 h-3" />
            <span className="text-xs">No lead</span>
          </div>
        );
      case "targetDate":
        return project.metrics?.targetDate ? (
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-foreground">{project.metrics.targetDate}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        );
      case "status":
        const statusPercent = project.metrics?.status === 'done' ? 100
          : project.metrics?.status === 'in_progress' ? 45
          : project.metrics?.status === 'blocked' ? 25
          : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden max-w-[80px]">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${statusPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground min-w-[28px]">{statusPercent}%</span>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 overflow-hidden bg-background">
      <div className="flex h-full">
        {/* Left Panel - Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
          {/* Header */}
          <div className="h-12 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 shadow-sm">
            <div className="flex-1 flex items-center gap-4">
              <span className="text-sm font-medium">Overview</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 text-xs h-8">
                    {viewMode === "list" ? "Projects" : "Timeline"}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-popover">
                  <DropdownMenuItem onClick={() => setViewMode("list")}>
                    Projects
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode("timeline")}>
                    Timeline
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Filter..."
                className="pl-3 bg-input border-input-border h-8 w-48 text-xs"
              />
              <Button size="sm" className="gap-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs h-8" onClick={handleAddProject}>
                <Plus className="w-3 h-3" />
                Add project
              </Button>
              {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          {viewMode === "timeline" ? (
            <div className="flex-1 overflow-auto flex flex-col">
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-semibold">Project Timeline</h2>
                  <div className="flex gap-1 border rounded-md p-1">
                    <Button
                      variant={calendarView === "week" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setCalendarView("week")}
                    >
                      Week
                    </Button>
                    <Button
                      variant={calendarView === "month" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setCalendarView("month")}
                    >
                      Month
                    </Button>
                    <Button
                      variant={calendarView === "year" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setCalendarView("year")}
                    >
                      Year
                    </Button>
                  </div>
                </div>

                <div className="h-[350px] flex flex-col">
                  {calendarView === "month" && (
                    <div className="h-full border rounded-md overflow-hidden">
                      <Calendar
                        mode="single"
                        className="w-full h-full p-6"
                        onDayClick={() => setCalendarView("week")}
                      />
                    </div>
                  )}

                  {calendarView === "year" && (
                    <div className="grid grid-cols-4 gap-4 h-full content-start">
                      {Array.from({ length: 12 }, (_, i) => (
                        <button
                          key={i}
                          className="border rounded-md p-6 hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-center"
                          onClick={() => setCalendarView("month")}
                        >
                          <div className="text-center">
                            <div className="text-2xl font-semibold mb-1">
                              {new Date(2024, i).toLocaleString('default', { month: 'short' })}
                            </div>
                            <div className="text-xs text-muted-foreground">2024</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {calendarView === "week" && (
                    <div className="border rounded-md h-full flex flex-col">
                      <div className="grid grid-cols-7 border-b">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                          <div key={day} className="p-3 text-center text-xs font-medium border-r last:border-r-0">
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 flex-1">
                        {Array.from({ length: 7 }, (_, i) => (
                          <div key={i} className="border-r last:border-r-0 p-3 flex flex-col">
                            <div className="text-xs font-medium mb-2">
                              {new Date(Date.now() + i * 86400000).getDate()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-4">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Projects</div>
                  {system.projects.map((project) => (
                    <div
                      key={project.id}
                      className="p-3 border rounded-lg bg-card cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => onProjectSelect?.(project.id)}
                    >
                      <div className="flex items-center gap-3">
                        <TargetIcon className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{project.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Target: {project.metrics?.targetDate || "Not set"}
                          </div>
                        </div>
                        {project.metrics?.priority && (
                          <Badge className={cn("text-xs", getPriorityBadge(project.metrics.priority))}>
                            {project.metrics.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-background border-b border-border z-10">
                  <tr>
                    {columns.map((column, index) => (
                      <th
                        key={column.id}
                        className="text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-3 py-1.5 relative"
                        style={{ width: `${column.width}px` }}
                      >
                        {column.label}
                        {index < columns.length - 1 && (
                          <div
                            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 transition-colors group"
                            onMouseDown={(e) => handleResizeStart(column.id, e)}
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <GripVertical className="w-3 h-3 text-primary" />
                            </div>
                          </div>
                        )}
                      </th>
                    ))}
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {system.projects.map((project) => (
                    <tr
                      key={project.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => onProjectSelect?.(project.id)}
                    >
                      {columns.map(column => (
                        <td key={column.id} className="px-3 py-2" style={{ width: `${column.width}px` }}>
                          {renderCell(project, column.id)}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                    <span className="text-sm">{systemNotes.length}</span>
                  </div>
                </div>
              </section>

              {/* Quick Actions */}
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-2">Quick Actions</h2>
                <div className="space-y-1">
                  <Button variant="outline" className="w-full justify-start h-7 text-sm" size="sm" onClick={handleAddProject}>
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
