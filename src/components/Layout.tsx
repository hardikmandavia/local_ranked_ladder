import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useLeagueState } from "../data/useLeague";
import { formatDate } from "../data/derive";

const NAV = [
  { to: "/", label: "Leaderboard", icon: "M4 15h3V8H4zm5 0h3V4H9zm5 0h3v-5h-3z" },
  { to: "/best-of", label: "Best Of", icon: "M10 2l2.4 5 5.6.7-4 3.9.9 5.6L10 14.5 5.1 17.2l.9-5.6-4-3.9L7.6 7z" },
  { to: "/matchups", label: "Matchups", icon: "M3 3h6v6H3zm8 0h6v6h-6zM3 11h6v6H3zm8 0h6v6h-6z" },
  { to: "/legends", label: "Legends", icon: "M10 2a4 4 0 110 8 4 4 0 010-8zm-7 15a7 7 0 0114 0z" },
];

// The SoloRift app's own site, linked from the nav and the "Powered by" credit.
const APP_SITE = { href: "https://www.solo-rift.com", label: "Get SoloRift", icon: "M6 1h8a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V3a2 2 0 012-2zm0 2v12h8V3zm3 13.5h2v1H9z" };

const CREDITS = {
  dataBy: "Daniel Newton",
  appStore: "https://apps.apple.com/us/app/solorift/id6806668813",
  googlePlay: "https://play.google.com/store/apps/details?id=com.hiddenmangoltd.solorift&pcampaignid=web_share",
};

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
    document.title = page ? `SoloRift - ${page}` : "SoloRift";
  }, [pathname]);

  const week = state.status === "ready" ? state.league.data : null;

  return (
    <div className="flex min-h-dvh flex-col bg-app text-app">
      <header className="sticky top-0 z-30 border-b border-app bg-elev/95 backdrop-blur supports-[backdrop-filter]:bg-elev/80">
        <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-3 py-2.5 sm:px-5">
          <NavLink to="/" className="flex min-w-0 items-center gap-2.5">
            <img
              src={`${import.meta.env.BASE_URL}logo-solorift.svg`}
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-lg object-contain"
            />
            <span className="min-w-0">
              <span className="block truncate font-display text-base font-semibold leading-tight sm:text-lg">Mythic Goblin · Riftbound</span>
              <span className="hidden text-[11px] uppercase tracking-wider text-faint sm:block">Vendetta League</span>
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
            <a
              href={APP_SITE.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-app"
            >
              {APP_SITE.label}
            </a>
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

        <div className="border-t border-app/60">
          <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-x-4 gap-y-0.5 px-3 py-1 text-[11px] text-faint sm:px-5">
            <span className="truncate">
              Data by <span className="font-medium text-muted">{CREDITS.dataBy}</span>
            </span>
            <span className="flex items-center gap-2">
              <a
                href={APP_SITE.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded px-1 py-0.5 transition-colors hover:bg-surface hover:text-app"
              >
                Powered by
                <img
                  src={`${import.meta.env.BASE_URL}logo-solorift.svg`}
                  alt=""
                  width={16}
                  height={16}
                  className="size-4 rounded-[3px]"
                />
                <span className="font-semibold text-muted">SoloRift</span>
              </a>
              <StoreLink href={CREDITS.appStore} label="App Store">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
              </StoreLink>
              <StoreLink href={CREDITS.googlePlay} label="Google Play">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z" />
              </StoreLink>
            </span>
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
        <ul className="grid grid-cols-5">
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
          <li>
            <a
              href={APP_SITE.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5">
                <path d={APP_SITE.icon} fill="currentColor" />
              </svg>
              {APP_SITE.label}
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}

function StoreLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`SoloRift on the ${label}`}
      title={`SoloRift on the ${label}`}
      className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-muted transition-colors hover:bg-surface hover:text-app"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
        {children}
      </svg>
      <span className="hidden sm:inline">{label}</span>
    </a>
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
