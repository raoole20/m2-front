# Spec: Mobile-to-Monorepo Migration

> Delta spec for the `mobile-to-monorepo-migration` change. Structural / infrastructure spec — pass/fail is defined by file layout, command output, grep counts, and app boot, not by user-visible features.

---

## 1. Glossary

| Term | Definition |
|---|---|
| **workspace** | A `package.json` folder listed in `pnpm-workspace.yaml`. In this repo: `apps/mobile`, `packages/types`, `packages/design`, and the root. |
| **package** | A workspace that ships code under an `@m2/*` name (here: `@m2/mobile`, `@m2/types`, `@m2/design`). |
| **workspace root** | The repo root — the directory containing `pnpm-workspace.yaml`, `turbo.json`, root `package.json`, `pnpm-lock.yaml`. |
| **hoisting** | pnpm's behavior of lifting dependencies from nested `node_modules` into a shared one so tools (Metro, Gradle autolinking) that don't understand pnpm's strict isolation can resolve them. Controlled by `.npmrc`. |
| **`watchFolders`** | Metro config array telling the bundler which directories OUTSIDE the app's own root to watch for file changes. Required so Metro rebuilds when `packages/types` or `packages/design` source edits. |
| **`nodeModulesPaths`** | Metro resolver config listing the `node_modules/` directories Metro will search. In a monorepo, both `apps/mobile/node_modules` and the root `node_modules` must be listed. |
| **workspace protocol** | pnpm's `workspace:*` dependency specifier that resolves to the in-repo workspace copy rather than a registry fetch. |
| **dev client** | An Expo-built native binary (`expo-dev-client`) that loads JS from Metro; distinct from Expo Go. Required here because of Google Sign-In native module. |
| **dual-remote push** | Git configuration where `origin` has two push URLs, so a single `git push` writes to both the `Ramsesdb/motomoto` and `raoole20/m2-front` remotes. |

---

## 2. Non-Functional Requirements

### REQ-NFR-001: Mobile dev-client boot time MUST NOT regress by more than 20% vs pre-migration baseline

The time from `pnpm --filter @m2/mobile start` (or equivalent Metro launch) to first JS bundle served to the Android dev client MUST be within 120% of the pre-migration baseline measured on the same dev machine.

- Baseline is the wall-clock duration captured on `main` immediately before branching `feat/monorepo-migration`.
- Measurement MUST be made on the same Android device, same host, same network, cold Metro cache in both runs.

#### Scenario: Boot time within budget

- GIVEN pre-migration baseline cold-boot time is `T_base` seconds
- WHEN the same cold boot is performed on `feat/monorepo-migration` with an empty Metro cache
- THEN the measured time `T_mig` MUST satisfy `T_mig <= 1.20 * T_base`

### REQ-NFR-002: First `tsc --noEmit` across workspaces MUST complete in under 5 seconds cold

Running `pnpm -w typecheck` (which fans out to `tsc --noEmit` across `apps/mobile`, `packages/types`, `packages/design`) on a cold Turborepo cache MUST complete in under 5 seconds on the developer's reference machine.

- Reference machine: Windows 11, Node 20.19.4, the host used for development (current laptop).
- "Cold" means Turborepo's local cache (`.turbo/`) has been cleared and TypeScript's own incremental caches are absent.

#### Scenario: Typecheck within budget

- GIVEN `.turbo/` and any `*.tsbuildinfo` are deleted
- WHEN `pnpm -w typecheck` runs from the workspace root
- THEN the command completes in `< 5s` and exits `0`

### REQ-NFR-003: Cold `pnpm install` MUST complete in under 90 seconds on the dev machine

On a fresh clone with no `node_modules/` and no pnpm store hits, `pnpm install` from the workspace root MUST finish in under 90 seconds on the reference dev machine with a reasonable home internet connection.

#### Scenario: Cold install within budget

- GIVEN a fresh clone of the repo with no local `node_modules/`
- WHEN `pnpm install` is run from the workspace root
- THEN it exits `0` within 90 seconds

---

