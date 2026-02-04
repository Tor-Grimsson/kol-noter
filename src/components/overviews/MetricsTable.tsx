import { useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ItemMetrics, HealthStatus, PriorityLevel, ItemStatus } from "@/store/notesStore";

interface MetricsTableRow {
  id: string;
  name: string;
  metrics?: ItemMetrics;
  onClick?: () => void;
}

interface MetricsTableProps {
  items: MetricsTableRow[];
  onMetricsChange: (id: string, metrics: Partial<ItemMetrics>) => void;
  className?: string;
}

type SortField = 'name' | 'health' | 'priority' | 'lead' | 'targetDate' | 'status';
type SortDirection = 'asc' | 'desc' | null;

const healthColors: Record<HealthStatus, string> = {
  good: 'bg-green-500',
  warning: 'bg-yellow-500',
  critical: 'bg-red-500',
};

const statusColors: Record<ItemStatus, string> = {
  not_started: 'bg-gray-500/20 text-gray-700 dark:text-gray-300',
  in_progress: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  done: 'bg-green-500/20 text-green-700 dark:text-green-300',
  blocked: 'bg-red-500/20 text-red-700 dark:text-red-300',
};

const statusLabels: Record<ItemStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
};

const priorityLabels: Record<PriorityLevel, string> = {
  high: 'P1',
  medium: 'P2',
  low: 'P3',
};

