import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Plus, Filter, User, Target as TargetIcon, Calendar as CalendarIcon, ChevronDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UnifiedSidebar } from "@/components/UnifiedSidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Calendar } from "@/components/ui/calendar";

interface Project {
  id: string;
  name: string;
  health: "good" | "at-risk" | "critical";
  priority: "low" | "medium" | "high";
  lead?: string;
  targetDate?: string;
  status: number;
  systemId?: string;
  projectId?: string;
}

type ColumnId = "name" | "health" | "priority" | "lead" | "targetDate" | "status";

interface Column {
  id: ColumnId;
  label: string;
  width: number;
}

const Projects = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [calendarView, setCalendarView] = useState<"month" | "year" | "week">("month");
  const [selectedSystemId, setSelectedSystemId] = useState<string | "all">("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
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
  const [projects] = useState<Project[]>([
    {
      id: "1",
      name: "Journal App - Lovable",
      health: "good",
      priority: "high",
      lead: "Tor Griness",
      status: 0,
      systemId: "system-1",
      projectId: "project-1",
    },
    {
      id: "2",
      name: "SSH & remote login via Terminal + Network",
      health: "good",
      priority: "medium",
      status: 0,
      systemId: "system-1",
      projectId: "project-1",
    },
    {
      id: "3",
      name: "Terminal TMUX",
      health: "at-risk",
      priority: "high",
      status: 45,
      systemId: "system-1",
      projectId: "project-2",
    },
    {
      id: "4",
      name: "Terminal in browser",
      health: "good",
      priority: "low",
      status: 0,
      systemId: "system-2",
      projectId: "project-3",
    },
    {
      id: "5",
      name: "LLM Coder/Agents -- { Terminal } API Keys",
      health: "good",
      priority: "medium",
      status: 0,
      systemId: "system-2",
      projectId: "project-3",
    },
  ]);

  const getHealthColor = (health: Project["health"]) => {
    switch (health) {
      case "good":
        return "text-success";
      case "at-risk":
        return "text-warning";
      case "critical":
        return "text-destructive";
    }
  };

  const getPriorityBadge = (priority: Project["priority"]) => {
    const variants = {
      low: "bg-muted text-muted-foreground",
      medium: "bg-warning/20 text-warning",
      high: "bg-destructive/20 text-destructive",
    };
    return variants[priority];
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

  const renderCell = (project: Project, columnId: ColumnId) => {
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
            <div className={cn("w-1.5 h-1.5 rounded-full", getHealthColor(project.health))} />
            <span className="text-xs text-muted-foreground">
              {project.health === "good" && "No updates"}
              {project.health === "at-risk" && "On track"}
              {project.health === "critical" && "Behind"}
            </span>
          </div>
        );
      case "priority":
        return (
          <Badge className={cn("text-[10px] px-1.5 py-0", getPriorityBadge(project.priority))}>
            {project.priority}
          </Badge>
        );
      case "lead":
        return project.lead ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
              <span className="text-[10px] font-medium text-accent-foreground">
                {project.lead.split(" ").map(n => n[0]).join("")}
              </span>
            </div>
            <span className="text-xs text-foreground">{project.lead}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-3 h-3" />
            <span className="text-xs">No lead</span>
          </div>
        );
      case "targetDate":
        return project.targetDate ? (
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-foreground">{project.targetDate}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        );
      case "status":
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden max-w-[80px]">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${project.status}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground min-w-[28px]">{project.status}%</span>
          </div>
        );
    }
  };

  const breadcrumbItems = [
    { label: "Overview", href: "/" }
  ];

  const filteredProjects = projects.filter(project => {
    if (selectedSystemId === "all") return true;
    if (selectedProjectId) {
      return project.systemId === selectedSystemId && project.projectId === selectedProjectId;
    }
    return project.systemId === selectedSystemId;
  });

  const handleSystemProjectSelect = (systemId: string | "all", projectId?: string) => {
    setSelectedSystemId(systemId);
    setSelectedProjectId(projectId);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <UnifiedSidebar 
        collapsed={sidebarCollapsed}
        onNoteSelect={() => {}}
        selectedNoteId={undefined}
        onSystemProjectSelect={handleSystemProjectSelect}
      />

      <div className="flex-1 bg-background flex flex-col">
        {/* Header */}
        <div className="h-12 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 shadow-sm">
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-xs h-8">
                  {viewMode === "list" ? "Projects" : "Timeline"}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={() => setViewMode("list")}>
                  Projects
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode("timeline")}>
                  Timeline
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="relative">
              <Input
                placeholder="Filter..."
                className="pl-3 bg-input border-input-border h-8 w-48 text-xs"
              />
            </div>
            <Button variant="ghost" size="sm" className="gap-2 h-8">
              <Filter className="w-3 h-3" />
            </Button>

            <Button size="sm" className="gap-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs h-8">
              <Plus className="w-3 h-3" />
              Add project
            </Button>
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
                          <div className="space-y-1 flex-1">
                            {/* Event items will go here */}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-4">
                <div className="text-xs font-medium text-muted-foreground mb-2">Upcoming Events</div>
                {filteredProjects.map((project) => (
                  <div key={project.id} className="p-3 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <TargetIcon className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{project.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Created • Updated • Target: {project.targetDate || "Not set"}
                        </div>
                      </div>
                      <Badge className={cn("text-xs", getPriorityBadge(project.priority))}>
                        {project.priority}
                      </Badge>
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
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    {columns.map(column => (
                      <td key={column.id} className="px-3 py-2" style={{ width: `${column.width}px` }}>
                        {renderCell(project, column.id)}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-6 h-6">
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
    </div>
  );
};

export default Projects;
