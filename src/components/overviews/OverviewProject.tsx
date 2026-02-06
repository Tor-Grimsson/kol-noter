import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Plus, User, Target as TargetIcon, Calendar as CalendarIcon, ChevronDown, GripVertical, X, FileText, ChevronLeft, ChevronRight, ArrowDown, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui-elements/atoms/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useNotesStore, EditorType } from "@/store/NotesContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { MetadataProject } from "@/components/metadata/MetadataProject";
import { MetadataNote } from "@/components/metadata/MetadataNote";

interface OverviewProjectProps {
  systemId: string;
  projectId: string;
  onNoteSelect?: (noteId: string, editorType: EditorType) => void;
  onSystemSelect?: (systemId: string) => void;
  onRootSelect?: () => void;
  onClose?: () => void;
}

type ColumnId = "name" | "health" | "priority" | "lead" | "targetDate" | "status";

interface Column {
  id: ColumnId;
  label: string;
  width: number;
}

export const OverviewProject = ({
  systemId,
  projectId,
  onNoteSelect,
  onSystemSelect,
  onRootSelect,
  onClose,
}: OverviewProjectProps) => {
  const {
    getSystem, getProject, getNotesByProject,
    addNote, getNote,
  } = useNotesStore();
  const system = getSystem(systemId);
  const project = getProject(systemId, projectId);
  const projectNotes = getNotesByProject(systemId, projectId);

  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [calendarView, setCalendarView] = useState<"month" | "year" | "week">("month");
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage("project-overview-sidebar-collapsed", true);
  const [sidebarPosition, setSidebarPosition] = useLocalStorage<'right' | 'bottom'>("overview-sidebar-position", "right");
  const [sidebarWidth, setSidebarWidth] = useLocalStorage("project-overview-sidebar-width", 280);
  const [isResizing, setIsResizing] = useState(false);
  const resizingStartRef = useRef({ x: 0, width: 0 });
  const MIN_SIDEBAR_WIDTH = 200;
  const MAX_SIDEBAR_WIDTH = 480;
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

  const selectedNote = selectedRowId ? getNote(selectedRowId) : null;

  // Column resize handling
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
        : resizingStartRef.current.x - e.clientX;
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
  }, [isResizing, sidebarPosition, setSidebarWidth]);

  if (!system || !project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

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

  const handleAddNote = () => {
    const newNote = addNote(systemId, projectId, "modular");
    if (newNote && onNoteSelect) {
      onNoteSelect(newNote.id, newNote.editorType);
    }
  };

  const handleRowClick = (noteId: string) => {
    setSelectedRowId(noteId);
  };

  const handleRowDoubleClick = (noteId: string, editorType: EditorType) => {
    onNoteSelect?.(noteId, editorType);
  };

  const renderCell = (note: typeof projectNotes[0], columnId: ColumnId) => {
    switch (columnId) {
      case "name":
        return (
          <div className="flex items-center gap-2">
            <TargetIcon
              className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onNoteSelect?.(note.id, note.editorType);
              }}
            />
            <span className="text-xs font-medium text-foreground">{note.title}</span>
          </div>
        );
      case "health":
        return (
          <div className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full", getHealthColor(note.metrics?.health))}
                 style={{ backgroundColor: note.metrics?.health ? undefined : 'currentColor' }} />
            <span className="text-xs text-muted-foreground">
              {note.metrics?.health === "good" && "On track"}
              {note.metrics?.health === "warning" && "No updates"}
              {note.metrics?.health === "critical" && "At risk"}
              {!note.metrics?.health && "No updates"}
            </span>
          </div>
        );
      case "priority":
        return note.metrics?.priority ? (
          <Badge className={cn("text-[10px] px-1.5 py-0", getPriorityBadge(note.metrics.priority))}>
            {note.metrics.priority}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        );
      case "lead":
        return note.metrics?.lead ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
              <span className="text-[10px] font-medium text-accent-foreground">
                {note.metrics.lead.split(" ").map(n => n[0]).join("")}
              </span>
            </div>
            <span className="text-xs text-foreground">{note.metrics.lead}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-3 h-3" />
            <span className="text-xs">No lead</span>
          </div>
        );
      case "targetDate":
        return note.metrics?.targetDate ? (
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-foreground">{note.metrics.targetDate}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        );
      case "status":
        const statusPercent = note.metrics?.status === 'done' ? 100
          : note.metrics?.status === 'in_progress' ? 45
          : note.metrics?.status === 'blocked' ? 25
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
    if (selectedNote) {
      return (
        <MetadataNote
          noteId={selectedNote.id}
          onClose={() => setSelectedRowId(null)}
        />
      );
    }

    return (
      <MetadataProject
        systemId={systemId}
        projectId={projectId}
        onClose={() => onSystemSelect?.(systemId)}
      />
    );
  };

  const renderMainContent = () => (
    <>
      {viewMode === "timeline" ? (
        <div className="flex-1 overflow-auto flex flex-col">
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold">Note Timeline</h2>
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
              <div className="text-xs font-medium text-muted-foreground mb-2">Notes</div>
              {projectNotes.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    "p-3 border rounded-lg bg-card cursor-pointer hover:bg-accent/50 transition-colors",
                    selectedRowId === note.id && "bg-primary/10 border-l-2 border-l-primary"
                  )}
                  onClick={() => handleRowClick(note.id)}
                  onDoubleClick={() => handleRowDoubleClick(note.id, note.editorType)}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{note.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {note.date} • Target: {note.metrics?.targetDate || "Not set"}
                      </div>
                    </div>
                    {note.metrics?.priority && (
                      <Badge className={cn("text-xs", getPriorityBadge(note.metrics.priority))}>
                        {note.metrics.priority}
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
              {projectNotes.map((note) => (
                <tr
                  key={note.id}
                  className={cn(
                    "border-b border-border hover:bg-muted/50 transition-colors cursor-pointer",
                    selectedRowId === note.id && "bg-primary/10 border-l-2 border-l-primary"
                  )}
                  onClick={() => handleRowClick(note.id)}
                  onDoubleClick={() => handleRowDoubleClick(note.id, note.editorType)}
                >
                  {columns.map(column => (
                    <td key={column.id} className="px-3 py-2" style={{ width: `${column.width}px` }}>
                      {renderCell(note, column.id)}
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
          {projectNotes.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notes yet. Create one to get started.</p>
            </div>
          )}
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
                      {viewMode === "list" ? "Notes" : "Timeline"}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover">
                    <DropdownMenuItem onClick={() => setViewMode("list")}>
                      Notes
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
                <Button size="sm" className="gap-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs h-8" onClick={handleAddNote}>
                  <Plus className="w-3 h-3" />
                  Add note
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
                      {viewMode === "list" ? "Notes" : "Timeline"}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover">
                    <DropdownMenuItem onClick={() => setViewMode("list")}>
                      Notes
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
                <Button size="sm" className="gap-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs h-8" onClick={handleAddNote}>
                  <Plus className="w-3 h-3" />
                  Add note
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
