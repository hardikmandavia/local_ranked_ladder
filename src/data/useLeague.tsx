import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { LeagueData, LegendGroup } from "./types";
import { buildMatrix, legendGroups, weeksRemaining, winrateByLegend, type Matrix } from "./derive";

const LAST_SEEN_KEY = "league:lastGeneratedAt";

export interface League {
  data: LeagueData;
  weeksRemaining: number;
  groups: LegendGroup[];
  matrix: Matrix;
  winrates: ReturnType<typeof winrateByLegend>;
}

type State =
  | { status: "loading" }
  | { status: "error"; error: string; lastSeen: string | null }
  | { status: "ready"; league: League };

const Ctx = createContext<State>({ status: "loading" });

function readLastSeen(): string | null {
  try {
    return localStorage.getItem(LAST_SEEN_KEY);
  } catch {
    return null;
  }
}

export function LeagueProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}data/league.json`, { cache: "no-cache" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as LeagueData;
      })
      .then((data) => {
        if (cancelled) return;
        try {
          localStorage.setItem(LAST_SEEN_KEY, data.generatedAt);
        } catch {
          /* private mode etc. */
        }
        setState({ status: "ready", league: buildLeague(data) });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({ status: "error", error: err instanceof Error ? err.message : String(err), lastSeen: readLastSeen() });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

function buildLeague(data: LeagueData): League {
  return {
    data,
    weeksRemaining: weeksRemaining(data),
    groups: legendGroups(data),
    matrix: buildMatrix(data.matchupGrid, data.matchups ?? []),
    winrates: winrateByLegend(data.legendWinrates),
  };
}

export function useLeagueState(): State {
  return useContext(Ctx);
}

// For pages: only rendered once data is ready (see Layout), so this never throws in practice.
export function useLeague(): League {
  const s = useContext(Ctx);
  if (s.status !== "ready") throw new Error("useLeague() called before league data was loaded");
  return useMemo(() => s.league, [s.league]);
}
