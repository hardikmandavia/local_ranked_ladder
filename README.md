# Vendetta League stats site

Public, read-only site for the **Mythic Goblin Riftbound Vendetta League**.
The league workbook (a shared OneDrive `.xlsx`) is the single source of truth;
a GitHub Actions job snapshots it daily into `public/data/league.json` and the
site is served from GitHub Pages. See [SPEC.md](SPEC.md) for the full spec.

Pages: **Leaderboard** · **Best Of** (top player per legend, with eligibility)
· **Matchups** (legend-vs-legend win-rate matrix) · **Legends** (overall win rates).

## Develop

```bash
npm install
npm run dev
```

`public/data/league.json` is committed, so the site runs without any
Microsoft credentials. Other scripts:

| Script | What it does |
|---|---|
| `npm run build` | Type-check and build to `dist/` (set `VITE_BASE=/repo-name/` for GitHub Pages) |
| `npm test` | Unit tests for the workbook normaliser against the fixture in `scripts/fixtures/` |
| `npm run portraits` | Regenerate `public/legends/*.jpg` from `assets/` |
| `npm run refresh` | Download the live workbook and rewrite `public/data/league.json` (needs sign-in, below) |
| `npm run read` | Print every sheet of the workbook (`--json`, `--sheet=NAME`) |

Layout: `scripts/` (Graph download + `normalise.mjs`), `src/data/` (types,
derivations, `useLeague` context), `src/components/`, `src/pages/`.

### Legend portraits

Source art lives in `assets/<Legend name>/portrait.png`. `npm run portraits`
(macOS, uses `sips`) resizes each one to a 192px JPEG in `public/legends/`
named by the slug in `src/data/legends.json`. Folder names that differ from the
workbook's legend names are mapped in `scripts/sync-portraits.mjs` (e.g.
`Renata Glasc` → `Renata`). Legends without a file fall back to an initials
placeholder.

## Reading the league workbook

`scripts/read-leaderboard.mjs` downloads the shared OneDrive workbook through
the Microsoft Graph API and parses it with SheetJS. OneDrive refuses
anonymous API access to this file, so a one-time sign-in is needed:

1. Go to https://entra.microsoft.com > App registrations > New registration.
   Supported account types: *Personal Microsoft accounts only*. No redirect URI.
2. Under Authentication, set **Allow public client flows** to Yes.
3. Copy the Application (client) ID and run:

   ```bash
   MS_CLIENT_ID=<client id> npm run refresh
   ```

   Or put `MS_CLIENT_ID=<client id>` in a `.env` file (gitignored); the
   script loads it automatically.

4. Follow the printed device-code prompt and sign in with the Microsoft
   account that can open the link. The refresh token is cached in
   `.token-cache.json` (gitignored), so later runs need no interaction.

## Deploying (GitHub Pages)

1. Repo **Settings → Pages → Source: GitHub Actions**.
2. Add repository secrets:
   - `MS_CLIENT_ID` — the app registration's client ID.
   - `MS_REFRESH_TOKEN` — the `refresh_token` value from a local
     `.token-cache.json` after running `npm run refresh` once.
   - `SECRETS_PAT` *(recommended)* — a fine-grained personal access token with
     **Secrets: read and write** on this repo. Microsoft rotates the refresh
     token on each use, so the workflow writes the new one back; without this
     the token eventually expires and the refresh job starts failing.
3. Workflows:
   - `refresh.yml` — daily at 06:00 UTC and on demand (*Actions → Refresh data
     & deploy → Run workflow*): fetches the workbook, commits `league.json`,
     builds and deploys.
   - `deploy.yml` — on every push to `main`: builds with the committed
     `league.json` and deploys.

The site is built with `VITE_BASE=/<repo name>/`. If you later add a custom
domain, set a repository variable `VITE_BASE=/`.
