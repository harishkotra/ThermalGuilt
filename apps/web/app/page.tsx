import { apiGet } from "../lib/api";
import { CoachCard } from "../components/coach-card";
import { GhostCard } from "../components/ghost-card";
import { GhostMap } from "../components/ghost-map";
import { LeaderboardCard } from "../components/leaderboard-card";
import { ScoreChart } from "../components/score-chart";
import { TokenCard } from "../components/token-card";

type CurrentEnergy = {
  summary: {
    score: number;
    ghostType: string;
    zScore: number;
    shameRed: boolean;
  };
};

type History = {
  rows: Array<{ timestamp: string; energyKwh: number }>;
};

type Leaderboard = {
  rows: Array<{ rank: number; handle: string; efficiencyScore: number; tokensEarned: number; ghostType: string }>;
};

export default async function DashboardPage() {
  let apiOffline = false;
  let energy: CurrentEnergy = {
    summary: { score: 50, ghostType: "Warm Hug", zScore: 0, shameRed: false }
  };
  let history: History = {
    rows: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600_000).toISOString(),
      energyKwh: 3 + Math.random() * 2
    }))
  };
  let leaderboard: Leaderboard = {
    rows: [
      { rank: 1, handle: "@coolcat_42", efficiencyScore: 97, tokensEarned: 100, ghostType: "Ice Queen" },
      { rank: 2, handle: "@frostbyte", efficiencyScore: 90, tokensEarned: 50, ghostType: "Cool Cat" },
      { rank: 3, handle: "@you", efficiencyScore: 50, tokensEarned: 5, ghostType: "Warm Hug" }
    ]
  };

  try {
    [energy, history, leaderboard] = await Promise.all([
      apiGet<CurrentEnergy>("/api/energy/current"),
      apiGet<History>("/api/energy/history"),
      apiGet<Leaderboard>("/api/leaderboard/neighborhood/n-94107-west")
    ]);
  } catch {
    apiOffline = true;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-10 pt-8 md:px-8">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="card flex min-h-[560px] flex-col justify-between p-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">THERMAL GUILT</h1>
            <p className="mt-2 text-sm text-slate-300">
              Make energy waste embarrassing. Make efficiency profitable.
            </p>
            {apiOffline ? (
              <p className="mt-3 text-xs text-amber-300">
                API is offline (`localhost:3001`). Showing fallback demo data.
              </p>
            ) : null}
          </div>
          <div className="space-y-1 text-xs text-slate-300">
            <p>
              Built By{" "}
              <a className="text-frost hover:underline" href="https://harishkotra.me" target="_blank" rel="noreferrer">
                Harish Kotra
              </a>
            </p>
            <p>
              <a className="text-frost hover:underline" href="https://dailybuild.xyz" target="_blank" rel="noreferrer">
                Checkout my other builds
              </a>
            </p>
          </div>
        </aside>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <GhostCard {...energy.summary} />
          <TokenCard score={energy.summary.score} />
          <CoachCard />
          <div className="md:col-span-2">
            <GhostMap />
          </div>
          <ScoreChart points={history.rows} />
          <LeaderboardCard entries={leaderboard.rows} />
        </div>
      </div>
    </main>
  );
}
