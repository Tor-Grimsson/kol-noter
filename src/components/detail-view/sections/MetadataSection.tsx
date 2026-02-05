import * as React from "react";
import { Calendar, Type, Info, Box } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DateDisplay } from "@/components/ui-elements/atoms/DateDisplay";
import { SectionHeader } from "@/components/ui-elements/atoms/SectionHeader";
import { DropdownSelect } from "@/components/ui-elements/molecules/DropdownSelect";
import { TAG_COLOR_PRESETS } from "@/store/notesStore";
import {
  CELL_STYLE,
  GRID_LAYOUT,
  LABEL_STYLE,
  VALUE_STYLE,
  ICON_SIZE,
} from "../constants";

// Panel-specific styles
const PANEL_INPUT_CLASS = "h-6 px-2 rounded-[4px] bg-[#1e1e24] border border-white/10 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-white/15";
const PANEL_TEXTAREA_CLASS = "min-h-[60px] w-full rounded-[4px] bg-[#1e1e24] border border-white/10 p-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-white/15 resize-none";

export interface MetadataSectionProps {
  name: string;
  description?: string;
  type?: string;
  typeOptions?: string[];
  createdAt?: number;
  updatedAt?: number;
  size?: number;
  sizeLabel?: string;
  onUpdateName?: (name: string) => void;
  onUpdateDescription?: (description: string) => void;
  onUpdateType?: (type: string) => void;
  isBottomPanel?: boolean;
  className?: string;
}

export function MetadataSection({
  name,
  description,
  type,
  typeOptions = [],
  createdAt,
  updatedAt,
  size,
  sizeLabel,
  onUpdateName,
  onUpdateDescription,
  onUpdateType,
  isBottomPanel = false,
  className,
}: MetadataSectionProps) {
  const [editingName, setEditingName] = React.useState(false);
  const [editingDescription, setEditingDescription] = React.useState(false);
  const [tempName, setTempName] = React.useState(name);
  const [tempDescription, setTempDescription] = React.useState(description || "");

  React.useEffect(() => {
    setTempName(name);
  }, [name]);

  React.useEffect(() => {
    setTempDescription(description || "");
  }, [description]);

  const handleNameSubmit = () => {
    if (tempName.trim() && tempName !== name) {
      onUpdateName?.(tempName.trim());
    }
    setEditingName(false);
  };

  const handleDescriptionSubmit = () => {
    onUpdateDescription?.(tempDescription.trim());
    setEditingDescription(false);
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  if (isBottomPanel) {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Section Header */}
        <SectionHeader icon={<Calendar className="w-3 h-3" />} title="METADATA" />

        {/* 2-col grid for metadata fields */}
        <section className={cn(GRID_LAYOUT)}>
          {/* Created */}
          <div>
            <label className={cn(LABEL_STYLE, "block mb-1.5")}>Created</label>
            <div className={cn(CELL_STYLE)}>
              <span className={cn(VALUE_STYLE)}><DateDisplay timestamp={createdAt} format="short" /></span>
            </div>
          </div>

          {/* Modified */}
          <div>
            <label className={cn(LABEL_STYLE, "block mb-1.5")}>Modified</label>
            <div className={cn(CELL_STYLE)}>
              <span className={cn(VALUE_STYLE)}><DateDisplay timestamp={updatedAt} format="relative" /></span>
            </div>
          </div>

          {/* Type */}
          {typeOptions.length > 0 && (
            <DropdownSelect
              value={type}
              options={typeOptions}
              placeholder="Select..."
              onChange={onUpdateType}
              label="Type"
            />
          )}

          {/* Size */}
          {size !== undefined && (
            <div>
              <label className={cn(LABEL_STYLE, "block mb-1.5")}>{sizeLabel || "Size"}</label>
              <div className={cn(CELL_STYLE)}>
                <span className={cn(VALUE_STYLE)}>{formatSize(size)}</span>
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with name and description */}
      <section>
        {editingName ? (
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
            className={cn(PANEL_INPUT_CLASS, "h-6 text-sm font-medium mb-2")}
            placeholder="Item name"
            autoFocus
          />
        ) : (
          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded -mx-2 px-2 py-1"
            onClick={() => setEditingName(true)}
          >
            <h2 className="text-sm font-semibold">{name}</h2>
          </div>
        )}

        {editingDescription ? (
          <textarea
            value={tempDescription}
            onChange={(e) => setTempDescription(e.target.value)}
            onBlur={handleDescriptionSubmit}
            className={cn(PANEL_TEXTAREA_CLASS, "min-h-[80px]")}
            placeholder="Add a description..."
            autoFocus
          />
        ) : (
          <div
            className="cursor-pointer hover:bg-white/5 rounded -mx-2 px-2 py-1"
            onClick={() => setEditingDescription(true)}
          >
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">Add a description...</p>
            )}
          </div>
        )}
      </section>

      {/* Metadata grid */}
      <section className={cn(GRID_LAYOUT)}>
        {/* Created */}
        <div>
          <label className={cn(LABEL_STYLE, "block mb-1.5")}>Created</label>
          <div className={cn(CELL_STYLE)}>
            <span className={cn(VALUE_STYLE)}><DateDisplay timestamp={createdAt} format="full" /></span>
          </div>
        </div>

        {/* Modified */}
        <div>
          <label className={cn(LABEL_STYLE, "block mb-1.5")}>Modified</label>
          <div className={cn(CELL_STYLE)}>
            <span className={cn(VALUE_STYLE)}><DateDisplay timestamp={updatedAt} format="relative" /></span>
          </div>
        </div>

        {/* Type */}
        {typeOptions.length > 0 && (
          <DropdownSelect
            value={type}
            options={typeOptions}
            placeholder="Select type..."
            onChange={onUpdateType}
            label="Type"
          />
        )}

        {/* Size */}
        {size !== undefined && (
          <div>
            <label className={cn(LABEL_STYLE, "block mb-1.5")}>{sizeLabel || "Size"}</label>
            <div className={cn(CELL_STYLE)}>
              <span className={cn(VALUE_STYLE)}>{formatSize(size)}</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
