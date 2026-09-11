# Riftbound League Stats Site — Specification

Status: v0.2 (2026-09-11). All open questions resolved; decisions recorded in §9.

## 1. Goal

A public, read-only, responsive website that visualises the "Mythic Goblin Riftbound Vendetta League" workbook
(shared OneDrive .xlsx). The workbook is the single source of truth and is updated weekly. There is no database.

## 2. Source data (as observed on 2026-09-10 snapshot)

The workbook has 7 tabs; three (`Config`, `Match Results`, `Matchups`) are hidden sheets and are **out of scope for
now** — the site reads only the four visible tabs below. (The hidden tabs are described in §10 for future reference.)

| Tab | Shape | Notes |
|---|---|---|
| `Leaderboard` | 150 rows × 10 cols | Header is on row 2 (row 1 holds a non-visible value the parser must skip). Columns: `#, Player, Att, Pts, Pts/Ma, Pts/We, Plyd, W, L, D`. `Att` is a fraction (1, 0.8, 0.6 …) → render as `%`. Ranks tie (e.g. many players at `#134`). |
| `Best Of Leaderboard` | 198 rows × 6 cols | `Legend, Player, Pts, Wks Att, Wks>5, Best Of`. **Already contains per-player weeks on each legend (`Wks Att`)**, so no derivation is needed for that. The sheet's own `Best Of = YES` flag ignores eligibility and has ties (46 YES across 40 legends) — the site computes its own. |
| `Matchups Grid` | pivot, 36 row legends × 39 column legends | `.` = no data. Asymmetric: Lux, Shen, Volibear, Zed have columns but no rows. No match counts. |
| `Legend Winrates` | 40 rows × 3 cols | `Legend, Winrate (fraction), Matches`. |

Legend names are plain (e.g. `Akali`) except `Master Yi, Wuju Bladesman`. 40 legends appear in Best Of; 39/36 in the grid.

### Derived values

- **`currentWeek`** = take the **first** row in the Leaderboard (sheet order) whose `Att` is 100%, sum its
  `W + L + D`, divide by 3. Currently Tawhid Rahman, 15 matches → 5.
- **`totalWeeks`** = 11, hard-coded constant.
- **`weeksRemaining`** = `totalWeeks − currentWeek`.
- **Best-of eligibility** per (legend, player), with `wks = Wks Att`:
  - `eligible` if `wks ≥ 6` → green check
  - `pending` if `wks < 6` and `wks + weeksRemaining ≥ 6` → hourglass
  - `blocked` if `wks + weeksRemaining < 6` → red blocked icon; sorted after all non-blocked entries
  - Today (5 of 11 weeks, 6 remaining) nobody is eligible or blocked; everyone shows an hourglass, and the
    "current best of" is simply the top-points player. Blocked entries start appearing from week 6 onward for anyone
    with 0 weeks on a legend, etc.

## 3. Architecture

### 3.1 Data access — the key decision (see Q4)

The Graph API refuses anonymous access to this file. The existing `scripts/read-leaderboard.mjs` signs in with a
device-code flow and caches a **refresh token** locally. That token must never ship to the browser, so the site cannot
read the workbook client-side.

**Decision: static site + scheduled daily snapshot, hosted on GitHub Pages** (the repo is already on GitHub, so
build, data refresh and hosting live in one place with no extra accounts; Cloudflare Pages is the fallback if a custom
domain or faster CDN is wanted later — domain deferred).

1. A GitHub Actions workflow (cron daily 06:00 UTC, plus manual `workflow_dispatch`) runs the reader script
   with `MS_CLIENT_ID` and the refresh token stored as repository secrets.
2. The script is extended to emit a normalised `public/data/league.json` (see §4) including `lastModified` from Graph
   and a `generatedAt` stamp.
3. The site is built (Vite) and deployed to GitHub Pages via `actions/deploy-pages`. A separate `deploy.yml` also
   runs on every push to `main` (reusing the last committed `league.json`) so code changes ship without a refresh.
