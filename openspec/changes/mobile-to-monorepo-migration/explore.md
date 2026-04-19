# Explore — `mobile-to-monorepo-migration`

> Precursor change to `m2-web-monorepo-setup`. Converts the existing Motomoto mobile-only repo into a **pnpm + Turborepo monorepo shell** with the current app relocated to `apps/mobile/`. **Does NOT add landing/admin** — those arrive in the next change.

---

## 1. Problem Statement

Motomoto currently ships as a **single Expo React Native app** (`raoole20/m2-front`, mirrored as `Ramsesdb/motomoto`). The product roadmap requires two additional frontends in the near term:

- A **public landing site** (Next.js, marketing, waitlist, pricing)
- An **admin/back-office web app** (Next.js, internal operators)

All three surfaces will need to share:

- **TypeScript domain types** (`User`, `Conversation`, `Channel`, `Message`, etc. — already defined in `src/types/`)
- **Design tokens** (colors, spacing, typography — already in `src/design/`)
- Eventually: an API client, i18n dictionaries, validation schemas, brand assets

Keeping these in a single-app repo forces future duplication (copy-paste of types/tokens into separate repos → drift guaranteed). Keeping the mobile app in `raoole20/m2-front` as-is *and* spinning up a separate web repo is the same problem with extra steps.

**This change** performs the lowest-risk, lowest-scope half of the migration: **turn the mobile repo into a monorepo shell** and extract only what is obviously shareable (`types`, `design`). Landing + admin are then a clean, additive follow-up in `m2-web-monorepo-setup`.

---

## 2. Current State

### 2.1 Repo topology

| Remote | URL | Role |
|---|---|---|
| `origin` (local) | `https://github.com/Ramsesdb/motomoto.git` | Personal mirror |
| `m2front` (to add) | `https://github.com/raoole20/m2-front.git` | Canonical team repo |

Both remotes must stay in sync going forward (user decision: dual push).

### 2.2 Current file layout (mobile app root)

```
motomoto/  (= m2-front)
├── app/                          # Expo Router v55 routes
│   ├── (app)/
│   │   ├── _layout.tsx
│   │   ├── ai/index.tsx
│   │   ├── home/index.tsx
│   │   ├── inbox/{[id]/index,index}.tsx
│   │   ├── profile/index.tsx
│   │   └── team/index.tsx
│   ├── (auth)/login.tsx
│   └── _layout.tsx
├── src/
│   ├── types/                    # <-- EXTRACT to packages/types
│   │   ├── user.ts channel.ts message.ts conversation.ts
│   │   ├── api.ts websocket.ts index.ts
│   ├── design/                   # <-- EXTRACT to packages/design
│   │   ├── colors.ts typography.ts spacing.ts index.ts
│   ├── components/
│   │   ├── ui/                   # Stays in apps/mobile (RN-only)
│   │   ├── messaging/
│   │   ├── ai/
│   │   └── navigation/
│   ├── hooks/ services/ store/ mock/   # RN-specific, stays
├── App.tsx  index.ts
├── app.json  eas.json  babel.config.js
├── package.json  package-lock.json  tsconfig.json
├── .nvmrc  .npmrc  .gitignore
├── BEST_PRACTICES.md  CLAUDE.md  PHASES.md  README.md
```

### 2.3 Toolchain snapshot

| Concern | Current | Target |
|---|---|---|
| Package manager | `npm` (package-lock.json) | `pnpm` (pnpm-lock.yaml) |
| Workspace root | — (single project) | pnpm workspace + Turborepo |
| Node | `20.19.4` (`.nvmrc`) | Unchanged |
| Expo SDK | 55 | Unchanged |
| RN | 0.83.2 (New Arch / Fabric) | Unchanged |
| Path alias `@/` | Maps to `src/` via tsconfig + babel | Unchanged *inside* mobile; add `@m2/*` for cross-package |
| Last commit | `1425285 feat: Batch 4 — Luminous Executive` (local, unpushed) | Pushed to both remotes before migration |

### 2.4 What has NOT been done yet

- No `pnpm` install has ever run in this repo
- No `pnpm-workspace.yaml`, no `turbo.json`
- No `packages/` directory
- No `@m2/*` scoped packages published/consumed
- Metro config is default — no `watchFolders`

