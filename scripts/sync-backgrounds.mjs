#!/usr/bin/env node
// Copies legend splash art from assets/backgrounds/legends/<name>.<ext> into
// public/backgrounds/<slug>.jpg, resized to a web-friendly width. Used as the
// hero background on player pages (the player's most-played legend).
// Uses macOS `sips`; re-run whenever assets/backgrounds changes.
//
//   node scripts/sync-backgrounds.mjs [--width=1600]

import { readdir, mkdir, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "assets", "backgrounds", "legends");
const OUT = path.join(ROOT, "public", "backgrounds");
const width = Number(process.argv.find((a) => a.startsWith("--width="))?.slice(8) ?? 1600);
const EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

// File names that differ from the workbook's legend names.
const ALIASES = { "master yi": "Master Yi, Wuju Bladesman", lilia: "Lillia", "renata glasc": "Renata" };

// Same slug rule as src/data/legends.ts.
const slug = (name) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const known = JSON.parse(await readFile(path.join(ROOT, "src/data/legends.json"), "utf8"));
const knownSlugs = new Set(Object.values(known));

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC, { withFileTypes: true })).filter((d) => d.isFile() && EXTS.has(path.extname(d.name).toLowerCase()));
const written = new Set();
for (const f of files) {
  const base = f.name.slice(0, -path.extname(f.name).length);
  const s = slug(ALIASES[base.toLowerCase()] ?? base);
  if (written.has(s)) continue; // first format wins when the same legend has several files
  const out = path.join(OUT, `${s}.jpg`);
  try {
    execFileSync("sips", ["--resampleWidth", String(width), "-s", "format", "jpeg", "-s", "formatOptions", "80", path.join(SRC, f.name), "--out", out], { stdio: "pipe" });
  } catch (err) {
    console.warn(`skipped ${f.name}: ${String(err.stderr ?? err.message).trim().split("\n").pop()}`);
    continue;
  }
  written.add(s);
  if (!knownSlugs.has(s)) console.warn(`note: ${f.name} -> ${s}.jpg is not a legend in the league data yet`);
}
const missing = [...knownSlugs].filter((s) => !written.has(s));
console.log(`wrote ${written.size} backgrounds to public/backgrounds/`);
if (missing.length) console.warn(`missing backgrounds for: ${missing.join(", ")}`);
