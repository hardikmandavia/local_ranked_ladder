# local_ranked_ladder

## Reading the league leaderboard spreadsheet

`scripts/read-leaderboard.mjs` downloads the shared OneDrive workbook through
the Microsoft Graph API, parses it with SheetJS, and prints every sheet
(or `--json` for machine use).

```bash
npm install
npm run read
```

Options: `node scripts/read-leaderboard.mjs [shareLink] [--sheet=NAME] [--json]`

OneDrive refuses anonymous API access to this file, so a one-time sign-in is
needed:

1. Go to https://entra.microsoft.com > App registrations > New registration.
   Supported account types: *Personal Microsoft accounts only*. No redirect URI.
2. Under Authentication, set **Allow public client flows** to Yes.
3. Copy the Application (client) ID and run:

   ```bash
   MS_CLIENT_ID=<client id> npm run read
   ```

   Or put `MS_CLIENT_ID=<client id>` in a `.env` file (gitignored); the
   script loads it automatically.

4. Follow the printed device-code prompt and sign in with the Microsoft
   account that can open the link. The refresh token is cached in
   `.token-cache.json` (gitignored), so later runs need no interaction.