---

## 3. Target State (after this change)

### 3.1 Directory tree

```
m2-front/  (both remotes point here)
├── apps/
│   └── mobile/                   # Entire current app, moved via `git mv`
│       ├── app/                  # Expo Router routes (unchanged contents)
│       ├── src/
│       │   ├── components/ hooks/ services/ store/ mock/
│       │   └── (NO types/, NO design/ — extracted)
│       ├── App.tsx  index.ts
│       ├── app.json  eas.json  babel.config.js
│       ├── metro.config.js       # NEW: watchFolders for workspace packages
│       ├── package.json          # name: "@m2/mobile", private
│       └── tsconfig.json         # extends root base; paths include @m2/*
├── packages/
│   ├── types/                    # NEW — ex-src/types
│   │   ├── src/
│   │   │   ├── user.ts channel.ts message.ts conversation.ts
│   │   │   ├── api.ts websocket.ts index.ts
│   │   ├── package.json          # name: "@m2/types", main: dist/index.js
│   │   └── tsconfig.json
│   └── design/                   # NEW — ex-src/design (TS-only token exports)
│       ├── src/
│       │   ├── colors.ts typography.ts spacing.ts index.ts
│       ├── package.json          # name: "@m2/design"
│       └── tsconfig.json
├── .npmrc                        # NEW: RN-friendly hoisting
├── pnpm-workspace.yaml           # NEW
├── turbo.json                    # NEW
├── tsconfig.base.json            # NEW (shared strict config)
├── package.json                  # NEW root; devDeps: turbo, typescript
├── pnpm-lock.yaml                # NEW (replaces package-lock.json)
├── .nvmrc                        # moved to root
├── .gitignore                    # updated for pnpm + turbo
├── README.md  BEST_PRACTICES.md  CLAUDE.md  PHASES.md
└── (NO landing/, NO admin/ — those come next change)
```

### 3.2 Package boundaries

| Package | Kind | Consumers |
|---|---|---|
| `@m2/mobile` | Expo app (private) | End-user |
| `@m2/types` | TS-only library | mobile (now), landing + admin (next) |
| `@m2/design` | TS-only tokens | mobile (now), landing + admin (next) |

### 3.3 Import rewrites inside mobile

| Before | After |
|---|---|
| `import { User } from '@/types/user'` | `import { User } from '@m2/types'` |
| `import { colors } from '@/design/colors'` | `import { colors } from '@m2/design'` |
| `import { ChatInput } from '@/components/messaging/ChatInput'` | **unchanged** (still `@/`) |
| `import { useAuth } from '@/hooks/useAuth'` | **unchanged** |

---

## 4. Goals

1. **Preserve git blame** on every moved file (`git mv`, no rewrite history).
2. **Zero visual/behavioral change** to the mobile app. Dev client still builds and runs on Android.
3. Establish a **pnpm + Turborepo shell** ready for `apps/landing` and `apps/admin` to slot in next change.
4. Extract `types` and `design` as **proper workspace packages** (`@m2/types`, `@m2/design`) consumed by mobile.
5. Update `CLAUDE.md`, `README.md`, `BEST_PRACTICES.md` so future sessions start from correct ground truth.
6. **Dual-remote push** works (`origin`=Ramsesdb, `m2front`=raoole20) with a single `git push`.
7. Land the migration on a **feature branch** (`feat/monorepo-migration`) and merge via PR.

---

## 5. Non-Goals

- ❌ No `apps/landing` (Next.js marketing)
- ❌ No `apps/admin` (Next.js back-office)
- ❌ No `packages/ui`, `packages/api-client`, `packages/i18n`
- ❌ No Tailwind, shadcn, Next.js
- ❌ No Vercel deploy config
- ❌ No visual, design-token, or UX changes to the mobile app
- ❌ No Expo SDK / RN version bumps
- ❌ No extracting mobile RN components into a shared `@m2/ui-native` (stay in `apps/mobile/src/components/`)
- ❌ No CI/CD pipeline changes (Turborepo remote cache can come later)
- ❌ No history rewrite (no `filter-repo`, no squash)

