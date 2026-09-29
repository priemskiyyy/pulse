import assert from "node:assert/strict";
import { appendFileSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const changelog = readFileSync(new URL("CHANGELOG.md", root), "utf8");

const manifest = JSON.parse(
  readFileSync(new URL("packages/pulse/package.json", root), "utf8"),
);

const { name, version } = manifest;

assert.equal(manifest.license, "MIT");
assert.equal(
  manifest.repository.url,
  "git+https://github.com/priemskiyyy/pulse.git",
);
assert.equal(manifest.repository.directory, "packages/pulse");
assert.equal(manifest.bugs.url, "https://github.com/priemskiyyy/pulse/issues");
assert.equal(manifest.publishConfig.access, "public");
assert.match(version, /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/);

const entry = changelog
  .split("\n")
  .find((line) => line.startsWith(`## ${name} ${version} - `));

assert(entry, `${name} ${version} needs a changelog entry.`);

const tag = process.env.RELEASE_TAG;

if (tag !== undefined) {
  // An `Unreleased` heading blocks the publish rather than shipping a version nobody dated.
  assert.match(
    entry,
    / - \d{4}-\d{2}-\d{2}$/,
    "Date the changelog entry before publishing a release.",
  );
  assert.equal(
    tag,
    `pulse-v${version}`,
    "The release tag must match the package version.",
  );
}

const prerelease = process.env.RELEASE_PRERELEASE;

if (prerelease !== undefined) {
  assert.equal(
    prerelease,
    String(version.includes("-")),
    "The GitHub prerelease flag must match the version suffix.",
  );
}

if (process.env.GITHUB_OUTPUT !== undefined) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `package=${name}\nversion=${version}\n`,
  );
}

console.log(`Release metadata is valid for ${name} ${version}.`);
