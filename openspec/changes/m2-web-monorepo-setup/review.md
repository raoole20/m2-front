# Review — m2-web-monorepo-setup (against Option A: convert `m2-front` to monorepo)

> Phase: architecture-decision review · Date: 2026-04-19
> Input: 5 SDD artifacts (`explore.md`, `proposal.md`, `spec.md`, `design.md`, `tasks.md`) authored under the **sibling-repo assumption** (new empty `m2-web/` beside `motomoto/`).
> New decision: **Option A** — convert `raoole20/m2-front` (currently holding the mobile app) into a Turborepo+pnpm monorepo; mobile migrates to `apps/mobile/`, add `apps/landing/` + `apps/admin/` (Next.js), share `packages/design|ui|api-client|i18n`.
> Purpose: tell the orchestrator whether to patch these artifacts in place or spin a new precursor change.

---

## 1. Summary verdict

**Somewhere in between — leaning reusable, but materially incomplete.**

The *content* of the SDD (tech choices, auth flow, i18n strategy, Tailwind-v4/next-intl/React-Query picks, REQ enumeration, task granularity) is ~80% reusable. What is broken is the *setting*: every artifact assumes a greenfield empty repo and therefore omits an entire precursor workstream — **migrating the existing mobile app, preserving git history, and making Expo/Metro coexist with pnpm + Next.js under Turborepo**. That omission is not a paragraph-level patch; it is a new ~25-task phase that must run before the present tasks can start.

**Estimated rework**: ~30% of existing content needs edits (repo identity, paths, scope sentences, references to `motomoto/`); ~70% is untouched. Plus **net-new content**: one additional phase (mobile migration + monorepo coexistence) and one additional requirements capability (mobile migration acceptance criteria).

**Recommendation (previewed here, detailed in §5).** Do **not** patch `m2-web-monorepo-setup` in place. Create a new change `mobile-to-monorepo-migration` that runs **first**, then patch `m2-web-monorepo-setup` with a smaller diff (repo rename, path updates, mobile-as-consumer-of-shared-packages section). This keeps each change atomic, reviewable, and rollback-safe.

---

## 2. Per-artifact review

### 2.1 `explore.md`

