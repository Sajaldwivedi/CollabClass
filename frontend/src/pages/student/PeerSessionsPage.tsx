import React from "react";
import { motion } from "framer-motion";
import { Clock, Sparkles } from "lucide-react";

export const StudentPeerSessionsPage: React.FC = () => {
  // Backend currently exposes peer sessions only for teachers.
  // This page presents an explanatory, future-proof view for students.

  return (
    <div className="space-y-4">
      <section className="glass-surface rounded-3xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Peer sessions
            </p>
            <p className="text-xs text-slate-300">
              Your teacher can schedule 1:1 or small-group mentorship sessions.
              Once scheduled, invites will appear here and in your calendar.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-900/80 px-2 py-1 text-[10px] text-slate-400">
            <Sparkles className="h-3 w-3" />
            Coming from your faculty
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-950/80 px-4 py-10 text-center text-xs text-slate-400">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900"
          >
            <Clock className="h-5 w-5 text-slate-300" />
          </motion.div>
          <p className="max-w-sm">
            When your teacher spins up peer mentorship for this course,
            you&apos;ll see upcoming and completed sessions here with live
            status and notes. For now, focus on doubts and submissions – they
            feed directly into the mentorship suggestions engine.
          </p>
        </div>
      </section>
    </div>
  );
};

