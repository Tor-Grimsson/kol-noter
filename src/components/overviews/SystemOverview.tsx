import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Plus, User, Target as TargetIcon, Calendar as CalendarIcon, ChevronDown, GripVertical, X, Folder, ChevronLeft, ChevronRight, ArrowDown, ArrowRight } from "lucide-react";
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
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import { ItemMetadataPanel } from "@/components/ItemMetadataPanel";

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
  const {
    systems, notes, getSystem, getProject, updateSystemMetadata, getAggregatedTags,
    updateSystemTagColor, addProject, addSystemAttachment, removeSystemAttachment,
    addSystemPhoto, removeSystemPhoto, addSystemLink, removeSystemLink, updateSystemLink,
    addSystemVoiceRecording, removeSystemVoiceRecording, updateSystemDetailNotes,
    addSystemTag, removeSystemTag, deleteSystem, updateSystemColorIcon,
    addProjectPhoto, removeProjectPhoto, addProjectLink, removeProjectLink, updateProjectLink,
    addProjectVoiceRecording, removeProjectVoiceRecording, updateProjectDetailNotes,
    addProjectTag, removeProjectTag, deleteProject, updateProjectColorIcon,
  } = useNotesStore();
  const system = getSystem(systemId);

  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [calendarView, setCalendarView] = useState<"month" | "year" | "week">("month");
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage("system-overview-sidebar-collapsed", true);
  const [sidebarPosition, setSidebarPosition] = useLocalStorage<'right' | 'bottom'>("overview-sidebar-position", "right");
  const [sidebarWidth, setSidebarWidth] = useLocalStorage("system-overview-sidebar-width", 280);
  const [isResizing, setIsResizing] = useState(false);
  const resizingStartRef = useRef({ x: 0, width: 0 });
  const MIN_SIDEBAR_WIDTH = 200;
  const MAX_SIDEBAR_WIDTH = 480;
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

  // Auto-expand sidebar when row is selected
  useEffect(() => {
    if (selectedRowId) {
      setSidebarCollapsed(false);
    }
  }, [selectedRowId, setSidebarCollapsed]);

  const selectedProject = selectedRowId ? getProject(systemId, selectedRowId) : null;

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

  // Sidebar resize handling
  useEffect(() => {
    if (!isResizing) return;

    const handleResizeMove = (e: MouseEvent) => {
      const diff = sidebarPosition === 'right'
        ? e.clientX - resizingStartRef.current.x
        : resizingStartRef.current.x - e.clientY;
      let newWidth = resizingStartRef.current.width + diff;

      newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth));
      setSidebarWidth(newWidth);
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, sidebarPosition]);

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

  const handleRowClick = (projectId: string) => {
    setSelectedRowId(projectId);
  };

  const handleRowDoubleClick = (projectId: string) => {
    onProjectSelect?.(projectId);
  };

  const renderCell = (project: typeof system.projects[0], columnId: ColumnId) => {
    switch (columnId) {
      case "name":
        return (
          <div className="flex items-center gap-2">
            <TargetIcon
              className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onProjectSelect?.(project.id);
              }}
            />
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

  const renderSidebarContent = () => {
    const isBottom = sidebarPosition === 'bottom';

    if (selectedProject) {
      return (
        <ItemMetadataPanel
          itemType="project"
          itemName={selectedProject.name}
          itemDescription={selectedProject.description}
          createdAt={selectedProject.createdAt}
          updatedAt={selectedProject.updatedAt}
          isBottomPanel={isBottom}
          attachments={selectedProject.attachments || []}
          photos={selectedProject.photos || []}
          links={selectedProject.links || []}
          voiceRecordings={selectedProject.voiceRecordings || []}
          tags={selectedProject.tags || []}
          tagColors={selectedProject.tagColors}
          aggregatedTags={getAggregatedTags('project', selectedProject.id)}
          detailNotes={selectedProject.detailNotes}
          onAddAttachment={(att) => {
            // For projects, we need to go through the system
            const system = systems.find(s => s.id === systemId);
            if (system) {
              const projects = system.projects.map(p =>
                p.id === selectedProject.id
                  ? { ...p, attachments: [...(p.attachments || []), att] }
                  : p
              );
              updateSystemMetadata(systemId, { projects } as any);
            }
          }}
          onRemoveAttachment={(attId) => {
            const system = systems.find(s => s.id === systemId);
            if (system) {
              const projects = system.projects.map(p =>
                p.id === selectedProject.id
                  ? { ...p, attachments: (p.attachments || []).filter(a => a.id !== attId) }
                  : p
              );
              updateSystemMetadata(systemId, { projects } as any);
            }
          }}
          onAddPhoto={(name, dataUrl) => addProjectPhoto(systemId, selectedProject.id, name, dataUrl)}
          onRemovePhoto={(photoId) => removeProjectPhoto(systemId, selectedProject.id, photoId)}
          onAddLink={(url, title) => addProjectLink(systemId, selectedProject.id, url, title)}
          onRemoveLink={(linkId) => removeProjectLink(systemId, selectedProject.id, linkId)}
          onUpdateLink={(linkId, updates) => updateProjectLink(systemId, selectedProject.id, linkId, updates)}
          onAddVoiceRecording={(name, dataUrl, duration) =>
            addProjectVoiceRecording(systemId, selectedProject.id, name, dataUrl, duration)
          }
          onRemoveVoiceRecording={(recId) =>
            removeProjectVoiceRecording(systemId, selectedProject.id, recId)
          }
          onAddTag={(tag) => addProjectTag(systemId, selectedProject.id, tag)}
          onRemoveTag={(tag) => removeProjectTag(systemId, selectedProject.id, tag)}
          onUpdateDetailNotes={(notes) => updateProjectDetailNotes(systemId, selectedProject.id, notes)}
          onDelete={() => {
            if (confirm(`Delete project "${selectedProject.name}"?`)) {
              deleteProject(systemId, selectedProject.id);
              setSelectedRowId(null);
            }
          }}
        />
      );
    }

    return (
      <ItemMetadataPanel
        itemType="system"
        itemName={system.name}
        itemDescription={system.description}
        createdAt={system.createdAt}
        updatedAt={system.updatedAt}
        isBottomPanel={isBottom}
        attachments={system.attachments || []}
        photos={system.photos || []}
        links={system.links || []}
        voiceRecordings={system.voiceRecordings || []}
        tags={system.tags || []}
        tagColors={system.tagColors}
        aggregatedTags={getAggregatedTags('system', systemId)}
        detailNotes={system.detailNotes}
        onAddAttachment={(att) => addSystemAttachment(systemId, att)}
        onRemoveAttachment={(attId) => removeSystemAttachment(systemId, attId)}
        onAddPhoto={(name, dataUrl) => addSystemPhoto(systemId, name, dataUrl)}
        onRemovePhoto={(photoId) => removeSystemPhoto(systemId, photoId)}
        onAddLink={(url, title) => addSystemLink(systemId, url, title)}
        onRemoveLink={(linkId) => removeSystemLink(systemId, linkId)}
        onUpdateLink={(linkId, updates) => updateSystemLink(systemId, linkId, updates)}
        onAddVoiceRecording={(name, dataUrl, duration) =>
          addSystemVoiceRecording(systemId, name, dataUrl, duration)
        }
        onRemoveVoiceRecording={(recId) => removeSystemVoiceRecording(systemId, recId)}
        onAddTag={(tag) => addSystemTag(systemId, tag)}
        onRemoveTag={(tag) => removeSystemTag(systemId, tag)}
        onUpdateDetailNotes={(notes) => updateSystemDetailNotes(systemId, notes)}
        onDelete={() => {
          if (confirm(`Delete system "${system.name}" and all its projects?`)) {
            deleteSystem(systemId);
            onRootSelect?.();
          }
        }}
      />
    );
  };

  const renderMainContent = () => (
    <>
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
                  className={cn(
                    "p-3 border rounded-lg bg-card cursor-pointer hover:bg-accent/50 transition-colors",
                    selectedRowId === project.id && "bg-primary/10 border-l-2 border-l-primary"
                  )}
                  onClick={() => handleRowClick(project.id)}
                  onDoubleClick={() => handleRowDoubleClick(project.id)}
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
                  className={cn(
                    "border-b border-border hover:bg-muted/50 transition-colors cursor-pointer",
                    selectedRowId === project.id && "bg-primary/10 border-l-2 border-l-primary"
                  )}
                  onClick={() => handleRowClick(project.id)}
                  onDoubleClick={() => handleRowDoubleClick(project.id)}
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
    </>
  );

  return (
    <div className="flex-1 overflow-hidden bg-background">
      {sidebarPosition === 'right' ? (
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
            {renderMainContent()}
          </div>

          {/* Right Panel - Details */}
          {!sidebarCollapsed ? (
            <div
              className="flex flex-col overflow-hidden bg-card relative"
              style={{ width: `${sidebarWidth}px` }}
            >
              <div className="h-10 border-b border-border flex items-center justify-between px-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSidebarCollapsed(true)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSidebarPosition('bottom')}
                  title="Move to bottom"
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                {renderSidebarContent()}
              </ScrollArea>
              {/* Resize handle */}
              <div
                className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 transition-colors group"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsResizing(true);
                  resizingStartRef.current = { x: e.clientX, width: sidebarWidth };
                }}
              >
                <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-3 h-3 text-primary" />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-10 flex flex-col items-center pt-2 bg-card border-l border-border">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSidebarCollapsed(false)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Top Panel - Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden border-b border-border">
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
            {renderMainContent()}
          </div>

          {/* Bottom Panel - Details */}
          {!sidebarCollapsed ? (
            <div
              className="flex flex-col overflow-hidden bg-card relative"
              style={{ height: `${sidebarWidth}px` }}
            >
              <div className="h-10 border-b border-border flex items-center justify-between px-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSidebarCollapsed(true)}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSidebarPosition('right')}
                  title="Move to right"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                {renderSidebarContent()}
              </ScrollArea>
              {/* Resize handle */}
              <div
                className="absolute top-0 left-0 w-full h-1 cursor-row-resize hover:bg-primary/50 transition-colors group"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsResizing(true);
                  resizingStartRef.current = { x: e.clientY, width: sidebarWidth };
                }}
              >
                <div className="absolute left-1/2 top-0 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-3 h-3 text-primary rotate-90" />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-10 flex items-center justify-center bg-card border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-2"
                onClick={() => setSidebarCollapsed(false)}
              >
                <ChevronDown className="w-4 h-4 rotate-180" />
                <span className="text-xs">Show Details</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
