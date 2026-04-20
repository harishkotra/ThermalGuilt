"use client";

import { motion } from "framer-motion";
import { ghostPalette } from "../lib/ghost-color";

type Props = {
  score: number;
  ghostType: string;
  zScore: number;
  shameRed: boolean;
};

export function GhostCard({ score, ghostType, zScore, shameRed }: Props) {
  const palette = ghostPalette(ghostType);

  return (
    <section className="card p-5">
      <h2 className="text-sm uppercase tracking-[0.18em] text-slate-300">Your Thermal Ghost</h2>
      <div className="mt-4 flex items-center gap-5">
        <motion.div
          animate={shameRed ? { scale: [1, 1.07, 1], opacity: [0.75, 1, 0.75] } : { y: [0, -8, 0] }}
          transition={{ duration: shameRed ? 1.1 : 3.2, repeat: Infinity }}
          className={`h-24 w-24 rounded-full ring-4 ${palette.ring} ${palette.glow} flex items-center justify-center text-xl font-bold`}
        >
          👻
        </motion.div>
        <div>
          <p className="text-3xl font-semibold">{ghostType}</p>
          <p className="text-slate-300">Efficiency Score: <span className="text-frost">{score}</span>/100</p>
          <p className={shameRed ? "text-plasma" : "text-mint"}>Neighborhood Delta: {zScore.toFixed(2)}σ</p>
        </div>
      </div>
    </section>
  );
}
