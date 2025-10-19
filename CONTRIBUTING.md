# Contributing to dauth

We welcome contributions of all sizes, from typo fixes to new features. This document outlines the expectations and workflows that help us keep the project healthy.

## Getting Started

- Fork the repository and clone your fork locally.
- Install dependencies with `pnpm install`.
- Run `pnpm build` to make sure the TypeScript project compiles before you start changing code.
- Use `pnpm format` to apply Prettier formatting to your changes.

## Development Workflow

- Keep changes focused. Separate unrelated updates into different pull requests.
- For new features or behavior changes, update the documentation and add example usage where helpful.
- When fixing a bug, describe the issue and how your change addresses it in the pull request description.
- Run `pnpm build` before submitting a pull request to ensure type safety.

## Commit Guidelines

- Follow conventional commit style when possible (`feat:`, `fix:`, `docs:`) so changelog generation stays simple.
- Write clear commit messages that explain the motivation for the change.

## Pull Request Checklist

Before submitting a pull request, make sure that:

- Tests or example scripts cover the new behavior when practical.
- Documentation reflects any user-facing changes.
- The branch merges cleanly with `main`.

## Code Review

- Maintainers review pull requests for correctness, clarity, and alignment with project goals.
- Please respond to review feedback promptly. Let us know if you need help with any suggested changes.

## Reporting Issues

- Use GitHub Issues for bug reports or feature requests.
- Include reproduction steps, expected and actual behavior, and environment details.
- Be respectful and follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

Thanks for helping make dauth better!
