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

/**
 * Architectural template configuration for desktop electron shell
 */
export const DESKTOP_MAIN_JS_TEMPLATE = `const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    resizable: true,
    fullscreenable: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`;

export const DESKTOP_PACKAGE_JSON = (title: string, version: string = "1.0.0") => ({
  name: title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
  version,
  main: "main.js",
  description: `Built with Punker Game Engine`,
  dependencies: {},
  devDependencies: {
    electron: "^33.0.0",
    "electron-builder": "^25.1.8",
  },
});

/**
 * Sanitizing HTML wrapper for standalone exports:
 * - Fullscreen canvas scaling with CSS aspect-ratio containment
 * - Auto-focus on canvas load to capture keyboard/gamepad inputs immediately
 * - Web Audio unlock on initial user touch or keypress
 * - Strips sandbox-only debugging hooks
 * - Maps imports to offline bundled scripts
 */
export function normalizeExportHtml(
  rawHtml: string,
  options: {
    title?: string
    offlineImportMap?: boolean
  } = {}
): string {
  const { title = "Punker Game", offlineImportMap = true } = options
  let html = rawHtml

  // Strip sandbox/preview only scripts
  html = html.replace(/<script[^>]*src=["']\.\/report\.js["'][^>]*><\/script>/gi, "")
  html = html.replace(/<script[^>]*src=["']\.\/welcome\.js["'][^>]*><\/script>/gi, "")

  // Normalize page title
  if (/<title>.*?<\/title>/i.test(html)) {
    html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
  }

  // Configure offline-first importmap
  if (offlineImportMap) {
    const offlineImports = {
      three: "./three.module.js",
      "three/": "./",
      "punker-engine": "./punker-engine.min.js",
      "./engine/index.js": "./punker-engine.min.js",
      "./engine/": "./engine/",
    }

    if (/<script[^>]*type=["']importmap["'][^>]*>[\s\S]*?<\/script>/i.test(html)) {
      html = html.replace(
        /<script[^>]*type=["']importmap["'][^>]*>[\s\S]*?<\/script>/i,
        `<script type="importmap">
${JSON.stringify({ imports: offlineImports }, null, 2)}
</script>`
      )
    }
  }

  // Fullscreen canvas scaling with CSS aspect-ratio containment
  const containmentStyle = `
  <style id="punker-standalone-scaling">
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #0a0a0a;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
    }
    canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
      max-width: 100vw;
      max-height: 100vh;
      aspect-ratio: 16 / 9;
      object-fit: contain;
      outline: none;
    }
  </style>`

  // Auto-focus on canvas load & Web Audio unlock on initial user touch or keypress
  const runtimeBootstrap = `
  <script id="punker-standalone-bootstrap">
    function autoFocusCanvas() {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        if (!canvas.hasAttribute('tabindex')) {
          canvas.setAttribute('tabindex', '0');
        }
        canvas.focus();
      }
    }

    window.addEventListener('DOMContentLoaded', autoFocusCanvas);
    window.addEventListener('load', autoFocusCanvas);
    document.addEventListener('pointerdown', autoFocusCanvas);
    document.addEventListener('keydown', autoFocusCanvas);

    (function initAudioUnlock() {
      const events = ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown'];
      function unlock() {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          if (window.__punkerAudio && typeof window.__punkerAudio.resume === 'function') {
            window.__punkerAudio.resume();
          }
        }
        for (const evt of events) {
          window.removeEventListener(evt, unlock, true);
        }
      }
      for (const evt of events) {
        window.addEventListener(evt, unlock, { capture: true, passive: true });
      }
    })();
  </script>`

  if (/<\/head>/i.test(html)) {
    html = html.replace(/<\/head>/i, `${containmentStyle}\n${runtimeBootstrap}\n</head>`)
  } else {
    html = `${containmentStyle}\n${runtimeBootstrap}\n${html}`
  }

  return html
}