4. The workflow also re-saves the rotated refresh token back into the secret (`gh secret set`), since Microsoft rotates
   it on each use and consumer tokens expire after 90 days of non-use.

Trade-offs: data freshness = cron interval (the workbook changes weekly, so a daily pull is plenty and a manual trigger
covers "I just updated it"). Zero runtime secrets, zero servers, free hosting.

Alternative: a serverless function (Vercel/Netlify) holding the token, fetching + parsing the xlsx on request with a
1h cache. Always fresh, but adds a runtime secret, cold-start parsing of a 250 KB workbook, and a hosting dependency.

### 3.2 Stack

- Vite + React 18 + TypeScript, React Router (4–5 routes), Tailwind CSS.
- No charting library needed; every view is a table/grid/card layout. `@tanstack/react-table` optional for
  sort/filter on the two tables — plain hooks are sufficient.
- Data loaded once (`fetch('/data/league.json')`), parsed and derived in a `useLeague()` context.
- Dark theme by default (matches riftdecks and Riftbound branding); light theme optional.
- Legend portraits: `public/legends/<slug>.png` (or `.webp`) with a `legends.json` mapping legend name → slug.
  Real images arrive later; until then every legend renders a **placeholder** (initials on a deterministic colour
  derived from the name). Legend names are always shown **in full** — `Master Yi, Wuju Bladesman` is never shortened,
  because a second Master Yi legend exists.

### 3.3 Layout shell

- Top nav (desktop) / bottom tab bar or hamburger (≤640px): Leaderboard · Best Of · Matchups · Legends.
- Footer: "Data from the league workbook · last updated {lastModified} · snapshot {generatedAt}". Week badge
  "Week {currentWeek} of {totalWeeks}" in the header.
- Breakpoints: 360, 640, 768, 1024, 1280+. All tables scroll horizontally inside their own container; the page never
  scrolls sideways.

## 4. Normalised data model (`league.json`)

```ts
interface LeagueData {
  generatedAt: string;        // ISO
  lastModified: string;       // from Graph driveItem
  totalWeeks: number;         // 11
  currentWeek: number;        // derived
  leaderboard: {
    rank: number; player: string; attendance: number; points: number;
    ptsPerMatch: number; ptsPerWeek: number; played: number; wins: number; losses: number; draws: number;
  }[];
  bestOf: { legend: string; player: string; points: number; weeks: number }[];
  matchupGrid: { rows: string[]; cols: string[]; cells: (number | null)[][] }; // from the pivot tab
  legendWinrates: { legend: string; winRate: number; matches: number }[];
}
```

Parsing rules: Leaderboard header row is detected by finding the row whose first cell is `#` (do not assume row 2).
Numeric cells stay numbers; `.` in the grid → `null`; `""` → `null`.

## 5. Pages

### 5.1 `/` — Leaderboard

- Table with all 10 columns. Default order = sheet order (rank).
- **Search box** (debounced, case-insensitive, matches any part of the player name). Shows "N of M players".
  Clear button. Query persisted in URL (`?q=`) so it can be shared.
- **Row + column highlighting**: hovering a cell highlights its whole row and whole column; clicking a cell "pins"
  the highlight (click again or press Esc to unpin). On touch devices tap = pin (no hover).
- Sticky header row; sticky first two columns (`#`, `Player`) on narrow screens.
- Formatting: `Att` as `100%`, `Pts/Ma` and `Pts/We` to 2 dp, W/L/D coloured subtly (green/red/grey).
- Mobile (<640px): the `Pts/Ma` and `Pts/We` columns are hidden; the remaining 8 columns fit without horizontal
  scroll. Tablet and up show all 10.

### 5.2 `/best-of` — Best Of Leaderboard

- Group `bestOf` rows by legend. Sort legends alphabetically (option to sort by "leader's points").
- Responsive grid of **legend cards**: a large circular portrait (Instagram-story style ring), the legend name,
  then the current best-of player underneath: name, points, `{weeks} wks`, and the eligibility icon.
