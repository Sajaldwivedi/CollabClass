import React from "react";
import { cn } from "../../utils/cn";

export const RiskBadge: React.FC<{ band: "low" | "medium" | "high" }> = ({
  band
}) => {
  const label =
    band === "high" ? "High risk" : band === "medium" ? "Medium risk" : "Stable";
  const classes =
    band === "high"
      ? "bg-rose-500/10 text-rose-200 border-rose-500/40"
      : band === "medium"
      ? "bg-amber-500/10 text-amber-200 border-amber-500/40"
      : "bg-emerald-500/10 text-emerald-200 border-emerald-500/40";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
        classes
      )}
    >
      {label}
    </span>
  );
};

