import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

const MAX_ATTEMPTS = 3;
const projectRoot = process.cwd();
const nextDir = resolve(projectRoot, ".next");

function cleanNextDir() {
  try {
    rmSync(nextDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  } catch {
    // Ignore cleanup failures; next build can still recover on retry.
  }
}

function runNextBuild() {
  return spawnSync("next", ["build"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  if (attempt > 1) {
    cleanNextDir();
    console.log(`Retrying landing build (${attempt}/${MAX_ATTEMPTS}) after transient filesystem error...`);
  }

  const result = runNextBuild();
  if (result.status === 0) {
    process.exit(0);
  }

  const canRetry = attempt < MAX_ATTEMPTS;
  if (!canRetry) {
    process.exit(result.status ?? 1);
  }
}