- Grid columns: 2 (phone) → 3 (tablet) → 5–6 (desktop).
- Legend-level search/filter box at the top (optional but cheap).
- **Ranking within a legend**:
  1. Partition into non-blocked and blocked.
  2. Sort each partition by points desc, then by the player's **overall attendance** (`Att` from the Leaderboard tab,
     joined on player name) desc.
  3. Players still tied after both keys **share the position** (standard competition ranking: two shared golds are
     followed by bronze, not silver).
  4. Concatenate: non-blocked first, blocked after.
  5. `current best of` = every player sharing position 1. If two or more share gold, the legend card shows **all of
     them** in the best-of slot (stacked names, same points/weeks/status line each).
- **Eligibility icons** (with `title`/aria-label text): ✅ eligible (≥6 wks), ⏳ pending, ⛔ blocked
  (mathematically cannot reach 6). Rendered as small inline SVGs, not emoji, for consistent cross-platform look.
- **Modal** (click card or the best-of player): title = legend name + portrait.
  - Row 1: 🥇 + player name (large), points, weeks, eligibility icon. Shared gold → one row per player, same size.
  - Row 2 (if present): 🥈, slightly smaller. Skipped entirely if gold is shared by two or more.
  - Row 3 (if present): 🥉, smaller again. Skipped if the top two positions already hold three or more players.
  - Remaining: compact table `Player · Pts · Wks · Status` in the same order.
  - Blocked players always sink to the bottom of the modal list, even if their points would put them on a podium.
  - Closes on overlay click, Esc, close button. On phones it is a full-height bottom sheet. Focus is trapped and
    returned on close; `role="dialog"`, `aria-modal`.
  - Deep-linkable: `/best-of?legend=Akali` opens the modal.
- Empty state: legend with no rows is not shown.

### 5.3 `/matchups` — Matchups Grid (riftdecks-style win-rate matrix)

Reference (riftdecks.com/stats/winrate): dark table, legend portrait + name in both the sticky header row and sticky
first column, every cell shows win% large with match count small, cells coloured on a red→amber→green scale by win%,
`--` on the diagonal / no data, an "Overall" first column, and a sort control (matches / winrate / alphabetical).

Spec:

- Build the matrix from the **`Matchups Grid` pivot tab** as-is: row legend vs column legend, value = row legend's
  win rate, `.` = no data. The tab has no per-cell match counts, so cells show win% only (no "N matches" line and no
  sample-size fading, unlike riftdecks). Parsing: header row = first row whose cell B is non-empty; the `# of Matches
  (All)` filter rows above it are skipped.
- The pivot is asymmetric (36 row legends, 39 column legends; Lux, Shen, Volibear, Zed have no row). Render the axis
  as the union of row and column legends (39); legends with no row are shown as **empty rows** (all `--`). No
  mirroring.
- Axis order selectable: by matches played (default, from `Legend Winrates`), by overall win rate, alphabetical.
- First data column = **Overall** from `Legend Winrates` (win rate + matches).
- Cell: `62%` (bold). Background: diverging scale centred on 50% (red → grey → green). Diagonal and missing = `--` on
  neutral grey.
- Hover/tap tooltip: "Akali vs Ambessa · 67%". Row + column highlight on hover like the leaderboard.
- Sticky header row and sticky first column; the table scrolls inside its container both ways on small screens.
  Portrait 32px, name truncated below it; on phones names show only on the sticky column and the header shows
  portraits only.
- Controls above the grid: sort-by and a legend search that highlights/scrolls to that row. (A minimum-matches
  filter needs per-cell counts, which only the hidden `Matchups` tab has — deferred.)
- Colour legend bar under the controls (red 0% → grey 50% → green 100%).

### 5.4 `/legends` — Legend Winrates

