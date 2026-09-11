export interface LeaderboardRow {
  rank: number;
  player: string;
  attendance: number; // fraction 0..1
  points: number;
  ptsPerMatch: number;
  ptsPerWeek: number;
  played: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface BestOfRow {
  legend: string;
  player: string;
  points: number;
  weeks: number; // weeks attended on this legend
}

export interface MatchupGrid {
  rows: string[];
  cols: string[];
  cells: (number | null)[][]; // cells[rowIdx][colIdx] = row legend's win rate vs col legend
}

export interface MatchupPair {
  legend: string;
  opponent: string;
  matches: number;
  winRate: number; // legend's win rate vs opponent, 0..1
}

export interface LegendWinrate {
  legend: string;
  winRate: number; // fraction 0..1
  matches: number;
}

export interface LeagueData {
  generatedAt: string;
  lastModified: string | null;
  file?: string | null;
  totalWeeks: number;
  currentWeek: number;
  leaderboard: LeaderboardRow[];
  bestOf: BestOfRow[];
  matchupGrid: MatchupGrid;
  matchups?: MatchupPair[]; // from the hidden Matchups tab; absent in old snapshots
  legendWinrates: LegendWinrate[];
}

export type Eligibility = "eligible" | "pending" | "blocked";

export interface RankedBestOf extends BestOfRow {
  status: Eligibility;
  attendance: number; // overall attendance, used as the tie-break
  position: number; // 1-based, standard competition ranking; blocked players rank after everyone else
}

export interface LegendGroup {
  legend: string;
  entries: RankedBestOf[]; // sorted: non-blocked by points/attendance, then blocked
  leaders: RankedBestOf[]; // everyone sharing position 1
  leaderPoints: number;
}