---

## 6. Constraints

| # | Constraint | Why |
|---|---|---|
| C1 | pnpm + React Native hoisting must work | RN's Metro bundler + autolinking assume certain packages are hoisted; pnpm's strict isolation breaks this unless configured |
| C2 | Expo Dev Client (native build) must still install and run on Android | Known symlink friction with pnpm → Metro/Gradle |
| C3 | Git history must be preserved per file (blame survives) | Team is already using blame; rewrites would orphan commits |
| C4 | Git identity fixed: `Ramsesdb <rdbriceno5@urbe.edu.ve>`, **no Co-Authored-By** | User policy (memory `feedback_no_coauthored.md`) |
| C5 | Both remotes must stay mirrors | User decision — avoids ever-drifting forks |
| C6 | Node 20.19.4 pinned via `.nvmrc` | Matches Expo SDK 55 tooling |
| C7 | TypeScript `strict: true` with zero errors | Project non-negotiable |
| C8 | `@/` alias inside mobile must keep working | 40+ files import via `@/` |
| C9 | React version must be singular across workspace | RN and (future) web must not pull duplicate React |
| C10 | No interactive git commands (`rebase -i`, `add -i`) | Agent constraint |

---

## 7. Options Considered

### 7.1 How to move mobile files into `apps/mobile/`

| Option | How it works | Pros | Cons | Verdict |
|---|---|---|---|---|
| **A. `git mv`** (chosen) | One bulk `git mv` of every tracked path into `apps/mobile/`, then commit | Preserves blame per-file; simple; reversible via normal git | Commit diff is huge (hundreds of renames); requires clean tree | ✅ Recommended |
| B. `git filter-repo --to-subdirectory-filter` | Rewrites all history so every commit appears under `apps/mobile/` | Cleanest post-migration history | Rewrites SHAs → forces everyone to re-clone; breaks existing PRs; invalidates mirror | ❌ Rejected |
| C. `git subtree` add | Treat current repo as a subtree inside a new monorepo repo | Flexible, keeps history linkable | Creates merge-commit noise; subtree split/push workflow is fragile; dual-mirror gets awkward | ❌ Rejected |
| D. Manual copy + new commit | `cp -r` then `git add` | Simple | **Destroys blame** | ❌ Rejected |

**Decision:** `git mv` — matches user instruction and satisfies C3.

### 7.2 Workspace tooling

| Option | Pros | Cons |
|---|---|---|
| **pnpm workspaces** (chosen) | Strict, fast installs; content-addressed store saves disk; first-class monorepo support; Turborepo pairs well | Strict hoisting collides with RN → requires `.npmrc` tuning |
| npm workspaces | Zero new tooling; already in use | Slower; hoisting behavior less deterministic; less robust for monorepos |
| yarn workspaces (classic) | Mature; good RN track record | Legacy; project direction is away from yarn |
| yarn berry (PnP) | Modern | PnP is **incompatible** with React Native's Metro resolver |

**Decision:** pnpm — matches user choice; best disk + speed; Turborepo integrates naturally.

### 7.3 Build orchestrator

| Option | Pros | Cons |
|---|---|---|
| **Turborepo** (chosen) | Tiny config; task graph; remote cache free on Vercel; used widely with Next.js | Another tool to learn |
| Nx | Powerful generators; plugin ecosystem | Heavier; opinionated; overkill for 1 app + 2 TS packages |
| Vanilla pnpm scripts (`pnpm -r run build`) | Zero tools | No caching; no task graph; grows unwieldy once web apps land |

**Decision:** Turborepo — lowest ceremony now, scales once landing/admin land.

### 7.4 `.npmrc` hoisting strategy (for pnpm + RN)

