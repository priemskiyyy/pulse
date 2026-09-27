# Releasing

`@priemskiyyy/pulse` is one package with one GitHub release tag per version: `pulse-v<version>`, for example `pulse-v0.1.0`. The publish workflow verifies the tag against the package version and its changelog entry, runs the test workflows, and publishes the verified tarball from `.artifacts/release/@priemskiyyy/pulse/` with provenance after checking its checksum. It publishes the tarball that was tested, not a rebuild. Prereleases use the `next` dist-tag, and stable releases use `latest`. Pushes and verification runs publish nothing.

## Prepare a release

1. Update the version in `packages/pulse/package.json` and its entry in `CHANGELOG.md` together. Date the entry, because `Unreleased` blocks publishing. The heading is `## @priemskiyyy/pulse <version> - <date>`, and `verify:release` parses it literally.
2. Run `pnpm check:release`. It needs no browser, device or credentials.
3. Merge into `main` and check GitHub Actions on that revision.
4. Create a GitHub release with the tag. Mark a prerelease version as a prerelease.
5. Approve the publish job in the GitHub `npm` environment once its verification jobs pass.

Do not reuse a published version. Prepare a new patch version and changelog entry for a release fix.

## What the release checks do not cover

The adapters are tested against jsdom pages and a fake `AppState`, never a real browser's back/forward cache, a device or a simulator. See the [verification matrix](docs/verification.md). Before a stable release, exercise the browser adapter in the browsers the release claims and the React Native adapter on an iOS and an Android device, and say in the release notes what you ran.

## npm trusted publishers

The package uses the GitHub owner `priemskiyyy`, repository `pulse`, workflow `publish.yml` and environment `npm`. Trusted publishing uses GitHub's short-lived OIDC identity, so the repository needs no npm token.

The first publication requires an authenticated npm maintainer, because the package must exist before its trusted publisher can be configured. Publish the verified tarball from its artifact directory, then register the workflow. Do not create a GitHub release for that same version afterward.

```sh
npm login
cd .artifacts/release/@priemskiyyy/pulse
shasum -a 256 -c SHA256SUMS
npm publish priemskiyyy-pulse-<version>.tgz --access public --tag latest
```

After the publish, register the trusted publisher, then require two-factor authentication and disallow tokens for the package. `npm trust` needs npm 11.15 or later; older versions leave out the permission the registry requires and fail with a bare `400 Bad Request`.

```sh
npm trust github @priemskiyyy/pulse --file publish.yml --repository priemskiyyy/pulse --environment npm --allow-publish
npm access set mfa=publish @priemskiyyy/pulse
```
