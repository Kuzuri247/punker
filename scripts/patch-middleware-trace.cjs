const fs = require("node:fs");
const path = require("node:path");

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getAllFiles(dir, baseDir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      results.push(path.relative(baseDir, fullPath).replace(/\\/g, "/"));
    }
  }
  return results;
}

const rootDir = process.cwd();
const otelSrcDir = path.join(rootDir, "node_modules/@opentelemetry/api");
const standaloneOtelDir = path.join(rootDir, ".next/standalone/node_modules/@opentelemetry/api");
const nftJsonPath = path.join(rootDir, ".next/server/middleware.js.nft.json");

console.log("[patch-middleware-trace] Running middleware trace patch...");

if (fs.existsSync(otelSrcDir) && fs.existsSync(path.join(rootDir, ".next/standalone"))) {
  console.log("[patch-middleware-trace] Ensuring @opentelemetry/api is present in .next/standalone...");
  copyDirSync(otelSrcDir, standaloneOtelDir);
}

if (fs.existsSync(nftJsonPath) && fs.existsSync(otelSrcDir)) {
  console.log("[patch-middleware-trace] Updating middleware.js.nft.json...");
  const nftData = JSON.parse(fs.readFileSync(nftJsonPath, "utf8"));
  const filesSet = new Set(nftData.files || []);

  const serverDir = path.join(rootDir, ".next/server");
  const allOtelFiles = getAllFiles(otelSrcDir, serverDir);
  for (const file of allOtelFiles) {
    filesSet.add(file);
  }

  nftData.files = Array.from(filesSet).sort();
  fs.writeFileSync(nftJsonPath, JSON.stringify(nftData, null, 2));
  console.log(`[patch-middleware-trace] Added @opentelemetry/api files to middleware trace (total entries: ${nftData.files.length}).`);
} else {
  console.log("[patch-middleware-trace] middleware.js.nft.json not found or @opentelemetry/api not installed.");
}
