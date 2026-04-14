# Releasing and Versioning

This repository uses [Changesets](https://github.com/changesets/changesets) and follows Semantic Versioning.

## Release standard

Use SemVer for every published package:

- **patch** (`0.1.2` → `0.1.3`): bug fixes, docs or behavior improvements with no breaking API/output changes.
- **minor** (`0.1.2` → `0.2.0`): backward-compatible new features.
- **major** (`0.1.2` → `1.0.0`): breaking API, contract, or output changes.

## Typical contributor flow

1. Implement change.
2. Run checks locally:

```bash
pnpm build
pnpm check-types
```

3. Add changeset when package behavior/API/output changes:

```bash
pnpm changeset
```

4. Commit code + generated changeset file.
5. Open PR.

## Maintainer release flow

After PRs are merged:

1. Generate package version bumps and changelog entries:

```bash
pnpm version-packages
```

2. Commit generated version updates.
3. Push to `main`.
4. Existing publish workflow publishes new versions if they are not already on npm.

## How to write a good changeset

A changeset contains:

- affected package(s)
- bump type (`patch`, `minor`, `major`)
- short user-facing summary

Example:

```md
---
"@better-s3/core": minor
---

Add `formatFaCurrency` for localized currency formatting with Persian digits.
```

Guidelines:

- Write from the package consumer perspective.
- Explain behavior/API impact, not implementation details.
- Keep one logical change per changeset when possible.

## When a changeset is not required

You can skip a changeset for:

- repository-only docs updates
- CI/config changes that do not affect published package behavior
- typo fixes with no package output impact
