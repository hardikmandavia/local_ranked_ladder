import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLeague } from "../data/useLeague";
import { pct, sortLegends, type AxisSort } from "../data/derive";
import { LegendAvatar } from "../components/LegendAvatar";
import { SearchBox } from "../components/SearchBox";
import { useHighlight, type HighlightCell } from "../components/useHighlight";

// Three-band colour scale (HSL stops, interpolated within each band):
//   0–45%   deep red → lighter red
//   45–55%  dark orange-yellow → light yellow
//   55–100% pale yellow-green → deep green
type Hsl = [h: number, s: number, l: number];
const BANDS: { from: number; to: number; start: Hsl; end: Hsl }[] = [
  { from: 0, to: 0.45, start: [0, 48, 30], end: [3, 50, 50] },
  { from: 0.45, to: 0.55, start: [34, 58, 40], end: [50, 60, 60] },
  { from: 0.55, to: 1, start: [78, 38, 56], end: [148, 42, 26] },
];

function scaleColour(v: number): { bg: string; fg: string } {
  const x = Math.min(1, Math.max(0, v));
  const band = BANDS.find((b) => x < b.to) ?? BANDS[BANDS.length - 1];
  const t = (x - band.from) / (band.to - band.from);
  const mix = (i: 0 | 1 | 2) => band.start[i] + (band.end[i] - band.start[i]) * t;
  const l = mix(2);
  return { bg: `hsl(${mix(0).toFixed(0)} ${mix(1).toFixed(0)}% ${l.toFixed(0)}%)`, fg: l > 50 ? "#14110a" : "#f1f2f6" };
}

function cellStyle(v: number): React.CSSProperties {
  const { bg, fg } = scaleColour(v);
  return { background: bg, color: fg };
}

// Gradient for the key bar: sample the scale at each band edge and a few points between.
const SCALE_GRADIENT = `linear-gradient(90deg, ${[0, 0.15, 0.3, 0.4499, 0.45, 0.5, 0.5499, 0.55, 0.7, 0.85, 1]
  .map((v) => `${scaleColour(v).bg} ${(v * 100).toFixed(2)}%`)
  .join(", ")})`;

