import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

interface StatCardProps {
  label: string;
  value: number | string;
  trend?: string;
  accent?: "emerald" | "sky" | "amber" | "rose";
  rightNode?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  trend,
  accent = "emerald",
  rightNode
}) => {
  const accentClasses: Record<
    NonNullable<StatCardProps["accent"]>,
    string
  > = {
    emerald: "from-emerald-500/20 via-emerald-500/5 to-slate-900/60",
    sky: "from-sky-500/20 via-sky-500/5 to-slate-900/60",
    amber: "from-amber-500/20 via-amber-500/5 to-slate-900/60",
    rose: "from-rose-500/20 via-rose-500/5 to-slate-900/60"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br p-4 shadow-soft-xl",
        accentClasses[accent]
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
          {trend && (
            <p className="mt-1 text-[11px] text-emerald-300/90">{trend}</p>
          )}
        </div>
        {rightNode && (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950/40 text-xs text-slate-200">
            {rightNode}
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/5 blur-2xl" />
    </motion.div>
  );
};

