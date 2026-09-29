import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const workspace = fileURLToPath(new URL("..", import.meta.url));

const output = fileURLToPath(
  new URL("../docs/.vitepress/dist/demo", import.meta.url),
);

const base =
  process.env.DOCS_BASE_PATH ??
  (process.env.DOCS_SITE_URL
    ? new URL(process.env.DOCS_SITE_URL).pathname
    : "/");

const result = spawnSync(
  "pnpm",
  [
    "--filter",
    "example-react",
    "exec",
    "vite",
    "build",
    "--base",
    `${base.replace(/\/$/, "")}/demo/`,
    "--outDir",
    output,
    "--emptyOutDir",
  ],
  { cwd: workspace, stdio: "inherit" },
);

if (result.status !== 0) {
  throw new Error("The lifecycle lab could not be built for the docs site.", {
    cause: result.error,
  });
}