export function Matchups() {
  const { matrix, winrates } = useLeague();
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState<AxisSort>("matches");
  const legendQ = params.get("legend") ?? "";
  const setLegendQ = useCallback(
    (v: string) =>
      setParams(
        (p) => {
          if (v) p.set("legend", v);
          else p.delete("legend");
          return p;
        },
        { replace: true }
      ),
    [setParams]
  );

  const legends = useMemo(() => sortLegends(matrix.legends, sort, winrates), [matrix.legends, sort, winrates]);

  // The searched legend: exact name first, otherwise the first substring match.
  const focused = useMemo(() => {
    const needle = legendQ.trim().toLowerCase();
    if (!needle) return null;
    return legends.find((l) => l.toLowerCase() === needle) ?? legends.find((l) => l.toLowerCase().includes(needle)) ?? null;
  }, [legendQ, legends]);

  const tableRef = useRef<HTMLTableElement>(null);
  const captionRef = useRef<HTMLSpanElement>(null);
  const onCell = useCallback(
    (c: HighlightCell | null) => {
      const el = captionRef.current;
      if (!el) return;
      if (!c || c.row < 0 || c.col < 1) {
        el.textContent = "";
        return;
      }
      const row = legends[c.row];
      if (c.col === 1) {
        const w = winrates.get(row);
        el.textContent = w ? `${row} overall · ${pct(w.winRate)} over ${w.matches} games` : `${row} overall · no data`;
        return;
      }
      const col = legends[c.col - 2];
      const v = row === col ? null : matrix.lookup(row, col);
      const detail = v === null ? "no data" : `${pct(v.winRate)}${v.matches !== null ? ` over ${v.matches} ${v.matches === 1 ? "game" : "games"}` : ""}`;
      el.textContent = `${row} vs ${col} · ${detail}${c.pinned ? " (pinned)" : ""}`;
    },
    [legends, matrix, winrates]
  );
  useHighlight(tableRef, onCell);

  useEffect(() => {
    if (!focused) return;
    const row = tableRef.current?.querySelector<HTMLElement>(`tr[data-legend="${CSS.escape(focused)}"]`);
    const box = row?.closest<HTMLElement>(".tbl-scroll");
    if (!row || !box) return;
    // Scroll the grid container only (scrollIntoView would also move the page).
    box.scrollTo({ top: row.offsetTop - box.clientHeight / 2 + row.offsetHeight / 2, behavior: "smooth" });
  }, [focused, legends]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Matchups</h1>
          <p className="text-sm text-muted">Row legend’s win rate against the column legend · hover or tap a cell for details</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <SearchBox className="min-w-0 flex-1 sm:w-64" label="Find a legend" placeholder="Find a legend…" value={legendQ} onChange={setLegendQ} />
          <label className="flex items-center gap-1.5 text-xs text-muted">
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as AxisSort)} className="rounded-md border border-app bg-surface px-2 py-1.5 text-sm text-app">
              <option value="matches">Matches played</option>
              <option value="winrate">Overall win rate</option>
              <option value="alpha">A → Z</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
        <div className="flex items-center gap-2" aria-label="Colour scale: red below 45%, yellow 45–55%, green above 55%">
          <span className="tabular">0%</span>
          <span className="h-2.5 w-44 rounded-full" style={{ background: SCALE_GRADIENT }} />
          <span className="tabular">100%</span>
          <span className="ml-1 text-faint">· “--” no data</span>
        </div>
        <span ref={captionRef} className="min-h-[1.25rem] font-medium text-app tabular" aria-live="polite" />
      </div>

      <div className="tbl-scroll mx-scroll">
        <table ref={tableRef} className="tbl mx" key={sort}>
          <thead>
            <tr>
              <th scope="col" className="sticky-1 !z-[5] !text-left" data-col={0}>
                <span className="sr-only">Legend</span>
              </th>
              <th scope="col" data-col={1} className="sticky-2 !z-[5] !text-[10px]" title="Overall win rate and matches, from Legend Winrates">
                Overall
              </th>
              {legends.map((l, i) => (
                <th key={l} scope="col" data-col={i + 2} className="align-bottom" title={l}>
                  <span className="flex flex-col items-center gap-1">
                    <LegendAvatar name={l} size={32} />
                    <span className="hidden max-w-[3.5rem] truncate text-[10px] normal-case tracking-normal sm:block">{l}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {legends.map((row, ri) => {
              const overall = winrates.get(row);
              const isFocused = focused === row;
              return (
                <tr key={row} data-row={ri} data-legend={row} className={isFocused ? "hl-row focus-row" : ""}>
                  <th scope="row" data-col={0} className={`sticky-1 !text-left !normal-case !tracking-normal ${isFocused ? "!text-accent" : "!text-app"}`}>
                    <span className="flex items-center gap-2">
                      <LegendAvatar name={row} size={28} />
                      <span className="max-w-[5.5rem] truncate text-xs font-semibold sm:max-w-[9rem] sm:text-sm" title={row}>
                        {row}
                      </span>
                    </span>
                  </th>
                  <td data-col={1} className="sticky-2 cell" style={overall ? cellStyle(overall.winRate) : undefined}>
                    {overall ? (
                      <>
                        {pct(overall.winRate)}
                        <span className="block text-[10px] font-normal leading-tight opacity-75">{overall.matches} games</span>
                      </>
                    ) : (
                      <span className="text-faint">--</span>
                    )}
                  </td>
                  {legends.map((col, ci) => {
                    const v = row === col ? null : matrix.lookup(row, col);
                    const games = v?.matches ?? null;
                    const label =
                      row === col
                        ? `${row} mirror`
                        : `${row} vs ${col}: ${v === null ? "no data" : pct(v.winRate)}${games !== null ? ` over ${games} ${games === 1 ? "game" : "games"}` : ""}`;
                    return (
                      <td
                        key={col}
                        data-col={ci + 2}
                        className={`cell ${v === null ? "na" : ""}`}
                        style={v === null ? undefined : cellStyle(v.winRate)}
                        title={label}
                        aria-label={label}
                      >
                        {v === null ? (
                          "--"
                        ) : (
                          <>
                            {pct(v.winRate)}
                            {games !== null && <span className="block text-[10px] font-normal leading-tight opacity-75">{games} {games === 1 ? "game" : "games"}</span>}
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {focused === null && legendQ && <p className="mt-2 text-sm text-muted">No legend matches “{legendQ}”.</p>}
    </div>
  );
}
