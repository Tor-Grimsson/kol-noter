import * as React from "react";
import { cn } from "@/lib/utils";

const INPUT_CLASS = "w-full h-6 px-2 rounded-[4px] bg-[#1e1e24] border border-transparent text-xs text-foreground placeholder:text-muted-foreground/50 hover:border-white/10 focus:outline-none focus:border-white/15";
const LABEL_CLASS = "text-[10px] text-muted-foreground block mb-1";

export interface LabeledInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  className?: string;
  inputClassName?: string;
}

export function LabeledInput({
  label,
  value,
  onChange,
  icon,
  className,
  inputClassName,
  ...inputProps
}: LabeledInputProps) {
  return (
    <div className={className}>
      <label className={LABEL_CLASS}>
        {icon && <span className="inline mr-1 align-middle">{icon}</span>}
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(INPUT_CLASS, inputClassName)}
        {...inputProps}
      />
    </div>
  );
}
