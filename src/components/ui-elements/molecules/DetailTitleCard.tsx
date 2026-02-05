import * as React from "react";
import { LabeledInput } from "../atoms/LabeledInput";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface DetailTitleCardProps {
  title: string;
  subtitle?: string;
  field1Label?: string;
  field1Value?: string;
  field2Label?: string;
  field2Value?: string;
  field3Label?: string;
  field3Value?: string;
  onUpdateTitle?: (title: string) => void;
  onUpdateSubtitle?: (subtitle: string) => void;
  onUpdateField1?: (value: string) => void;
  onUpdateField2?: (value: string) => void;
  onUpdateField3?: (value: string) => void;
  onDelete?: () => void;
  className?: string;
}

export function DetailTitleCard({
  title,
  subtitle,
  field1Label = "Field 1",
  field1Value = "",
  field2Label = "Field 2",
  field2Value = "",
  field3Label,
  field3Value = "",
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdateField1,
  onUpdateField2,
  onUpdateField3,
  onDelete,
  className,
}: DetailTitleCardProps) {
  // Generate initials from title
  const initials = title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header row: Avatar + Title/Subtitle + Delete */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-medium text-black shrink-0">
          {initials || "N"}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          {onUpdateTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => onUpdateTitle(e.target.value)}
              placeholder="Title"
              className="text-xs font-medium bg-transparent border-none p-0 focus:outline-none"
            />
          ) : (
            <span className="text-xs font-medium truncate">{title}</span>
          )}
          {onUpdateSubtitle ? (
            <input
              type="text"
              value={subtitle || ""}
              onChange={(e) => onUpdateSubtitle(e.target.value)}
              placeholder="Subtitle"
              className="text-[10px] text-muted-foreground bg-transparent border-none p-0 focus:outline-none"
            />
          ) : (
            subtitle && (
              <span className="text-[10px] text-muted-foreground truncate">
                {subtitle}
              </span>
            )
          )}
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1 hover:bg-white/10 rounded text-white/30 hover:text-white/50 shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Input fields - 2-col grid */}
      {(onUpdateField1 || onUpdateField2) && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {onUpdateField1 && (
            <LabeledInput
              label={field1Label}
              value={field1Value}
              onChange={onUpdateField1}
              placeholder={`Enter ${field1Label.toLowerCase()}...`}
            />
          )}
          {onUpdateField2 && (
            <LabeledInput
              label={field2Label}
              value={field2Value}
              onChange={onUpdateField2}
              placeholder={`Enter ${field2Label.toLowerCase()}...`}
            />
          )}
          {onUpdateField3 && field3Label && (
            <LabeledInput
              label={field3Label}
              value={field3Value}
              onChange={onUpdateField3}
              placeholder={`Enter ${field3Label.toLowerCase()}...`}
              className="col-span-2"
            />
          )}
        </div>
      )}
    </div>
  );
}