export const MetricsTable = ({ items, onMetricsChange, className }: MetricsTableProps) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    let aVal: any;
    let bVal: any;

    switch (sortField) {
      case 'name':
        aVal = a.name;
        bVal = b.name;
        break;
      case 'health':
        const healthOrder = { critical: 0, warning: 1, good: 2 };
        aVal = healthOrder[a.metrics?.health || 'good'];
        bVal = healthOrder[b.metrics?.health || 'good'];
        break;
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        aVal = priorityOrder[a.metrics?.priority || 'low'];
        bVal = priorityOrder[b.metrics?.priority || 'low'];
        break;
      case 'lead':
        aVal = a.metrics?.lead || '';
        bVal = b.metrics?.lead || '';
        break;
      case 'targetDate':
        aVal = a.metrics?.targetDate || '';
        bVal = b.metrics?.targetDate || '';
        break;
      case 'status':
        const statusOrder = { blocked: 0, not_started: 1, in_progress: 2, done: 3 };
        aVal = statusOrder[a.metrics?.status || 'not_started'];
        bVal = statusOrder[b.metrics?.status || 'not_started'];
        break;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 ml-1 opacity-50" />;
    if (sortDirection === 'asc') return <ChevronUp className="w-3 h-3 ml-1" />;
    return <ChevronDown className="w-3 h-3 ml-1" />;
  };

  const handleLeadEdit = (id: string, currentValue?: string) => {
    setEditingCell({ id, field: 'lead' });
    setEditValue(currentValue || '');
  };

  const handleLeadSave = (id: string) => {
    onMetricsChange(id, { lead: editValue || undefined });
    setEditingCell(null);
    setEditValue('');
  };

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left py-2 px-3">
              <button
                className="flex items-center font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => handleSort('name')}
              >
                NAME <SortIcon field="name" />
              </button>
            </th>
            <th className="text-center py-2 px-3 w-24">
              <button
                className="flex items-center justify-center font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                onClick={() => handleSort('health')}
              >
                HEALTH <SortIcon field="health" />
              </button>
            </th>
            <th className="text-center py-2 px-3 w-24">
              <button
                className="flex items-center justify-center font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                onClick={() => handleSort('priority')}
              >
                PRIORITY <SortIcon field="priority" />
              </button>
            </th>
            <th className="text-left py-2 px-3 w-32">
              <button
                className="flex items-center font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => handleSort('lead')}
              >
                LEAD <SortIcon field="lead" />
              </button>
            </th>
            <th className="text-left py-2 px-3 w-36">
              <button
                className="flex items-center font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => handleSort('targetDate')}
              >
                TARGET DATE <SortIcon field="targetDate" />
              </button>
            </th>
            <th className="text-center py-2 px-3 w-32">
              <button
                className="flex items-center justify-center font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                onClick={() => handleSort('status')}
              >
                STATUS <SortIcon field="status" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item) => (
            <tr
              key={item.id}
              className="border-b border-border hover:bg-accent/30 transition-colors"
            >
              {/* Name */}
              <td className="py-2 px-3">
                <button
                  onClick={item.onClick}
                  className="font-medium hover:text-primary transition-colors text-left"
                >
                  {item.name}
                </button>
              </td>

              {/* Health */}
              <td className="py-2 px-3 text-center">
                <Select
                  value={item.metrics?.health || ''}
                  onValueChange={(value) => onMetricsChange(item.id, { health: value as HealthStatus })}
                >
                  <SelectTrigger className="h-7 w-20 mx-auto border-0 bg-transparent hover:bg-accent/50">
                    <SelectValue placeholder="-">
                      {item.metrics?.health && (
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", healthColors[item.metrics.health])} />
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", healthColors.good)} />
                        Good
                      </div>
                    </SelectItem>
                    <SelectItem value="warning">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", healthColors.warning)} />
                        Warning
                      </div>
                    </SelectItem>
                    <SelectItem value="critical">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", healthColors.critical)} />
                        Critical
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </td>

              {/* Priority */}
              <td className="py-2 px-3 text-center">
                <Select
                  value={item.metrics?.priority || ''}
                  onValueChange={(value) => onMetricsChange(item.id, { priority: value as PriorityLevel })}
                >
                  <SelectTrigger className="h-7 w-16 mx-auto border-0 bg-transparent hover:bg-accent/50">
                    <SelectValue placeholder="-">
                      {item.metrics?.priority && priorityLabels[item.metrics.priority]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">P1 - High</SelectItem>
                    <SelectItem value="medium">P2 - Medium</SelectItem>
                    <SelectItem value="low">P3 - Low</SelectItem>
                  </SelectContent>
                </Select>
              </td>

              {/* Lead */}
              <td className="py-2 px-3">
                {editingCell?.id === item.id && editingCell?.field === 'lead' ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleLeadSave(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleLeadSave(item.id);
                      if (e.key === 'Escape') {
                        setEditingCell(null);
                        setEditValue('');
                      }
                    }}
                    className="h-7 text-sm"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => handleLeadEdit(item.id, item.metrics?.lead)}
                    className="text-left w-full px-2 py-1 rounded hover:bg-accent/50 transition-colors min-h-[28px]"
                  >
                    {item.metrics?.lead || <span className="text-muted-foreground">-</span>}
                  </button>
                )}
              </td>

              {/* Target Date */}
              <td className="py-2 px-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-7 px-2 text-sm font-normal justify-start w-full"
                    >
                      {item.metrics?.targetDate ? (
                        format(new Date(item.metrics.targetDate), 'MMM d, yyyy')
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={item.metrics?.targetDate ? new Date(item.metrics.targetDate) : undefined}
                      onSelect={(date) => {
                        onMetricsChange(item.id, {
                          targetDate: date ? date.toISOString() : undefined,
                        });
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </td>

              {/* Status */}
              <td className="py-2 px-3 text-center">
                <Select
                  value={item.metrics?.status || ''}
                  onValueChange={(value) => onMetricsChange(item.id, { status: value as ItemStatus })}
                >
                  <SelectTrigger className="h-7 w-28 mx-auto border-0 bg-transparent hover:bg-accent/50">
                    <SelectValue placeholder="-">
                      {item.metrics?.status && (
                        <span className={cn("px-2 py-0.5 rounded text-xs font-medium", statusColors[item.metrics.status])}>
                          {statusLabels[item.metrics.status]}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium", statusColors.not_started)}>
                        Not Started
                      </span>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium", statusColors.in_progress)}>
                        In Progress
                      </span>
                    </SelectItem>
                    <SelectItem value="done">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium", statusColors.done)}>
                        Done
                      </span>
                    </SelectItem>
                    <SelectItem value="blocked">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium", statusColors.blocked)}>
                        Blocked
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
