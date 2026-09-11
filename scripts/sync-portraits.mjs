#!/usr/bin/env node
// Copies legend portraits from assets/<Legend name>/portrait.png into
// public/legends/<slug>.jpg, resized for the site (largest render is 72px at
// 2× DPR). Uses macOS `sips`; re-run whenever assets/ changes.
//
//   node scripts/sync-portraits.mjs [--size=192]

import { readdir, mkdir, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "assets");
const OUT = path.join(ROOT, "public", "legends");
const size = Number(process.argv.find((a) => a.startsWith("--size="))?.slice(7) ?? 192);

// Folder names that differ from the workbook's legend names.
const ALIASES = { "Renata Glasc": "Renata" };

// Same slug rule as src/data/legends.ts.
const slug = (name) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const known = JSON.parse(await import("node:fs").then((fs) => fs.readFileSync(path.join(ROOT, "src/data/legends.json"), "utf8")));
const knownSlugs = new Set(Object.values(known));

await mkdir(OUT, { recursive: true });
const folders = (await readdir(SRC, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
const written = new Set();
for (const folder of folders) {
  const src = path.join(SRC, folder, "portrait.png");
  try {
    await stat(src);
  } catch {
    console.warn(`skip ${folder}: no portrait.png`);
    continue;
  }
  const s = slug(ALIASES[folder] ?? folder);
  const out = path.join(OUT, `${s}.jpg`);
  execFileSync("sips", ["-Z", String(size), "-s", "format", "jpeg", "-s", "formatOptions", "85", src, "--out", out], { stdio: "ignore" });
  written.add(s);
  if (!knownSlugs.has(s)) console.warn(`note: ${folder} -> ${s}.jpg is not a legend in the league data yet`);
}
const missing = [...knownSlugs].filter((s) => !written.has(s));
console.log(`wrote ${written.size} portraits to public/legends/`);
if (missing.length) console.warn(`missing portraits for: ${missing.join(", ")}`);
