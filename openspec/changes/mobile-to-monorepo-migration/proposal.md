# Proposal: Mobile-to-Monorepo Migration

> Precursor change to `m2-web-monorepo-setup`. Converts the existing single-package Expo mobile repo into a **pnpm + Turborepo** monorepo shell with the current app relocated to `apps/mobile/`, and extracts shareable TS assets into `@m2/types` and `@m2/design`. No landing/admin apps are added here — they arrive in the follow-on change.

---

## 1. Summary

We are converting the single-package Expo mobile repo at `raoole20/m2-front` (mirrored at `Ramsesdb/motomoto`) into a **pnpm + Turborepo monorepo**. The entire current app is relocated into `apps/mobile/` via `git mv` (preserving per-file blame). Two workspace packages are extracted: `@m2/types` (from `src/types/`) and `@m2/design` (from `src/design/`), both published as `workspace:*` references and shipped as TypeScript source (no build step). No landing site, no admin app, no new UI packages, and zero visual or behavioral change to the mobile app. The pnpm switch is atomic with the removal of `package-lock.json`; the pnpm version is pinned via `"packageManager": "pnpm@9.x"` + Corepack. This change is strictly the **foundation** on which `m2-web-monorepo-setup` will later scaffold `apps/landing` and `apps/admin` as additive workspaces that consume the same two packages.

### 1.1 Package boundaries (introduced by this change)

| Package | Kind | Build | Consumers (today) | Consumers (next change) |
|---|---|---|---|---|
| `@m2/mobile` | Expo app, private | Metro | End users (Android/iOS) | Unchanged |
| `@m2/types` | TS-only library, private | None (ships source) | `@m2/mobile` | `@m2/landing`, `@m2/admin` |
| `@m2/design` | TS-only tokens, private | None (ships source) | `@m2/mobile` | `@m2/landing`, `@m2/admin` |

### 1.2 Import rewrites inside `apps/mobile/`

| Before | After |
|---|---|
| `import { User } from '@/types/user'` | `import { User } from '@m2/types'` |
| `import type { Conversation } from '@/types/conversation'` | `import type { Conversation } from '@m2/types'` |
| `import { colors } from '@/design/colors'` | `import { colors } from '@m2/design'` |
| `import { spacing } from '@/design/spacing'` | `import { spacing } from '@m2/design'` |
| `import { ChatInput } from '@/components/messaging/ChatInput'` | **unchanged** (`@/` still maps to `apps/mobile/src/`) |
| `import { useAuth } from '@/hooks/useAuth'` | **unchanged** |
| `import { MOCK_CURRENT_USER } from '@/mock/users'` | **unchanged** |

---

## 2. Motivation

- **Enable future landing + admin apps to share** design tokens and TS domain types without copy-paste drift.
- Establish a **single source of truth** for all frontend code (mobile today, web tomorrow) in one repo rather than forking into two.
- Provide the **foundation** that must exist before v1 of the landing or admin apps can ship — this is the low-risk, low-scope half of the migration, isolated from product work.
- Avoid the trap of "ship landing in a separate repo now, consolidate later" — history shows that consolidation never happens once types and tokens have drifted.

---

## 3. Scope

### 3.1 In Scope

- Create **feature branch** `feat/monorepo-migration` from `main`.
- Scaffold **root-level** monorepo config:
  - `pnpm-workspace.yaml`
  - `turbo.json`
  - root `package.json` (workspaces list, `"packageManager": "pnpm@9.x"`, scripts)
  - `tsconfig.base.json` (shared strict config)
  - `.npmrc` with RN-compatible hoisting
- **Relocate** the entire mobile app into `apps/mobile/` via `git mv` (preserves history).
- **Extract** `apps/mobile/src/types/*.ts` → `packages/types/src/*.ts` as `@m2/types`.
- **Extract** `apps/mobile/src/design/*.ts` → `packages/design/src/*.ts` as `@m2/design`.
- **Rewrite imports** inside `apps/mobile/`:
  - `@/types/*` → `@m2/types`
  - `@/design` and `@/design/*` → `@m2/design`
