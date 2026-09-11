import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useLeagueState } from "../data/useLeague";
import { formatDate } from "../data/derive";

const NAV = [
  { to: "/", label: "Leaderboard", icon: "M4 15h3V8H4zm5 0h3V4H9zm5 0h3v-5h-3z" },
  { to: "/best-of", label: "Best Of", icon: "M10 2l2.4 5 5.6.7-4 3.9.9 5.6L10 14.5 5.1 17.2l.9-5.6-4-3.9L7.6 7z" },
  { to: "/matchups", label: "Matchups", icon: "M3 3h6v6H3zm8 0h6v6h-6zM3 11h6v6H3zm8 0h6v6h-6z" },
  { to: "/legends", label: "Legends", icon: "M10 2a4 4 0 110 8 4 4 0 010-8zm-7 15a7 7 0 0114 0z" },
];

const TITLES: Record<string, string> = {
  "/": "Leaderboard",
  "/best-of": "Best Of",
  "/matchups": "Matchups",
  "/legends": "Legends",
};

type Theme = "dark" | "light";

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem("league:theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch {
      /* ignore */
    }
    return "dark";
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("league:theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  return [theme, () => setTheme((t) => (t === "dark" ? "light" : "dark"))];
}

export function Layout() {
  const state = useLeagueState();
  const { pathname } = useLocation();
  const [theme, toggleTheme] = useTheme();

  useEffect(() => {
    const page = TITLES[pathname];
    document.title = page ? `${page} · Vendetta League` : "Vendetta League";
  }, [pathname]);

  const week = state.status === "ready" ? state.league.data : null;

  return (
    <div className="flex min-h-dvh flex-col bg-app text-app">
      <header className="sticky top-0 z-30 border-b border-app bg-elev/95 backdrop-blur supports-[backdrop-filter]:bg-elev/80">
        <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-3 py-2.5 sm:px-5">
          <NavLink to="/" className="flex min-w-0 items-center gap-2.5">
            <svg aria-hidden="true" viewBox="0 0 64 64" className="size-8 shrink-0">
              <rect width="64" height="64" rx="14" fill="#0b0e14" />
              <path d="M14 18h10l8 22 8-22h10L38 50H26z" fill="#e6b450" />
            </svg>
            <span className="min-w-0">
              <span className="block truncate font-display text-base font-semibold leading-tight sm:text-lg">Vendetta League</span>
              <span className="hidden text-[11px] uppercase tracking-wider text-faint sm:block">Mythic Goblin · Riftbound</span>
            </span>
          </NavLink>

          <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 sm:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? "bg-surface-2 text-app" : "text-muted hover:bg-surface hover:text-app"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {week && (
              <span
                className="rounded-full border border-strong bg-surface px-2.5 py-1 text-xs font-semibold tabular text-accent"
                title={`${week.totalWeeks - week.currentWeek} weeks remaining`}
              >
                Week {week.currentWeek} <span className="text-faint">of</span> {week.totalWeeks}
              </span>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-app"
            >
              {theme === "dark" ? (
                <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5">
                  <circle cx="10" cy="10" r="4" fill="currentColor" />
                  <path d="M10 1v3M10 16v3M1 10h3M16 10h3M3.6 3.6l2.1 2.1M14.3 14.3l2.1 2.1M3.6 16.4l2.1-2.1M14.3 5.7l2.1-2.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5">
                  <path d="M17 12.5A7.5 7.5 0 017.5 3 7.5 7.5 0 1017 12.5z" fill="currentColor" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-2 pb-24 pt-4 sm:px-5 sm:pb-8">
        {state.status === "loading" && <Loading />}
        {state.status === "error" && <LoadError error={state.error} lastSeen={state.lastSeen} />}
        {state.status === "ready" && <Outlet />}
      </main>

      <footer className="hidden border-t border-app px-5 py-4 text-center text-xs text-faint sm:block">
        {week ? (
          <>
            Data from the league workbook · last updated {formatDate(week.lastModified)} · snapshot {formatDate(week.generatedAt)}
          </>
        ) : (
          "Data from the league workbook"
        )}
      </footer>

      <nav aria-label="Primary" className="tabbar fixed inset-x-0 bottom-0 z-30 border-t border-app bg-elev/95 backdrop-blur sm:hidden">
        <ul className="grid grid-cols-4">
          {NAV.map((n) => (
            <li key={n.to}>
              <NavLink
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? "text-accent" : "text-muted"}`
                }
              >
                <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5">
                  <path d={n.icon} fill="currentColor" />
                </svg>
                {n.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-muted" role="status" aria-live="polite">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-3 size-5 animate-spin">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.25" />
        <path d="M21 12a9 9 0 00-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      Loading league data…
    </div>
  );
}

function LoadError({ error, lastSeen }: { error: string; lastSeen: string | null }) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-strong bg-surface p-6 text-center">
      <h1 className="mb-2 text-lg font-semibold">Couldn’t load the league data</h1>
      <p className="text-sm text-muted">
        The stats file didn’t load ({error}). Try refreshing in a moment.
        {lastSeen && (
          <>
            {" "}
            The last snapshot this browser saw was from {formatDate(lastSeen)}.
          </>
        )}
      </p>
      <button
        type="button"
        onClick={() => location.reload()}
        className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-semibold"
      >
        Retry
      </button>
    </div>
  );
}
