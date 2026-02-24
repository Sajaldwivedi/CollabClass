import React from "react";
import { cn } from "../../utils/cn";

export const TrendPill: React.FC<{
  status: "IMPROVING" | "DECLINING" | "STABLE";
}> = ({ status }) => {
  const label =
    status === "IMPROVING"
      ? "Improving"
      : status === "DECLINING"
      ? "Declining"
      : "Stable";
  const classes =
    status === "IMPROVING"
      ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/40"
      : status === "DECLINING"
      ? "bg-rose-500/10 text-rose-200 border-rose-500/40"
      : "bg-slate-800 text-slate-200 border-slate-600";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
        classes
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "IMPROVING"
            ? "bg-emerald-400"
            : status === "DECLINING"
            ? "bg-rose-400"
            : "bg-slate-400"
        )}
      />
      {label}
    </span>
  );
};

