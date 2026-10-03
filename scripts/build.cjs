const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// Pre-bundle punker-engine.min.js before Next.js / OpenNext build
try {
  const esbuild = require("esbuild");
  const engineEntry = path.join(__dirname, "..", "lib", "games", "runtime", "engine", "index.js");
  const outPath = path.join(__dirname, "..", "lib", "games", "runtime", "punker-engine.min.js");

  const res = esbuild.buildSync({
    entryPoints: [engineEntry],
    bundle: true,
    external: ["three", "three/*"],
    format: "esm",
    minify: true,
    write: false,
  });

  if (res.outputFiles && res.outputFiles.length > 0) {
    fs.writeFileSync(outPath, res.outputFiles[0].contents);
    console.log(`[build] Successfully pre-bundled punker-engine.min.js (${res.outputFiles[0].contents.length} bytes)`);
  }
} catch (err) {
  console.warn("[build] Note: Could not pre-bundle engine:", err?.message || err);
}

if (process.env.VERCEL) {
  console.log("[build] Vercel environment detected. Running standard Next.js build...");
  execSync("next build", { stdio: "inherit" });
} else {
  console.log("[build] Cloudflare / local environment detected. Running OpenNext Cloudflare build...");
  execSync("npx opennextjs-cloudflare build", { stdio: "inherit" });
}
