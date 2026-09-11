import type {
  BestOfRow,
  Eligibility,
  LeaderboardRow,
  LeagueData,
  LegendGroup,
  LegendWinrate,
  MatchupGrid,
  MatchupPair,
  RankedBestOf,
} from "./types";

export const MIN_WEEKS_FOR_BEST_OF = 6;

export function weeksRemaining(data: Pick<LeagueData, "totalWeeks" | "currentWeek">): number {
  return Math.max(0, data.totalWeeks - data.currentWeek);
}

export function eligibility(weeks: number, remaining: number): Eligibility {
  if (weeks >= MIN_WEEKS_FOR_BEST_OF) return "eligible";
  if (weeks + remaining >= MIN_WEEKS_FOR_BEST_OF) return "pending";
  return "blocked";
}

export function attendanceByPlayer(leaderboard: LeaderboardRow[]): Map<string, number> {
  return new Map(leaderboard.map((p) => [p.player, p.attendance]));
}

// Ranks one legend's players: non-blocked first, then blocked; each partition
// sorted by points desc then overall attendance desc; ties share a position
// (1, 1, 3 …).
export function rankLegend(
  rows: BestOfRow[],
  attendance: Map<string, number>,
  remaining: number
): RankedBestOf[] {
  const withStatus = rows.map((r) => ({
    ...r,
    status: eligibility(r.weeks, remaining),
    attendance: attendance.get(r.player) ?? 0,
  }));
  const byScore = (a: (typeof withStatus)[number], b: (typeof withStatus)[number]) =>
    b.points - a.points || b.attendance - a.attendance || a.player.localeCompare(b.player);
  const open = withStatus.filter((r) => r.status !== "blocked").sort(byScore);
  const blocked = withStatus.filter((r) => r.status === "blocked").sort(byScore);

  const ranked: RankedBestOf[] = [];
  let position = 0;
  for (const partition of [open, blocked]) {
    let prev: (typeof withStatus)[number] | null = null;
    let prevPos = 0;
    for (const r of partition) {
      position += 1;
      const tied = prev && prev.points === r.points && prev.attendance === r.attendance;
      const pos = tied ? prevPos : position;
      ranked.push({ ...r, position: pos });
      prev = r;
      prevPos = pos;
    }
  }
  return ranked;
}

export function legendGroups(data: LeagueData): LegendGroup[] {
  const remaining = weeksRemaining(data);
  const att = attendanceByPlayer(data.leaderboard);
  const byLegend = new Map<string, BestOfRow[]>();
  for (const row of data.bestOf) {
    const list = byLegend.get(row.legend) ?? [];
    list.push(row);
    byLegend.set(row.legend, list);
  }
  return [...byLegend.entries()]
    .filter(([, rows]) => rows.length > 0)
    .map(([legend, rows]) => {
      const entries = rankLegend(rows, att, remaining);
      const leaders = entries.filter((e) => e.position === 1);
      return { legend, entries, leaders, leaderPoints: leaders[0]?.points ?? 0 };
    })
    .sort((a, b) => a.legend.localeCompare(b.legend));
}

export interface MatchupCell {
  winRate: number;
  matches: number | null; // null when only the pivot (no counts) is available
}

export interface Matrix {
  legends: string[]; // union of every legend seen, alphabetical
  lookup: (row: string, col: string) => MatchupCell | null;
}

// Source of truth is the pair list from the hidden Matchups tab (it carries
// match counts and is fresher than the cached pivot). Each pair is stored
// once, so (B, A) is derived from (A, B): same matches, win rate 1 − v. The
// pivot fills any cell the pairs don't cover.
export function buildMatrix(grid: MatchupGrid, pairs: MatchupPair[] = []): Matrix {
  const rowIdx = new Map(grid.rows.map((l, i) => [l, i]));
  const colIdx = new Map(grid.cols.map((l, i) => [l, i]));
  const byPair = new Map(pairs.map((p) => [`${p.legend}\u0000${p.opponent}`, p]));
  const legends = [...new Set([...grid.rows, ...grid.cols, ...pairs.flatMap((p) => [p.legend, p.opponent])])].sort((a, b) =>
    a.localeCompare(b)
  );

  const pivot = (row: string, col: string): number | null => {
    const r = rowIdx.get(row);
    const c = colIdx.get(col);
    if (r === undefined || c === undefined) return null;
    return grid.cells[r]?.[c] ?? null;
  };
  const mirror = (v: number) => Math.round((1 - v) * 10000) / 10000;

  return {
    legends,
    lookup: (row, col) => {
      const direct = byPair.get(`${row}\u0000${col}`);
      if (direct) return { winRate: direct.winRate, matches: direct.matches };
      const reverse = byPair.get(`${col}\u0000${row}`);
      if (reverse) return { winRate: mirror(reverse.winRate), matches: reverse.matches };
      const p = pivot(row, col);
      if (p !== null) return { winRate: p, matches: null };
      const q = pivot(col, row);
      return q === null ? null : { winRate: mirror(q), matches: null };
    },
  };
}

export function winrateByLegend(rows: LegendWinrate[]): Map<string, LegendWinrate> {
  return new Map(rows.map((r) => [r.legend, r]));
}

export type AxisSort = "matches" | "winrate" | "alpha";

export function sortLegends(legends: string[], by: AxisSort, wr: Map<string, LegendWinrate>): string[] {
  const list = [...legends];
  if (by === "alpha") return list.sort((a, b) => a.localeCompare(b));
  return list.sort((a, b) => {
    const A = wr.get(a);
    const B = wr.get(b);
    const ka = by === "matches" ? (A?.matches ?? -1) : (A?.winRate ?? -1);
    const kb = by === "matches" ? (B?.matches ?? -1) : (B?.winRate ?? -1);
    return kb - ka || (B?.matches ?? 0) - (A?.matches ?? 0) || a.localeCompare(b);
  });
}

// ---- formatting helpers ----
export const pct = (v: number, dp = 0) => `${(v * 100).toFixed(dp)}%`;
export const fixed = (v: number, dp = 2) => v.toFixed(dp);

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "unknown";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