- Keep the `@/` alias working for **in-app** imports (`@/components/*`, `@/hooks/*`, `@/services/*`, `@/store/*`, `@/mock/*`, `@/constants`).
- Update `apps/mobile/metro.config.js` with `watchFolders` pointed at the workspace root and `nodeModulesPaths` for both mobile and root `node_modules/`.
- Update `apps/mobile/tsconfig.json` to extend `tsconfig.base.json` and retain the `@/` paths entry.
- **Delete** `package-lock.json` and generate `pnpm-lock.yaml` in the same commit (atomic switch).
- **Rewrite/update docs** at root: `CLAUDE.md`, `README.md`, `BEST_PRACTICES.md`. Keep `PHASES.md` at root.
- Add a thin **`apps/mobile/README.md`** for app-specific commands.
- **Verify** Expo dev client installs and runs on Android end-to-end after migration.
- Configure **dual-remote push** on `origin` so a single `git push` fans out to both `Ramsesdb/motomoto` and `raoole20/m2-front`; also register `m2front` as a named remote for fallback.
- Open **PR to `raoole20/m2-front:main`** for review before merge.

### 3.2 Out of Scope

- **No** `apps/landing` (Next.js marketing site).
- **No** `apps/admin` (Next.js back-office).
- **No** `packages/ui`, `packages/api-client`, `packages/i18n`.
- **No** Next.js, Tailwind, shadcn, or any web framework.
- **No** visual, design-token, or UX changes to the mobile app.
- **No** Expo SDK or React Native version bumps.
- **No** extracting mobile RN components into a shared `@m2/ui-native` — they stay in `apps/mobile/src/components/`.
- **No** `eas.json` rewrite; retain current config. Only update `cwd` if EAS verification requires it.
- **No** Vercel or web deploy configuration.
- **No** Sentry, analytics, or observability tooling.
- **No** test suite or CI pipeline (mobile has none today — adding is deferred).
- **No** git history rewrite (no `git filter-repo`, no squash).
- **No** registry publication of `@m2/*` packages — workspace-only.
- **No** build step for `@m2/types` / `@m2/design` — they ship TS source directly.
- **No** pre-commit hooks (husky/lefthook); deferred.

---

## 4. Non-Goals (Explicit)

To be absolutely clear: this change produces a working mobile app that **looks identical, behaves identically, builds identically** on Android, installs from a `pnpm install` instead of `npm install`, and lives under `apps/mobile/` instead of the repo root. That is the entire delta visible to a user of the app. Specifically:

- **No** new screens, routes, components, or hooks.
- **No** new dependencies added to `apps/mobile/package.json` beyond `@m2/types` and `@m2/design` workspace refs.
- **No** removal of any runtime dependency.
- **No** Expo SDK upgrade, no RN upgrade, no Node upgrade.
- **No** performance work, no bundle analysis, no profiling.
- **No** env var changes, no secret-store changes, no auth-flow changes.
- **No** change to `USE_NATIVE_GOOGLE_SIGNIN` or any other feature flag.
- **No** change to `app.json` (scheme, bundle IDs, EAS project ID all unchanged).

---

## 5. High-Level Approach

1. **Ensure clean tree**: confirm `main` is pushed to both remotes; no uncommitted work pending.
2. **Branch off**: create `feat/monorepo-migration`.
3. **Scaffold root**: add `pnpm-workspace.yaml`, `turbo.json`, root `package.json`, `tsconfig.base.json`, `.npmrc` (initially with targeted `public-hoist-pattern` for Expo/RN ecosystem).
4. **Bulk `git mv`**: relocate the entire current tree (except the brand-new root configs, `.git/`, root docs) into `apps/mobile/`. One commit, all renames, zero content changes.
5. **Carve out packages**: `git mv apps/mobile/src/types/*.ts` → `packages/types/src/`; same for `design`. Author `package.json` + `tsconfig.json` for each package.
6. **Rewrite mobile imports**: `@/types/*` → `@m2/types`; `@/design` → `@m2/design`. Commit separately for reviewability.
7. **Update Metro + tsconfig**: `watchFolders`, `nodeModulesPaths` in `apps/mobile/metro.config.js`; extend `tsconfig.base.json` in `apps/mobile/tsconfig.json` while keeping `@/` paths.
8. **Atomic PM swap**: delete `package-lock.json`, run `pnpm install`, commit `pnpm-lock.yaml`.
9. **Verify locally**: `pnpm -w typecheck` green; `pnpm --filter @m2/mobile start` launches Metro; dev client connects and hot-reloads on Android; spot-check `eas build --dry-run` (or equivalent) shows no config error.
10. **Docs pass**: rewrite root `README.md`, `CLAUDE.md`, `BEST_PRACTICES.md` for monorepo reality; add `apps/mobile/README.md`.
11. **Configure dual-remote push** and push the feature branch to both remotes.
12. **Open PR** to `raoole20/m2-front:main` with migration notes and reviewer guide.

