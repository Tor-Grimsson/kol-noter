import * as React from "react";
import {
  BarChart3,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ItemMetrics } from "@/store/notesStore";
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
import {
  GRID_LAYOUT,
  LABEL_STYLE,
  ICON_SIZE,
} from "../constants";

export interface MetricsSectionProps {
  metrics?: ItemMetrics;
  onUpdateMetrics?: (metrics: Partial<ItemMetrics>) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isBottomPanel?: boolean;
  className?: string;
}

export function MetricsSection({
  metrics,
  onUpdateMetrics,
  collapsed = false,
  onToggleCollapse,
  isBottomPanel = false,
  className,
}: MetricsSectionProps) {
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

          {/* Color boxes container */}
          <div className="w-full h-[24px] flex flex-col gap-0 rounded-[4px] p-1 bg-white/5">
            <div className="flex-1 h-full bg-[#66a44c]" />
            <div className="flex-1 h-full bg-[#ce4646]" />
            <div className="flex-1 h-full bg-[#49a0a2]" />
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
              <LabeledInput
                label="Target Date"
                placeholder="YYYY-MM-DD"
                value={metrics?.targetDate || ""}
                onChange={(val) => onUpdateMetrics?.({ targetDate: val || undefined })}
              />

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
          <LabeledInput
            label="Target Date"
            icon={<CalendarDays className={ICON_SIZE} />}
            placeholder="YYYY-MM-DD"
            value={metrics?.targetDate || ""}
            onChange={(val) => onUpdateMetrics?.({ targetDate: val || undefined })}
          />

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
