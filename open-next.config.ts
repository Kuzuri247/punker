import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig(),
  buildCommand: "npx next build && node scripts/patch-middleware-trace.cjs",
};