---

## 6. Target Tree (after this change)

```
m2-front/ (raoole20)  (also pushed to Ramsesdb/motomoto)
├── apps/
│   └── mobile/                          # Everything that was at repo root (minus root configs)
│       ├── app/                         # Expo Router v55 routes (unchanged)
│       │   ├── (app)/
│       │   │   ├── _layout.tsx
│       │   │   ├── ai/index.tsx
│       │   │   ├── home/index.tsx
│       │   │   ├── inbox/[id]/index.tsx
│       │   │   ├── inbox/index.tsx
│       │   │   ├── profile/index.tsx
│       │   │   └── team/index.tsx
│       │   ├── (auth)/login.tsx
│       │   └── _layout.tsx
│       ├── src/
│       │   ├── components/              # ui/, messaging/, ai/, navigation/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── store/
│       │   ├── mock/
│       │   ├── constants.ts
│       │   └── ... (NO types/, NO design/ — extracted to packages)
│       ├── App.tsx
│       ├── index.ts
│       ├── app.json
│       ├── eas.json
│       ├── babel.config.js
│       ├── metro.config.js              # UPDATED: watchFolders + nodeModulesPaths
│       ├── package.json                 # name: "@m2/mobile", deps include @m2/types, @m2/design
│       ├── tsconfig.json                # extends ../../tsconfig.base.json; keeps @/ alias
│       └── README.md                    # NEW: thin, app-specific
├── packages/
│   ├── types/                           # NEW: @m2/types (TS source, no build)
│   │   ├── src/
│   │   │   ├── user.ts
│   │   │   ├── channel.ts
│   │   │   ├── message.ts
│   │   │   ├── conversation.ts
│   │   │   ├── api.ts
│   │   │   ├── websocket.ts
│   │   │   └── index.ts
│   │   ├── package.json                 # name: "@m2/types", main: "src/index.ts", private
│   │   └── tsconfig.json                # extends root base
│   └── design/                          # NEW: @m2/design (TS tokens, no build)
│       ├── src/
│       │   ├── colors.ts
│       │   ├── typography.ts
│       │   ├── spacing.ts
│       │   └── index.ts
│       ├── package.json                 # name: "@m2/design", main: "src/index.ts", private
│       └── tsconfig.json                # extends root base
├── .npmrc                               # NEW: public-hoist-pattern for Expo/RN
├── .gitignore                           # UPDATED: pnpm + turbo entries
├── .nvmrc                               # MOVED to root (Node 20.19.4)
├── pnpm-workspace.yaml                  # NEW
├── pnpm-lock.yaml                       # NEW (replaces package-lock.json)
├── turbo.json                           # NEW
├── package.json                         # NEW root: workspaces, scripts, packageManager: "pnpm@9.x"
├── tsconfig.base.json                   # NEW: shared strict config
├── CLAUDE.md                            # UPDATED for monorepo
├── README.md                            # REWRITTEN for monorepo
├── BEST_PRACTICES.md                    # UPDATED
└── PHASES.md                            # Kept at root
```

**Removed after this change:** `package-lock.json` (root), `src/types/*` (moved to `packages/types/src/`), `src/design/*` (moved to `packages/design/src/`).

---

## 7. Tech Decisions

| Choice | Alternatives | Rationale |
|---|---|---|
| **pnpm workspaces** | npm workspaces, yarn classic, yarn berry (PnP) | Fastest installs, content-addressed store, strict isolation configurable per `.npmrc`. Yarn PnP is incompatible with Metro. npm workspaces are slower and less deterministic for monorepos. User preference locked. |
| **Turborepo** | Nx, bare `pnpm -r` scripts | Minimal config, task graph, remote cache free on Vercel, integrates cleanly once Next.js apps land. Nx is heavier than needed for 1 app + 2 TS packages. Bare scripts don't scale past 2 workspaces. |
| **`git mv` (bulk)** | `git filter-repo --to-subdirectory-filter`, `git subtree`, `cp -r` + new commit | Preserves per-file blame (constraint C3), reversible, no SHA rewrite (keeps mirrors intact). filter-repo forces re-clone and invalidates the mirror. subtree produces fragile merge-commit noise. Plain copy destroys blame. |
| **`.npmrc` with `public-hoist-pattern`** (targeted for Expo/RN/@react-native/@expo) with `node-linker=hoisted` as fallback | `node-linker=hoisted` from day one, `shamefully-hoist=true` (legacy), default pnpm isolation | Targeted hoisting keeps pnpm's strictness for non-RN packages (beneficial for future web apps) while unblocking Metro autolinking + Expo config plugins. Global hoist is the documented fallback if dev client still fails resolution. Default isolation is known to break RN. |
| **Workspace version `workspace:*`** | `file:../packages/types`, explicit semver, npm-published versions | `workspace:*` is the idiomatic pnpm monorepo reference; pnpm rewrites it on publish (never, in our case) and enforces graph correctness. `file:` protocol doesn't participate in pnpm's graph and breaks caching. Since packages are private (default #1), semver is meaningless. |
| **No build step for `@m2/types` / `@m2/design`** | tsup, rollup, tsc emitting `dist/` | Both packages are tiny, pure TypeScript, consumed directly by Metro (which compiles TS) and tsc (which reads source). A build step adds a watcher, an extra CI task, and `dist/` sync bugs for zero runtime benefit. Build step can be added later if a non-TS consumer appears. |

---

## 8. Migration Mechanics (outline)

Pseudo-commands — actual command list lives in `tasks.md`:

1. `git checkout -b feat/monorepo-migration`
2. Scaffold root files:
   - `pnpm-workspace.yaml` (lists `apps/*`, `packages/*`)
   - `turbo.json` (pipeline stubs: `typecheck`, `lint`, `build`)
   - root `package.json` (workspaces, `"packageManager": "pnpm@9.x"`, devDeps: `turbo`, `typescript`)
   - `tsconfig.base.json` (strict, `moduleResolution`, shared lib settings)
   - `.npmrc` (public-hoist-pattern entries for Expo/RN)
3. `mkdir -p apps/mobile packages/types/src packages/design/src`
4. Bulk-relocate mobile into `apps/mobile/`: `git mv <every tracked root entry except new root configs and root docs> apps/mobile/`.
5. Extract packages:
   - `git mv apps/mobile/src/types/*.ts packages/types/src/`
   - `git mv apps/mobile/src/design/*.ts packages/design/src/`
6. Author `package.json` + `tsconfig.json` for `packages/types` and `packages/design` (name, `main: "src/index.ts"`, `private: true`, extends base).
7. Add `@m2/types` and `@m2/design` as `workspace:*` deps in `apps/mobile/package.json`; rename `"name"` to `@m2/mobile`.
8. Rewrite imports inside `apps/mobile/` (separate commit): `@/types/*` → `@m2/types`; `@/design` → `@m2/design`.
9. Update `apps/mobile/metro.config.js` with `watchFolders` and `nodeModulesPaths` per Expo monorepo guide.
10. Update `apps/mobile/tsconfig.json` to extend base and retain `@/` paths.
11. Atomic PM swap: `rm package-lock.json && pnpm install`; commit `pnpm-lock.yaml`.
12. Docs pass: rewrite root `README.md`, `CLAUDE.md`, `BEST_PRACTICES.md`; add `apps/mobile/README.md`.
13. Verify: `pnpm -w typecheck`, `pnpm --filter @m2/mobile start`, dev-client Android smoke test, `eas build --dry-run`.
14. Configure dual-remote push: `git remote set-url --add --push origin <raoole20>`; add `m2front` as named remote.
15. Push branch; open PR to `raoole20/m2-front:main`.

---

## 9. Verification Plan

**Install & typecheck**

- `pnpm install` at repo root succeeds with zero errors on a clean checkout (no pre-existing `node_modules/`).
- `pnpm why react` shows a single React version resolved across the workspace.
- `pnpm -w typecheck` (runs `tsc --noEmit` across all workspaces via Turborepo) passes with **zero** TS errors.
- Running `tsc --noEmit` individually inside `packages/types/` and `packages/design/` also passes (catches any base-config regressions).

**Runtime (mobile)**

- `pnpm --filter @m2/mobile start` launches Metro without module-resolution warnings.
- Android dev client connects to the Metro bundle and the app boots end-to-end through login and home.
- Hot reload works on a trivial edit inside `apps/mobile/src/components/` (e.g., change a label).
- Hot reload **also** works on an edit to `packages/design/src/colors.ts` — proves Metro `watchFolders` is wired correctly.
- Every `@m2/types` and `@m2/design` import resolves at runtime (spot-check `LoginScreen`, `HomeScreen`, a messaging component, and the AI screens).

**History**

- `git log --follow apps/mobile/<any-moved-file>` shows full pre-migration history (at least the last 10 commits visible pre-move).
- `git log --follow packages/types/src/user.ts` shows history from when the file existed at `src/types/user.ts`.
- `git blame` on any moved file attributes lines to the original author/SHA, not to the migration commit.

**Build tooling**

- `eas build --dry-run --platform android` (or the SDK-55-equivalent) completes without configuration errors.
- If `eas.json` needs a `"cwd": "apps/mobile"` tweak, apply it as a minimal patch; do **not** rewrite the file.

**Git remotes**

- `git remote -v` shows `origin` with two push URLs (Ramsesdb + raoole20) and a named `m2front` fallback remote.
- A test push of a no-op commit to `feat/monorepo-migration` appears on both remotes without manual re-push.

---

## 10. Rollback

- **Branch is isolated.** Abandoning the migration = `git checkout main && git branch -D feat/monorepo-migration` (local) and delete the remote branch on both remotes. No other work is affected.
- **If merged and broken post-merge:** two options, user chooses:
  1. `git revert <merge-sha>` on `main` (preserves history of the attempt); force-sync both mirrors.
  2. `git reset --hard <pre-merge-sha>` on `main` (user operates; destructive and requires coordination with the team). Force-push to both remotes.
- **`package-lock.json` recovery**: the pre-migration `package-lock.json` is recoverable from `main`'s history at all times; re-checking out the pre-migration commit produces a working `npm install` tree.
- **No data migration, no backend change, no user-facing state change** — rollback is purely a source-control operation.

---

## 10.1 Affected Areas

| Area | Impact | Description |
|---|---|---|
| repo root | New | `pnpm-workspace.yaml`, `turbo.json`, `package.json`, `tsconfig.base.json`, `.npmrc`, `pnpm-lock.yaml` |
| repo root | Removed | `package-lock.json` |
| repo root | Moved | `.nvmrc` stays at root; `.gitignore` updated in place |
| `src/types/` | Moved | Relocated to `packages/types/src/` as `@m2/types` |
| `src/design/` | Moved | Relocated to `packages/design/src/` as `@m2/design` |
| `app/`, `App.tsx`, `index.ts` | Moved | Relocated under `apps/mobile/` (contents unchanged) |
| `src/components/`, `src/hooks/`, `src/services/`, `src/store/`, `src/mock/`, `src/constants.ts` | Moved | Relocated under `apps/mobile/src/` (contents unchanged except import rewrites) |
| `app.json`, `eas.json`, `babel.config.js` | Moved | Relocated under `apps/mobile/` (contents unchanged; EAS `cwd` only if verification demands) |
| `metro.config.js` | New/Modified | Authored under `apps/mobile/metro.config.js` with `watchFolders` + `nodeModulesPaths` |
| `tsconfig.json` (mobile) | Modified | Extends `../../tsconfig.base.json`; retains `@/` paths |
| `apps/mobile/package.json` | Modified | Renamed to `@m2/mobile`; adds `@m2/types` and `@m2/design` workspace deps |
| `packages/types/package.json` + `tsconfig.json` | New | Package metadata, `main: src/index.ts`, private |
| `packages/design/package.json` + `tsconfig.json` | New | Package metadata, `main: src/index.ts`, private |
| `CLAUDE.md`, `README.md`, `BEST_PRACTICES.md` | Modified | Rewritten at root for monorepo reality |
| `apps/mobile/README.md` | New | Thin app-specific entry point |
| `PHASES.md` | Unchanged location | Stays at root |
| Import sites across `apps/mobile/` | Modified | `@/types/*` → `@m2/types`; `@/design` → `@m2/design` |
| git remotes | Modified | `origin` gains a second push URL; `m2front` named remote added |

---

## 11. Milestones

1. **Foundation committed** — root configs (`pnpm-workspace.yaml`, `turbo.json`, root `package.json`, `tsconfig.base.json`, `.npmrc`) and empty `apps/` + `packages/` directories land on the branch.
2. **Mobile moved** — bulk `git mv` into `apps/mobile/`; smoke test that `pnpm --filter @m2/mobile start` still launches Metro (pre-extraction, imports unchanged).
3. **Types + Design extracted + imports updated** — `packages/types` and `packages/design` authored; `@/types/*` and `@/design` rewritten across mobile.
4. **Metro + Expo boot verified on Android** — dev client builds, connects, hot-reloads.
5. **Docs updated** — root `README.md`, `CLAUDE.md`, `BEST_PRACTICES.md` rewritten; `apps/mobile/README.md` added.
6. **PR opened** — dual-remote push configured; PR raised against `raoole20/m2-front:main` with migration notes.

---

## 12. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | pnpm isolation breaks Expo Dev Client native build on Android | Medium | High | Start with targeted `public-hoist-pattern` in `.npmrc` (Expo, RN, @react-native/*, @expo/*). If resolver errors surface during `eas build` or Gradle, escalate to `node-linker=hoisted`. Verify on a clean checkout before PR. |
| R2 | Metro can't resolve `@m2/types` or `@m2/design` from workspace | Medium | High | Configure `watchFolders` + `nodeModulesPaths` in `apps/mobile/metro.config.js` per the Expo monorepos guide. Add a smoke-test import in a mobile file before merging. |
| R3 | Expo dev client chokes on pnpm symlinks (Gradle / autolinking) | Medium | High | `public-hoist-pattern` unblocks most autolinking. If it still fails, fall back to `node-linker=hoisted` (documented in tech-decisions). Known Expo monorepo patterns cover both. |
| R4 | TS path alias `@/` conflicts with workspace `@m2/*` resolution | Low | Medium | Keep `@/` scoped to `apps/mobile/src/*` in `apps/mobile/tsconfig.json`. `@m2/*` is resolved via `node_modules` symlinks created by pnpm — the two systems never collide because `@m2/` has a different scope prefix. |
| R5 | PR diff is so large that reviewers rubber-stamp or reject on size | High | Medium | Split the branch into **logical commits**: (1) scaffold-only, (2) pure `git mv`, (3) types/design extraction, (4) import rewrites, (5) Metro/tsconfig, (6) pnpm swap, (7) docs. Reviewer guide in PR body points to the 2-3 commits that actually change content. |
| R6 | EAS build fails because it expects mobile at repo root | Medium | High | Verify with `eas build --dry-run --platform android` before merge. If the build context is wrong, set `"build.*.cwd": "apps/mobile"` in `eas.json` or run EAS from `apps/mobile/`. Keep this fix minimal — do not rewrite the EAS config. |
| R7 | Push permission to `raoole20/m2-front` remote is denied | Medium | High | Confirm push access with the `raoole20` repo owner **before** running the migration. If denied, open the PR from a fork and have it merged upstream, then reconfigure `origin` to track `raoole20/m2-front`. |
| R8 | Dual-remote push succeeds on one remote, silently fails on the other | Low | Medium | Use `git remote set-url --add --push origin <url>` so a single `git push` touches both URLs. Register `m2front` as a separate named remote for manual fallback. Include `git remote -v` verification in the PR checklist. |
| R9 | React gets duplicated across the workspace once web apps land | Low (now) / Medium (next change) | Medium | Add `pnpm.overrides` at root for `react` (and `react-dom` when web apps arrive). `pnpm why react` must show a single version. Not blocking this change, but scaffolded here. |
| R10 | Windows path-length limits hit on deep `node_modules` paths | Low | Medium | pnpm's content-addressed store keeps trees shallow. Document `git config --global core.longpaths true` as fallback in `README.md`. |
| R11 | Existing uncommitted work is lost during bulk `git mv` | Low | High | Confirm `git status` is clean before starting; require that `main` is pushed to both remotes before branching. |

---

## 13. Success Criteria

- [ ] `feat/monorepo-migration` branch exists and is pushed to both remotes.
- [ ] Repo root contains `pnpm-workspace.yaml`, `turbo.json`, `package.json` (with `"packageManager": "pnpm@9.x"`), `tsconfig.base.json`, `.npmrc`.
- [ ] `apps/mobile/` contains the full mobile app; no mobile-specific files remain at the repo root.
- [ ] `packages/types/` and `packages/design/` exist, expose their original symbols through `src/index.ts`, and are consumed by `apps/mobile` as `@m2/types` and `@m2/design` (workspace refs).
- [ ] `apps/mobile/src/` no longer contains `types/` or `design/` subdirectories.
- [ ] All former `@/types/*` and `@/design` imports in `apps/mobile/` are rewritten to the `@m2/*` packages.
- [ ] `@/` alias still resolves for `components/*`, `hooks/*`, `services/*`, `store/*`, `mock/*`, `constants`.
- [ ] `package-lock.json` is deleted; `pnpm-lock.yaml` is committed.
- [ ] `pnpm install` succeeds on a fresh clone.
- [ ] `pnpm -w typecheck` passes with zero TS errors across all workspaces.
- [ ] `pnpm --filter @m2/mobile start` launches Metro without errors.
- [ ] Android Expo dev client connects to Metro and hot-reloads a trivial component edit.
- [ ] `eas build --dry-run --platform android` (or equivalent) completes without configuration error.
- [ ] `git log --follow` on any moved file shows its full pre-migration history.
- [ ] Root `CLAUDE.md`, `README.md`, `BEST_PRACTICES.md` reflect the monorepo reality; `apps/mobile/README.md` exists and is thin.
- [ ] `git remote -v` shows `origin` with two push URLs and a named `m2front` fallback.
- [ ] PR is opened against `raoole20/m2-front:main` with reviewer notes.

---

## 14. Follow-ups

Captured here so they are not lost, but **not** part of this change:

- **Next change (`m2-web-monorepo-setup`)**: scaffold `apps/landing` (Next.js marketing site) and `apps/admin` (Next.js back-office) as sibling workspaces consuming `@m2/types` and `@m2/design`.
- Add `packages/ui` — a web component library (shadcn-based) for landing + admin.
- Add `packages/api-client` — generated or hand-written REST/WebSocket client shared across all surfaces.
- Add `packages/i18n` — shared translation dictionaries (`es-LA`, future locales).
- Consider `packages/ui-native` — extraction of RN primitive components (GlassCard, Avatar, etc.) if a second RN surface ever emerges. **Deferred** indefinitely; single-consumer extraction is premature.
- Add root `pnpm.overrides` for `react` once a web app actually lands (not needed for mobile-only).
- Consider pre-commit hooks (lefthook/husky) for `pnpm -w typecheck`, **deferred** per user preference against hooks.
- Turborepo remote cache on Vercel — wire up when the first web app deploys.
- Introduce a CI pipeline (GitHub Actions) — deferred; mobile has no tests today and adding CI is out of scope for this change.