- Table: `Legend (portrait + name) · Win rate · Matches`. Optional derived `Wins` (= round(rate × matches)).
- Default sort: win rate desc. Clickable headers toggle asc/desc on win rate and matches (and name).
- Search box filters by legend name.
- Win rate cell shows `%` to 1 dp plus a thin inline bar; matches cell right-aligned. Low-sample rows
  (< 5 matches) get a muted "small sample" hint.
- Row click → `/matchups?legend=X` (highlights that row in the grid). Nice-to-have.

## 6. Non-functional

- Responsive 360px → 1440px+; tested on iPhone SE width, iPad, 1080p desktop.
- Accessibility: keyboard-navigable tables and modal; icons have text alternatives; colour is never the only
  signal (icons + text for eligibility, numbers in matrix cells).
- Performance: single ~100 KB JSON, no runtime API calls, Lighthouse ≥ 90 on mobile.
- SEO not a concern (private league), but a basic `<title>` per page and an OG image are cheap.
- Error state: if `league.json` fails to load, show a friendly message with the last-known `generatedAt`.

## 7. Repo layout (proposed)

```
scripts/read-leaderboard.mjs   # existing; add --out=public/data/league.json + normalisation
scripts/normalise.mjs           # sheet rows → LeagueData (unit-tested with the current snapshot as fixture)
.github/workflows/refresh.yml   # cron + dispatch: fetch → normalise → build → deploy
src/
  main.tsx, App.tsx, routes/
  data/ (types, useLeague, derive.ts: currentWeek, eligibility, matrix)
  components/ (DataTable, LegendAvatar, Modal, HighlightGrid, SearchBox)
  pages/ (Leaderboard, BestOf, Matchups, Legends)
public/legends/*.png, public/data/league.json
```

## 8. Milestones

1. Data pipeline: normalisation + fixture tests + CI workflow that commits `league.json`. (½ day)
2. Shell + Leaderboard page. (½ day)
3. Legend Winrates page + LegendAvatar + portrait assets. (½ day)
4. Best Of page + modal + eligibility. (1 day)
5. Matchups matrix. (1 day)
6. Responsive polish, a11y pass, deploy. (½ day)

## 9. Decisions log (questions resolved 2026-09-11)

| # | Topic | Decision |
|---|---|---|
| 1 | Extra tabs | Hidden tabs ignored; four pages only. |
| 2 | Current week | First 100%-attendance player in sheet order; `(W+L+D) / 3`. |
| 3 | Stray A1 value | Not visible to the owner; ignore it, parser skips row 1. |
| 4 | Hosting | Static site, GitHub Pages, GitHub Actions for build + daily data refresh. Domain deferred. |
| 5 | Stack | Vite + React + TypeScript + Tailwind. |
| 6 | Portraits | Placeholders now; owner supplies an image folder later. Full legend names, never shortened. |
| 7 | Leaderboard on phones | Hide `Pts/Ma` and `Pts/We` below 640px. |
| 8 | Best Of tie-break | Points, then overall attendance, then shared medal; all shared-gold players shown on the card. |
| 9 | Grid gaps | Legends with no row are rendered as empty rows. |
| 10 | Constants | `totalWeeks = 11` hard-coded; `weeksRemaining = totalWeeks − currentWeek`. |
| 11 | Refresh | Daily cron plus manual dispatch. |

## 10. Hidden tabs (ignored for now)

For later: the workbook also contains three hidden sheets that the visible tabs are derived from. They are fetched
with the file anyway, so enabling them later is a parsing change, not an access change.

- `Config` — key/value settings (`WorkbookPath`). A natural home for `TotalWeeks` / `MinWeeksForBestOf` (Q10).
- `Match Results` — one row per match (week, round, both players' names, legends, game record, points; byes have an
  empty player 2). Would give an exact `currentWeek` (`max(Week number)`) and a match explorer page.
- `Matchups` — long-form `Legend, Opponent, Matches, Win %`, one row per pair. Would give per-cell match counts and a
  symmetric matrix, enabling riftdecks-style sample-size fading and a minimum-matches filter.