## 3. Requirements by Area

### 3.A Workspace Topology

#### REQ-A-001: `pnpm-workspace.yaml` MUST declare `apps/*` and `packages/*`

The root `pnpm-workspace.yaml` MUST exist and MUST contain exactly these two workspace globs, in this order:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

No additional globs; no negations.

#### REQ-A-002: Root `package.json` MUST pin pnpm via `packageManager`

Root `package.json` MUST:

- Set `"packageManager": "pnpm@9.x"` (specifically, a `9.x` line — e.g. `pnpm@9.15.0`).
- Be `"private": true`.
- NOT declare a `"workspaces"` field (pnpm reads `pnpm-workspace.yaml`, not `package.json` workspaces).
- Include `devDependencies.turbo` and `devDependencies.typescript`.
- Expose at minimum these scripts: `"dev"`, `"build"`, `"typecheck"`, `"lint"`, each implemented as `"turbo run <task>"`.

#### REQ-A-003: `turbo.json` MUST define the required pipelines

Root `turbo.json` MUST define pipelines (or `tasks`, depending on Turborepo version) for all four of: `build`, `typecheck`, `lint`, `dev`. `dev` MUST be configured as persistent (`"cache": false`, `"persistent": true`).

#### Scenario: Turbo runs typecheck across workspaces

- GIVEN the monorepo is installed
- WHEN `pnpm -w typecheck` runs
- THEN Turborepo fans out to `apps/mobile`, `packages/types`, and `packages/design`, executes `tsc --noEmit` in each, and exits `0` if all pass

### 3.B Directory Layout

#### REQ-B-001: Post-migration tree MUST match proposal §6 exactly

The post-migration tree MUST be the target tree in `proposal.md §6`. The repo root MUST contain ONLY the following tracked entries (plus `.git/`):

| Allowed root entry | Kind |
|---|---|
| `apps/` | dir |
| `packages/` | dir |
| `openspec/` | dir (this spec framework) |
| `.agent/` | dir (if present pre-migration) |
| `.claude/` | dir (if present) |
| `.github/` | dir (if present) |
| `.vscode/` | dir (if present) |
| `.gitignore` | file |
| `.npmrc` | file |
| `.nvmrc` | file |
| `pnpm-workspace.yaml` | file |
| `pnpm-lock.yaml` | file |
| `turbo.json` | file |
| `package.json` | file |
| `tsconfig.base.json` | file |
| `README.md` | file |
| `CLAUDE.md` | file |
| `BEST_PRACTICES.md` | file |
| `PHASES.md` | file |
| `.mcp.json` | file (if present pre-migration) |
| `LICENSE` | file (if present pre-migration) |

#### REQ-B-002: No stray app files at repo root