| Strategy | Setting | Behavior | RN compat |
|---|---|---|---|
| **A. Targeted public-hoist** (chosen) | `public-hoist-pattern[]=*expo*`<br>`public-hoist-pattern[]=*react-native*`<br>`public-hoist-pattern[]=@react-native/*`<br>`public-hoist-pattern[]=@expo/*` | Hoists Expo/RN ecosystem to root `node_modules` but keeps everything else isolated | ✅ Works with Expo Dev Client; keeps pnpm benefits |
| B. `node-linker=hoisted` | Global flat `node_modules` (npm-style) | Maximum compatibility — behaves like npm | ✅ Works but loses pnpm strictness everywhere, including web packages |
| C. `shamefully-hoist=true` | Legacy flag, hoists everything | ✅ Works | ❌ Deprecated alias for (B); no reason over it |
| D. Default pnpm isolation | nothing in `.npmrc` | Each package sees only its direct deps | ❌ Breaks Metro autolinking + Expo config plugins |

**Decision:** Start with (A), targeted. If Expo Dev Client build fails with cryptic resolver errors, escalate to (B) for the whole repo.

### 7.5 React version pinning

| Option | How |
|---|---|
| **A. Pin via `pnpm.overrides` at root** (chosen) | Root `package.json` → `"pnpm": { "overrides": { "react": "<pinned>", "react-dom": "<pinned>" } }` |
| B. Rely on deduplication | Let pnpm hoist the highest compatible | Risky — future web apps could pull mismatched React |
| C. Put React in each app individually | Duplication; drift guaranteed |

**Decision:** (A). Read React version from current `apps/mobile/package.json` after move, mirror into root override.

### 7.6 Metro `watchFolders` placement

| Option | Where | Tradeoff |
|---|---|---|
| **A. Inside `apps/mobile/metro.config.js`** (chosen) | Extend default Expo Metro config; add `workspaceRoot = path.resolve(__dirname, '../..')`; set `watchFolders = [workspaceRoot]`; set `nodeModulesPaths = [apps/mobile/node_modules, workspaceRoot/node_modules]` | Standard pattern; keeps mobile self-contained |
| B. Custom resolver for `@m2/*` | Handwritten resolver mapping `@m2/types` → `packages/types/src` | Over-engineered; TS/Metro already resolve via node_modules symlinks |
| C. Symlink packages manually | `ln -s ../packages/types apps/mobile/node_modules/@m2/types` | Works but bypasses pnpm's own symlinks; confusing |

