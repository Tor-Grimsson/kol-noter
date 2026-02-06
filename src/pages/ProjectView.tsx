import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui-elements/atoms/Button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Folder, 
  FileText, 
  Network, 
  Calendar,
  Tag,
  ArrowLeft,
  Plus
} from "lucide-react";

interface ProjectStats {
  totalNotes: number;
  totalPages: number;
  recentActivity: string;
  tags: string[];
}

interface ProjectCardProps {
  id: string;
  name: string;
  system: string;
  stats: ProjectStats;
  color?: string;
  onClick: () => void;
}

const ProjectCard = ({ name, system, stats, color = "primary", onClick }: ProjectCardProps) => {
  return (
    <Card 
      className="p-6 cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg group h-full flex flex-col"
      onClick={onClick}
    >
      <div className="flex items-start gap-4 flex-1">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10"
        >
          <Folder className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">{name}</h3>
          <p className="text-xs text-muted-foreground mb-3">{system}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{stats.totalNotes} notes</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{stats.recentActivity}</span>
            </div>
          </div>
          
          {stats.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {stats.tags.map((tag) => (
                <span 
                  key={tag}
                  className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export const ProjectView = () => {
  const navigate = useNavigate();
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);

  const projects = [
    {
      id: "1",
      name: "Engineering",
      system: "Work",
      stats: {
        totalNotes: 12,
        totalPages: 45,
        recentActivity: "2 hours ago",
        tags: ["architecture", "api", "frontend"]
      },
      color: "primary"
    },
    {
      id: "2",
      name: "Product",
      system: "Work",
      stats: {
        totalNotes: 8,
        totalPages: 23,
        recentActivity: "1 day ago",
        tags: ["roadmap", "features"]
      },
      color: "primary"
    },
    {
      id: "3",
      name: "Marketing",
      system: "Work",
      stats: {
        totalNotes: 15,
        totalPages: 34,
        recentActivity: "5 hours ago",
        tags: ["campaigns", "analytics", "social"]
      },
      color: "primary"
    },
    {
      id: "4",
      name: "Learning",
      system: "Personal",
      stats: {
        totalNotes: 25,
        totalPages: 78,
        recentActivity: "3 hours ago",
        tags: ["react", "typescript", "design"]
      },
      color: "primary"
    },
    {
      id: "5",
      name: "Ideas & Projects",
      system: "Personal",
      stats: {
        totalNotes: 18,
        totalPages: 42,
        recentActivity: "1 day ago",
        tags: ["brainstorm", "startup", "side-projects"]
      },
      color: "primary"
    },
    {
      id: "6",
      name: "Health & Fitness",
      system: "Personal",
      stats: {
        totalNotes: 9,
        totalPages: 21,
        recentActivity: "4 hours ago",
        tags: ["workout", "nutrition", "goals"]
      },
      color: "primary"
    }
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar with Systems */}
      <div className="w-64 border-r border-border bg-sidebar-bg flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold mb-4">Systems</h2>
          <div className="space-y-1">
            <Button
              variant={selectedSystem === null ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setSelectedSystem(null)}
            >
              <Network className="w-4 h-4" />
              All Systems
            </Button>
            <Button
              variant={selectedSystem === "Work" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setSelectedSystem("Work")}
            >
              <Network className="w-4 h-4" />
              Work
            </Button>
            <Button
              variant={selectedSystem === "Personal" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setSelectedSystem("Personal")}
            >
              <Network className="w-4 h-4" />
              Personal
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="h-12 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-sm font-semibold">
            {selectedSystem ? `${selectedSystem} Projects` : "All Projects"}
          </h1>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects
                .filter(p => !selectedSystem || p.system === selectedSystem)
                .map((project) => (
                  <ProjectCard
                    key={project.id}
                    {...project}
                    onClick={() => navigate("/")}
                  />
                ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
