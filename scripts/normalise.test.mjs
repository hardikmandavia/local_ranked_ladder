import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalise, deriveCurrentWeek, parseMatchupGrid, parseMatchResults } from "./normalise.mjs";

const raw = JSON.parse(
  await readFile(new URL("./fixtures/workbook-2026-09-10.json", import.meta.url), "utf8")
);
const data = normalise(raw, { now: new Date("2026-09-11T06:00:00Z") });

test("metadata", () => {
  assert.equal(data.generatedAt, "2026-09-11T06:00:00.000Z");
  assert.equal(data.lastModified, "2026-09-10T22:06:02Z");
  assert.equal(data.totalWeeks, 11);
  assert.equal(data.currentWeek, 5);
});

test("leaderboard skips the stray first row and keeps numbers numeric", () => {
  assert.equal(data.leaderboard.length, 149);
  assert.deepEqual(data.leaderboard[0], {
    rank: 1, player: "Tawhid Rahman", attendance: 1, points: 43, ptsPerMatch: 2.87,
    ptsPerWeek: 8.6, played: 15, wins: 14, losses: 0, draws: 1,
  });
  assert.equal(data.leaderboard.at(-1).rank, 134);
  for (const p of data.leaderboard) {
    assert.equal(typeof p.attendance, "number");
    assert.equal(p.played, p.wins + p.losses + p.draws);
  }
});

test("best of rows", () => {
  assert.equal(data.bestOf.length, 198);
  assert.deepEqual(data.bestOf[0], { legend: "Akali", player: "Cold Phnx", points: 33, weeks: 4 });
  assert.ok(data.bestOf.some((r) => r.legend === "Master Yi, Wuju Bladesman"));
  assert.equal(new Set(data.bestOf.map((r) => r.legend)).size, 40);
});

test("matchup grid skips the pivot filter rows and maps '.' to null", () => {
  const g = data.matchupGrid;
  assert.equal(g.rows.length, 36);
  assert.equal(g.cols.length, 39);
  assert.equal(g.rows[0], "Akali");
  assert.equal(g.cols[0], "Ambessa");
  assert.ok(g.cols.includes("Master Yi, Wuju Bladesman"));
  assert.ok(!g.rows.includes("Lux") && g.cols.includes("Lux"));
  assert.equal(g.cells.length, 36);
  assert.ok(g.cells.every((r) => r.length === 39));
  assert.equal(g.cells[0][0], 0.6667); // Akali vs Ambessa
  assert.equal(g.cells[0][8], null); // Akali vs Ivern is "."
  assert.ok(g.cells.flat().every((c) => c === null || (typeof c === "number" && c >= 0 && c <= 1)));
});

test("matchup grid header detection tolerates a whitespace-only first cell", () => {
  const g = parseMatchupGrid([
    ["# of Matches", "(All)"],
    [" ", ""],
    ["", "A", "B"],
    ["A", ".", 1],
    ["B", 0, "."],
  ]);
  assert.deepEqual(g, { rows: ["A", "B"], cols: ["A", "B"], cells: [[null, 1], [0, null]] });
});

test("matchups pairs from the hidden tab", () => {
  assert.equal(data.matchups.length, 305);
  assert.deepEqual(data.matchups[0], { legend: "Akali", opponent: "Ambessa", matches: 3, winRate: 0.6667 });
  assert.ok(data.matchups.every((m) => Number.isInteger(m.matches) && m.matches > 0));
  // The pivot tab is a cached Excel PivotTable and lags the pair rows (6 cells
  // differed on this snapshot), so the site prefers the pairs when present.
});

test("matchups tab is optional", () => {
  const without = { ...raw, sheets: raw.sheets.filter((s) => s.name !== "Matchups") };
  assert.deepEqual(normalise(without).matchups, []);
});

test("legend winrates", () => {
  assert.equal(data.legendWinrates.length, 40);
  assert.deepEqual(data.legendWinrates[0], { legend: "Jhin", winRate: 1, matches: 3 });
});

test("current week falls back to the largest match count", () => {
  assert.equal(deriveCurrentWeek([{ attendance: 0.6, wins: 5, losses: 3, draws: 1 }]), 3);
  assert.equal(deriveCurrentWeek([]), 0);
});

test("match results: names join first/last, byes have no second player, missing tab is empty", () => {
  const rows = parseMatchResults([
    ["Week number", "Round number", "Player 1 First Name", "Player 1 Last Name", "Player 1 Legend", "Player 1 Round Record", "Player 1 Points", "Player 2 First Name", "Player 2 Last Name", "Player 2 Legend", "Player 2 Round Record", "Player 2 Points"],
    ["1", "1", "Lisa", "M", "Kai'Sa", "1-2-0", 0, "Aaron", "B", "Irelia", "2-1-0", 3],
    ["2", "3", "Daniel", "C", "Ezreal", "2-0-0", 3, "", "", "", "0-0-0", ""],
  ]);
  assert.deepEqual(rows, [
    { week: 1, round: 1, p1: { player: "Lisa M", legend: "Kai'Sa", record: "1-2-0", points: 0 }, p2: { player: "Aaron B", legend: "Irelia", record: "2-1-0", points: 3 } },
    { week: 2, round: 3, p1: { player: "Daniel C", legend: "Ezreal", record: "2-0-0", points: 3 }, p2: null },
  ]);
  assert.deepEqual(parseMatchResults(null), []);
  assert.deepEqual(data.matches, []); // the 2026-09-10 fixture predates the tab
});
