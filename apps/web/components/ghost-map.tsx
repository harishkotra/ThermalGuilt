"use client";

import { motion } from "framer-motion";

type GhostPoint = {
  handle: string;
  ghostType: string;
  score: number;
  x: number;
  y: number;
};

const points: GhostPoint[] = [
  { handle: "@you", ghostType: "Thermal Vampire", score: 42, x: 52, y: 58 },
  { handle: "@coolcat_42", ghostType: "Ice Queen", score: 97, x: 32, y: 38 },
  { handle: "@vent_sense", ghostType: "Warm Hug", score: 64, x: 67, y: 25 },
  { handle: "@frostbyte", ghostType: "Cool Cat", score: 84, x: 24, y: 66 }
];

function colorFor(score: number) {
  if (score >= 95) return "bg-[#7ef6ff]";
  if (score >= 75) return "bg-[#7ef6c8]";
  if (score >= 50) return "bg-[#ffb26f]";
  if (score >= 25) return "bg-[#ff6b5f]";
  return "bg-[#f9532d]";
}

export function GhostMap() {
  return (
    <section className="card p-5">
      <h2 className="text-sm uppercase tracking-[0.18em] text-slate-300">Neighborhood Heatmap</h2>
      <div className="relative mt-4 h-64 overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(126,246,255,0.12),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(249,83,45,0.18),transparent_45%),#0a1326]">
        {points.map((point) => (
          <motion.div
            key={point.handle}
            className="absolute flex flex-col items-center"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            animate={point.score < 50 ? { scale: [1, 1.2, 1] } : { y: [0, -4, 0] }}
            transition={{ duration: point.score < 50 ? 1.2 : 2.8, repeat: Infinity }}
          >
            <div className={`h-6 w-6 rounded-full ${colorFor(point.score)} shadow-lg`} />
            <span className="mt-1 text-[11px] text-slate-200">{point.handle}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