| Dimension | Notes |
|---|---|
| **Still applies** | §2.2 (backend surface), §2.3 (design language from mobile), §3.1 v1 goals for *web apps*, all of §5 (tool comparisons: Turborepo vs Nx, Next 15, Tailwind v4, openapi-typescript, TanStack Query, Vercel) are framework decisions agnostic of repo topology. §7.1–7.2 technical + process risks all still valid and, if anything, more acute under Option A. |
| **Now wrong** | §2.1 table row "Web frontend — `c:/…/m2-web/` — **Empty**": under Option A the target repo is `raoole20/m2-front`, and it is **not empty** — it holds the live mobile app with 27 uncommitted files. §4.1 "Repo location" row locks in sibling-repo assumption. §7.2 "Parallel development with mobile: Monorepo is isolated from `motomoto/`; no shared files in v1" is now **inverted** — the monorepo *contains* the mobile, and the design tokens are explicitly shared (mobile's `@/design` becomes `@m2/design`). Recommended direction (§8) says "Stand up a Turborepo at `c:/…/m2-web/` containing two Next apps and four packages" — must be restated as "convert `raoole20/m2-front` to a Turborepo containing three apps (mobile + landing + admin) and four packages". |
| **Missing** | No mention of: (a) Expo + Metro + pnpm compatibility matrix; (b) Hermes/New Architecture survival under hoisting; (c) `git mv` vs `git filter-repo` history-preservation strategy; (d) mobile's uncommitted visual-overhaul work preservation; (e) dual-remote topology (`Ramsesdb/motomoto` ↔ `raoole20/m2-front`); (f) `expo-dev-client` build pipeline impact when Android `app.json` moves under `apps/mobile/`; (g) the "CLIENT role" deprecation of `Ramsesdb/motomoto`. These were not in-scope when exploration happened, but Option A makes them core. |
| **Quality (for its original brief)** | High. Clear problem statement, five explicit option matrices, well-reasoned tool choices, risks itemized by likelihood/impact. The 10 open questions are surgical, not rambling. Nothing here is "bad" — it just answers a different question than Option A is now asking. |

**Verdict**: ~75% reusable; needs a §10 "Addendum: Option A topology changes" or, cleaner, a new change's exploration file that only covers the migration concerns while cross-referencing this one for web-app tech choices.

### 2.2 `proposal.md`

| Dimension | Notes |
|---|---|
| **Still applies** | §2 motivation, §3 scope of **landing + admin** (all 30+ bullets), §4 non-goals, §5 high-level approach (apart from the repo-location-wrapping sentence), §7 tech stack table, §8 auth flow, §9 backend integration, §10 deployment plan, §11 milestones 2–13 (shared packages, apps, deploy), §12 risks, §13 success criteria for landing/admin, §14 follow-ups, §15 rollback, §17 contradictions-with-explore, §18 new risks. |
| **Now wrong** | §1 Summary: "Stand up a fresh Turborepo + pnpm monorepo at `c:/…/m2-web/` (GitHub: `Ramsesdb/m2-web`, private)". Wrong repo, wrong identity, wrong "fresh" framing. §6 architecture diagram repo name `m2-web/ # Ramsesdb/m2-web (private)` must be `m2-front/ # raoole20/m2-front` with an `apps/mobile/` entry added alongside `apps/landing/` + `apps/admin/`. §11 Milestone 1 "Repo bootstrap — `Ramsesdb/m2-web` created (private), `pnpm init` …" is a fiction under Option A — the repo exists already and is not private. §13 last checkbox "GitHub repo `Ramsesdb/m2-web` is private" is wrong on both repo identity and visibility assumption. §15 Rollback plan's "delete the Vercel projects and/or the `Ramsesdb/m2-web` repo" — deleting `raoole20/m2-front` would nuke the live mobile app; rollback semantics change fundamentally. §16 "Dependencies — GitHub repo creation" is moot (repo exists). §17 table row "packages/tokens → packages/design" renaming is still correct but now has a second reason: symmetry with mobile's pre-existing `src/design/`. |
| **Missing** | (a) No mention of the **mobile app** as a monorepo citizen — it should appear in §3 scope ("migrate existing mobile into `apps/mobile/` with preserved import paths via alias update"), §6 architecture diagram (`apps/mobile/` box consuming `@m2/design`, `@m2/i18n`, and eventually `@m2/api-client`), §11 milestones (a Milestone 0 "Mobile migration" or split into pre/post), §12 risks (Expo+pnpm hoisting, Metro config, EAS build path change). (b) No mention of **package-manager switch for mobile**: mobile currently uses `npm` (per `package-lock.json` modified in gitStatus); Option A forces pnpm on mobile too, which is a *non-trivial* change (peer resolution strictness, `node_modules` shape change affecting Metro). (c) No mention of **mobile's existing `src/types/`** which should graduate to `packages/types` (or live in `@m2/api-client` once OpenAPI-typed). (d) No mention of **dual remotes** (`Ramsesdb/motomoto` still exists with the mobile-only history; decision: archive, mirror, or delete). (e) No mention of **git identity pin** — commits authored during migration must use `rdbriceno5@urbe.edu.ve` / `Ramsesdb`, which is a repo-config concern for a repo not created by this workflow. (f) No mention of **uncommitted visual-overhaul work** (27 modified files); they must be committed or stashed before the monorepo restructure or they get scrambled when `app/`, `src/` move. |
| **Quality** | High for its original brief. Scope/non-scope/tradeoffs clearly delineated. The "contradictions with explore" table (§17) is an excellent discipline the migration change should copy. Success criteria (§13) are binary and observable. The risks table is already 15+ rows — a good precedent for expanding under Option A. |

**Verdict**: ~70% reusable. Needs a targeted patch (repo identity, milestone 1 re-worded, architecture diagram's root renamed with `apps/mobile` added, success criteria adjusted) **plus** acknowledgement that a predecessor change owns the migration.

### 2.3 `spec.md`

| Dimension | Notes |
|---|---|
| **Still applies** | All 60 REQ-IDs covering landing (A, 12), auth (B, 6), route guards (C, 3), dashboard (D, 4), inbox (E, 7), profile (F, 2), i18n (G, 6), design system (H, 7), api-client (I, 4), monorepo (J, 5), deployment (K, 4) — with the exception of REQ-MONO-002 (see below). Non-functional §2 (perf, a11y, browser, security, session, i18n quality) fully applies. Glossary §1 applies. |
| **Now wrong** | REQ-MONO-002: "The repo MUST contain exactly these top-level workspaces in v1: `@m2/landing`, `@m2/admin`, `@m2/ui`, `@m2/design`, `@m2/api-client`, `@m2/i18n`, `@m2/config`". Under Option A this list is incomplete — `@m2/mobile` (or whatever mobile's chosen workspace name) **must** be there. "Exactly" becomes a blocker if the mobile workspace is added later. Rows in REQ-MONO-002 must also reflect whether mobile consumes `@m2/design` and `@m2/i18n` (yes, per Option A's intent). REQ-DS-007 (no hardcoded hex/px in `apps/*`) extends to `apps/mobile/**` automatically — which is a *large* net-new expectation because mobile today imports hex values from local `src/design/` but via TS consts (not hardcoded literals), so the REQ may pass by accident; still, the review scope must include mobile. |
| **Missing** | **A whole capability is absent**: migration acceptance criteria. Suggested new capability "**L. Mobile migration**" with REQ-MIG-001 … REQ-MIG-00N covering: (a) mobile `app/` moves to `apps/mobile/app/` with git history preserved (verifiable via `git log --follow`); (b) mobile's `@/` alias remaps to `apps/mobile/src/` with no broken imports; (c) mobile's `src/design/*.ts` files deleted and replaced with imports from `@m2/design`; (d) mobile's `src/types/*.ts` either move to `packages/types` or stay under `apps/mobile/src/types/` (decision needed); (e) `pnpm install` at monorepo root produces a working `apps/mobile/node_modules` shape Metro can resolve; (f) `pnpm --filter @m2/mobile start` launches Expo dev server; (g) `eas build --profile development --platform android` still produces a working dev client; (h) `expo-router` typed routes still work; (i) `app.json` / `eas.json` paths updated for new directory depth. Also missing from current spec: an **NFR row for monorepo install time** (a bad hoisting config can make `pnpm install` pathological). |
| **Quality** | **Very high.** REQ-IDs are well-scoped, GIVEN/WHEN/THEN scenarios are testable and unambiguous, the acceptance checklist at §5 is a real acceptance contract. The §7 "open/flagged items" section is a gold-standard convention. This is the strongest of the 5 artifacts. Editing it is low-risk. |

**Verdict**: ~90% reusable as-is. REQ-MONO-002 needs patching. One new capability ("L. Mobile migration", ~8–12 REQs) needs authoring — ideally in the new precursor change's own spec.md, not here.

### 2.4 `design.md`

| Dimension | Notes |
|---|---|
| **Still applies** | §1.1 system view (browsers → Vercel → backend) unchanged. §1.2 monorepo view still accurate for the web half. §3 package designs (`@m2/design`, `@m2/ui`, `@m2/api-client`, `@m2/i18n`, `@m2/config`) all apply verbatim. §4 styling (Tailwind v4 + preset, glass effect mapping, mesh-gradient plugin, colored-glow plugin) unchanged. §5 auth sequence diagrams unchanged (web-only concern). §6 middleware composition unchanged. §7 api-client design unchanged. §8 i18n architecture unchanged. §9 web routing unchanged. §10 token→Tailwind mapping table unchanged. §11 polling strategy, §12 state management, §13 testing, §14 deploy, §15 shared tooling, §16 perf budgets, §17 trade-offs, §18 open questions — **all unchanged for the web apps**. |
| **Now wrong** | §2.1 authoritative directory tree is missing `apps/mobile/`. §2.2 purpose-of-each-top-level-entry table must add a row for `apps/mobile`. §14.3 domains table implies only 3 domains (landing/admin/api); mobile has no domain but has EAS artifacts — table should note that "mobile is deployed via EAS Build, not Vercel; EAS config lives under `apps/mobile/eas.json`". §15 shared-tooling table implies one `tsconfig.base.json` for all workspaces — mobile's `tsconfig.json` has different needs (Expo's `tsconfig/base`, `jsx: 'react-jsx'`, `types: ['expo/types']`). Need to say `@m2/config/tsconfig/expo.json` exists. §12 (state management) says "No Zustand/Redux in web" — correct — but must clarify *mobile keeps Zustand* and that Zustand stores that reference auth/user should eventually hydrate from the same `@m2/api-client` (cross-surface session sharing is out of scope for v1 but should be flagged). |
| **Missing** | A whole section is absent. Proposed: **§19 RN + Next coexistence under pnpm + Turborepo**, covering: (a) pnpm hoisting config (`.npmrc` with `node-linker=hoisted` vs `isolated`; Expo/Metro needs some packages hoisted, specifically `react`, `react-native`, `expo-*`); (b) Metro bundler config for monorepo (`watchFolders`, `resolver.nodeModulesPaths`, `resolver.disableHierarchicalLookup`); (c) Turborepo task graph for mobile (`start`, `prebuild`, `eas-build` targets; cache invalidation for native artifacts); (d) New Architecture (Fabric) compatibility with hoisted deps (Hermes podspec path resolution on iOS); (e) `react` / `react-native` / `react-dom` duplication avoidance (Next wants `react-dom`, RN does not; pnpm's strict store surfaces this as resolution errors); (f) whether `@m2/ui` can serve both (answer: **no** in v1 — RN components need `react-native` primitives, web needs `<div>`; keep `@m2/ui` web-only; add `@m2/ui-native` later if cross-surface components become valuable; in v1 mobile keeps its own `src/components/`); (g) shared `@m2/design` consumable by both (answer: **yes** — pure TS consts, no RN imports); (h) shared `@m2/api-client` consumable by both (answer: **yes, eventually** — but mobile currently uses `axios`; in v1, mobile keeps axios and consumes only the *types* from `@m2/api-client`); (i) git-history preservation strategy (`git mv` preserves history for single-commit moves; `git filter-repo` is for larger restructures but rewrites SHAs — tradeoff to document). |
| **Quality** | **Very high.** 18 sections, 5 sequence diagrams, explicit trade-off tables, concrete code snippets for middleware composition, clear "picked and justified" decisions. The "open design questions" at §18 is concise and actionable. |

**Verdict**: ~80% reusable. Needs an RN-coexistence section (net-new, ~300 lines). The existing sections need only surgical edits.

### 2.5 `tasks.md`

| Dimension | Notes |
|---|---|
| **Still applies** | Phase 1 shared packages (TASK-010…TASK-035) essentially unchanged — tokens, i18n, api-client, ui all still need to be built. Phase 2 landing app (TASK-050…TASK-058) unchanged. Phase 3 admin app (TASK-070…TASK-081) unchanged. Phase 4 polish (TASK-090…TASK-094) mostly unchanged. Phase 5 deploy (TASK-100…TASK-104) unchanged except for repo reference in TASK-094. |
| **Now wrong** | TASK-001 "Init git repo": assumes `git init` in an empty directory; under Option A the repo exists at `raoole20/m2-front` and the working tree is the mobile app. Steps 1–4 become "Configure existing repo: verify remote, verify `user.email=rdbriceno5@urbe.edu.ve` / `user.name=Ramsesdb`; update `.gitignore`/`.gitattributes`/`.editorconfig` if needed." TASK-002 "Init pnpm workspace": must first **remove mobile's `package-lock.json`** and its `npm`-style deps, then move mobile's `package.json` to `apps/mobile/package.json`. TASK-011 "Port design tokens from mobile repo" — under Option A this becomes "**Move** (not copy) `motomoto/src/design/*.ts` into `packages/design/src/` and rewrite mobile's imports from `@/design` to `@m2/design`". The fundamental shift: these are no longer *ports* — they are *relocations with backward-compat updates*. TASK-094 "Init GitHub repo `Ramsesdb/m2-web`": wrong — push to `raoole20/m2-front`, not create a new private repo. Entire Phase 0 (TASK-001…TASK-007) is shaped wrong for Option A. |
| **Missing** | **An entire Phase -1 "Mobile migration" is absent.** Required new tasks (sketch): MIG-001 stash or commit mobile's uncommitted visual-overhaul work; MIG-002 create migration branch `chore/monorepo-migration`; MIG-003 add `.gitattributes` / `.editorconfig` / root `tsconfig.base.json`; MIG-004 `git mv` mobile's `app/`, `src/`, `App.tsx`, `index.ts`, `app.json`, `eas.json`, `babel.config.js`, `tsconfig.json`, `package.json`, `README.md` into `apps/mobile/` (preserve history via `git mv`); MIG-005 rewrite `apps/mobile/package.json` to be a workspace member; MIG-006 add root `package.json` + `pnpm-workspace.yaml` + `turbo.json`; MIG-007 add root `.npmrc` with Expo-safe pnpm hoisting; MIG-008 update `apps/mobile/babel.config.js` `module-resolver` root to match new depth; MIG-009 update `apps/mobile/app.json` `scheme`, `ios.bundleIdentifier`, asset paths if depth-relative; MIG-010 update `apps/mobile/eas.json` working-dir for EAS Build; MIG-011 update Metro config (`metro.config.js`) with `watchFolders: [workspaceRoot]`, `resolver.nodeModulesPaths`, `resolver.disableHierarchicalLookup`; MIG-012 delete mobile's `src/design/` files (after `@m2/design` is ready) and update every `@/design` import to `@m2/design`; MIG-013 verify `pnpm --filter @m2/mobile start` boots Expo; MIG-014 verify `eas build --profile development --platform android` produces a working dev client; MIG-015 open PR on `raoole20/m2-front` with migration; MIG-016 archive/deprecate `Ramsesdb/motomoto` (push a final README "see raoole20/m2-front", mirror, or delete — user decision). Also missing: a task for **CI config** — current plan has no `.github/workflows/ci.yml` detailed, and Option A raises the complexity (matrix across mobile typecheck, web typecheck, lint, next build, EAS dry-run). Tasks are also missing: **shared types decision** (move `src/types/` to `packages/types` or leave in mobile), **root CLAUDE.md update** for monorepo-wide rules. |
| **Quality** | **Very high.** 30+ tasks, each with `Depends on / Satisfies / Implements / Files / Steps / Acceptance`, properly phased, parallelism flagged in-line. The REQ-coverage note at the end is excellent discipline. Granularity is right (30–90 min/task). This file is an exemplar of sdd-tasks. |

**Verdict**: ~65% reusable. Phase 0 needs a rewrite; a new Phase -1 (migration) needs ~12–16 tasks; TASK-094 needs changing. The remaining phases are nearly untouched.

---

## 3. Gaps introduced by Option A that SDD doesn't cover yet

### 3.1 Mobile migration strategy

| Concern | Status in SDD | What's needed |
|---|---|---|
| `git mv` vs `git filter-repo` vs plain move | Not mentioned | **Pick `git mv`** (preserves history; atomic commit; zero SHA rewrites). `git filter-repo` is overkill + destructive for SHAs; external consumers won't notice but any open PR against `raoole20/m2-front` would be invalidated. |
| Preserving "last active author" on every file | Not mentioned | `git mv` + a single migration commit preserves `--follow` history. Verify with `git log --follow apps/mobile/app/_layout.tsx` after migration. |
| 27 uncommitted files (active visual overhaul) | Not mentioned | **Must be committed OR stashed before `git mv`**. Recommendation: commit them first in `main` on `Ramsesdb/motomoto` and `raoole20/m2-front` both (preserves work), then start migration branch. |
| Moving `app/` (Expo Router) | Not mentioned | Entire `app/` directory moves to `apps/mobile/app/` — Expo Router path is filesystem-based, so the relative nesting **inside** `app/` is preserved; no route changes needed. `expo-router` typegen needs re-running. |
| Moving `src/` with `@/` alias | Not mentioned | `@/` alias in `tsconfig.json` (`"@/*": ["src/*"]`) resolves relative to the tsconfig file's location. Moving both `tsconfig.json` and `src/` together under `apps/mobile/` keeps the alias working with zero edits. |
| `App.tsx`, `index.ts`, `app.json`, `eas.json`, `babel.config.js` | Not mentioned | Move together to `apps/mobile/`. Update `package.json`'s `main` (`"main": "index.ts"` → still `index.ts` since it's co-located). `eas.json` may have `"cli.appVersionSource": "local"` paths that need reconsideration if CI assumes root. |

### 3.2 RN + Next coexistence

| Concern | Status in SDD | What's needed |
|---|---|---|
| Metro + Turborepo | Not mentioned | Turborepo has no opinion on Metro; they coexist via separate task names (`mobile:start` uses `expo start`, `landing:dev` uses `next dev`). Must add **`metro.config.js`** with `watchFolders: [path.resolve(__dirname, '../../')]` + `resolver.nodeModulesPaths: [<workspace>/node_modules, <root>/node_modules]`. |
| Expo + pnpm hoisting | Not mentioned (known hard issue) | pnpm's default `node-linker=isolated` **breaks Expo** because Metro expects flat `node_modules`. Two options: (a) `.npmrc` with `node-linker=hoisted` (simplest, works today, slight footgun on peer-dep bugs); (b) keep isolated + use `expo-yarn-workspaces`-style Metro resolver (fragile). **Recommend (a) for v1**; document as a follow-up to revisit. |
| Hermes / New Architecture | Not mentioned | Native-build paths (`ios/Podfile`, `android/build.gradle`) are under `apps/mobile/` after migration. EAS Build respects `cli.appVersionSource` and project-root setting; should JustWork™ but needs a clean `eas build --profile development` smoke test. |
| React version duplication | Not mentioned | Next 15 wants `react@19.x`; Expo SDK 55 pins `react@19.x` too — alignment is feasible. Must **explicitly pin the same React version in root `package.json` via `overrides` or pnpm `resolutions`** to prevent two copies ending up on Metro's watch path. |
| `react-dom` in mobile tree | Not mentioned (memory flag) | Mobile's gitStatus shows `package-lock.json` modified — probably from the `react-dom` install the memory `project_dev_setup.md` records. In a monorepo, `react-dom` belongs only to web apps; mobile can declare it if needed for SSR types, but via an `optionalDependency` or not at all. |
| Shared component library between mobile and web | Not mentioned | **Do not attempt in v1.** `@m2/ui` stays web-only. Mobile keeps `apps/mobile/src/components/`. Design tokens (`@m2/design`) are shared; components are not. Document as a deliberate v2 target: "`@m2/ui-native` for RN primitives + `@m2/ui-core` headless logic". |

### 3.3 Shared design package migration

| Concern | Status in SDD | What's needed |
|---|---|---|
| Mobile's current `@/design` imports | Implied "port 1:1"; under Option A it's "relocate + rewrite imports" | A codemod or a grep/replace step across `app/**/*.tsx`, `src/**/*.{ts,tsx}`: `from '@/design'` → `from '@m2/design'`. Verify with `pnpm --filter @m2/mobile typecheck`. Estimated: 20–40 import sites touched. |
| What `@m2/design` must export | SDD lists `colors`, `typography`, `spacing`, `radii`, `glows`, `tailwindPreset` | Mobile currently has `colors`, `typography`, `spacing` (no `radii`, `glows`, `tailwindPreset`). `@m2/design` must be a **superset** — add `radii`, `glows` first, keeping mobile's existing shapes backward-compatible. Mobile will not consume `tailwindPreset` (RN has no Tailwind). |
| Deletion timing | Not sequenced | After `@m2/design` is live **and** mobile's imports are rewritten **and** `pnpm --filter @m2/mobile typecheck` passes, then delete `apps/mobile/src/design/`. Not before. |
| Task ownership | Not assigned | Should live in the new migration change as MIG-012 (sketched in §2.5 above). |

### 3.4 Shared TypeScript types

| Concern | Status | Recommendation |
|---|---|---|
| Mobile's `src/types/` has 7 hand-written type files (`user.ts`, `channel.ts`, `message.ts`, `conversation.ts`, `api.ts`, `websocket.ts`, `index.ts`) | Not addressed | **Do not move to `packages/types` in v1.** Rationale: (a) `@m2/api-client` generates types from Swagger — that is the eventual single source of truth; (b) moving hand-written types out of mobile risks drift with generated types; (c) mobile will gradually migrate to generated types post-v1. Keep `apps/mobile/src/types/` as-is, flag the eventual consolidation as a follow-up. |
| Where generated types live | In `@m2/api-client/src/generated/` per SDD | Correct. Mobile can `import type { components } from '@m2/api-client'` once it's ready; until then, hand-written types continue to serve. |

### 3.5 Uncommitted work preservation

| Concern | Status | Recommendation |
|---|---|---|
| 27 modified files across `app/`, `src/components/`, `src/design/`, + 11 new files | Not addressed | **MUST be committed on `Ramsesdb/motomoto` + `raoole20/m2-front` before migration.** If left uncommitted during `git mv`, the moves will conflict with the edits. Sequence: (1) finish visual overhaul commit; (2) push to both remotes; (3) cut migration branch on `raoole20/m2-front`; (4) `git mv`. If the work is mid-flight and cannot be committed as-is, `git stash` is acceptable but risky (stashes live in local-only refs). |
| New files (AuraGlow, FilterTab, GradientButton, KPICard, MeshGradient, SunkenInput, TeamMemberCard, PerformanceMetric, AIInsightCard, GlassHeader) | Overlaps with `@m2/ui` component list! | **Important finding**: the new mobile components are **the same names** as what `@m2/ui` is supposed to deliver for web. Option A raises a latent question: do these become shared components? For v1, **no** (RN vs React-DOM divergence), but it's a strong signal that the `@m2/ui-native` + `@m2/ui-web` split will happen sooner than expected. Document as a follow-up. |

### 3.6 Git remote switch

| Concern | Status | Recommendation |
|---|---|---|
| Tasks target `Ramsesdb/m2-web` (new private repo) | Explicit in TASK-094 | Change to `raoole20/m2-front` (existing repo). |
| Git author identity | Locked in user memory | Must be `Ramsesdb` / `rdbriceno5@urbe.edu.ve` for every commit in this migration. Verify once at MIG-002. |
| Co-Authored-By trailers | Banned in user memory | Confirm none appear in any commit message. |

### 3.7 Dual remotes

| Concern | Status | Decision needed |
|---|---|---|
| Mobile is currently pushed to both `Ramsesdb/motomoto` and `raoole20/m2-front` | Not addressed | Three options: (a) **deprecate `Ramsesdb/motomoto`** (push a final README pointing to `raoole20/m2-front`, archive via `gh repo archive`); (b) keep both in sync via post-receive mirror; (c) delete `Ramsesdb/motomoto`. **Recommend (a)** — preserves history, no broken links, lowest maintenance. Needs explicit user confirmation before executing. |

### 3.8 App-specific constraints after migration

| File | Current location | Post-migration | Edits needed |
|---|---|---|---|
| `app.json` | `motomoto/app.json` | `apps/mobile/app.json` | `scheme: "motomoto"` unchanged; `ios.bundleIdentifier`, `android.package` unchanged; asset paths are `./assets/...` — unchanged (relative). ✓ |
| `eas.json` | `motomoto/eas.json` | `apps/mobile/eas.json` | Likely unchanged if EAS auto-detects project root; verify with `eas build --profile development --dry-run`. |
| `babel.config.js` | `motomoto/babel.config.js` | `apps/mobile/babel.config.js` | `module-resolver` plugin's `root: ['./src']` — still `'./src'` (relative to babel config location). ✓ |
| `metro.config.js` | may not exist today; Expo defaults | **Must be created** | `watchFolders: [path.resolve(__dirname, '../..')]`, `resolver.nodeModulesPaths: [path.resolve(__dirname, 'node_modules'), path.resolve(__dirname, '../../node_modules')]`, `resolver.disableHierarchicalLookup: true`. |
| `tsconfig.json` | `motomoto/tsconfig.json` | `apps/mobile/tsconfig.json` | `extends: "@m2/config/tsconfig/expo.json"` (new preset — net-new work in `@m2/config`). Keep `@/*` alias pointing to `src/*`. |
| `package.json` | `motomoto/package.json` | `apps/mobile/package.json` | Rename to `@m2/mobile` (or keep current name, whatever wins the naming debate). Remove `package-lock.json`. Convert any explicit `axios`/`expo-image`/etc. deps that are still wanted — keep them workspace-local; add `@m2/design` as a `workspace:*` dep. |
| `index.ts` | `motomoto/index.ts` | `apps/mobile/index.ts` | Unchanged. |
| Expo Router typed routes | generated from `app/**` | Regenerate via `expo customize tsconfig.json` or `npx expo start --clear`; ambient `expo-router/types.d.ts` still lives with `apps/mobile/`. |

### 3.9 pnpm + Expo Dev Client

| Concern | Status | Recommendation |
|---|---|---|
| Known-issue compatibility | Not in SDD | Expo Dev Client + pnpm has been reliable **only** with `node-linker=hoisted` (as of Expo SDK 55). Without hoisting, Metro fails to resolve `expo-modules-core` or `react-native` at startup. Must: (a) add `.npmrc` with `node-linker=hoisted`, `public-hoist-pattern[]=*expo*`, `public-hoist-pattern[]=*react-native*`; (b) smoke-test `pnpm --filter @m2/mobile start` + `eas build --profile development --platform android` early (MIG-013, MIG-014). |

### 3.10 CI/CD

| Concern | Status | Recommendation |
|---|---|---|
| Current SDD's CI is thin (typecheck + lint + build) | Fine for web-only | Under Option A, CI must do: (a) `pnpm install --frozen-lockfile`; (b) `turbo run typecheck lint build --filter=@m2/landing... --filter=@m2/admin... --filter=@m2/mobile...`; (c) for mobile, add an EAS Build dry-run on PR (via `eas build:configure` + `eas build --non-interactive --no-wait --platform android --profile preview` gated to manual triggers to avoid burning EAS credits on every PR); (d) separate "affected-only" builds on `main` pushes using Turborepo's `--filter=[origin/main]`. Net-new `.github/workflows/ci.yml` is now ~60 lines instead of ~30. |
| EAS Build is not a Vercel concern | Current deploy plan is Vercel-only | Mobile has no Vercel presence — it ships via EAS + App Store + Play Store + OTA updates. The deploy plan (§10, §14) needs a new subsection "mobile releases via EAS" acknowledging this is **not** in scope for this monorepo-migration change but shouldn't regress. |

---

## 4. Optimization opportunities

| # | Opportunity | Where | Impact |
|---|---|---|---|
| 1 | **Order matters: migrate mobile first, then add web**. If mobile migration is unstable, we should discover that before investing in 100+ tasks for landing+admin. Proposed phasing: Migration → Mobile smoke test → Shared packages → Landing → Admin → Deploy. | Phasing across both changes | High — de-risks the bigger-ticket work. |
| 2 | **Branch strategy**: do the migration on `chore/monorepo-migration` against `raoole20/m2-front`, merge to `main` behind a feature flag (environmental, not code), then start web apps on separate feature branches. | New migration change's proposal | Medium — isolates rollback to a single merge. |
| 3 | **Consolidate shared packages count**: SDD has `@m2/config` + `@m2/design` + `@m2/ui` + `@m2/api-client` + `@m2/i18n` = 5. Consider adding `@m2/types` (eventually) for generated OpenAPI types as a separate package vs burying them in `@m2/api-client` — but not in v1. Flag for v2. | `proposal.md` §5 follow-ups | Low — hygiene, not urgent. |
| 4 | **Naming collision in `@m2/ui`**: mobile has new files named `GlassCard.tsx`, `MeshGradient.tsx`, `GradientButton.tsx`, `KPICard.tsx`, `AuraGlow.tsx`, `FilterTab.tsx`, `SunkenInput.tsx`, `AIInsightCard.tsx`, `TeamMemberCard.tsx`, `PerformanceMetric.tsx`, `GlassHeader.tsx`. `@m2/ui` (web) will create components with identical names. **This is fine** (different workspaces = different modules) but will confuse developers reading PR diffs. Document the convention: `@m2/ui` = web; `apps/mobile/src/components/ui/` = mobile; signatures are **not** guaranteed to match. | `design.md` §3.2 note | Medium — avoids future "why is `GlassCard` props different on mobile vs web" churn. |
| 5 | **Bundle-size budgets for mobile not changed by web work** (reverse also): add a sanity budget for mobile JS bundle (Hermes-compiled) to detect accidental regressions from shared-package updates. Not a gate in v1; just a recorded baseline. | `design.md` §16 | Low — cheap insurance. |
| 6 | **Mobile CI matrix is cheap**: run mobile typecheck on every PR that touches `apps/mobile/**` OR `packages/design/**` OR `packages/i18n/**` via Turborepo's `--filter` + `turbo.json` `globalDependencies`. Prevents "design change broke mobile unknowingly." | `design.md` §14 / new CI section | High — this is the whole reason for a monorepo. |
| 7 | **Stash the mobile uncommitted work first**: orchestrator should run `git status`, confirm with user "you have 27 modified files — commit or stash before migration?", and only proceed after resolution. Treat this as a precondition, not a task. | Pre-migration checklist | High — protects user's active work. |
| 8 | **Dual-remote strategy decision** is a user-approval gate, not a task. The orchestrator should present options clearly (archive `Ramsesdb/motomoto`, keep mirrored, delete) and wait for user pick. | Pre-migration checklist | Medium — irreversible decision. |
| 9 | **Root `CLAUDE.md`**: the project-root CLAUDE.md (currently at `motomoto/CLAUDE.md`) needs a rewrite for the monorepo shape. Mobile's rules (no `any`, `hasMinRole`, Zustand + `useShallow`, `@/` alias, etc.) still apply to `apps/mobile/**`. A new top-level CLAUDE.md at `m2-front/` root should cover monorepo conventions; `apps/mobile/CLAUDE.md` keeps mobile-specific rules. | New MIG task | Medium — prevents AI agents from violating invariants. |
| 10 | **Keep scope creep out**: it's tempting, with mobile already in the monorepo, to add tasks like "extract messaging logic to `@m2/messaging`" or "unify Zustand store shape with TanStack Query." **Resist.** v1's goal is coexistence, not convergence. Document as v2 follow-ups. | `proposal.md` §14 | High — protects v1 timeline. |

---

## 5. Recommended next steps

### 5.1 Patch existing SDD vs create new change?

**Create a new precursor change.** Name: `mobile-to-monorepo-migration` (or `m2-front-monorepo-migration`). Reasoning:

- The migration is a **different kind of work** (infra/devops, git history, Expo Dev Client smoke tests) from what `m2-web-monorepo-setup` owns (product features for landing + admin).
- Mixing them makes every artifact ~2x longer and harder to review.
- Discrete rollback: if migration ships and web apps stall for weeks, we still deliver value (unified tooling, shared `@m2/design` for mobile visual overhaul).
- SDD convention (per `/sdd-new`): small, atomic changes are easier to verify and archive.
- The patch to `m2-web-monorepo-setup` then becomes minimal (~20 edits across 5 files), which is a healthy size.

### 5.2 Ideal phasing

```
Phase A. Pre-migration gating (user decisions)
   A1. Commit/stash mobile's 27 modified files             [user action]
   A2. Decide dual-remote fate for Ramsesdb/motomoto       [user decision]
   A3. Confirm git identity (Ramsesdb / rdbriceno5@…)      [user confirm]
   A4. Confirm whether to rename workspace scope (@m2 vs
       @motomoto) — affects package.json names everywhere  [user decision]

Phase B. New change: mobile-to-monorepo-migration
   B1. sdd-explore (scoped to migration only, cross-refs
       this review for topology)
   B2. sdd-propose (scope: git mv + pnpm/turbo bootstrap +
       Expo Dev Client smoke test; non-goals: new features,
       design tweaks, landing/admin)
   B3. sdd-spec (capability "Mobile migration" with ~10 REQs:
       history preserved, app.json scheme unchanged, EAS
       build succeeds, typecheck passes, `@/` alias works,
       @m2/design consumed successfully)
   B4. sdd-design (§ on RN+Next coexistence, §
       on pnpm hoisting, § on Metro config, § on
       git-mv mechanics)
   B5. sdd-tasks (~16 tasks MIG-001 … MIG-016)
   B6. sdd-apply (execute, iteratively, with manual
       verification points at MIG-013 and MIG-014)
   B7. sdd-verify → sdd-archive

Phase C. Patch existing m2-web-monorepo-setup
   C1. explore.md: add §10 "Post-Option-A context" pointing
       at the migration change; edit §2.1, §4.1, §7.2, §8.
   C2. proposal.md: edit §1, §3 scope (add apps/mobile as
       a first-class workspace that consumes shared
       packages), §6 architecture diagram, §11 milestone 1,
       §13 success criteria, §15 rollback, §16 deps.
   C3. spec.md: edit REQ-MONO-002 to add @m2/mobile.
       Optionally link to migration change's spec for
       migration REQs.
   C4. design.md: add §19 "RN + Next coexistence" (net-new);
       edit §2.1 tree (add apps/mobile), §2.2 table,
       §14.3 domains note, §15 tooling (add tsconfig/expo).
   C5. tasks.md: rewrite Phase 0 (TASK-001 … TASK-007) to
       assume existing repo; edit TASK-094 to push to
       raoole20/m2-front. Leave Phase 1–5 nearly untouched.

Phase D. Execute m2-web-monorepo-setup
   Proceed through sdd-apply for the patched plan.

Phase E. Deploy + decommission
   E1. Deploy web apps to Vercel.
   E2. Archive Ramsesdb/motomoto per Phase A2 decision.
```

### 5.3 User decisions needed before continuing

1. **Commit-vs-stash mobile's 27 modified files?** (Recommend: finish and commit the visual-overhaul work on both remotes, then start migration.)
2. **`Ramsesdb/motomoto` fate**: archive with a forwarding README / keep mirrored / delete? (Recommend: archive with README pointing to `raoole20/m2-front`.)
3. **Workspace scope**: `@m2/*` or `@motomoto/*`? (SDD uses `@m2/*`; review stays with it unless user prefers otherwise.)
4. **Mobile `package.json` name**: `@m2/mobile` (consistent with scope) or keep whatever it is today? (Recommend: `@m2/mobile`.)
5. **Go-ahead to author the new change `mobile-to-monorepo-migration` before patching `m2-web-monorepo-setup`?** This is the pivotal phasing question. (Recommend: **yes**.)
6. **`.npmrc` hoisting policy**: `node-linker=hoisted` for v1 (Expo-safe, slightly less strict) or `isolated` with custom Metro resolver (strict, fragile)? (Recommend: **hoisted** for v1; revisit in v2.)
7. **Mobile components under `@m2/ui`?** (Recommend: **no** in v1; keep `apps/mobile/src/components/` local. Revisit post-v1.)

### 5.4 What the orchestrator can safely do without waiting

- Read this review and use it as source-of-truth for the new change.
- Prepare a draft user-prompt asking the 7 decisions above in one shot.
- Stage the 5-file patch list for `m2-web-monorepo-setup` so it's ready to apply immediately after the migration change archives.
- Do **not** touch `apps/` or `packages/` directories in either repo yet. Do **not** run `git mv`. Do **not** delete `Ramsesdb/motomoto`.

---

## 6. Appendix — file paths referenced

Artifacts reviewed (all under `c:/Users/ramse/OneDrive/Documents/vacas/m2-web/openspec/changes/m2-web-monorepo-setup/`):

- `explore.md`
- `proposal.md`
- `spec.md`
- `design.md`
- `tasks.md`

Existing mobile repo (authoritative source for the migration):

- `c:/Users/ramse/OneDrive/Documents/vacas/motomoto/`
  - `app/` (Expo Router; will become `apps/mobile/app/`)
  - `src/design/{colors,typography,spacing,index}.ts` (will be relocated to `packages/design/src/` + imports rewritten)
  - `src/types/{user,channel,message,conversation,api,websocket,index}.ts` (will stay in `apps/mobile/src/types/` for v1; consolidate post-v1)
  - `src/components/` (stays in `apps/mobile/src/components/` for v1)
  - `App.tsx`, `index.ts`, `app.json`, `eas.json`, `babel.config.js`, `tsconfig.json`, `package.json`, `CLAUDE.md`
  - 27 modified files + 11 new files from active visual-overhaul work — must be resolved pre-migration

Existing m2-front clone (for reference; confirms shape parity with motomoto/):

- `c:/Users/ramse/OneDrive/Documents/vacas/_m2-front-scratch/`

Review output (this file):

- `c:/Users/ramse/OneDrive/Documents/vacas/m2-web/openspec/changes/m2-web-monorepo-setup/review.md`
