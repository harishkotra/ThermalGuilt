"use client";

import { FormEvent, useState } from "react";
import { apiPost } from "../lib/api";

type ChatReply = {
  assistant: string;
  roastLevel: string;
  reply: string;
};

export function CoachCard() {
  const [input, setInput] = useState("Why am I a Thermal Vampire?");
  const [reply, setReply] = useState<string>("Ask ThermalCoach for a roast or a recovery plan.");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await apiPost<ChatReply>("/api/ai/chat", { message: input });
      setReply(data.reply);
    } catch {
      setReply("ThermalCoach is temporarily unavailable. Try again in a minute.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card p-5">
      <h2 className="text-sm uppercase tracking-[0.18em] text-slate-300">AI Coach</h2>
      <form onSubmit={onSubmit} className="mt-3 space-y-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-lg border border-white/20 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-frost"
        />
        <button
          disabled={loading}
          className="rounded-lg bg-frost px-3 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
          type="submit"
        >
          {loading ? "Analyzing..." : "Send"}
        </button>
      </form>
      <p className="mt-3 text-sm text-slate-200">{reply}</p>
    </section>
  );
}
