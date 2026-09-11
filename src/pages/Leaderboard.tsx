import { Fragment, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useLeague } from "../data/useLeague";
import { fixed, pct } from "../data/derive";
import { SearchBox } from "../components/SearchBox";
import { useHighlight } from "../components/useHighlight";
import { BestOfBadge } from "../components/BestOfBadge";
import type { Eligibility } from "../data/types";

// Top 8 on the leaderboard qualify for the end-of-season tournament (ties on rank 8 included).
const QUALIFY_RANK = 8;

const COLS: { key: string; label: string; title: string; align: "left" | "right"; hideOnPhone?: boolean; sticky?: 1 | 2 }[] = [
  { key: "rank", label: "#", title: "Rank", align: "right", sticky: 1 },
  { key: "player", label: "Player", title: "Player", align: "left", sticky: 2 },
  { key: "attendance", label: "Att", title: "Attendance", align: "right" },
  { key: "points", label: "Pts", title: "Points", align: "right" },
  { key: "ptsPerMatch", label: "Pts/Ma", title: "Points per match", align: "right", hideOnPhone: true },
  { key: "ptsPerWeek", label: "Pts/We", title: "Points per week attended", align: "right", hideOnPhone: true },
  { key: "played", label: "Plyd", title: "Matches played", align: "right" },
  { key: "wins", label: "W", title: "Wins", align: "right" },
  { key: "losses", label: "L", title: "Losses", align: "right" },
  { key: "draws", label: "D", title: "Draws", align: "right" },
];

export function Leaderboard() {
  const { data, groups } = useLeague();
  const [params, setParams] = useSearchParams();

  // player → legends they currently lead (shared gold counts), alphabetical by legend
  const bestOfByPlayer = useMemo(() => {
    const m = new Map<string, { legend: string; status: Eligibility }[]>();
    for (const g of groups) {
      for (const l of g.leaders) {
        const list = m.get(l.player) ?? [];
        list.push({ legend: g.legend, status: l.status });
        m.set(l.player, list);
      }
    }
    return m;
  }, [groups]);
  const q = params.get("q") ?? "";
  const setQ = useCallback(
    (v: string) => {
      setParams(
        (p) => {
          if (v) p.set("q", v);
          else p.delete("q");
          return p;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return data.leaderboard;
    return data.leaderboard.filter((r) => r.player.toLowerCase().includes(needle));
  }, [data.leaderboard, q]);

  const tableRef = useRef<HTMLTableElement>(null);
  useHighlight(tableRef);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Leaderboard</h1>
          <p className="text-sm text-muted">
            Top {QUALIFY_RANK} qualify for the end-of-season tournament · hover or tap a cell to highlight its row and column
          </p>
        </div>
        <SearchBox
          className="w-full sm:w-80"
          label="Search players"
          placeholder="Search players…"
          value={q}
          onChange={setQ}
          hint={`${rows.length} of ${data.leaderboard.length} players`}
        />
      </div>

      <div className="tbl-scroll" style={{ "--col1-w": "2.4rem" } as React.CSSProperties}>
        <table ref={tableRef} className="tbl" key={q}>
          <thead>
            <tr>
              {COLS.map((c, i) => (
                <th
                  key={c.key}
                  scope="col"
                  data-col={i}
                  title={c.title}
                  className={`${c.align === "right" ? "text-right" : "text-left"} ${c.hideOnPhone ? "hidden sm:table-cell" : ""} ${
                    c.sticky ? `sticky-${c.sticky}` : ""
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <Fragment key={r.player}>
              {ri > 0 && rows[ri - 1].rank <= QUALIFY_RANK && r.rank > QUALIFY_RANK && (
                <tr className="qualify-divider" aria-hidden="true">
                  <td colSpan={COLS.length}>
                    <span>Top {QUALIFY_RANK}</span>
                  </td>
                </tr>
              )}
              <tr data-row={ri} className={r.rank <= QUALIFY_RANK ? "qualifier" : ""}>
                <td data-col={0} className={`sticky-1 text-right tabular ${r.rank <= QUALIFY_RANK ? "font-semibold text-accent" : "text-muted"}`}>{r.rank}</td>
                <td data-col={1} className="sticky-2 font-medium">
                  {/* phones: badges drop under the name so it isn't squeezed to nothing */}
                  <span className="flex max-w-[5.25rem] flex-col items-start gap-0.5 sm:max-w-none sm:flex-row sm:items-center sm:gap-1.5">
                    <span className="min-w-0 max-w-full truncate sm:flex-1" title={r.player}>
                      {r.player}
                    </span>
                    {bestOfByPlayer.has(r.player) && (
                      <span className="flex items-center gap-1.5 self-end sm:self-auto">
                        {bestOfByPlayer.get(r.player)!.map((b) => (
                          <BestOfBadge key={b.legend} legend={b.legend} status={b.status} size={22} />
                        ))}
                      </span>
                    )}
                  </span>
                </td>
                <td data-col={2} className="text-right tabular">{pct(r.attendance)}</td>
                <td data-col={3} className="text-right tabular font-semibold">{r.points}</td>
                <td data-col={4} className="hidden text-right tabular sm:table-cell">{fixed(r.ptsPerMatch)}</td>
                <td data-col={5} className="hidden text-right tabular sm:table-cell">{fixed(r.ptsPerWeek)}</td>
                <td data-col={6} className="text-right tabular">{r.played}</td>
                <td data-col={7} className="text-right tabular text-win">{r.wins}</td>
                <td data-col={8} className="text-right tabular text-loss">{r.losses}</td>
                <td data-col={9} className="text-right tabular text-draw">{r.draws}</td>
              </tr>
              </Fragment>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLS.length} className="py-10 text-center text-muted">
                  No players match “{q}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
