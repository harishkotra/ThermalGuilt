"use client";

import { motion } from "framer-motion";

type Entry = {
  rank: number;
  handle: string;
  efficiencyScore: number;
  tokensEarned: number;
  ghostType: string;
};

export function LeaderboardCard({ entries }: { entries: Entry[] }) {
  return (
    <section className="card p-5">
      <h2 className="text-sm uppercase tracking-[0.18em] text-slate-300">Neighborhood Leaderboard</h2>
      <ol className="mt-4 space-y-2">
        {entries.slice(0, 10).map((entry, idx) => (
          <motion.li
            key={`${entry.handle}-${entry.rank}`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 ${entry.rank <= 3 ? "border-mint/40 bg-mint/10" : "border-white/10 bg-white/5"}`}
          >
            <span className="text-sm">#{entry.rank} {entry.handle}</span>
            <span className="text-sm text-slate-300">{entry.efficiencyScore} • {entry.tokensEarned} COOL</span>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
