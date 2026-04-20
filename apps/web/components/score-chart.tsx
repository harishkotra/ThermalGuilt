"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = {
  timestamp: string;
  energyKwh: number;
};

export function ScoreChart({ points }: { points: Point[] }) {
  const data = points.slice(-24).map((p) => ({
    hour: new Date(p.timestamp).getHours(),
    kwh: Number(p.energyKwh.toFixed(2))
  }));

  return (
    <section className="card p-5">
      <h2 className="text-sm uppercase tracking-[0.18em] text-slate-300">24h HVAC Burn Curve</h2>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="kwh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#61d3ff" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#61d3ff" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="hour" stroke="#bdd4ff" />
            <YAxis stroke="#bdd4ff" />
            <Tooltip />
            <Area type="monotone" dataKey="kwh" stroke="#61d3ff" fill="url(#kwh)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
