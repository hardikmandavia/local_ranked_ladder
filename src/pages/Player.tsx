import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLeague } from "../data/useLeague";
import { mainLegend, pct, playerMatches, playerPath, type MatchOutcome, type PlayerMatch } from "../data/derive";
import { legendSlug } from "../data/legends";
import { LegendAvatar } from "../components/LegendAvatar";
import type { MatchSide } from "../data/types";

type Tone = "win" | "loss" | "draw" | "none";

// Panel colours for [the player, the opponent].
function tone(o: MatchOutcome): [Tone, Tone] {
  if (o === "win" || o === "bye") return ["win", o === "bye" ? "none" : "loss"];
  if (o === "loss") return ["loss", "win"];
  if (o === "draw") return ["draw", "draw"];
  return ["none", "none"];
}

const OUTCOME_TITLE: Record<MatchOutcome, string> = {
  win: "Win",
  loss: "Loss",
  draw: "Draw",
  bye: "Bye — counted as a win",
  none: "No opponent and no games played — the leaderboard counts this as a draw",
};

type WeekPick = number | "all";

export function Player() {
  const { player: raw = "" } = useParams();
  const player = safeDecode(raw);
  const { data } = useLeague();

  const row = useMemo(() => data.leaderboard.find((r) => r.player === player) ?? null, [data.leaderboard, player]);
  const history = useMemo(() => playerMatches(data.matches ?? [], player), [data.matches, player]);
  const weeksPlayed = useMemo(() => new Set(history.map((m) => m.week)), [history]);
  const latest = history.length ? Math.max(...history.map((m) => m.week)) : null;
  const weeks = Array.from({ length: Math.max(data.totalWeeks, latest ?? 0) }, (_, i) => i + 1);

  // Default to the most recent week the player attended; switching players resets it.
  const [week, setWeek] = useState<WeekPick>(latest ?? "all");
  useEffect(() => setWeek(latest ?? "all"), [player, latest]);

  const main = useMemo(() => mainLegend(history), [history]);

  const shown = useMemo(() => (week === "all" ? history : history.filter((m) => m.week === week)), [history, week]);
  const summary = useMemo(() => tally(shown), [shown]);

  if (!row) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-strong bg-surface p-6 text-center">
        <h1 className="mb-2 font-display text-lg font-semibold">Player not found</h1>
        <p className="text-sm text-muted">There is no player called “{player}” on the leaderboard.</p>
        <Link to="/" className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold">
          Back to the leaderboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/" className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-app">
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4">
          <path d="M12 4l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Leaderboard
      </Link>

      <div className={`player-hero mb-4 ${main ? "has-bg" : ""}`} style={main ? ({ "--art": artUrl(main) } as React.CSSProperties) : undefined}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold sm:text-3xl">{player}</h1>
            <p className="text-sm text-muted">
              Rank <span className="font-semibold text-accent tabular">#{row.rank}</span> · {row.points} pts · {row.wins}W {row.losses}L {row.draws}D ·{" "}
              {pct(row.attendance)} attendance
            </p>
            {main && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <LegendAvatar name={main} size={18} />
                Most played: <span className="font-medium text-app">{main}</span>
              </p>
            )}
          </div>
          {shown.length > 0 && (
            <p className="text-xs text-muted tabular">
              {week === "all" ? "All weeks" : `Week ${week}`}: {summary.wins}W {summary.losses}L {summary.draws}D · {summary.points} pts
            </p>
          )}
        </div>
      </div>

      <div className="tbl-scroll">
        <div className="sticky left-0 z-[5] flex flex-wrap items-center gap-1.5 border-b border-app bg-surface px-2 py-2" role="group" aria-label="Week">
          <WeekButton active={week === "all"} onClick={() => setWeek("all")} disabled={history.length === 0} title="Every match">
            All
          </WeekButton>
          <span className="mx-1 h-5 w-px" aria-hidden="true" style={{ background: "var(--border-strong)" }} />
          {weeks.map((w) => {
            const has = weeksPlayed.has(w);
            return (
              <WeekButton
                key={w}
                active={week === w}
                disabled={!has}
                onClick={() => setWeek(w)}
                title={has ? `Week ${w}` : w > data.currentWeek ? `Week ${w} hasn’t been played yet` : `${player} didn’t play in week ${w}`}
              >
                {w}
              </WeekButton>
            );
          })}
        </div>

        <ol className="match-list">
          {shown.map((m) => {
            const [mine, theirs] = tone(m.outcome);
            return (
              <li key={`${m.week}-${m.round}`} className="match-card">
                <SidePanel side={m.me} tone={mine} align="left" />
                <div className="match-mid">
                  <span className="match-round">
                    {week === "all" ? `Wk ${m.week} · ` : ""}R{m.round}
                  </span>
                  <Score outcome={m.outcome} record={m.me.record} />
                </div>
                {m.opponent ? (
                  <SidePanel side={m.opponent} tone={theirs} align="right" />
                ) : (
                  <div className={`side-panel side-right tone-${theirs} no-art`}>
                    <span className="side-name">{m.outcome === "bye" ? "Bye" : "No opponent"}</span>
                  </div>
                )}
              </li>
            );
          })}
          {shown.length === 0 && (
            <li className="py-10 text-center text-muted">
              {history.length === 0 ? "No match history is available for this player yet." : "No matches this week."}
            </li>
          )}
        </ol>
      </div>
    </div>
  );
}

const artUrl = (legend: string) => `url(${import.meta.env.BASE_URL}backgrounds/${legendSlug(legend)}.jpg)`;

function SidePanel({ side, tone, align }: { side: MatchSide; tone: Tone; align: "left" | "right" }) {
  return (
    <Link
      to={playerPath(side.player)}
      className={`side-panel side-${align} tone-${tone}`}
      style={{ "--art": artUrl(side.legend) } as React.CSSProperties}
      title={`${side.player} · ${side.legend}`}
    >
      <LegendAvatar name={side.legend} size={40} className="side-avatar" />
      <span className="side-text">
        <span className="side-name">{side.player}</span>
        <span className="side-legend">{side.legend}</span>
      </span>
    </Link>
  );
}

// Game score inside the match, "2 : 1" (games won by each side).
function Score({ outcome, record }: { outcome: MatchOutcome; record: string }) {
  const [w = 0, l = 0] = record.split("-").map(Number);
  const [mine, theirs] = tone(outcome);
  return (
    <span className="match-score" title={OUTCOME_TITLE[outcome]} aria-label={`${w} games to ${l}`}>
      <span className={`score-${mine}`}>{w}</span>
      <span className="score-sep">:</span>
      <span className={`score-${theirs}`}>{l}</span>
    </span>
  );
}

function WeekButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      title={title}
      className={`min-w-8 rounded-md px-2 py-1 text-sm font-medium tabular transition-colors ${
        active ? "bg-accent" : disabled ? "text-faint opacity-50" : "text-muted hover:bg-surface-2 hover:text-app"
      }`}
    >
      {children}
    </button>
  );
}


function tally(matches: PlayerMatch[]) {
  const t = { wins: 0, losses: 0, draws: 0, points: 0 };
  for (const m of matches) {
    // Mirrors the Leaderboard tab: a bye is a win, a no-game round is a draw.
    if (m.outcome === "win" || m.outcome === "bye") t.wins += 1;
    else if (m.outcome === "loss") t.losses += 1;
    else t.draws += 1;
    t.points += m.me.points;
  }
  return t;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