**Decision:** (A). Reference: [expo docs – monorepo](https://docs.expo.dev/guides/monorepos/).

### 7.7 Shared TS config

| Option | Tradeoff |
|---|---|
| **A. `tsconfig.base.json` at root, each package/app extends** (chosen) | Single source of truth for `strict`, `moduleResolution`, etc.; per-package overrides for RN / DOM libs |
| B. Inline in each package | Duplication; drift |

**Decision:** (A).

### 7.8 Dual-remote push mechanism

| Option | Mechanism |
|---|---|
| **A. `git remote set-url --add --push origin <m2front>` on origin** (chosen) | Single `git push` fan-outs to both |
| B. Two named remotes + manual `git push origin && git push m2front` | Footgun; easy to forget |
| C. GitHub-side mirror action | Admin overhead; CI dependency |

**Decision:** (A). Document both commands in README.

### 7.9 Naming of scoped packages

| Option | Rationale |
|---|---|
| **`@m2/*`** (chosen) | Matches org scratch/code name; short; clean |
| `@motomoto/*` | Long; unnecessarily verbose in imports |
| `@raoole20/*` | Tied to GitHub user, not product |

**Decision:** `@m2/*`.

---

## 8. Open Questions

Most decisions are locked. Remaining questions for the user before `sdd-propose`:

| # | Question | Proposed default if unanswered |
|---|---|---|
| Q1 | Do we publish `@m2/types` / `@m2/design` to a registry, or keep them workspace-only for the foreseeable future? | Workspace-only (private, never published) |
| Q2 | Should `packages/types` and `packages/design` ship **TS source** consumed directly (no build), or be **compiled to `dist/`**? | TS source — simpler, faster; Metro + tsc both handle `.ts` from workspace |
| Q3 | Do we add a root `lefthook`/`husky` pre-commit to run `tsc --noEmit` across the workspace now, or defer? | Defer to `m2-web-monorepo-setup` |
| Q4 | Should `BEST_PRACTICES.md`, `PHASES.md`, `CLAUDE.md` move to root, to `apps/mobile/`, or split? | Root for overall monorepo docs; keep a thin `apps/mobile/README.md` for app-specific |
| Q5 | Do we keep `package-lock.json` committed during the transition PR, or delete in the first commit of the branch? | Delete in the first commit of the branch (atomic with pnpm switch) |
| Q6 | Does the Expo **project ID** in `app.json` / EAS need any change when the app moves into `apps/mobile/`? | No — project ID is tied to EAS project, not path; verify with `eas build:configure --platform android --non-interactive --dry-run` |
| Q7 | Do we pin `pnpm` version via `packageManager` field in root `package.json` + Corepack? | Yes — pin latest stable pnpm 9.x for reproducibility |

---

## 9. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | pnpm isolation breaks Expo Dev Client native build on Android | Medium | High | Start with targeted `public-hoist-pattern` in `.npmrc`; fall back to `node-linker=hoisted` if resolver errors appear; verify with a clean `pnpm install && pnpm --filter @m2/mobile run android` before merging |
| R2 | Metro can't resolve `@m2/types` or `@m2/design` | Medium | High | Configure `watchFolders` + `nodeModulesPaths` in `apps/mobile/metro.config.js` per Expo monorepo guide; test with a trivial `import { User } from '@m2/types'` in a mobile file |
| R3 | Duplicated React across workspace once web apps land | Medium | Medium | Add `pnpm.overrides` for `react` and `react-dom` at root; `pnpm why react` must show single version |
| R4 | `git mv` commit is so large that review is noisy | High | Low | Dedicate one commit to pure moves (no content changes); follow up with separate commits for workspace scaffolding and import rewrites |
| R5 | `@/` alias stops working after the move | Low | High | mobile's own `tsconfig.json` and `babel.config.js` still define `@/` → `./src`; confirm tsc and Metro both still see it post-move |
| R6 | CI (if any) breaks because it `npm ci`s | Low | Medium | None existing; when CI lands in next change, use `pnpm install --frozen-lockfile` |
| R7 | Team member clones and gets stale `node_modules/` | Low | Low | Document in README: `rm -rf node_modules && pnpm install` after pulling the migration |
| R8 | Push to one remote succeeds, the other fails silently | Low | Medium | Configure `origin` with dual push URLs **and** add `m2front` as a separate named remote for fallback; verify with `git remote -v` showing two push URLs |
| R9 | EAS build context changes because it expects mobile at repo root | Medium | High | Update `eas.json` → `"build": { "production": { "cwd": "apps/mobile" } }` or run EAS from `apps/mobile/`; test with `eas build --platform android --local --profile preview` before merging |
| R10 | Existing uncommitted work gets lost during `git mv` | Low | High | **Already mitigated** — Batch 4 committed as `1425285` before this change begins |
| R11 | pnpm + New Architecture (Fabric) known quirks | Low | Medium | No reported incompatibility with Expo SDK 55 + pnpm specifically; proceed and flag if seen |
| R12 | Windows path-length limits hit on deep `node_modules` | Low | Medium | pnpm's content-addressed store keeps trees shallow; enable `core.longpaths=true` on Windows as a fallback |

---

## 10. Recommended Direction

Convert `raoole20/m2-front` **in place** on branch `feat/monorepo-migration` using `git mv` to preserve per-file blame. Scaffold a **pnpm workspace + Turborepo** shell at the root, move the entire existing app to `apps/mobile/`, and carve out **two tiny workspace packages**: `@m2/types` (ex-`src/types/`) and `@m2/design` (ex-`src/design/`) — both ship TypeScript source directly, no build step. Configure `.npmrc` with targeted `public-hoist-pattern` entries for the Expo/RN ecosystem and extend `apps/mobile/metro.config.js` with `watchFolders` pointing at the workspace root so Metro resolves `@m2/*`. Pin `react` via `pnpm.overrides`, pin pnpm via `packageManager`, update docs, and push to both remotes via a dual-URL `origin`. Landing and admin remain strictly out of scope and are reserved for the follow-on change `m2-web-monorepo-setup`.

---

## 11. Ready for Proposal?

**Yes.** All nine user decisions are locked, Q1–Q7 have reasonable defaults, and the migration path is well-trodden (Expo's own monorepo docs cover the risky parts). Proceed to `sdd-propose`.
