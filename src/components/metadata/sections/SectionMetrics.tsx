import * as React from "react";
import {
  BarChart3,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ItemMetrics } from "@/store/NotesContext";
import { SectionHeader } from "@/components/ui-elements/atoms/SectionHeader";
import { LabeledInput } from "@/components/ui-elements/atoms/LabeledInput";
import { DropdownSelect } from "@/components/ui-elements/molecules/DropdownSelect";
import {
  HealthBadge,
  PriorityBadge,
  StatusBadge,
  type HealthStatus,
  type PriorityLevel,
  type ItemStatus,
} from "@/components/ui-elements/molecules/MetricSelector";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui-elements/atoms/Button";
import { format } from "date-fns";
import {
  GRID_LAYOUT,
  LABEL_STYLE,
  ICON_SIZE,
} from "../constants";

export interface SectionMetricsProps {
  metrics?: ItemMetrics;
  stats?: { good: number; warning: number; critical: number };
  onUpdateMetrics?: (metrics: Partial<ItemMetrics>) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isBottomPanel?: boolean;
  className?: string;
}

export function SectionMetrics({
  metrics,
  stats,
  onUpdateMetrics,
  collapsed = false,
  onToggleCollapse,
  isBottomPanel = false,
  className,
}: SectionMetricsProps) {
  const healthOptions = ["Good", "Warning", "Critical"];
  const priorityOptions = ["High", "Medium", "Low"];
  const statusOptions = ["Not Started", "In Progress", "Done", "Blocked"];

  const healthMap: Record<string, string> = {
    "Good": "good",
    "Warning": "warning",
    "Critical": "critical",
  };
  const priorityMap: Record<string, string> = {
    "High": "high",
    "Medium": "medium",
    "Low": "low",
  };
  const statusMap: Record<string, string> = {
    "Not Started": "not_started",
    "In Progress": "in_progress",
    "Done": "done",
    "Blocked": "blocked",
  };
  const reverseHealthMap: Record<string, string> = {
    "good": "Good",
    "warning": "Warning",
    "critical": "Critical",
  };
  const reversePriorityMap: Record<string, string> = {
    "high": "High",
    "medium": "Medium",
    "low": "Low",
  };
  const reverseStatusMap: Record<string, string> = {
    "not_started": "Not Started",
    "in_progress": "In Progress",
    "done": "Done",
    "blocked": "Blocked",
  };

  const total = (stats?.good || 0) + (stats?.warning || 0) + (stats?.critical || 0);
  const goodCount = stats?.good || 0;
  const warningCount = stats?.warning || 0;
  const criticalCount = stats?.critical || 0;

  if (isBottomPanel) {
    return (
      <section className={cn("space-y-4", className)}>
        <h2 className="text-[16px] font-medium">Metrics</h2>
        <div className="space-y-2">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={onToggleCollapse}
          >
            <BarChart3 className={ICON_SIZE} />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Stats</span>
          </div>

          {/* Stats with numbers */}
          {total > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[#66a44c]">{goodCount}</span>
              <span className="text-white/30">/</span>
              <span className="text-[#db8000]">{warningCount}</span>
              <span className="text-white/30">/</span>
              <span className="text-[#ce4646]">{criticalCount}</span>
              <span className="text-white/30">/</span>
              <span className="text-muted-foreground">{total}</span>
            </div>
          )}

          {/* Color indicators */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#66a44c]" title="Good" />
            <div className="w-2 h-2 rounded-full bg-[#db8000]" title="Warning" />
            <div className="w-2 h-2 rounded-full bg-[#ce4646]" title="Critical" />
          </div>

          {!collapsed && (
            <div className={cn(GRID_LAYOUT)}>
              {/* Health */}
              <DropdownSelect
                value={metrics?.health ? reverseHealthMap[metrics.health] : undefined}
                options={healthOptions}
                placeholder="Unset"
                onChange={(val) => onUpdateMetrics?.({ health: healthMap[val] as HealthStatus || undefined })}
                label="Health"
              />

              {/* Priority */}
              <DropdownSelect
                value={metrics?.priority ? reversePriorityMap[metrics.priority] : undefined}
                options={priorityOptions}
                placeholder="Unset"
                onChange={(val) => onUpdateMetrics?.({ priority: priorityMap[val] as PriorityLevel || undefined })}
                label="Priority"
              />

              {/* Status */}
              <DropdownSelect
                value={metrics?.status ? reverseStatusMap[metrics.status] : undefined}
                options={statusOptions}
                placeholder="Unset"
                onChange={(val) => onUpdateMetrics?.({ status: statusMap[val] as ItemStatus || undefined })}
                label="Status"
              />

              {/* Target Date */}
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Target Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-6 px-2 justify-start text-xs font-normal bg-[#1e1e24] border-transparent hover:bg-white/5 hover:border-white/10",
                        !metrics?.targetDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="inline mr-1 h-3 w-3" />
                      {metrics?.targetDate ? format(new Date(metrics.targetDate), "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={metrics?.targetDate ? new Date(metrics.targetDate) : undefined}
                      onSelect={(date) => onUpdateMetrics?.({ targetDate: date?.toISOString() || undefined })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Lead */}
              <LabeledInput
                label="Lead"
                placeholder="Lead name"
                value={metrics?.lead || ""}
                onChange={(val) => onUpdateMetrics?.({ lead: val || undefined })}
              />
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("space-y-3", className)}>
      <SectionHeader
        title="Metrics"
        icon={<BarChart3 className={ICON_SIZE} />}
        collapsed={collapsed}
        onToggle={onToggleCollapse}
      />

      {/* Stats with numbers */}
      {total > 0 && (
        <div className="flex items-center gap-1 text-xs">
          <span className="text-[#66a44c]">{goodCount}</span>
          <span className="text-white/30">/</span>
          <span className="text-[#db8000]">{warningCount}</span>
          <span className="text-white/30">/</span>
          <span className="text-[#ce4646]">{criticalCount}</span>
          <span className="text-white/30">/</span>
          <span className="text-muted-foreground">{total}</span>
        </div>
      )}

      {/* Color indicators */}
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-[#66a44c]" title="Good" />
        <div className="w-2 h-2 rounded-full bg-[#db8000]" title="Warning" />
        <div className="w-2 h-2 rounded-full bg-[#ce4646]" title="Critical" />
      </div>

      {!collapsed && (
        <div className={cn(GRID_LAYOUT)}>
          {/* Health */}
          <div>
            <label className={cn(LABEL_STYLE, "block mb-1.5")}>
              <AlertCircle className={cn(ICON_SIZE, "inline mr-1")} />
              Health
            </label>
            <DropdownSelect
              value={metrics?.health ? reverseHealthMap[metrics.health] : undefined}
              options={healthOptions}
              placeholder="Not set"
              onChange={(val) => onUpdateMetrics?.({ health: healthMap[val] as HealthStatus || undefined })}
            />
          </div>

          {/* Priority */}
          <div>
            <label className={cn(LABEL_STYLE, "block mb-1.5")}>
              <CheckCircle2 className={cn(ICON_SIZE, "inline mr-1")} />
              Priority
            </label>
            <DropdownSelect
              value={metrics?.priority ? reversePriorityMap[metrics.priority] : undefined}
              options={priorityOptions}
              placeholder="Not set"
              onChange={(val) => onUpdateMetrics?.({ priority: priorityMap[val] as PriorityLevel || undefined })}
            />
          </div>

          {/* Status */}
          <div>
            <label className={cn(LABEL_STYLE, "block mb-1.5")}>
              <CheckCircle2 className={cn(ICON_SIZE, "inline mr-1")} />
              Status
            </label>
            <DropdownSelect
              value={metrics?.status ? reverseStatusMap[metrics.status] : undefined}
              options={statusOptions}
              placeholder="Not set"
              onChange={(val) => onUpdateMetrics?.({ status: statusMap[val] as ItemStatus || undefined })}
            />
          </div>

          {/* Target Date */}
          <div>
            <label className={cn(LABEL_STYLE, "block mb-1.5")}>
              <CalendarDays className={cn(ICON_SIZE, "inline mr-1")} />
              Target Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left h-9 px-3 font-normal bg-transparent border-white/10",
                    !metrics?.targetDate && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {metrics?.targetDate ? format(new Date(metrics.targetDate), "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={metrics?.targetDate ? new Date(metrics.targetDate) : undefined}
                  onSelect={(date) => onUpdateMetrics?.({ targetDate: date?.toISOString() || undefined })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Lead */}
          <LabeledInput
            label="Lead"
            icon={<User className={ICON_SIZE} />}
            placeholder="Lead name"
            value={metrics?.lead || ""}
            onChange={(val) => onUpdateMetrics?.({ lead: val || undefined })}
          />
        </div>
      )}
    </section>
  );
}
