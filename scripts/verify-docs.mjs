import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspace = fileURLToPath(new URL("..", import.meta.url));
const docs = path.join(workspace, "docs");

const listPages = (directory) =>
  readdirSync(directory, { recursive: true })
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.join(directory, name));

const pages = listPages(docs);

const prose = [
  ...pages,
  ...[
    "README.md",
    "CONTRIBUTING.md",
    "RELEASING.md",
    "SUPPORT.md",
    "SECURITY.md",
    "AGENTS.md",
    "CHANGELOG.md",
    "packages/pulse/README.md",
    "packages/react/README.md",
    "examples/react/README.md",
    "examples/expo/README.md",
  ].map((file) => path.join(workspace, file)),
];

const failures = [];

for (const page of pages) {
  const text = readFileSync(page, "utf8");
  const name = path.relative(workspace, page);

  if (!/^---\ndescription: "[^"\n]+"\n---\n/.test(text)) {
    failures.push(`${name} needs a frontmatter description.`);
  }

  const headings = text.split("\n").filter((line) => line.startsWith("# "));

  if (headings.length !== 1) {
    failures.push(`${name} needs exactly one h1, not ${headings.length}.`);
  }
}

for (const file of prose) {
  const text = readFileSync(file, "utf8");
  const name = path.relative(workspace, file);

  // The code point, so the rule cannot be dodged by how the file is viewed.
  if (text.includes(String.fromCodePoint(0x2014))) {
    failures.push(`${name} contains an em dash.`);
  }

  for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) {
      continue;
    }

    const [relative] = target.split("#");
    const resolved = path.resolve(path.dirname(file), relative);

    if (!existsSync(resolved)) {
      failures.push(`${name} links to ${target}, which does not exist.`);
    }
  }
}

assert.deepEqual(
  failures,
  [],
  `Documentation problems:\n${failures.join("\n")}`,
);
console.log(`Verified ${pages.length} pages and ${prose.length} prose files.`);
