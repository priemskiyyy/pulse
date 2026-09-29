import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { rolldown } from "rolldown";

// Each entry of the built package, bundled as a consumer would get it:
// minified, peers external, and the gzip size is what a budget reviews.
const dist = fileURLToPath(new URL("../packages/pulse/dist/", import.meta.url));

const ENTRIES = [
  { name: "core", files: ["index.js"], budget: 4 * 1024 },
  {
    name: "core + browser",
    files: ["index.js", "browser.js"],
    budget: 8 * 1024,
  },
  {
    name: "core + react-native",
    files: ["index.js", "react-native.js"],
    budget: 8 * 1024,
  },
  // A binding package, bundled against the core as a peer.
  { name: "react", files: ["../../react/dist/index.js"], budget: 1024 },
  { name: "solid", files: ["../../solid/dist/index.js"], budget: 1024 },
  { name: "vue", files: ["../../vue/dist/index.js"], budget: 1024 },
  { name: "testing", files: ["testing.js"], budget: null },
];

const measure = async (files) => {
  const bundle = await rolldown({
    input: files.map((file) => `${dist}${file}`),
    external: [
      /^@priemskiyyy\/pulse(\/|$)/,
      "react",
      "react-dom",
      "react-native",
      "solid-js",
      "vue",
      // Svelte's store and runtime are subpaths of the peer.
      /^svelte(\/|$)/,
    ],
    logLevel: "silent",
  });

  const getCode = async (minify) => {
    const { output } = await bundle.generate({ format: "esm", minify });

    return output
      .flatMap((chunk) => (chunk.type === "chunk" ? [chunk.code] : []))
      .join("\n");
  };

  const raw = await getCode(false);
  const minified = await getCode(true);

  await bundle.close();

  return {
    raw: Buffer.byteLength(raw),
    minified: Buffer.byteLength(minified),
    gzip: gzipSync(minified).byteLength,
  };
};

const rows = [];

for (const { name, files, budget } of ENTRIES) {
  const size = await measure(files);

  rows.push({ entry: name, ...size, "gzip budget": budget ?? "none" });

  if (budget !== null) {
    assert(
      size.gzip <= budget,
      `${name} is ${size.gzip} B gzip, over its ${budget} B budget.`,
    );
  }
}

console.table(rows);
console.log(
  "Bytes of a Rolldown bundle of the built entries, minified, peers external; the budget applies to gzip, by node:zlib.",
);