The repo root MUST NOT contain any of: `App.tsx`, `index.ts`, `app.json`, `eas.json`, `babel.config.js`, `metro.config.js`, `src/`, `app/`, `assets/`, `package-lock.json`, `node_modules/` (tracked — it's gitignored), `yarn.lock`.

#### Scenario: Root scan finds no stray mobile artifacts

- GIVEN `HEAD` after the migration merges to `feat/monorepo-migration`
- WHEN a shallow `ls` of the repo root is taken
- THEN none of the files in REQ-B-002 are present

### 3.C Mobile App Integrity

#### REQ-C-001: `apps/mobile/` MUST contain every expected file and folder

`apps/mobile/` MUST contain ALL of the following, with contents functionally equivalent to their pre-migration state (modulo import rewrites in REQ-F-001):

| Path under `apps/mobile/` | Kind | Required |
|---|---|---|
| `app/` | dir | MUST |
| `app/_layout.tsx` | file | MUST |
| `app/(app)/_layout.tsx` | file | MUST |
| `app/(app)/ai/index.tsx` | file | MUST |
| `app/(app)/home/index.tsx` | file | MUST |
| `app/(app)/inbox/index.tsx` | file | MUST |
| `app/(app)/inbox/[id]/index.tsx` | file | MUST |
| `app/(app)/profile/index.tsx` | file | MUST |
| `app/(app)/team/index.tsx` | file | MUST |
| `app/(auth)/login.tsx` | file | MUST |
| `src/components/` | dir | MUST |
| `src/hooks/` | dir | MUST |
| `src/services/` | dir | MUST |
| `src/store/` | dir | MUST |
| `src/mock/` | dir | MUST |
| `src/constants.ts` | file | MUST |
| `App.tsx` | file | MUST |
| `index.ts` | file | MUST |
| `app.json` | file | MUST |
| `eas.json` | file | MUST |
| `babel.config.js` | file | MUST |
| `metro.config.js` | file | MUST |
| `package.json` | file | MUST |
| `tsconfig.json` | file | MUST |
| `README.md` | file | MUST |
| `.nvmrc` | file | MAY (only if app-specific pinning beyond root is needed) |

#### REQ-C-002: `apps/mobile/src/types/` and `apps/mobile/src/design/` MUST NOT exist

Neither directory MUST be present at any depth under `apps/mobile/src/`. They are extracted to workspace packages (see REQ-D-001 and REQ-E-001).

#### REQ-C-003: `apps/mobile/package.json` naming and deps

`apps/mobile/package.json` MUST:

- Have `"name": "@m2/mobile"`.
- Be `"private": true`.
- Declare `"@m2/types": "workspace:*"` and `"@m2/design": "workspace:*"` in `dependencies`.
- NOT add any runtime dependency not already present pre-migration (beyond the two workspace refs above).
- NOT remove any runtime dependency that existed pre-migration.

#### REQ-C-004: `apps/mobile/tsconfig.json` MUST extend base and preserve `@/` alias

`apps/mobile/tsconfig.json` MUST:

- Have `"extends": "../../tsconfig.base.json"`.
- Under `compilerOptions.paths`, map `"@/*": ["./src/*"]`.
- NOT declare `@/types/*` or `@/design/*` path entries (those are resolved via node_modules now).

#### Scenario: Mobile app still points at its own `src/`

- GIVEN `apps/mobile/tsconfig.json` after migration
- WHEN TypeScript resolves an import `from '@/components/messaging/ChatInput'` inside `apps/mobile/src/`
- THEN it resolves to `apps/mobile/src/components/messaging/ChatInput.tsx`

### 3.D `@m2/types` Package

#### REQ-D-001: Package identity

`packages/types/package.json` MUST:

- Set `"name": "@m2/types"`.
- Set `"main": "src/index.ts"`.
- Be `"private": true`.
- Declare NO `"build"`, `"prepare"`, or `"prepublishOnly"` script (package ships TypeScript source).
- NOT declare a `"types"` field pointing at a `dist/` path.

#### REQ-D-002: Source files present

`packages/types/src/` MUST contain exactly these files, all compiling under the root `tsconfig.base.json`:

| File | Source |
|---|---|
| `user.ts` | moved from `src/types/user.ts` |
| `channel.ts` | moved from `src/types/channel.ts` |
| `message.ts` | moved from `src/types/message.ts` |
| `conversation.ts` | moved from `src/types/conversation.ts` |
| `api.ts` | moved from `src/types/api.ts` |
| `websocket.ts` | moved from `src/types/websocket.ts` |
| `index.ts` | moved from `src/types/index.ts` |

#### REQ-D-003: Export surface preserved

Every named export present in the pre-migration `src/types/index.ts` MUST remain exported from `@m2/types`. No additions, no removals.

#### REQ-D-004: No build output tracked

`packages/types/` MUST NOT contain a tracked `dist/`, `build/`, or `.d.ts.map` file.

#### Scenario: Types imported from workspace

- GIVEN `apps/mobile` declares `"@m2/types": "workspace:*"`
- WHEN mobile code imports `import { User, ROLE_HIERARCHY } from '@m2/types'`
- THEN `tsc --noEmit` resolves both exports from `packages/types/src/index.ts` with zero errors

### 3.E `@m2/design` Package

#### REQ-E-001: Package identity

`packages/design/package.json` MUST:

- Set `"name": "@m2/design"`.
- Set `"main": "src/index.ts"`.
- Be `"private": true`.
- Declare NO build script (ships TS source).

#### REQ-E-002: Source files present

`packages/design/src/` MUST contain:

| File | Source |
|---|---|
| `colors.ts` | moved from `src/design/colors.ts` |
| `typography.ts` | moved from `src/design/typography.ts` |
| `spacing.ts` | moved from `src/design/spacing.ts` |
| `index.ts` | moved from `src/design/index.ts` |

#### REQ-E-003: Export surface preserved

Every named export present in the pre-migration `src/design/index.ts` MUST remain exported from `@m2/design`. No additions, no removals.

#### REQ-E-004: No build output tracked

`packages/design/` MUST NOT contain a tracked `dist/` or `build/` folder.

### 3.F Import Rewrites

#### REQ-F-001: Zero occurrences of `from '@/types'` or `from '@/design'` inside `apps/mobile/`

After the migration, a search of `apps/mobile/` (excluding `node_modules/`) MUST return zero matches for each of the following patterns:

| Pattern | Expected match count |
|---|---|
| `from '@/types'` | 0 |
| `from "@/types"` | 0 |
| `from '@/types/` | 0 |
| `from "@/types/` | 0 |
| `from '@/design'` | 0 |
| `from "@/design"` | 0 |
| `from '@/design/` | 0 |
| `from "@/design/` | 0 |

#### REQ-F-002: Corresponding `@m2/*` imports present

The same search MUST find at least one usage of each replacement:

| Pattern | Minimum match count |
|---|---|
| `from '@m2/types'` or `from "@m2/types"` | 1 |
| `from '@m2/design'` or `from "@m2/design"` | 1 |

#### REQ-F-003: Other `@/` imports preserved

Imports matching `from '@/components/`, `from '@/hooks/`, `from '@/services/`, `from '@/store/`, `from '@/mock/`, `from '@/constants'` MUST continue to resolve, unchanged in count from pre-migration.

#### Scenario: Grep for banned paths

- GIVEN `apps/mobile/` after the import-rewrite commit
- WHEN `grep -r "from ['\"]@/\(types\|design\)"` runs inside `apps/mobile/`
- THEN it returns no matches

### 3.G Metro Config

#### REQ-G-001: `watchFolders` MUST cover both shared packages

`apps/mobile/metro.config.js` MUST export a config whose `watchFolders` array contains (via resolved absolute paths) at least:

- `../../packages/types` (i.e. `<repo-root>/packages/types`)
- `../../packages/design`

It MAY also include `../../` (the full workspace root) as a superset; either approach satisfies this requirement.

#### REQ-G-002: `resolver.nodeModulesPaths` MUST include the workspace root

`metro.config.js` MUST configure `resolver.nodeModulesPaths` to include BOTH:

- `apps/mobile/node_modules` (the app's own)
- the workspace root `node_modules`

#### REQ-G-003: Base config source

The config MUST be built from Expo's `getDefaultConfig()` (either `expo/metro-config` or `@expo/metro-config`, whichever the installed Expo SDK 55 ships). It MUST NOT be written from scratch.

#### Scenario: Metro watches workspace packages

- GIVEN `apps/mobile/metro.config.js` after migration
- WHEN Metro starts via `pnpm --filter @m2/mobile start`
- THEN editing `packages/design/src/colors.ts` while the bundler is running triggers a hot reload in the connected Android dev client

### 3.H `.npmrc`

#### REQ-H-001: `.npmrc` MUST contain an RN-compatible hoisting rule

The root `.npmrc` MUST contain EITHER (A) OR (B), not both:

- **(A)** a single line `node-linker=hoisted`
- **(B)** all three of:
  - `public-hoist-pattern[]=*react*`
  - `public-hoist-pattern[]=*expo*`
  - `public-hoist-pattern[]=metro*`

The change selects **(B)** by default per the proposal (targeted hoisting); **(A)** is acceptable as a documented fallback if and only if `(B)` fails verification REQ-I-001.

#### REQ-H-002: No `.npmrc` outside the repo root

`.npmrc` MUST exist only at the repo root. No `.npmrc` MUST be present in `apps/mobile/`, `packages/types/`, or `packages/design/`.

### 3.I Boot Verification

#### REQ-I-001: Metro launches and Android dev client boots end-to-end

Post-migration, the mobile app MUST boot through to the home screen via the Expo dev client, with visual parity against pre-migration.

#### Scenario: E2E dev-client boot on Android

- GIVEN a fresh clone at `HEAD` of `feat/monorepo-migration`
- AND `pnpm install` has completed successfully at the workspace root
- AND an Android device with a previously installed `expo-dev-client` build is on the same LAN
- WHEN the user runs `pnpm --filter @m2/mobile start`
- THEN Metro starts without module-resolution errors
- AND the dev client connects to the Metro bundle
- AND the login screen renders identically to the pre-migration build (font, colors, layout, copy)
- AND signing in routes the user to the home tab
- AND the home, inbox, AI, profile, and team tabs all render without runtime errors

#### REQ-I-002: Hot reload wired for shared packages

- GIVEN Metro is running against the migrated mobile app
- WHEN a developer edits `packages/design/src/colors.ts` (e.g. flipping one token value)
- THEN the running app reloads and renders with the new value — no Metro restart required

### 3.J Type-check Parity

#### REQ-J-001: `pnpm -w typecheck` MUST pass with error count equal to pre-migration baseline

The total TypeScript error count produced by `pnpm -w typecheck` MUST equal the pre-migration error count from `tsc --noEmit` on `main`. Per `CLAUDE.md`, that baseline is zero.

#### Scenario: Workspace typecheck green

- GIVEN the migration branch is fully committed
- WHEN `pnpm -w typecheck` runs from the workspace root
- THEN all three workspaces (`apps/mobile`, `packages/types`, `packages/design`) exit `0`
- AND the aggregate error count is `0`

#### REQ-J-002: Packages MUST typecheck in isolation

`cd packages/types && npx tsc --noEmit` MUST exit `0`. Same for `packages/design`. This catches base-config regressions that Turbo's cache might mask.

### 3.K Git History Preservation

#### REQ-K-001: `git log --follow` MUST show pre-migration history on moved files

For every file that was physically relocated by `git mv` (under `apps/mobile/` or `packages/*/src/`), `git log --follow <path>` MUST return commits that predate the migration commit.

#### Scenario: Follow a representative mobile file

- GIVEN `apps/mobile/src/components/ui/GlassCard.tsx` exists on `feat/monorepo-migration`
- WHEN `git log --follow -- apps/mobile/src/components/ui/GlassCard.tsx` runs
- THEN the output includes at least one commit authored BEFORE the first migration commit on the branch
- AND the earliest commit shown matches the file's original creation commit at its pre-migration path

#### Scenario: Follow an extracted types file

- GIVEN `packages/types/src/user.ts` exists on the migration branch
- WHEN `git log --follow -- packages/types/src/user.ts` runs
- THEN it shows history from when the file was at `src/types/user.ts`

#### REQ-K-002: `git blame` MUST attribute lines to original authors

Running `git blame` on any moved file MUST attribute the majority of its lines to pre-migration commits, NOT to the migration commit. The migration commit itself MAY own only lines that were structurally rewritten (e.g., the `import` statements touched by REQ-F-001).

### 3.L Dual Remote Push

#### REQ-L-001: `origin` MUST have two push URLs

After migration setup, `git remote -v` MUST show `origin` with two distinct push URLs resolving to:

- `Ramsesdb/motomoto`
- `raoole20/m2-front`

It MUST also show a named remote `m2front` pointing at `raoole20/m2-front` (fallback).

#### REQ-L-002: Single `git push` MUST fan out to both remotes

#### Scenario: Fan-out push

- GIVEN the dual-remote config of REQ-L-001
- WHEN a developer runs `git push origin feat/monorepo-migration`
- THEN the branch appears on both `github.com/Ramsesdb/motomoto` and `github.com/raoole20/m2-front` without additional commands

#### REQ-L-003: PR opened against `raoole20/m2-front:main`

A pull request MUST be opened from `feat/monorepo-migration` targeting the `main` branch of `raoole20/m2-front`. The PR body MUST include:

- A link to the proposal.
- A reviewer guide pointing at the 2–3 commits that contain content changes (import rewrites, metro config, mobile package.json), as distinct from the pure-rename commits.

### 3.M Dependency Cleanup

#### REQ-M-001: `package-lock.json` MUST be deleted

There MUST be NO `package-lock.json` anywhere in the tracked tree — not at the root, not inside `apps/mobile/`, not in any package.

#### REQ-M-002: `pnpm-lock.yaml` MUST exist only at the workspace root

`pnpm-lock.yaml` MUST exist at the repo root. It MUST NOT exist inside `apps/mobile/`, `packages/types/`, or `packages/design/`.

#### REQ-M-003: No `yarn.lock` or `bun.lockb`

Those MUST NOT be present anywhere.

### 3.N Commit Identity & No Co-Authored

#### REQ-N-001: All migration commits MUST be authored by the project identity

Every commit on `feat/monorepo-migration` (from branch creation through PR open) MUST have:

- `author.name` == `Ramsesdb`
- `author.email` == `rdbriceno5@urbe.edu.ve`

#### REQ-N-002: No `Co-Authored-By` trailers

No commit on `feat/monorepo-migration` MUST contain a `Co-Authored-By:` trailer in the commit message body. (Per user preference: these trailers surface unwanted avatars in GitHub's "Built by" widget.)

#### Scenario: Verify commit metadata

- GIVEN the full commit log of `feat/monorepo-migration`
- WHEN `git log --pretty='%an <%ae>%n%b'` is inspected
- THEN every author line reads `Ramsesdb <rdbriceno5@urbe.edu.ve>`
- AND no commit body contains the string `Co-Authored-By:`

### 3.O Documentation

#### REQ-O-001: Root `README.md` describes the monorepo layout

The root `README.md` MUST:

- Describe the `apps/` and `packages/` layout at a top level.
- List `@m2/mobile`, `@m2/types`, `@m2/design` with a one-line description each.
- Document the primary commands: `pnpm install`, `pnpm --filter @m2/mobile start`, `pnpm -w typecheck`, `pnpm -w build`.
- Document the Windows long-paths workaround (`git config --global core.longpaths true`).

#### REQ-O-002: `apps/mobile/README.md` exists and is thin

`apps/mobile/README.md` MUST exist and MUST be 40 lines or fewer. It MUST cover:

- How to start Metro from this app.
- How to build / run the dev client.
- Where to find design tokens and types (one sentence pointing at the packages).

#### REQ-O-003: Root `CLAUDE.md` updated for monorepo conventions

Root `CLAUDE.md` MUST be updated to reflect:

- The `apps/` / `packages/` layout.
- Package manager is pnpm (not npm).
- `@m2/types` and `@m2/design` import conventions (and that `@/` still works within `apps/mobile/`).
- The "run `pnpm -w typecheck`" cadence replacing the old `npx tsc --noEmit`.

#### REQ-O-004: `BEST_PRACTICES.md` and `PHASES.md` preserved at root

Both files MUST remain at the repo root. Their contents MAY be updated to reflect monorepo realities, but neither MUST be moved.

---

## 4. Out of Scope (Reminder)

Per `proposal.md §3.2` and `§4`, the following are explicitly NOT part of this change and MUST NOT appear in the migration:

- No `apps/landing`, `apps/admin`, or any new app.
- No `packages/ui`, `packages/api-client`, `packages/i18n`, or any new package beyond `@m2/types` and `@m2/design`.
- No Next.js, Tailwind, shadcn, or web framework setup.
- No visual, UX, or design-token behavior changes in the mobile app.
- No Expo SDK or React Native version bump.
- No new runtime dependencies in `apps/mobile/package.json` beyond the two workspace refs.
- No removal of any existing runtime dependency.
- No `git filter-repo`, no history rewrite, no squash.
- No registry publication of `@m2/*`.
- No build step for `@m2/types` / `@m2/design`.
- No test suite, no CI pipeline, no pre-commit hooks.
- No Vercel / web deploy config.
- No Sentry / analytics / observability.
- No change to `USE_NATIVE_GOOGLE_SIGNIN` or any feature flag.
- No change to `app.json` fields (scheme, bundle IDs, EAS project ID).

---

## 5. Acceptance Checklist

Derived flat from the REQs above — the change is "done" when EVERY box below is true.

### Topology & layout

- [ ] `pnpm-workspace.yaml` exists at root and lists `apps/*` and `packages/*` only. *(REQ-A-001)*
- [ ] Root `package.json` has `"packageManager": "pnpm@9.x"`, `"private": true`, no `"workspaces"` field. *(REQ-A-002)*
- [ ] Root `package.json` scripts `dev`, `build`, `typecheck`, `lint` all shell out via `turbo run`. *(REQ-A-002)*
- [ ] `turbo.json` defines `build`, `typecheck`, `lint`, and `dev` (persistent) pipelines. *(REQ-A-003)*
- [ ] Repo root contains no stray mobile files (`App.tsx`, `index.ts`, `app.json`, `eas.json`, `babel.config.js`, `metro.config.js`, `src/`, `app/`, `assets/`, `package-lock.json`, `yarn.lock`). *(REQ-B-002)*

### Mobile app

- [ ] `apps/mobile/` contains every path listed in REQ-C-001's table. *(REQ-C-001)*
- [ ] `apps/mobile/src/types/` does not exist. *(REQ-C-002)*
- [ ] `apps/mobile/src/design/` does not exist. *(REQ-C-002)*
- [ ] `apps/mobile/package.json` has `"name": "@m2/mobile"`, `"private": true`, and `workspace:*` deps for `@m2/types` and `@m2/design`. *(REQ-C-003)*
- [ ] `apps/mobile/package.json` runtime-deps diff vs pre-migration = `+@m2/types, +@m2/design` and nothing else. *(REQ-C-003)*
- [ ] `apps/mobile/tsconfig.json` extends `../../tsconfig.base.json` and keeps `"@/*": ["./src/*"]`. *(REQ-C-004)*

### `@m2/types` package

- [ ] `packages/types/package.json` has `"name": "@m2/types"`, `"main": "src/index.ts"`, `"private": true`, no build scripts. *(REQ-D-001)*
- [ ] `packages/types/src/` contains `user.ts`, `channel.ts`, `message.ts`, `conversation.ts`, `api.ts`, `websocket.ts`, `index.ts`. *(REQ-D-002)*
- [ ] All pre-migration exports from `src/types/index.ts` are re-exported from `@m2/types`. *(REQ-D-003)*
- [ ] `packages/types/` has no tracked `dist/` or `build/` output. *(REQ-D-004)*

### `@m2/design` package

- [ ] `packages/design/package.json` has `"name": "@m2/design"`, `"main": "src/index.ts"`, `"private": true`, no build scripts. *(REQ-E-001)*
- [ ] `packages/design/src/` contains `colors.ts`, `typography.ts`, `spacing.ts`, `index.ts`. *(REQ-E-002)*
- [ ] All pre-migration exports from `src/design/index.ts` are re-exported from `@m2/design`. *(REQ-E-003)*
- [ ] `packages/design/` has no tracked `dist/` or `build/` output. *(REQ-E-004)*

### Import rewrites

- [ ] Zero occurrences of `from '@/types...'` (any form) under `apps/mobile/`. *(REQ-F-001)*
- [ ] Zero occurrences of `from '@/design...'` (any form) under `apps/mobile/`. *(REQ-F-001)*
- [ ] At least one occurrence of `from '@m2/types'` under `apps/mobile/`. *(REQ-F-002)*
- [ ] At least one occurrence of `from '@m2/design'` under `apps/mobile/`. *(REQ-F-002)*
- [ ] In-app `@/` imports (`@/components`, `@/hooks`, `@/services`, `@/store`, `@/mock`, `@/constants`) count unchanged vs pre-migration. *(REQ-F-003)*

### Metro & .npmrc

- [ ] `apps/mobile/metro.config.js` includes both `packages/types` and `packages/design` in `watchFolders`. *(REQ-G-001)*
- [ ] `apps/mobile/metro.config.js` includes both `apps/mobile/node_modules` and root `node_modules` in `resolver.nodeModulesPaths`. *(REQ-G-002)*
- [ ] `metro.config.js` is built from Expo's `getDefaultConfig()`. *(REQ-G-003)*
- [ ] Root `.npmrc` contains the selected hoisting rule set (option B by default, option A as fallback only). *(REQ-H-001)*
- [ ] No `.npmrc` file exists outside the repo root. *(REQ-H-002)*

### Boot & typecheck

- [ ] `pnpm install` at repo root on a clean clone succeeds in < 90s. *(REQ-NFR-003)*
- [ ] `pnpm --filter @m2/mobile start` launches Metro with zero resolution errors. *(REQ-I-001)*
- [ ] Android dev client connects and boots through login and all five tabs with visual parity. *(REQ-I-001)*
- [ ] Editing `packages/design/src/colors.ts` triggers a hot reload in the running app. *(REQ-I-002)*
- [ ] `pnpm -w typecheck` exits `0` across all workspaces. *(REQ-J-001)*
- [ ] `pnpm -w typecheck` cold runtime is < 5s on the reference machine. *(REQ-NFR-002)*
- [ ] `tsc --noEmit` inside each package (`packages/types`, `packages/design`) passes in isolation. *(REQ-J-002)*
- [ ] Cold dev-client boot time is within 120% of pre-migration baseline. *(REQ-NFR-001)*

### Git history

- [ ] `git log --follow -- apps/mobile/src/components/ui/GlassCard.tsx` shows commits prior to the migration commit. *(REQ-K-001)*
- [ ] `git log --follow -- packages/types/src/user.ts` shows history from its `src/types/user.ts` days. *(REQ-K-001)*
- [ ] `git blame` on any moved file attributes the majority of lines to pre-migration authors. *(REQ-K-002)*

### Remotes & PR

- [ ] `git remote -v` shows `origin` with two push URLs (Ramsesdb + raoole20). *(REQ-L-001)*
- [ ] `git remote -v` shows a named `m2front` remote pointing at `raoole20/m2-front`. *(REQ-L-001)*
- [ ] A single `git push origin feat/monorepo-migration` fans out to both remotes. *(REQ-L-002)*
- [ ] PR opened from `feat/monorepo-migration` targeting `raoole20/m2-front:main` with reviewer guide. *(REQ-L-003)*

### Dependency hygiene

- [ ] No `package-lock.json` anywhere in tracked tree. *(REQ-M-001)*
- [ ] `pnpm-lock.yaml` exists at root only. *(REQ-M-002)*
- [ ] No `yarn.lock` or `bun.lockb`. *(REQ-M-003)*

### Commit identity

- [ ] Every commit on `feat/monorepo-migration` is authored by `Ramsesdb <rdbriceno5@urbe.edu.ve>`. *(REQ-N-001)*
- [ ] No commit on the branch contains a `Co-Authored-By:` trailer. *(REQ-N-002)*

### Documentation

- [ ] Root `README.md` describes monorepo layout, lists packages, documents primary commands, and mentions `core.longpaths`. *(REQ-O-001)*
- [ ] `apps/mobile/README.md` exists and is ≤ 40 lines. *(REQ-O-002)*
- [ ] Root `CLAUDE.md` updated for monorepo conventions (pnpm, `@m2/*` imports, `pnpm -w typecheck`). *(REQ-O-003)*
- [ ] `BEST_PRACTICES.md` and `PHASES.md` remain at repo root. *(REQ-O-004)*

---
