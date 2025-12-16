import * as React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked);
      }
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <input
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        checked={checked}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };

