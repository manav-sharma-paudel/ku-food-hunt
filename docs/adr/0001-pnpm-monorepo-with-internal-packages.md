# ADR 0001 — pnpm monorepo with an internal shared package

**Status:** Accepted · 2026-07-16

## Context

The web app and the API must agree on data shapes (restaurant payloads, filter params, review
inputs). Publishing a versioned npm package for this is overhead; drifting hand-copied types are
worse.

## Decision

- Single repo, pnpm workspaces: `apps/web`, `apps/api`, `packages/shared`.
- `packages/shared` uses the **internal package** pattern: its `exports` points at TypeScript
  source (`./src/index.ts`). Consumers compile it themselves — Vite for web, tsx for api dev,
  tsup (with `noExternal`) for the api production bundle.
- Zod schemas in `shared` are the single source of truth; TS types are inferred from them, so the
  API contract cannot drift between client and server.

## Consequences

- No build-watch orchestration for shared code; edits are picked up instantly by both apps.
- Atomic commits across API + UI changes.
- `shared` must stay dependency-light (currently: zod only) since every consumer bundles it.
- If `shared` is ever published externally, a build step must be added then.
