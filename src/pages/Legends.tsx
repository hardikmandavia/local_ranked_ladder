import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLeague } from "../data/useLeague";
import { pct } from "../data/derive";
import { LegendAvatar } from "../components/LegendAvatar";
import { SearchBox } from "../components/SearchBox";

type SortKey = "legend" | "winRate" | "matches";
const SMALL_SAMPLE = 5;

export function Legends() {
  const { data } = useLeague();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "winRate", dir: "desc" });

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = data.legendWinrates.filter((r) => !needle || r.legend.toLowerCase().includes(needle));
    const m = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sort.key === "legend") return m * a.legend.localeCompare(b.legend);
      const d = a[sort.key] - b[sort.key];
      return m * d || b.matches - a.matches || a.legend.localeCompare(b.legend);
    });
  }, [data.legendWinrates, q, sort]);

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "legend" ? "asc" : "desc" }));

  const Th = ({ k, children, align = "right" }: { k: SortKey; children: React.ReactNode; align?: "left" | "right" }) => {
    const active = sort.key === k;
    return (
      <th
        scope="col"
        aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
        className={align === "left" ? "text-left" : "text-right"}
      >
        <button
          type="button"
          onClick={() => toggle(k)}
          className={`inline-flex items-center gap-1 uppercase tracking-wider ${active ? "text-app" : "hover:text-app"}`}
        >
          {children}
          <span aria-hidden="true" className={`text-[10px] ${active ? "text-accent" : "text-faint"}`}>
            {active ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
          </span>
        </button>
      </th>
    );
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Legend Win Rates</h1>
          <p className="text-sm text-muted">Across every match in the league · click a legend to see its matchups</p>
        </div>
        <SearchBox className="w-full sm:w-72" label="Search legends" placeholder="Search legends…" value={q} onChange={setQ} hint={`${rows.length} of ${data.legendWinrates.length}`} />
      </div>

      <div className="tbl-scroll">
        <table className="tbl">
          <thead>
            <tr>
              <Th k="legend" align="left">Legend</Th>
              <Th k="winRate">Win rate</Th>
              <Th k="matches">Matches</Th>
              <th scope="col" className="hidden text-right sm:table-cell" title="round(win rate × matches)">Wins</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const small = r.matches < SMALL_SAMPLE;
              return (
                <tr
                  key={r.legend}
                  tabIndex={0}
                  onClick={() => navigate(`/matchups?legend=${encodeURIComponent(r.legend)}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/matchups?legend=${encodeURIComponent(r.legend)}`);
                    }
                  }}
                  className="cursor-pointer"
                  title={`See ${r.legend} in the matchups grid`}
                >
                  <td>
                    <span className="flex items-center gap-2.5">
                      <LegendAvatar name={r.legend} size={28} />
                      <span className="font-medium">{r.legend}</span>
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="inline-flex items-center justify-end gap-2">
                      <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-surface-2 sm:block" aria-hidden="true">
                        <span className="block h-full rounded-full" style={{ width: pct(r.winRate), background: barColour(r.winRate) }} />
                      </span>
                      <span className="tabular font-semibold">{pct(r.winRate, 1)}</span>
                    </span>
                  </td>
                  <td className="text-right tabular">
                    {r.matches}
                    {small && (
                      <span className="ml-1.5 rounded bg-surface-2 px-1 py-0.5 text-[10px] uppercase tracking-wide text-faint" title={`Fewer than ${SMALL_SAMPLE} matches`}>
                        small sample
                      </span>
                    )}
                  </td>
                  <td className="hidden text-right tabular text-muted sm:table-cell">{Math.round(r.winRate * r.matches)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-muted">No legends match “{q}”.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function barColour(v: number) {
  if (v >= 0.55) return "#34c47a";
  if (v <= 0.45) return "#e5534b";
  return "#e6b450";
}
