import React from "react";
import { cn } from "../../utils/cn";

export const ProgressBar: React.FC<{
  value: number;
  className?: string;
}> = ({ value, className }) => {
  const band =
    value >= 70 ? "high" : value >= 40 ? "medium" : ("low" as const);
  const color =
    band === "high"
      ? "from-rose-500 to-orange-400"
      : band === "medium"
      ? "from-amber-400 to-yellow-300"
      : "from-emerald-400 to-teal-300";

  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r transition-[width]",
          color
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
};

