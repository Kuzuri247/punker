const { execSync } = require("node:child_process");

if (process.env.VERCEL) {
  console.log("[build] Vercel environment detected. Running standard Next.js build...");
  execSync("next build", { stdio: "inherit" });
} else {
  console.log("[build] Cloudflare / local environment detected. Running OpenNext Cloudflare build...");
  execSync("opennextjs-cloudflare build", { stdio: "inherit" });
}
