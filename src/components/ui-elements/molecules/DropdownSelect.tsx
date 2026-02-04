import * as React from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export interface DropdownSelectProps {
  value?: string;
  options: string[];
  placeholder?: string;
  onChange?: (value: string) => void;
  className?: string;
  label?: string;
  size?: "sm" | "lg";
}

export function DropdownSelect({
  value,
  options,
  placeholder = "Select...",
  onChange,
  className,
  label,
  size = "sm",
}: DropdownSelectProps) {
  const heightClass = size === "sm" ? "h-6" : "h-7";
  const iconSizeClass = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <div className={className}>
      {label && (
        <label className="text-[10px] text-muted-foreground block mb-1.5">
          {label}
        </label>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`w-full ${heightClass} text-xs justify-between bg-[#1e1e24] !border-transparent hover:bg-white/5 focus-visible:bg-white/5 focus-visible:!ring-0 focus-visible:!ring-offset-0`}
          >
            <span className="text-xs">{value || placeholder}</span>
            <ChevronDown className={`${iconSizeClass} text-muted-foreground ml-2`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-full">
          {options.map((option) => (
            <DropdownMenuItem
              key={option}
              onClick={() => onChange?.(option)}
              className="text-xs py-1.5 px-2"
            >
              {option}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
