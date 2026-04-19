# Tasks: Mobile-to-Monorepo Migration

> Ordered checklist from current `motomoto/` state to PR-opened-on-`raoole20/m2-front`. 10 phases, 7 commit groups (C1–C7). Every commit is authored by `Ramsesdb <rdbriceno5@urbe.edu.ve>` with NO `Co-Authored-By:` trailer (REQ-N-001, REQ-N-002). CLI cannot push in this environment — push/PR steps are DOCUMENTED for the user to run manually.

---

## Commit Group Legend

| Group | Commit title |
|---|---|
| **C1** | `chore(repo): scaffold pnpm+turbo monorepo and relocate mobile to apps/mobile` |
| **C2** | `feat(types): extract src/types to @m2/types workspace package` |
| **C3** | `feat(design): extract src/design to @m2/design workspace package` |
| **C4** | `refactor(mobile): rewrite @/types and @/design imports to @m2/* packages` |
| **C5** | `feat(mobile): wire tsconfig base, metro workspace config, @m2/* workspace deps` |
| **C6** | `chore(repo): swap npm for pnpm; delete package-lock.json, commit pnpm-lock.yaml` |
| **C7** | `docs: rewrite root docs for monorepo + add apps/mobile/README` |

Verification-only phases (0, 7, 10) produce no commits unless a defect is found.

---

## Phase 0 — Pre-flight

### TASK-001: Block on Batch 4 being pushed to origin
- **Phase:** 0
- **Depends on:** —
- **Satisfies:** pre-condition for all REQs (clean starting history)
- **Implements:** design §4.1.1
- **Commit group:** none (verification)
- **Files:** none
- **Steps:**
  1. Ask user to confirm Batch 4 commit (the pending uncommitted edits in current `git status`) has been committed and pushed to `origin/main` on `Ramsesdb/motomoto`.
  2. If not pushed, HALT. Print exact commands for user: `git add -A && git commit -m "<batch 4 msg>" && git push origin main`. Wait for user confirmation before proceeding.
- **Acceptance:** User confirms `git log origin/main -1` on GitHub shows the Batch 4 commit.

### TASK-002: Verify working tree is clean
- **Phase:** 0
- **Depends on:** TASK-001
- **Satisfies:** pre-condition (REQ-K-001, REQ-K-002 depend on clean history)
- **Implements:** design §4.1.1
- **Commit group:** none
- **Files:** none
- **Steps:**
  1. Run `git status` at repo root.
  2. Run `git pull --ff-only origin main`.
  3. Run `git log --oneline -5` and record the top SHA as `PRE_MIGRATION_SHA` in the task log.
- **Acceptance:** `git status` prints "working tree clean"; `PRE_MIGRATION_SHA` recorded.

### TASK-003: Capture baseline metrics
- **Phase:** 0
- **Depends on:** TASK-002
- **Satisfies:** REQ-NFR-001, REQ-NFR-002, REQ-NFR-003, REQ-J-001
- **Implements:** design §4.1.3
- **Commit group:** none
- **Files:** scratch log (not committed)
- **Steps:**
  1. Run `npx tsc --noEmit` on current `main`. Record error count as `T_ERRORS_BASE` (expected 0 per `CLAUDE.md`).
  2. Measure cold dev-client boot on Android: clear Metro cache (`rm -rf .expo node_modules/.cache`), run `npm start`, stopwatch from command to first bundle served. Record as `T_BOOT_BASE`.
  3. Optionally time cold `npm install` on a fresh clone; record as `T_INSTALL_BASE_NPM` for context.
  4. Record current `package-lock.json` SHA (`git ls-tree HEAD package-lock.json`) for post-migration recovery reference.
- **Acceptance:** `T_ERRORS_BASE = 0`; `T_BOOT_BASE` and optional `T_INSTALL_BASE_NPM` captured in task log.

### TASK-004: Enable Corepack and pin pnpm 9.15.0
- **Phase:** 0
- **Depends on:** TASK-002
- **Satisfies:** REQ-A-002 (packageManager pin), ADR-07
- **Implements:** design §4.1.2, ADR-07
- **Commit group:** none (environmental; no tracked file change)
- **Files:** none (global Node toolchain)
- **Steps:**
  1. Run `corepack enable`.
  2. Run `corepack prepare pnpm@9.15.0 --activate`.
  3. Verify `pnpm --version` prints `9.15.0`.
- **Acceptance:** `pnpm --version` == `9.15.0`.

---

## Phase 1 — Scaffold monorepo root

### TASK-005: Create feature branch `feat/monorepo-migration`
- **Phase:** 1
- **Depends on:** TASK-002, TASK-004
- **Satisfies:** ADR-08, REQ-L-003 (branch identity)
- **Implements:** design §4.2
- **Commit group:** C1 (pre-commit setup)
- **Files:** none (branch only)
- **Steps:**
  1. Run `git switch -c feat/monorepo-migration` from `main`.
  2. Verify `git branch --show-current` prints `feat/monorepo-migration`.
- **Acceptance:** On branch `feat/monorepo-migration`, pointing at `PRE_MIGRATION_SHA`.

### TASK-006: Author root `.npmrc`
- **Phase:** 1
- **Depends on:** TASK-005
- **Satisfies:** REQ-H-001 (option B), REQ-H-002, ADR-04
- **Implements:** design §3.5, §4.3.1
- **Commit group:** C1
- **Files:** `.npmrc` (new)
- **Steps:**
  1. Create `.npmrc` at repo root with the exact content from design §3.5 (targeted `public-hoist-pattern` for react/expo/metro + workspace prefs + `strict-peer-dependencies=false`).
  2. Do NOT set `node-linker=hoisted` (keep commented as fallback).
- **Acceptance:** `grep -c "public-hoist-pattern" .npmrc` ≥ 3; `grep -v "^#" .npmrc | grep "node-linker"` returns empty.

