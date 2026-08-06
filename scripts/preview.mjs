import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url)) + "/..";
const entry = join(root, ".output/server/index.mjs");

if (!existsSync(entry)) {
  console.log("[preview] No local server build found. Running a local production build first…");
  const viteCli = join(root, "node_modules/vite/bin/vite.js");
  const { status } = spawnSync(process.execPath, [viteCli, "build"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, NITRO_PRESET: "node-server" },
  });
  if (status !== 0) process.exit(status ?? 1);
}

console.log("[preview] Serving production build on http://localhost:3000/ (Ctrl+C to stop)");
await import(pathToFileURL(entry).href);
