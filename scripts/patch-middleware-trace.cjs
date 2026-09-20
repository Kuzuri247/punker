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
const standaloneDir = path.join(rootDir, ".next/standalone");
const packagesToSync = [
  "@opentelemetry/api",
  "pg-cloudflare",
];

console.log("[patch-middleware-trace] Running OpenNext trace patch...");

for (const pkg of packagesToSync) {
  const pkgSrcDir = path.join(rootDir, "node_modules", pkg);
  const pkgDestDir = path.join(standaloneDir, "node_modules", pkg);
  if (fs.existsSync(pkgSrcDir) && fs.existsSync(standaloneDir)) {
    console.log(`[patch-middleware-trace] Ensuring ${pkg} is present in .next/standalone...`);
    copyDirSync(pkgSrcDir, pkgDestDir);
  }
}

const nftJsonPath = path.join(rootDir, ".next/server/middleware.js.nft.json");
if (fs.existsSync(nftJsonPath)) {
  console.log("[patch-middleware-trace] Updating middleware.js.nft.json...");
  const nftData = JSON.parse(fs.readFileSync(nftJsonPath, "utf8"));
  const filesSet = new Set(nftData.files || []);
  const serverDir = path.join(rootDir, ".next/server");

  for (const pkg of packagesToSync) {
    const pkgSrcDir = path.join(rootDir, "node_modules", pkg);
    if (fs.existsSync(pkgSrcDir)) {
      const allFiles = getAllFiles(pkgSrcDir, serverDir);
      for (const file of allFiles) {
        filesSet.add(file);
      }
    }
  }

  nftData.files = Array.from(filesSet).sort();
  fs.writeFileSync(nftJsonPath, JSON.stringify(nftData, null, 2));
  console.log(`[patch-middleware-trace] Updated middleware trace (total entries: ${nftData.files.length}).`);
}
