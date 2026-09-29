import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Every ts and tsx fence a reader could copy compiles against the build. A
// fence preceded by `<!-- snippet: fragment -->` is an excerpt and is skipped.
const workspace = fileURLToPath(new URL("..", import.meta.url));
const output = path.join(workspace, ".artifacts/snippets");
// The built declarations, as a reader's installed package would provide them.
const dist = path.join(workspace, "packages/pulse/dist");

const listPages = (directory) =>
  readdirSync(directory, { recursive: true })
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.join(directory, name));

const pages = [
  path.join(workspace, "README.md"),
  path.join(workspace, "packages/pulse/README.md"),
  path.join(workspace, "packages/react/README.md"),
  path.join(workspace, "packages/solid/README.md"),
  ...listPages(path.join(workspace, "docs")),
];

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

const snippets = pages.flatMap((page) => {
  const lines = readFileSync(page, "utf8").split("\n");

  return lines.flatMap((line, index) => {
    const fence = /^```(ts|tsx)$/.exec(line);

    if (fence === null) {
      return [];
    }

    const marker = lines
      .slice(0, index)
      .findLast((candidate) => candidate.trim() !== "");

    if (marker?.trim() === "<!-- snippet: fragment -->") {
      return [];
    }

    const end = lines.findIndex(
      (candidate, at) => at > index && candidate === "```",
    );

    const name = `${path.relative(workspace, page).replaceAll(/[/.]/g, "_")}_${index + 1}.${fence[1]}`;

    writeFileSync(
      path.join(output, name),
      `${lines.slice(index + 1, end).join("\n")}\nexport {};\n`,
    );

    return [{ name, page, line: index + 1 }];
  });
});

writeFileSync(
  path.join(output, "tsconfig.json"),
  `${JSON.stringify(
    {
      extends: "../../tsconfig.json",
      compilerOptions: {
        noUnusedLocals: false,
        noUnusedParameters: false,
        types: ["node"],
        baseUrl: ".",
        paths: {
          "@priemskiyyy/pulse": [path.join(dist, "index.d.ts")],
          "@priemskiyyy/pulse/*": [path.join(dist, "*.d.ts")],
          "@priemskiyyy/pulse-react": [
            path.join(workspace, "packages/react/dist/index.d.ts"),
          ],
          "@priemskiyyy/pulse-solid": [
            path.join(workspace, "packages/solid/dist/index.d.ts"),
          ],
          "@tanstack/query-core": [
            path.join(
              workspace,
              "examples/shared/node_modules/@tanstack/query-core",
            ),
          ],
        },
      },
      // Wildcards skip dot directories such as .artifacts, so every file is named.
      files: [
        ...snippets.map((snippet) => snippet.name),
        path.join(workspace, "scripts/snippets.ambient.d.ts"),
      ],
    },
    null,
    2,
  )}\n`,
);

const result = spawnSync("npx", ["tsc", "-p", output], {
  cwd: workspace,
  encoding: "utf8",
});

if (result.status !== 0) {
  // Map each error back to the page and line its fence came from.
  const report = result.stdout.replaceAll(
    /([\w.-]+_(?:md))_(\d+)\.tsx?\((\d+),\d+\)/g,
    (match, file, fence, row) => {
      const snippet = snippets.find((candidate) =>
        candidate.name.startsWith(`${file}_${fence}.`),
      );

      if (snippet === undefined) {
        return match;
      }

      return `${path.relative(workspace, snippet.page)}:${snippet.line + Number(row)}`;
    },
  );

  console.error(report);
  process.exit(1);
}

console.log(`Compiled ${snippets.length} snippets from ${pages.length} pages.`);