### TASK-007: Author new root `package.json` (monorepo runner)
- **Phase:** 1
- **Depends on:** TASK-005
- **Satisfies:** REQ-A-002
- **Implements:** design §3.1, §4.3.2
- **Commit group:** C1
- **Files:** `package.json` (OVERWRITE — the old mobile one will be restored into `apps/mobile/` in TASK-011)
- **Steps:**
  1. Replace `package.json` content with the monorepo runner JSON from design §3.1 (name `m2-front`, `private: true`, `packageManager: pnpm@9.15.0`, scripts wired to `turbo run ...`, devDeps `turbo`/`typescript`/`rimraf`, engines pin).
  2. Do NOT declare a `"workspaces"` field.
- **Acceptance:** `jq -r '.packageManager, .private, .name' package.json` prints `pnpm@9.15.0 true m2-front`.

### TASK-008: Author `pnpm-workspace.yaml`
- **Phase:** 1
- **Depends on:** TASK-005
- **Satisfies:** REQ-A-001
- **Implements:** design §3.2, §4.3.3
- **Commit group:** C1
- **Files:** `pnpm-workspace.yaml` (new)
- **Steps:**
  1. Create `pnpm-workspace.yaml` with exactly `packages:` + `  - "apps/*"` + `  - "packages/*"` in that order. No negations.
- **Acceptance:** File exists with both globs, in declared order.

