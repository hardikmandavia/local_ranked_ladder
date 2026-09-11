import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { copyFile } from "node:fs/promises";
import path from "node:path";

// GitHub Pages serves the site from /<repo>/ — CI sets VITE_BASE accordingly.
const base = process.env.VITE_BASE ?? "/";

// GitHub Pages has no SPA rewrite rule; serving index.html as 404.html lets
// deep links like /best-of?legend=Akali render the app instead of a 404 page.
function spaFallback(): Plugin {
  let outDir = "dist";
  return {
    name: "spa-404-fallback",
    apply: "build",
    configResolved(c) {
      outDir = c.build.outDir;
    },
    async closeBundle() {
      await copyFile(path.join(outDir, "index.html"), path.join(outDir, "404.html"));
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), spaFallback()],
});
