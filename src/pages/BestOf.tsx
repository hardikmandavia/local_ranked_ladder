import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLeague } from "../data/useLeague";
import type { LegendGroup, RankedBestOf } from "../data/types";
import { MIN_WEEKS_FOR_BEST_OF } from "../data/derive";
import { LegendAvatar } from "../components/LegendAvatar";
import { SearchBox } from "../components/SearchBox";
import { Modal } from "../components/Modal";
import { EligibilityIcon, ELIGIBILITY_SHORT } from "../components/EligibilityIcon";

type SortMode = "alpha" | "points";

export function BestOf() {
  const { groups, weeksRemaining } = useLeague();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortMode>("alpha");

  const selected = params.get("legend");
  const openLegend = useCallback(
    (legend: string | null) =>
      setParams(
        (p) => {
          if (legend) p.set("legend", legend);
          else p.delete("legend");
          return p;
        },
        { replace: legend === null }
      ),
    [setParams]
  );
  const close = useCallback(() => openLegend(null), [openLegend]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = groups.filter((g) => !needle || g.legend.toLowerCase().includes(needle));
    if (sort === "points") return [...list].sort((a, b) => b.leaderPoints - a.leaderPoints || a.legend.localeCompare(b.legend));
    return list;
  }, [groups, q, sort]);

  const selectedGroup = selected ? groups.find((g) => g.legend === selected) ?? null : null;

  // A deep link to a legend that doesn't exist: drop the param quietly.
  useEffect(() => {
    if (selected && !selectedGroup) close();
  }, [selected, selectedGroup, close]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Best Of</h1>
          <p className="text-sm text-muted">
            Top player on each legend · needs {MIN_WEEKS_FOR_BEST_OF} weeks on the legend to qualify · {weeksRemaining} week{weeksRemaining === 1 ? "" : "s"} left
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <SearchBox className="min-w-0 flex-1 sm:w-64" label="Filter legends" placeholder="Filter legends…" value={q} onChange={setQ} />
          <label className="flex items-center gap-1.5 text-xs text-muted">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="rounded-md border border-app bg-surface px-2 py-1.5 text-sm text-app"
            >
              <option value="alpha">A → Z</option>
              <option value="points">Leader’s points</option>
            </select>
          </label>
        </div>
      </div>

      <Legend />

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {visible.map((g) => (
          <li key={g.legend}>
            <LegendCard group={g} onOpen={() => openLegend(g.legend)} />
          </li>
        ))}
      </ul>
      {visible.length === 0 && <p className="py-10 text-center text-muted">No legends match “{q}”.</p>}

      <Modal
        open={!!selectedGroup}
        onClose={close}
        title={
          selectedGroup && (
            <span className="flex items-center gap-3">
              <LegendAvatar name={selectedGroup.legend} size={40} ring />
              <span className="font-display">{selectedGroup.legend}</span>
            </span>
          )
        }
      >
        {selectedGroup && <LegendDetail group={selectedGroup} />}
      </Modal>
    </div>
  );
}

function Legend() {
  return (
    <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Eligibility key">
      {(["eligible", "pending", "blocked"] as const).map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <EligibilityIcon status={s} size={14} />
          {ELIGIBILITY_SHORT[s]}
        </li>
      ))}
    </ul>
  );
}

function LegendCard({ group, onOpen }: { group: LegendGroup; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full w-full flex-col items-center rounded-xl border border-app bg-surface px-3 pb-3 pt-4 text-center transition-colors hover:border-strong hover:bg-surface-2"
      aria-label={`${group.legend}: ${group.leaders.map((l) => l.player).join(", ")} — open details`}
    >
      <LegendAvatar name={group.legend} size={72} ring className="transition-transform group-hover:scale-105" />
      <span className="mt-2.5 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight">{group.legend}</span>
      <span className="mt-2 w-full space-y-1.5 border-t border-app pt-2">
        {group.leaders.map((l) => (
          <PlayerLine key={l.player} entry={l} />
        ))}
      </span>
    </button>
  );
}

function PlayerLine({ entry }: { entry: RankedBestOf }) {
  return (
    <span className="block">
      <span className="block truncate text-sm font-medium">{entry.player}</span>
      <span className="flex items-center justify-center gap-1.5 text-xs text-muted tabular">
        <span className="font-semibold text-accent">{entry.points} pts</span>
        <span aria-hidden="true">·</span>
        <span>{entry.weeks} wks</span>
        <EligibilityIcon status={entry.status} size={14} />
      </span>
    </span>
  );
}

const MEDAL: Record<number, { emoji: string; label: string; size: string }> = {
  1: { emoji: "🥇", label: "Gold", size: "text-lg" },
  2: { emoji: "🥈", label: "Silver", size: "text-base" },
  3: { emoji: "🥉", label: "Bronze", size: "text-sm" },
};

function LegendDetail({ group }: { group: LegendGroup }) {
  // Podium: position 1 (possibly shared), 2 (only exists if gold isn't shared), 3
  // (only exists if two players are ahead). Blocked players never take a medal.
  const podium = group.entries.filter((e) => e.status !== "blocked" && e.position <= 3);
  const rest = group.entries.filter((e) => !podium.includes(e));

  return (
    <div>
      <ol className="space-y-2">
        {podium.map((e) => {
          const m = MEDAL[e.position];
          return (
            <li key={e.player} className="flex items-center gap-3 rounded-lg border border-app bg-elev px-3 py-2">
              <span className={`${e.position === 1 ? "text-2xl" : e.position === 2 ? "text-xl" : "text-lg"}`} role="img" aria-label={m.label}>
                {m.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate font-semibold ${m.size}`}>{e.player}</span>
                <span className="text-xs text-muted tabular">
                  <span className="font-semibold text-accent">{e.points} pts</span> · {e.weeks} wks · {ELIGIBILITY_SHORT[e.status]}
                </span>
              </span>
              <EligibilityIcon status={e.status} size={18} />
            </li>
          );
        })}
      </ol>

      {rest.length > 0 && (
        <table className="tbl mt-4 text-sm">
          <thead>
            <tr>
              <th scope="col" className="text-left !bg-transparent !static">Player</th>
              <th scope="col" className="text-right !bg-transparent !static">Pts</th>
              <th scope="col" className="text-right !bg-transparent !static">Wks</th>
              <th scope="col" className="text-right !bg-transparent !static">Status</th>
            </tr>
          </thead>
          <tbody>
            {rest.map((e) => (
              <tr key={e.player} className={e.status === "blocked" ? "opacity-60" : ""}>
                <td className="!bg-transparent">
                  <span className="mr-2 text-xs text-faint tabular">{e.position}</span>
                  {e.player}
                </td>
                <td className="!bg-transparent text-right tabular font-semibold">{e.points}</td>
                <td className="!bg-transparent text-right tabular">{e.weeks}</td>
                <td className="!bg-transparent text-right">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                    {ELIGIBILITY_SHORT[e.status]}
                    <EligibilityIcon status={e.status} size={14} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
