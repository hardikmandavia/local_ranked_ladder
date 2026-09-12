// Turns the raw workbook dump produced by read-leaderboard.mjs
// ({ file, lastModified, sheets: [{ name, rows }] }) into the normalised
// LeagueData shape consumed by the site (see SPEC.md §4).
//
// Reads the four visible tabs plus the hidden `Matchups` tab (one row per
// legend pair with a match count, which the visible pivot lacks) and the hidden
// `Match Results` tab (one row per match, which drives the per-player pages).

export const TOTAL_WEEKS = 11;

const isBlank = (v) => v === undefined || v === null || String(v).trim() === "";

function sheetRows(raw, name, { optional = false } = {}) {
  const sheet = raw.sheets.find((s) => s.name === name);
  if (!sheet && optional) return null;
  if (!sheet) throw new Error(`Sheet "${name}" not found. Available: ${raw.sheets.map((s) => s.name).join(", ")}`);
  return sheet.rows;
}

function num(v) {
  if (typeof v === "number") return v;
  if (isBlank(v)) return 0;
  const n = Number(String(v).replace("%", ""));
  if (Number.isNaN(n)) throw new Error(`Expected a number, got ${JSON.stringify(v)}`);
  return n;
}

// A grid value: numbers pass through, "." and "" become null.
function cell(v) {
  if (typeof v === "number") return v;
  if (isBlank(v) || String(v).trim() === ".") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

// Header row is the first row whose first cell is `#`; row 1 holds a stray value.
export function parseLeaderboard(rows) {
  const h = rows.findIndex((r) => String(r[0]).trim() === "#");
  if (h < 0) throw new Error("Leaderboard: header row (starting with '#') not found");
  return rows
    .slice(h + 1)
    .filter((r) => !isBlank(r[1]))
    .map((r) => ({
      rank: num(r[0]),
      player: String(r[1]).trim(),
      attendance: num(r[2]),
      points: num(r[3]),
      ptsPerMatch: num(r[4]),
      ptsPerWeek: num(r[5]),
      played: num(r[6]),
      wins: num(r[7]),
      losses: num(r[8]),
      draws: num(r[9]),
    }));
}

export function parseBestOf(rows) {
  const h = rows.findIndex((r) => String(r[0]).trim() === "Legend");
  if (h < 0) throw new Error("Best Of Leaderboard: header row not found");
  return rows
    .slice(h + 1)
    .filter((r) => !isBlank(r[0]) && !isBlank(r[1]))
    .map((r) => ({
      legend: String(r[0]).trim(),
      player: String(r[1]).trim(),
      points: num(r[2]),
      weeks: num(r[3]),
    }));
}

// Pivot table. The `# of Matches (All)` filter rows above the header are skipped:
// the header is the first row whose first cell is blank and whose second cell
// is a legend name. Data rows follow, one per row legend.
export function parseMatchupGrid(rows) {
  const h = rows.findIndex((r) => isBlank(r[0]) && !isBlank(r[1]) && typeof r[1] === "string");
  if (h < 0) throw new Error("Matchups Grid: header row not found");
  const header = rows[h];
  const colIdx = [];
  const cols = [];
  header.forEach((v, i) => {
    if (i > 0 && !isBlank(v)) {
      colIdx.push(i);
      cols.push(String(v).trim());
    }
  });
  const dataRows = rows.slice(h + 1).filter((r) => !isBlank(r[0]));
  return {
    rows: dataRows.map((r) => String(r[0]).trim()),
    cols,
    cells: dataRows.map((r) => colIdx.map((i) => cell(r[i]))),
  };
}

export function parseLegendWinrates(rows) {
  const h = rows.findIndex((r) => String(r[0]).trim() === "Legend");
  if (h < 0) throw new Error("Legend Winrates: header row not found");
  return rows
    .slice(h + 1)
    .filter((r) => !isBlank(r[0]))
    .map((r) => ({ legend: String(r[0]).trim(), winRate: num(r[1]), matches: num(r[2]) }));
}

// Hidden long-form tab: `Legend, Opponent Legend, Matches, Win %`, one row per
// legend pair (stored once, first-named legend's win rate). Optional: older
// snapshots without the tab yield an empty list.
export function parseMatchups(rows) {
  if (!rows) return [];
  const h = rows.findIndex((r) => String(r[0]).trim() === "Legend");
  if (h < 0) throw new Error("Matchups: header row not found");
  return rows
    .slice(h + 1)
    .filter((r) => !isBlank(r[0]) && !isBlank(r[1]))
    .map((r) => ({
      legend: String(r[0]).trim(),
      opponent: String(r[1]).trim(),
      matches: num(r[2]),
      winRate: num(r[3]),
    }));
}

// Hidden long-form tab, one row per match:
//   Week number, Round number,
//   Player 1 First Name, Player 1 Last Name, Player 1 Legend, Player 1 Round Record, Player 1 Points,
//   Player 2 First Name, Player 2 Last Name, Player 2 Legend, Player 2 Round Record, Player 2 Points
// Player names are `First Last` (matching the Leaderboard tab); the record is
// the game score `W-L-D` inside the match. Byes have an empty player 2 and are
// emitted with `p2: null`. Optional: older snapshots without the tab yield [].
export function parseMatchResults(rows) {
  if (!rows) return [];
  const h = rows.findIndex((r) => String(r[0]).trim().toLowerCase() === "week number");
  if (h < 0) throw new Error("Match Results: header row not found");
  const name = (first, last) => [first, last].map((v) => String(v ?? "").trim()).filter(Boolean).join(" ");
  const side = (r, i) => {
    const player = name(r[i], r[i + 1]);
    if (!player) return null;
    return { player, legend: String(r[i + 2]).trim(), record: String(r[i + 3]).trim(), points: num(r[i + 4]) };
  };
  return rows
    .slice(h + 1)
    .filter((r) => !isBlank(r[0]) && !isBlank(r[2]))
    .map((r) => ({ week: num(r[0]), round: num(r[1]), p1: side(r, 2), p2: side(r, 7) }));
}

// First player (sheet order) with 100% attendance has played every week;
// each week is 3 matches. Falls back to the largest match count if nobody
// has full attendance.
export function deriveCurrentWeek(leaderboard) {
  const full = leaderboard.find((p) => p.attendance >= 1);
  const matches = full
    ? full.wins + full.losses + full.draws
    : Math.max(0, ...leaderboard.map((p) => p.wins + p.losses + p.draws));
  return Math.round(matches / 3);
}

export function normalise(raw, { now = new Date() } = {}) {
  const leaderboard = parseLeaderboard(sheetRows(raw, "Leaderboard"));
  const matches = parseMatchResults(sheetRows(raw, "Match Results", { optional: true }));
  return {
    generatedAt: now.toISOString(),
    lastModified: raw.lastModified ?? null,
    file: raw.file ?? null,
    totalWeeks: TOTAL_WEEKS,
    currentWeek: deriveCurrentWeek(leaderboard),
    leaderboard,
    bestOf: parseBestOf(sheetRows(raw, "Best Of Leaderboard")),
    matchupGrid: parseMatchupGrid(sheetRows(raw, "Matchups Grid")),
    matchups: parseMatchups(sheetRows(raw, "Matchups", { optional: true })),
    legendWinrates: parseLegendWinrates(sheetRows(raw, "Legend Winrates")),
    matches,
  };
}
