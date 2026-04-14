# Contributing

Thanks for your interest in contributing to this project.

## Prerequisites

- Node.js 18+
- pnpm 10+

## Development setup

```bash
pnpm install
```

## Useful commands

```bash
pnpm build
pnpm check-types
pnpm lint
```

Run commands for a specific package:

```bash
pnpm --filter @better-s3/core build
pnpm --filter @better-s3/core check-types
```

## Contribution workflow

1. Fork the repository and create a branch from `master`.
2. Make your changes with focused commits.
3. Add or update tests/docs where needed.
4. Add a changeset for user-facing package changes.
5. Open a Pull Request.

## Changesets (required for package changes)

When your PR changes behavior, API, or package output, add a changeset:

```bash
pnpm changeset
```

Then choose the package(s) and bump type:

- `patch`: bug fixes, small improvements, non-breaking behavior updates.
- `minor`: new backward-compatible features.
- `major`: breaking changes.

A changeset file is created in `.changeset/` and must be committed with your PR.

## How to choose bump type (SemVer standard)

- Choose `patch` if consumers can upgrade safely without changing their code.
- Choose `minor` for additive features (new exports, new options with defaults, improved behavior).
- Choose `major` when existing consumer code may break or output contracts change.

## Pull Request checklist

- [ ] Build passes (`pnpm build`)
- [ ] Type checks pass (`pnpm check-types`)
- [ ] Docs updated (if needed)
- [ ] Changeset added (if package behavior changed)

## Code of Conduct

By participating, you agree to follow [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
