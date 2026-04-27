import React from "react";
import { cn } from "../../utils/cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-500/70",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
