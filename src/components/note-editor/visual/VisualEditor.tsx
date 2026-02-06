import { useState, useEffect } from "react";
import { Button } from "@/components/ui-elements/atoms/Button";
import { Card } from "@/components/ui/card";
import { Plus, Circle, Square, Diamond, ArrowRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VisualNode } from "@/store/NotesContext";

const defaultNodes: VisualNode[] = [
  { id: "1", type: "start", label: "Start", x: 100, y: 100, connections: ["2"] },
  { id: "2", type: "process", label: "Process Data", x: 100, y: 200, connections: ["3"] },
  { id: "3", type: "decision", label: "Valid?", x: 100, y: 300, connections: ["4", "5"] },
  { id: "4", type: "process", label: "Save", x: 50, y: 400, connections: ["6"] },
  { id: "5", type: "process", label: "Error", x: 150, y: 400, connections: ["6"] },
  { id: "6", type: "end", label: "End", x: 100, y: 500, connections: [] },
];

interface VisualEditorProps {
  nodes?: VisualNode[];
  onChange?: (nodes: VisualNode[]) => void;
  focusMode?: boolean;
}

export const VisualEditor = ({ nodes: propNodes, onChange, focusMode }: VisualEditorProps) => {
  const [nodes, setNodes] = useState<VisualNode[]>(propNodes || defaultNodes);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Sync with prop changes (switching notes)
  useEffect(() => {
    if (propNodes) {
      setNodes(propNodes);
    }
  }, [JSON.stringify(propNodes)]);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "start":
      case "end":
        return Circle;
      case "process":
        return Square;
      case "decision":
        return Diamond;
      default:
        return Circle;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case "start":
        return "bg-primary/20 border-primary text-primary";
      case "end":
        return "bg-destructive/20 border-destructive text-destructive";
      case "process":
        return "bg-accent/20 border-accent text-accent-foreground";
      case "decision":
        return "bg-warning/20 border-warning text-warning";
      default:
        return "bg-muted border-border text-foreground";
    }
  };

  const addNode = (type: VisualNode["type"]) => {
    const newNode: VisualNode = {
      id: Date.now().toString(),
      type,
      label: `New ${type}`,
      x: 100,
      y: nodes.length * 100 + 100,
      connections: [],
    };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    onChange?.(newNodes);
  };

  const deleteNode = (id: string) => {
    const newNodes = nodes.filter(n => n.id !== id);
    setNodes(newNodes);
    onChange?.(newNodes);
  };

  return (
    <div className={`flex-1 overflow-auto bg-background ${focusMode ? 'px-12 py-12' : ''}`}>
      {!focusMode && (
        <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border px-6 py-3 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addNode("start")}
            className="gap-2"
          >
            <Circle className="w-4 h-4" />
            Start
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addNode("process")}
            className="gap-2"
          >
            <Square className="w-4 h-4" />
            Process
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addNode("decision")}
            className="gap-2"
          >
            <Diamond className="w-4 h-4" />
            Decision
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addNode("end")}
            className="gap-2"
          >
            <Circle className="w-4 h-4" />
            End
          </Button>
        </div>
      )}
      
      <div className="p-6 min-h-[calc(100vh-200px)] relative">
        <div className="relative w-full h-full">
          {nodes.map((node) => {
            const NodeIcon = getNodeIcon(node.type);
            return (
              <Card
                key={node.id}
                className={cn(
                  "absolute p-4 cursor-move transition-all hover:shadow-lg",
                  getNodeColor(node.type),
                  selectedNode === node.id && "ring-2 ring-primary"
                )}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: "160px"
                }}
                onClick={() => setSelectedNode(node.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <NodeIcon className="w-4 h-4" />
                  <span className="text-xs font-medium">{node.label}</span>
                </div>
                {node.connections && node.connections.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowRight className="w-3 h-3" />
                    <span>{node.connections.length} connection(s)</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNode(node.id);
                  }}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </Card>
            );
          })}
        </div>

        {nodes.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <Plus className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Add nodes from the toolbar above to create your flowchart
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
