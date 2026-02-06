import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui-elements/atoms/Badge";
import { SectionHeader } from "@/components/ui-elements/atoms/SectionHeader";
import { cn } from "@/lib/utils";
import { ICON_SIZE } from "../constants";

export interface SectionDeleteProps {
  /** Title text, defaults to "Delete note" */
  title?: string;
  /** Description text */
  description?: string;
  /** Callback when delete is clicked */
  onDelete?: () => void;
  /** Whether this is shown in the bottom panel */
  isBottomPanel?: boolean;
  className?: string;
}

export function SectionDelete({
  title = "Delete note",
  description = "Move this note to trash. You can restore it later.",
  onDelete,
  isBottomPanel = false,
  className,
}: SectionDeleteProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <SectionHeader
        title="DELETE"
        icon={<Trash2 className={ICON_SIZE} />}
      />
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge
          variant="outline"
          className="h-6 px-2 cursor-pointer hover:bg-white/5"
          onClick={onDelete}
        >
          <Trash2 className="w-3 h-3" />
        </Badge>
      </div>
    </div>
  );
}
