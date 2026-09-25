/**
 * Helper templates for standalone game exports.
 * Generates zero-dependency Node.js HTTP servers, package.json, and cross-platform launcher scripts.
 */

export function generatePackageJson(title: string, safeTitle: string): string {
  return JSON.stringify(
    {
      name: safeTitle || "punker-game",
      version: "1.0.0",
      description: `${title} - Standalone 3D game exported from Punker Studio`,
      type: "module",
      main: "server.js",
      scripts: {
        start: "node server.js",
        dev: "node server.js",
      },
    },
    null,
    2
  )
}

export function generateServerJs(title: string): string {
  return `import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wasm": "application/wasm",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, \`http://\${req.headers.host || "localhost"}\`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  if (pathname === "/" || pathname === "") {
    pathname = "/index.html";
  }

  const filePath = path.normalize(path.join(__dirname, pathname));

  // Security: Prevent directory traversal outside game root
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    return res.end("403 Forbidden");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("404 Not Found");
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  const url = \`http://localhost:\${PORT}\`;
  console.log("\\n========================================");
  console.log(\`🎮 ${title.replace(/[`"\\]/g, "")} is running!\`);
  console.log(\`🌐 Local URL: \${url}\`);
  console.log("⌨️  Press Ctrl+C to stop the server");
  console.log("========================================\\n");

  const startCmd =
    process.platform === "darwin"
      ? \`open "\${url}"\`
      : process.platform === "win32"
        ? \`start "\${url}"\`
        : \`xdg-open "\${url}"\`;

  exec(startCmd, () => {});
});
`
}

export function generateStartBat(title: string): string {
  return `@echo off
title ${title.replace(/[`"&|]/g, "")}
echo Starting ${title.replace(/[`"&|]/g, "")}...
where node >nul 2>nul
if %errorlevel% equ 0 (
  node server.js
) else (
  echo Node.js not detected. Attempting direct browser launch...
  start index.html
)
`
}

export function generateStartSh(title: string): string {
  return `#!/usr/bin/env bash
echo "Starting ${title.replace(/[`"\\]/g, "")}..."
if command -v node >/dev/null 2>&1; then
  node server.js
elif command -v python3 >/dev/null 2>&1; then
  echo "Node.js not detected, using python3 http.server on port 8080..."
  python3 -m http.server 8080 &
  PID=$!
  sleep 1
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:8080"
  elif command -v open >/dev/null 2>&1; then
    open "http://localhost:8080"
  fi
  wait $PID
else
  echo "Opening index.html in default browser..."
  xdg-open index.html 2>/dev/null || open index.html 2>/dev/null
fi
`
}

export function generateReadme(title: string): string {
  return `# ${title}

Standalone build exported from Punker Studio.

## Quick Start (Playing the Game)

### Windows
Double-click \`start_game.bat\` to launch the server and open the game in your default browser.

### Mac & Linux
Run the launcher script:
\`\`\`bash
chmod +x start_game.sh
./start_game.sh
\`\`\`

### Command Line (Any OS)
Run with Node.js (zero external dependencies required):
\`\`\`bash
npm start
\`\`\`
Or:
\`\`\`bash
node server.js
\`\`\`

Open **http://localhost:8080** in any modern web browser.
`
}