### TASK-009: Author root `tsconfig.base.json`
- **Phase:** 1
- **Depends on:** TASK-005
- **Satisfies:** REQ-C-004 (consumers extend this), REQ-J-002
- **Implements:** design §3.4, §4.3.4
- **Commit group:** C1
- **Files:** `tsconfig.base.json` (new)
- **Steps:**
  1. Create `tsconfig.base.json` at root with the JSON from design §3.4 (strict, `moduleResolution: Bundler`, `jsx: react-native`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noEmit`).
- **Acceptance:** `jq -r '.compilerOptions.strict' tsconfig.base.json` prints `true`.

### TASK-010: Author `turbo.json`
- **Phase:** 1
- **Depends on:** TASK-005
- **Satisfies:** REQ-A-003
- **Implements:** design §3.3, §4.3.5
- **Commit group:** C1
- **Files:** `turbo.json` (new)
- **Steps:**
  1. Create `turbo.json` with the JSON from design §3.3. Use Turborepo v2 `"tasks"` key (not v1 `"pipeline"`).
  2. Verify `dev` has `"cache": false` and `"persistent": true`.
- **Acceptance:** `jq -r '.tasks | keys[]' turbo.json` lists `build`, `typecheck`, `lint`, `dev`, `clean`.

---

## Phase 2 — Move mobile to apps/mobile/

### TASK-011: Create target directories and restore old root `package.json` into `apps/mobile/`
- **Phase:** 2
- **Depends on:** TASK-007, TASK-008
- **Satisfies:** REQ-B-001, REQ-C-001 (package.json placement)
- **Implements:** design §4.4.1, §4.4.2 first step
- **Commit group:** C1
- **Files:** `apps/mobile/` (new dir), `packages/types/src/` (new dir), `packages/design/src/` (new dir), `apps/mobile/package.json` (restored from `main`)
- **Steps:**
  1. Run `mkdir -p apps/mobile packages/types/src packages/design/src`.
  2. Restore old root `package.json` content (now overwritten) via `git show main:package.json > apps/mobile/package.json`.
  3. Run `git add apps/mobile/package.json`.
- **Acceptance:** `apps/mobile/package.json` exists and `jq -r .name apps/mobile/package.json` prints `motomoto` (pre-rename; renamed in TASK-023).

### TASK-012: `git mv` top-level mobile files into `apps/mobile/`
- **Phase:** 2
- **Depends on:** TASK-011
- **Satisfies:** REQ-B-002, REQ-C-001, REQ-K-001, REQ-K-002, ADR-03
- **Implements:** design §4.4.2
- **Commit group:** C1
- **Files (git mv):**
  - `App.tsx` → `apps/mobile/App.tsx`
  - `index.ts` → `apps/mobile/index.ts`
  - `app.json` → `apps/mobile/app.json`
  - `eas.json` → `apps/mobile/eas.json`
  - `babel.config.js` → `apps/mobile/babel.config.js`
  - `tsconfig.json` → `apps/mobile/tsconfig.json`
- **Steps:**
  1. For each file, run `git mv <file> apps/mobile/<file>`.
  2. Do NOT move `metro.config.js` — it does not exist pre-migration; it will be CREATED in TASK-022.
  3. Do NOT move `package-lock.json` yet — its deletion is deferred to TASK-027 (commit C6).
- **Acceptance:** `ls apps/mobile/{App.tsx,index.ts,app.json,eas.json,babel.config.js,tsconfig.json}` all present; root no longer contains any of them.

### TASK-013: `git mv` top-level mobile directories into `apps/mobile/`
- **Phase:** 2
- **Depends on:** TASK-011
- **Satisfies:** REQ-B-002, REQ-C-001, REQ-K-001
- **Implements:** design §4.4.2
- **Commit group:** C1
- **Files (git mv):**
  - `app/` → `apps/mobile/app/`
  - `src/` → `apps/mobile/src/` (still contains `types/` and `design/` — extracted in Phase 3/4)
  - `assets/` → `apps/mobile/assets/` (only if present)
- **Steps:**
  1. Run `git mv app apps/mobile/app`.
  2. Run `git mv src apps/mobile/src`.
  3. If `assets/` exists at root: `git mv assets apps/mobile/assets`.
- **Acceptance:** `test -d apps/mobile/app && test -d apps/mobile/src && echo OK` prints `OK`; root `ls` shows no `app/` or `src/`.

### TASK-014: Verify no file lost in bulk move
- **Phase:** 2
- **Depends on:** TASK-012, TASK-013
- **Satisfies:** REQ-B-001, REQ-B-002 (diff-level safety net)
- **Implements:** design §4.4 reviewer note
- **Commit group:** C1 (verification inside group)
- **Files:** none
- **Steps:**
  1. Run `git status` and confirm every change shown is either a new root config (TASK-006/007/008/009/010/011) or a `renamed:` entry under `apps/mobile/` (or future `packages/`).
  2. Run `git diff --cached --stat | wc -l` and sanity-check against pre-migration file count (recorded in TASK-002's log).
  3. Ensure the only root entries remaining are those listed in REQ-B-001's allowed-table.
- **Acceptance:** `ls -A` at root matches REQ-B-001 allowed entries; no `renamed:` target is missing its source.

### TASK-015: Create commit C1 (scaffold + move)
- **Phase:** 2
- **Depends on:** TASK-006, TASK-007, TASK-008, TASK-009, TASK-010, TASK-011, TASK-012, TASK-013, TASK-014
- **Satisfies:** REQ-A-001, REQ-A-002, REQ-A-003, REQ-B-001, REQ-B-002, REQ-C-001, REQ-H-001, REQ-H-002, REQ-N-001, REQ-N-002
- **Implements:** design §4.4.3, §5 row 1
- **Commit group:** C1 (finalize)
- **Files:** all from TASK-006 through TASK-013
- **Steps:**
  1. Run `git add .npmrc package.json pnpm-workspace.yaml turbo.json tsconfig.base.json apps/mobile/package.json`.
  2. Verify `git config user.name` == `Ramsesdb` and `git config user.email` == `rdbriceno5@urbe.edu.ve`; if not, set locally: `git config user.name "Ramsesdb"` and `git config user.email "rdbriceno5@urbe.edu.ve"`.
  3. Run `git commit -m "chore(repo): scaffold pnpm+turbo monorepo and relocate mobile to apps/mobile"`. Do NOT include a `Co-Authored-By:` trailer.
- **Acceptance:** `git log -1 --pretty='%an <%ae>%n%s%n%b'` prints `Ramsesdb <rdbriceno5@urbe.edu.ve>`, the expected subject, and no `Co-Authored-By:` in body.

---

## Phase 3 — Extract `@m2/types`

### TASK-016: `git mv` type source files into `packages/types/src/`
- **Phase:** 3
- **Depends on:** TASK-015
- **Satisfies:** REQ-C-002, REQ-D-002, REQ-K-001
- **Implements:** design §4.5.1
- **Commit group:** C2
- **Files (git mv):**
  - `apps/mobile/src/types/user.ts` → `packages/types/src/user.ts`
  - `apps/mobile/src/types/channel.ts` → `packages/types/src/channel.ts`
  - `apps/mobile/src/types/message.ts` → `packages/types/src/message.ts`
  - `apps/mobile/src/types/conversation.ts` → `packages/types/src/conversation.ts`
  - `apps/mobile/src/types/api.ts` → `packages/types/src/api.ts`
  - `apps/mobile/src/types/websocket.ts` → `packages/types/src/websocket.ts`
  - `apps/mobile/src/types/index.ts` → `packages/types/src/index.ts`
- **Steps:**
  1. Run `git mv` for each of the seven files per the mapping above.
  2. If `apps/mobile/src/types/` remains as an empty dir, remove with `rmdir apps/mobile/src/types`.
- **Acceptance:** `test ! -d apps/mobile/src/types && ls packages/types/src/ | wc -l` prints `7`.

### TASK-017: Author `packages/types/package.json`
- **Phase:** 3
- **Depends on:** TASK-016
- **Satisfies:** REQ-D-001, REQ-D-004, ADR-05, ADR-06
- **Implements:** design §3.6, §4.5.3
- **Commit group:** C2
- **Files:** `packages/types/package.json` (new)
- **Steps:**
  1. Create `packages/types/package.json` with exact content from design §3.6 (name `@m2/types`, `private: true`, `main: "src/index.ts"`, `types: "src/index.ts"`, `sideEffects: false`, NO build/prepare/prepublishOnly scripts, only `typecheck` and `clean` scripts).
- **Acceptance:** `jq -r '.name, .main, .scripts.build' packages/types/package.json` prints `@m2/types src/index.ts null`.

### TASK-018: Author `packages/types/tsconfig.json`
- **Phase:** 3
- **Depends on:** TASK-016
- **Satisfies:** REQ-J-002
- **Implements:** design §3.7
- **Commit group:** C2
- **Files:** `packages/types/tsconfig.json` (new)
- **Steps:**
  1. Create `packages/types/tsconfig.json` extending `../../tsconfig.base.json` with `rootDir: "src"`, `outDir: "dist"`, `noEmit: true`, `include: ["src/**/*.ts"]`.
- **Acceptance:** `jq -r .extends packages/types/tsconfig.json` prints `../../tsconfig.base.json`.

### TASK-019: Verify `@m2/types` export surface preserved and create commit C2
- **Phase:** 3
- **Depends on:** TASK-016, TASK-017, TASK-018
- **Satisfies:** REQ-D-003, REQ-D-004, REQ-N-001, REQ-N-002
- **Implements:** design §4.5 tail, §5 row 2
- **Commit group:** C2 (finalize)
- **Files:** staged from TASK-016/017/018
- **Steps:**
  1. Diff the current `packages/types/src/index.ts` against the pre-migration `src/types/index.ts`: `git diff PRE_MIGRATION_SHA -- packages/types/src/index.ts` (via rename detection `-M`). Expect zero added/removed named exports.
  2. Verify `test ! -d packages/types/dist && test ! -d packages/types/build` (no tracked build output).
  3. Run `git add packages/types/package.json packages/types/tsconfig.json`.
  4. Run `git commit -m "feat(types): extract src/types to @m2/types workspace package"`. No `Co-Authored-By:`.
- **Acceptance:** Commit created; export-diff reports zero symbol churn; no `dist/` tracked.

---

## Phase 4 — Extract `@m2/design`

### TASK-020: `git mv` design source files into `packages/design/src/`
- **Phase:** 4
- **Depends on:** TASK-019
- **Satisfies:** REQ-C-002, REQ-E-002, REQ-K-001
- **Implements:** design §4.6.1
- **Commit group:** C3
- **Files (git mv):**
  - `apps/mobile/src/design/colors.ts` → `packages/design/src/colors.ts`
  - `apps/mobile/src/design/typography.ts` → `packages/design/src/typography.ts`
  - `apps/mobile/src/design/spacing.ts` → `packages/design/src/spacing.ts`
  - `apps/mobile/src/design/index.ts` → `packages/design/src/index.ts`
- **Steps:**
  1. Run `git mv` for the four files per the mapping above.
  2. Remove the now-empty `apps/mobile/src/design/` if present.
- **Acceptance:** `test ! -d apps/mobile/src/design && ls packages/design/src/ | wc -l` prints `4`.

### TASK-021: Author `packages/design/{package.json,tsconfig.json}` and create commit C3
- **Phase:** 4
- **Depends on:** TASK-020
- **Satisfies:** REQ-E-001, REQ-E-003, REQ-E-004, REQ-J-002, REQ-N-001, REQ-N-002
- **Implements:** design §3.8, §3.9, §4.6.2, §5 row 3
- **Commit group:** C3 (finalize)
- **Files:**
  - `packages/design/package.json` (new)
  - `packages/design/tsconfig.json` (new)
- **Steps:**
  1. Create `packages/design/package.json` with content from design §3.8 (`@m2/design`, no build script).
  2. Create `packages/design/tsconfig.json` with content from design §3.9 (extends `../../tsconfig.base.json`).
  3. Diff `packages/design/src/index.ts` vs `PRE_MIGRATION_SHA:src/design/index.ts`: expect zero export churn (REQ-E-003).
  4. Verify no tracked `dist/`/`build/` under `packages/design/`.
  5. Run `git add packages/design/package.json packages/design/tsconfig.json`.
  6. Run `git commit -m "feat(design): extract src/design to @m2/design workspace package"`. No `Co-Authored-By:`.
- **Acceptance:** Commit created; export-surface diff empty; `jq -r .name packages/design/package.json` prints `@m2/design`.

---

## Phase 5 — Rewrite imports inside mobile

### TASK-022: Run codemod to rewrite `@/types` and `@/design` imports to `@m2/*`
- **Phase:** 5
- **Depends on:** TASK-021
- **Satisfies:** REQ-F-001, REQ-F-002, REQ-F-003
- **Implements:** design §4.7.2, §4.7.3, §6.1 rules R1–R4
- **Commit group:** C4
- **Files:** `apps/mobile/**/*.ts`, `apps/mobile/**/*.tsx` (bulk, via sed)
- **Steps:**
  1. From repo root, run the two sed pipelines from design §6.1 Combined sed block — one for types, one for design. Scope: `apps/mobile/`, exclude `node_modules/`.
  2. Collapse rule: both root (`from '@/types'`) and subpath (`from '@/types/user'`) rewrite to `from '@m2/types'` (design §6.2 recommendation).
  3. Verify no other `@/` paths were touched: `grep -rE "from ['\"]@/(components|hooks|services|store|mock|constants)" apps/mobile/ | wc -l` should match pre-migration baseline (REQ-F-003).
- **Acceptance:** `grep -rE "from ['\"]@/types" apps/mobile/ --include='*.ts' --include='*.tsx' | wc -l` == 0 AND same for `@/design` (REQ-F-001); `grep -rE "from ['\"]@m2/types['\"]" apps/mobile/ | wc -l` ≥ 1 AND same for `@m2/design` (REQ-F-002).

### TASK-023: Create commit C4 (import rewrite)
- **Phase:** 5
- **Depends on:** TASK-022
- **Satisfies:** REQ-F-001, REQ-F-002, REQ-F-003, REQ-N-001, REQ-N-002
- **Implements:** design §5 row 4
- **Commit group:** C4 (finalize)
- **Files:** staged edits from TASK-022
- **Steps:**
  1. Run `git add -u apps/mobile/`.
  2. Re-run the REQ-F-001 / REQ-F-002 greps as a pre-commit sanity check.
  3. Run `git commit -m "refactor(mobile): rewrite @/types and @/design imports to @m2/* packages"`. No `Co-Authored-By:`.
- **Acceptance:** Commit created; greps still clean.

---

## Phase 5b — Wire mobile tsconfig, metro, package.json (part of C5)

### TASK-024: Update `apps/mobile/tsconfig.json` to extend base
- **Phase:** 5
- **Depends on:** TASK-023
- **Satisfies:** REQ-C-004, ADR-09
- **Implements:** design §3.11, §4.8.1
- **Commit group:** C5
- **Files:** `apps/mobile/tsconfig.json`
- **Steps:**
  1. Replace content with design §3.11 JSON: `extends: "../../tsconfig.base.json"`, `paths: { "@/*": ["./src/*"] }`, `types: ["expo"]`, plus `include`/`exclude`.
  2. Do NOT declare `@/types/*` or `@/design/*` paths (REQ-C-004).
- **Acceptance:** `jq -r '.extends, .compilerOptions.paths["@/*"][0]' apps/mobile/tsconfig.json` prints `../../tsconfig.base.json ./src/*`.

### TASK-025: Create `apps/mobile/metro.config.js`
- **Phase:** 5
- **Depends on:** TASK-023
- **Satisfies:** REQ-G-001, REQ-G-002, REQ-G-003
- **Implements:** design §3.12, §4.8.2
- **Commit group:** C5
- **Files:** `apps/mobile/metro.config.js` (new — did not exist pre-migration)
- **Steps:**
  1. Create the file with exact content from design §3.12: `getDefaultConfig` from `expo/metro-config`, `watchFolders` with `packages/types` and `packages/design`, `resolver.nodeModulesPaths` with both `apps/mobile/node_modules` and workspace-root `node_modules`, `resolver.unstable_enableSymlinks: true`, and extended `sourceExts`.
- **Acceptance:** `grep -E "getDefaultConfig|watchFolders|nodeModulesPaths|unstable_enableSymlinks" apps/mobile/metro.config.js | wc -l` ≥ 4.

### TASK-026: Update `apps/mobile/package.json` — rename to `@m2/mobile` + add workspace deps
- **Phase:** 5
- **Depends on:** TASK-023
- **Satisfies:** REQ-C-003, ADR-06
- **Implements:** design §3.10, §4.8.3
- **Commit group:** C5
- **Files:** `apps/mobile/package.json`
- **Steps:**
  1. Change `"name": "motomoto"` → `"name": "@m2/mobile"`.
  2. Keep `"private": true`.
  3. Add to `dependencies`: `"@m2/types": "workspace:*"` and `"@m2/design": "workspace:*"`. Leave every other dep untouched (REQ-C-003: no adds, no removes beyond these two).
  4. Add `"typecheck": "tsc --noEmit"` and `"clean": "rimraf .turbo .expo"` scripts. Leave every existing script unchanged.
- **Acceptance:** `jq -r '.name, .dependencies["@m2/types"], .dependencies["@m2/design"], .scripts.typecheck' apps/mobile/package.json` prints `@m2/mobile workspace:* workspace:* tsc --noEmit`; full diff vs pre-migration shows ONLY name change + 2 added deps + 2 added scripts.

### TASK-027: Create commit C5 (mobile wiring)
- **Phase:** 5
- **Depends on:** TASK-024, TASK-025, TASK-026
- **Satisfies:** REQ-C-003, REQ-C-004, REQ-G-001, REQ-G-002, REQ-G-003, REQ-N-001, REQ-N-002
- **Implements:** design §4.8, §5 row 5
- **Commit group:** C5 (finalize)
- **Files:** all from TASK-024/025/026
- **Steps:**
  1. Run `git add apps/mobile/tsconfig.json apps/mobile/metro.config.js apps/mobile/package.json`.
  2. Run `git commit -m "feat(mobile): wire tsconfig base, metro workspace config, @m2/* workspace deps"`. No `Co-Authored-By:`.
- **Acceptance:** Commit created with exactly those three files changed.

---

## Phase 6 — Switch to pnpm

### TASK-028: Delete `package-lock.json`, run `pnpm install`, commit C6
- **Phase:** 6
- **Depends on:** TASK-027
- **Satisfies:** REQ-M-001, REQ-M-002, REQ-M-003, REQ-NFR-003, REQ-N-001, REQ-N-002
- **Implements:** design §4.9, §5 row 6
- **Commit group:** C6 (standalone: delete lockfile + add pnpm lockfile)
- **Files:**
  - DELETE: `package-lock.json`
  - ADD: `pnpm-lock.yaml` (generated by pnpm)
- **Steps:**
  1. Run `git rm package-lock.json`.
  2. Run `time pnpm install` from repo root. Record wall-clock time as `T_INSTALL_MIG`; assert `< 90s` (REQ-NFR-003).
  3. Run `pnpm why react | head -5` and verify a single React version is resolved (design §7.2).
  4. Verify `find . -name pnpm-lock.yaml -not -path "*/node_modules/*"` returns only `./pnpm-lock.yaml` (REQ-M-002).
  5. Verify `find . -name package-lock.json -not -path "*/node_modules/*"` is empty (REQ-M-001).
  6. Verify `find . \( -name yarn.lock -o -name bun.lockb \) -not -path "*/node_modules/*"` is empty (REQ-M-003).
  7. Run `git add pnpm-lock.yaml`.
  8. Run `git commit -m "chore(repo): swap npm for pnpm; delete package-lock.json, commit pnpm-lock.yaml"`. No `Co-Authored-By:`.
- **Acceptance:** Commit created; `T_INSTALL_MIG < 90s`; single `react` resolution; lockfile invariants all pass.

---

## Phase 7 — Boot verification on Android (verification only — no commit unless defect found)

### TASK-029: Typecheck fully green across workspace
- **Phase:** 7
- **Depends on:** TASK-028
- **Satisfies:** REQ-J-001, REQ-J-002, REQ-NFR-002
- **Implements:** design §4.10.1, §4.10.2
- **Commit group:** none (verification)
- **Files:** none
- **Steps:**
  1. Run `rm -rf .turbo` and any `*.tsbuildinfo` to force a cold run.
  2. Run `time pnpm -w typecheck`. Must exit 0 with zero aggregate TS errors; record wall-clock as `T_TC_MIG`; assert `< 5s` (REQ-NFR-002).
  3. Run `( cd packages/types && npx tsc --noEmit )` — expect exit 0 (REQ-J-002).
  4. Run `( cd packages/design && npx tsc --noEmit )` — expect exit 0 (REQ-J-002).
  5. If any errors surface from the stricter base (`noUncheckedIndexedAccess`/`noImplicitOverride`, design §11 item 6), STOP and raise with user before proceeding.
- **Acceptance:** All three commands exit 0; `T_TC_MIG < 5s`; aggregate error count equals `T_ERRORS_BASE` (0).

### TASK-030: Dev client end-to-end smoke test on Android
- **Phase:** 7
- **Depends on:** TASK-028
- **Satisfies:** REQ-I-001, REQ-NFR-001
- **Implements:** design §4.10.3, §4.10.5
- **Commit group:** none (verification)
- **Files:** none
- **Steps:**
  1. Clear mobile caches: `cd apps/mobile && rm -rf .expo node_modules/.cache`.
  2. Run `pnpm --filter @m2/mobile start` from repo root with a stopwatch; record wall-clock to first bundle served as `T_BOOT_MIG`.
  3. On the Android dev client device (same device as baseline), connect and verify: login renders → sign in → home tab renders → inbox tab (list + thread detail) → AI tab → team tab → profile tab. No runtime errors; visual parity with baseline.
  4. Assert `T_BOOT_MIG <= 1.20 * T_BOOT_BASE` (REQ-NFR-001).
  5. Run `( cd apps/mobile && eas build --platform android --dry-run )` (design §4.10.5); if it fails with "No package.json", apply the `eas.json` cwd patch from §7.6 and create a fixup task (see TASK-032).
- **Acceptance:** All five tabs render without crashes; `T_BOOT_MIG` within budget; EAS dry-run succeeds (or patch applied via TASK-032).

### TASK-031: Hot reload across workspace packages
- **Phase:** 7
- **Depends on:** TASK-030
- **Satisfies:** REQ-I-002
- **Implements:** design §4.10.4
- **Commit group:** none (verification)
- **Files:** temporary edit to `packages/design/src/colors.ts` (reverted before leaving task)
- **Steps:**
  1. With Metro still running and device connected, flip one token value in `packages/design/src/colors.ts` and save.
  2. Observe the running Android app reload and render with the new value.
  3. Revert the edit (`git checkout -- packages/design/src/colors.ts`) so the branch tree stays clean.
- **Acceptance:** App reloaded automatically; source reverted cleanly.

### TASK-032: Conditional fallback — `.npmrc` option A or `eas.json` cwd patch
- **Phase:** 7
- **Depends on:** TASK-029, TASK-030
- **Satisfies:** REQ-H-001 (fallback clause), REQ-I-001, design risk R1 / R3
- **Implements:** design §7 (Gotchas Handbook), §10 R1/R3
- **Commit group:** NEW commit only if triggered — title `fix(mobile): <specific fix>`; otherwise skip this task
- **Files (only if triggered):**
  - `.npmrc` (swap to `node-linker=hoisted` fallback) OR
  - `apps/mobile/eas.json` (add `"cwd": "apps/mobile"` per profile)
- **Steps:**
  1. If TASK-030 Metro boot fails with unresolved RN/Expo modules: edit `.npmrc` per ADR-04 option A (`node-linker=hoisted`), rerun `pnpm install`, retry TASK-030. Commit as `fix(mobile): fall back to node-linker=hoisted for Expo dev client compatibility`.
  2. If EAS dry-run fails with "No package.json": patch `eas.json` with `"cwd": "apps/mobile"` on each profile (design §7.6). Commit as `fix(mobile): set eas.json cwd to apps/mobile`.
  3. Each fix is authored `Ramsesdb <rdbriceno5@urbe.edu.ve>` with NO `Co-Authored-By:` trailer.
- **Acceptance:** TASK-029, TASK-030, TASK-031 all pass after the fallback. If not triggered: no commit and task marked "not required".

### TASK-033: Verify git history is preserved on moved files
- **Phase:** 7
- **Depends on:** TASK-028
- **Satisfies:** REQ-K-001, REQ-K-002
- **Implements:** design §4.10.6
- **Commit group:** none (verification)
- **Files:** none
- **Steps:**
  1. Run `git log --follow -- apps/mobile/src/components/ui/GlassCard.tsx | head` — expect commits predating the migration commits on the branch.
  2. Run `git log --follow -- packages/types/src/user.ts | head` — expect commits from the file's `src/types/user.ts` era.
  3. Run `git blame apps/mobile/src/components/ui/GlassCard.tsx | awk '{print $1}' | sort | uniq -c | sort -rn | head` — the migration commit SHA must NOT dominate line ownership (REQ-K-002).
- **Acceptance:** Both `--follow` runs show pre-migration history; blame is dominated by pre-migration SHAs.

---

## Phase 8 — Docs update

### TASK-034: Rewrite root `README.md` for monorepo
- **Phase:** 8
- **Depends on:** TASK-033
- **Satisfies:** REQ-O-001
- **Implements:** design §4.11
- **Commit group:** C7
- **Files:** `README.md`
- **Steps:**
  1. Rewrite the file to describe `apps/` + `packages/` layout at a top level.
  2. List `@m2/mobile`, `@m2/types`, `@m2/design` with a one-line description each.
  3. Document primary commands: `pnpm install`, `pnpm --filter @m2/mobile start`, `pnpm -w typecheck`, `pnpm -w build`.
  4. Document Windows long-paths workaround (`git config --global core.longpaths true`) and the Corepack-enabled pnpm bootstrap from ADR-07.
- **Acceptance:** `grep -E "apps/|packages/|@m2/" README.md` returns ≥ 3 hits; `core.longpaths` string is present.

### TASK-035: Update root `CLAUDE.md` for monorepo conventions
- **Phase:** 8
- **Depends on:** TASK-033
- **Satisfies:** REQ-O-003
- **Implements:** design §4.11
- **Commit group:** C7
- **Files:** `CLAUDE.md`
- **Steps:**
  1. Update structure/layout section to reflect `apps/mobile/`, `packages/types/`, `packages/design/`.
  2. Note package manager is pnpm (not npm).
  3. Document `@m2/types` and `@m2/design` import conventions; `@/` still works within `apps/mobile/` (ADR-09).
  4. Replace any `npx tsc --noEmit` reference with `pnpm -w typecheck`.
- **Acceptance:** `grep -cE "pnpm|@m2/" CLAUDE.md` ≥ 3.

### TASK-036: Create `apps/mobile/README.md` (thin)
- **Phase:** 8
- **Depends on:** TASK-033
- **Satisfies:** REQ-O-002
- **Implements:** design §4.11
- **Commit group:** C7
- **Files:** `apps/mobile/README.md` (new)
- **Steps:**
  1. Author ≤ 40 lines covering: how to start Metro from this app, how to build/run dev client, where design tokens and types live (one-sentence pointer to `@m2/types` and `@m2/design`).
- **Acceptance:** `wc -l apps/mobile/README.md` ≤ 40.

### TASK-037: Preserve `BEST_PRACTICES.md` and `PHASES.md` at root; create commit C7
- **Phase:** 8
- **Depends on:** TASK-034, TASK-035, TASK-036
- **Satisfies:** REQ-O-004, REQ-N-001, REQ-N-002
- **Implements:** design §4.11, §5 row 7
- **Commit group:** C7 (finalize)
- **Files:**
  - `BEST_PRACTICES.md` (optional minor updates only; must remain at root)
  - `PHASES.md` (must remain at root)
  - plus TASK-034/035/036 files
- **Steps:**
  1. Confirm both files are at repo root (`ls BEST_PRACTICES.md PHASES.md`).
  2. Make any minor updates ONLY if they contradict monorepo reality; otherwise leave untouched.
  3. Run `git add README.md CLAUDE.md apps/mobile/README.md` (+ `BEST_PRACTICES.md` if edited).
  4. Run `git commit -m "docs: rewrite root docs for monorepo + add apps/mobile/README"`. No `Co-Authored-By:`.
- **Acceptance:** Commit created; `ls BEST_PRACTICES.md PHASES.md` both succeed at root.

---

## Phase 9 — Remote + PR

### TASK-038: Configure dual-remote push on `origin` + add `m2front`
- **Phase:** 9
- **Depends on:** TASK-037
- **Satisfies:** REQ-L-001, ADR-10
- **Implements:** design §4.12.1, §4.12.2
- **Commit group:** none (local git config only)
- **Files:** none (git config only)
- **Steps:**
  1. Run `git remote set-url --push origin https://github.com/Ramsesdb/motomoto.git`.
  2. Run `git remote set-url --add --push origin https://github.com/raoole20/m2-front.git`.
  3. Run `git remote add m2front https://github.com/raoole20/m2-front.git` (ignore "already exists" error).
  4. Run `git remote -v` — verify `origin` shows TWO push URLs AND a named `m2front` remote is present.
  5. This task is performed BY THE USER manually (CLI push permissions are blocked). The orchestrator documents the commands; user executes.
- **Acceptance:** `git remote -v | grep '^origin.*(push)' | wc -l` == 2; `git remote | grep -x m2front` succeeds.

### TASK-039: Document push commands for user to run manually
- **Phase:** 9
- **Depends on:** TASK-038
- **Satisfies:** REQ-L-002 (fan-out push)
- **Implements:** design §4.12.4
- **Commit group:** none (no commit; user-executed shell)
- **Files:** none
- **Steps:**
  1. Print the exact commands for the user to run locally:
     - `git push -u origin feat/monorepo-migration`
     - Verify GitHub UIs: `Ramsesdb/motomoto` and `raoole20/m2-front` both show the branch at the same SHA.
  2. Remind user: commits are already authored `Ramsesdb <rdbriceno5@urbe.edu.ve>` with no `Co-Authored-By:` trailers (REQ-N-001/002).
  3. If one remote fails silently (design risk R5), retry `git push m2front feat/monorepo-migration` as belt-and-suspenders.
- **Acceptance:** User reports both remotes show the branch at the same HEAD SHA.

### TASK-040: Document PR-opening commands for user
- **Phase:** 9
- **Depends on:** TASK-039
- **Satisfies:** REQ-L-003
- **Implements:** design §4.12.5
- **Commit group:** none
- **Files:** PR body (authored inline or via a temp file; NOT committed)
- **Steps:**
  1. Print the exact PR-open command for the user:
     ```
     gh pr create --repo raoole20/m2-front \
       --base main \
       --head feat/monorepo-migration \
       --title "chore(repo): migrate to pnpm + Turborepo monorepo (mobile → apps/mobile)" \
       --body-file <path-to-pr-body.md>
     ```
  2. Provide the PR body content (for the user to paste or save to a file). It MUST include:
     - Link to `openspec/changes/mobile-to-monorepo-migration/proposal.md`.
     - Reviewer guide pointing at commits C4, C5, C7 as the content-change commits; C1, C2, C3, C6 flagged as rename/scaffold-only (design §5 reviewer note).
     - Acceptance checklist derived from spec.md §5 (copy-paste).
     - Explicit note: "No `Co-Authored-By:` trailers in any commit — per project convention (REQ-N-002)."
  3. User runs the command; captures PR URL.
- **Acceptance:** PR URL returned by user and noted; PR targets `raoole20/m2-front:main` from `feat/monorepo-migration`.

### TASK-041: Final on-branch verification matrix (pre-merge)
- **Phase:** 9
- **Depends on:** TASK-040
- **Satisfies:** REQ-B-002, REQ-C-002, REQ-F-001, REQ-F-002, REQ-H-002, REQ-M-001, REQ-M-002, REQ-M-003, REQ-N-001, REQ-N-002, REQ-O-002, REQ-O-004
- **Implements:** design §9 Verification Matrix
- **Commit group:** none (verification)
- **Files:** none
- **Steps:**
  1. Execute every row of design §9 marked as a REQ in the above "Satisfies" list (copy the exact command from the matrix).
  2. Record pass/fail per row in the PR body's acceptance checklist.
  3. Run `git log feat/monorepo-migration ^main --pretty='%an <%ae>' | sort -u` — single line `Ramsesdb <rdbriceno5@urbe.edu.ve>` (REQ-N-001).
  4. Run `git log feat/monorepo-migration ^main --pretty=%b | grep -c Co-Authored-By` — must print `0` (REQ-N-002).
- **Acceptance:** All checked rows pass; `Co-Authored-By:` count is `0`; single author identity on all commits.

---

## Phase 10 — Post-merge cleanup (NOT blocking this change)

> Tasks run by the user AFTER the PR is merged into `raoole20/m2-front:main`. Not part of the migration branch itself.

### TASK-042: Fast-forward local `main` on both mirrors
- **Phase:** 10
- **Depends on:** PR merged on `raoole20/m2-front:main`
- **Satisfies:** post-merge mirror consistency (preserve `Ramsesdb/motomoto` mirror)
- **Implements:** design §8.4
- **Commit group:** none (post-merge sync)
- **Files:** none
- **Steps:**
  1. `git switch main`
  2. `git pull --ff-only origin main` (fans from both URLs; whichever is authoritative wins as base)
  3. Verify `gh repo view Ramsesdb/motomoto --json pushedAt` and `gh repo view raoole20/m2-front --json pushedAt` both advanced to the same HEAD.
  4. This task is performed by the user; orchestrator only documents commands.
- **Acceptance:** Both mirror HEADs match post-merge.

### TASK-043: Delete `feat/monorepo-migration` branch locally and on both remotes
- **Phase:** 10
- **Depends on:** TASK-042
- **Satisfies:** cleanup
- **Implements:** design §8.1 (adapted for post-merge)
- **Commit group:** none
- **Files:** none
- **Steps:**
  1. `git branch -d feat/monorepo-migration` (local; `-d` not `-D` — fast-forward already applied).
  2. `git push origin --delete feat/monorepo-migration` (fans to both remotes via dual-push URLs).
  3. Optional: `git push m2front --delete feat/monorepo-migration` as belt + suspenders.
- **Acceptance:** Branch absent from `git branch -a` locally and from both GitHub UIs.

### TASK-044: Confirm both mirrors are up to date
- **Phase:** 10
- **Depends on:** TASK-043
- **Satisfies:** ADR-10 (preserve `Ramsesdb/motomoto` mirror forever)
- **Implements:** design §8.4
- **Commit group:** none
- **Files:** none
- **Steps:**
  1. `gh repo view Ramsesdb/motomoto --json defaultBranchRef -q .defaultBranchRef.target.oid`
  2. `gh repo view raoole20/m2-front --json defaultBranchRef -q .defaultBranchRef.target.oid`
  3. Assert both SHAs match.
- **Acceptance:** Both commands return the same SHA.

---

## Coverage Notes (REQs ↔ Tasks)

All spec requirements are covered; no uncovered REQ flagged.

- **REQ-NFR-001** → TASK-003 (baseline), TASK-030 (post-migration + assertion).
- **REQ-NFR-002** → TASK-003, TASK-029.
- **REQ-NFR-003** → TASK-003, TASK-028.
- **REQ-A-001 / A-002 / A-003** → TASK-007, TASK-008, TASK-010, TASK-015.
- **REQ-B-001 / B-002** → TASK-011, TASK-012, TASK-013, TASK-014, TASK-015, TASK-041.
- **REQ-C-001 / C-002 / C-003 / C-004** → TASK-011, TASK-013, TASK-016, TASK-020, TASK-024, TASK-026, TASK-027.
- **REQ-D-001 / D-002 / D-003 / D-004** → TASK-016, TASK-017, TASK-018, TASK-019.
- **REQ-E-001 / E-002 / E-003 / E-004** → TASK-020, TASK-021.
- **REQ-F-001 / F-002 / F-003** → TASK-022, TASK-023, TASK-041.
- **REQ-G-001 / G-002 / G-003** → TASK-025, TASK-027.
- **REQ-H-001 / H-002** → TASK-006, TASK-015, TASK-032 (fallback), TASK-041.
- **REQ-I-001 / I-002** → TASK-030, TASK-031, TASK-032 (fallback).
- **REQ-J-001 / J-002** → TASK-029.
- **REQ-K-001 / K-002** → TASK-012, TASK-013, TASK-016, TASK-020, TASK-033 (ADR-03 uses `git mv` throughout).
- **REQ-L-001 / L-002 / L-003** → TASK-038, TASK-039, TASK-040.
- **REQ-M-001 / M-002 / M-003** → TASK-028, TASK-041.
- **REQ-N-001 / N-002** → TASK-015, TASK-019, TASK-021, TASK-023, TASK-027, TASK-028, TASK-037, TASK-041.
- **REQ-O-001 / O-002 / O-003 / O-004** → TASK-034, TASK-035, TASK-036, TASK-037.

## Parallel Opportunities (within a phase)

- **Phase 1:** TASK-006, TASK-007, TASK-008, TASK-009, TASK-010 are all independent writes once TASK-005 completes — can be authored in parallel.
- **Phase 3:** TASK-017 and TASK-018 are independent once TASK-016 completes.
- **Phase 5b:** TASK-024, TASK-025, TASK-026 are independent once TASK-023 lands — can be authored in parallel, then single commit in TASK-027.
- **Phase 8:** TASK-034, TASK-035, TASK-036 are independent once TASK-033 clears — author in parallel, then commit in TASK-037.
- **Phase 9:** TASK-038 and TASK-041 are independent (remote config vs verification greps); the user runs TASK-039 and TASK-040 sequentially.

## Hard Constraints (restated)

- **No CLI push.** TASK-039 and TASK-040 are DOCUMENTED for the user. The orchestrator never runs `git push`.
- **No hooks.** Do NOT add husky, lint-staged, or `.husky/` anywhere.
- **Git identity.** Every commit: `Ramsesdb <rdbriceno5@urbe.edu.ve>`. NO `Co-Authored-By:` trailers (enforced at every commit task + asserted by TASK-041).
- **Mirror preservation.** `Ramsesdb/motomoto` remains forever (ADR-10). Never remove it from `origin`'s push URL set.
