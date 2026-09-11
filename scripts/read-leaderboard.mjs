#!/usr/bin/env node
// Reads a shared OneDrive Excel workbook through the Microsoft Graph API.
//
// Usage:
//   node scripts/read-leaderboard.mjs [shareLink] [--json] [--sheet=NAME]
//
// Requires: npm install (for the xlsx parser).
// Auth: anonymous access is attempted first. If OneDrive refuses it, set
// MS_CLIENT_ID to an Entra app registration (personal accounts enabled,
// "Allow public client flows" = yes) and follow the one-time device-code
// sign-in. The refresh token is cached in .token-cache.json (gitignored).

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import XLSX from "xlsx";

const DEFAULT_LINK =
  "https://1drv.ms/x/c/273f106030f84ede/IQAK5B8X3mvuTZ_KwLYExU_gAQkZFRLhVhbvBLhrPs8QEG0?e=ghw5U0";

const GRAPH = "https://graph.microsoft.com/v1.0";
const AUTH = "https://login.microsoftonline.com/consumers/oauth2/v2.0";
const SCOPE = "Files.Read offline_access";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOKEN_CACHE = path.join(ROOT, ".token-cache.json");

// Load .env (KEY=VALUE lines) without overriding real environment variables.
try {
  for (const line of (await readFile(path.join(ROOT, ".env"), "utf8")).split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

// ---------- args ----------
const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args.filter((a) => a.startsWith("--")).map((a) => {
    const [k, v = true] = a.slice(2).split("=");
    return [k, v];
  })
);
const shareLink = args.find((a) => !a.startsWith("--")) ?? DEFAULT_LINK;

// ---------- helpers ----------
function encodeShareUrl(url) {
  const b64 = Buffer.from(url, "utf8").toString("base64");
  return "u!" + b64.replace(/=+$/, "").replace(/\//g, "_").replace(/\+/g, "-");
}

async function graphGet(url, token) {
  // redeemSharingLink lets Graph resolve "anyone with the link" shares owned by another account.
  const headers = { Accept: "application/json", Prefer: "redeemSharingLink" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`${res.status} ${res.statusText} for ${url}\n${body}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function readCache() {
  try {
    return JSON.parse(await readFile(TOKEN_CACHE, "utf8"));
  } catch {
    return null;
  }
}

async function tokenRequest(clientId, params) {
  const res = await fetch(`${AUTH}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, ...params }),
  });
  return { ok: res.ok, data: await res.json() };
}

async function getAccessToken() {
  const clientId = process.env.MS_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "Anonymous access was refused and MS_CLIENT_ID is not set.\n" +
        "Register an app at https://entra.microsoft.com (accounts: personal Microsoft accounts,\n" +
        "Authentication > Allow public client flows = Yes), then run:\n" +
        "  MS_CLIENT_ID=<app id> npm run read"
    );
  }

  const cache = await readCache();
  if (cache?.refresh_token) {
    const { ok, data } = await tokenRequest(clientId, {
      grant_type: "refresh_token",
      refresh_token: cache.refresh_token,
      scope: SCOPE,
    });
    if (ok) {
      await writeFile(TOKEN_CACHE, JSON.stringify(data, null, 2));
      return data.access_token;
    }
    console.error("Cached token rejected, starting a fresh sign-in.");
  }

  const dc = await fetch(`${AUTH}/devicecode`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, scope: SCOPE }),
  }).then((r) => r.json());
  if (!dc.device_code) throw new Error(`Device code request failed: ${JSON.stringify(dc)}`);

  console.error(dc.message);
  const interval = (dc.interval ?? 5) * 1000;
  const deadline = Date.now() + dc.expires_in * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval));
    const { ok, data } = await tokenRequest(clientId, {
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code: dc.device_code,
    });
    if (ok) {
      await writeFile(TOKEN_CACHE, JSON.stringify(data, null, 2));
      return data.access_token;
    }
    if (data.error !== "authorization_pending" && data.error !== "slow_down") {
      throw new Error(`Sign-in failed: ${data.error} - ${data.error_description}`);
    }
  }
  throw new Error("Sign-in timed out.");
}

// ---------- workbook reading ----------
// The Graph Excel cell API is not available for personal Microsoft accounts,
// so download the .xlsx and parse it locally.
async function readWorkbook(token) {
  const base = `${GRAPH}/shares/${encodeShareUrl(shareLink)}/driveItem`;
  const item = await graphGet(`${base}?$select=name,lastModifiedDateTime`, token);

  const headers = { Prefer: "redeemSharingLink" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}/content`, { headers });
  if (!res.ok) {
    const err = new Error(`${res.status} ${res.statusText} downloading workbook\n${await res.text()}`);
    err.status = res.status;
    throw err;
  }
  const wb = XLSX.read(Buffer.from(await res.arrayBuffer()), { type: "buffer" });

  const names = flags.sheet ? [flags.sheet] : wb.SheetNames;
  if (flags.sheet && !wb.Sheets[flags.sheet]) {
    throw new Error(`Sheet "${flags.sheet}" not found. Available: ${wb.SheetNames.join(", ")}`);
  }

  return {
    file: item.name,
    lastModified: item.lastModifiedDateTime,
    sheets: names.map((name) => {
      const ws = wb.Sheets[name];
      return {
        name,
        address: ws["!ref"] ?? "",
        rows: XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", blankrows: false }),
      };
    }),
  };
}

function printTable(rows) {
  if (!rows?.length) return console.log("(empty)");
  const cells = rows.map((r) => r.map((c) => String(c ?? "")));
  const widths = cells[0].map((_, i) => Math.max(...cells.map((r) => r[i]?.length ?? 0)));
  for (const r of cells) console.log(r.map((c, i) => c.padEnd(widths[i])).join("  "));
}

// ---------- main ----------
let data;
try {
  try {
    data = await readWorkbook(null);
  } catch (err) {
    if (err.status !== 401 && err.status !== 403) throw err;
    const token = await getAccessToken();
    data = await readWorkbook(token);
  }
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

if (flags.json) {
  console.log(JSON.stringify(data, null, 2));
} else {
  console.log(`${data.file}  (modified ${data.lastModified})`);
  for (const s of data.sheets) {
    console.log(`\n== ${s.name}  [${s.address}]`);
    printTable(s.rows);
  }
}
