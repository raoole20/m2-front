# Design: Mobile-to-Monorepo Migration

> Technical design doc for `mobile-to-monorepo-migration`. Target reader: the dev executing the migration. Heavy on real config snippets and shell commands; light on feature narrative (that lives in `proposal.md`). Read this end-to-end before running any `git mv`.

---

## 1. Architecture Overview

### 1.1 Before (single-package Expo repo)

```
motomoto/                                 <- repo root (also the mobile app root)
├── .git/
├── .gitignore
├── .nvmrc                                Node 20.19.4
├── .mcp.json
├── app/                                  Expo Router v55 routes
│   ├── (app)/{ai,home,inbox,profile,team}/...
│   ├── (auth)/login.tsx
│   └── _layout.tsx
├── src/
│   ├── components/                       ui/, messaging/, ai/, navigation/
│   ├── hooks/
│   ├── services/
│   ├── store/
│   ├── mock/
│   ├── constants.ts
│   ├── types/        ◄───────────────────  will be extracted to @m2/types
│   │   ├── user.ts, channel.ts, message.ts, conversation.ts, api.ts, websocket.ts, index.ts
│   └── design/       ◄───────────────────  will be extracted to @m2/design
│       ├── colors.ts, typography.ts, spacing.ts, index.ts
├── App.tsx
├── index.ts
├── app.json
├── eas.json
├── babel.config.js
├── tsconfig.json                         extends expo/tsconfig.base, "@/*": ["src/*"]
├── package.json                          name: "motomoto", npm install
├── package-lock.json     ◄───────────────  removed in atomic swap
├── README.md
├── CLAUDE.md
├── BEST_PRACTICES.md
├── PHASES.md
└── openspec/                             (SDD framework — stays where it is)
```

Package manager: **npm** (lockfile `package-lock.json`). One `package.json` at root. One `tsconfig.json`. No workspace concept.

### 1.2 After (pnpm + Turborepo monorepo)

```
m2-front/ (raoole20)   ▲ also pushed to Ramsesdb/motomoto via dual-URL origin
├── .git/
├── .gitignore                            UPDATED (+ .turbo/, pnpm-store entries)
├── .nvmrc                                unchanged at root
├── .mcp.json
├── .npmrc                                NEW — RN-compatible hoisting (ADR-04)
├── pnpm-workspace.yaml                   NEW
├── pnpm-lock.yaml                        NEW (replaces package-lock.json)
├── turbo.json                            NEW
├── package.json                          NEW root — workspaces runner, "packageManager": "pnpm@9.x"
├── tsconfig.base.json                    NEW — strict, moduleResolution, shared lib
├── apps/
│   └── mobile/                           <- everything that was at the repo root, minus new configs
│       ├── app/                          (unchanged)
│       ├── src/                          (components/, hooks/, services/, store/, mock/, constants.ts)
│       │                                  NO types/, NO design/
│       ├── App.tsx, index.ts
│       ├── app.json, eas.json, babel.config.js
│       ├── metro.config.js               UPDATED — watchFolders + nodeModulesPaths + symlinks
│       ├── tsconfig.json                 UPDATED — extends ../../tsconfig.base.json, keeps "@/*"
│       ├── package.json                  RENAMED: "@m2/mobile", adds workspace deps
│       └── README.md                     NEW (thin)
├── packages/
│   ├── types/                            NEW — @m2/types
│   │   ├── src/{user,channel,message,conversation,api,websocket,index}.ts
│   │   ├── package.json                  name: "@m2/types", main: "src/index.ts", no build
│   │   └── tsconfig.json                 extends ../../tsconfig.base.json
│   └── design/                           NEW — @m2/design
│       ├── src/{colors,typography,spacing,index}.ts
│       ├── package.json                  name: "@m2/design", main: "src/index.ts", no build
│       └── tsconfig.json                 extends ../../tsconfig.base.json
├── README.md                             REWRITTEN for monorepo
├── CLAUDE.md                             UPDATED for monorepo conventions
├── BEST_PRACTICES.md                     UPDATED
├── PHASES.md                             unchanged location
└── openspec/                             (unchanged)
```

**Movement summary.** `app/`, `App.tsx`, `index.ts`, `app.json`, `eas.json`, `babel.config.js`, `metro.config.js`, `src/` (minus `types/` and `design/`), `tsconfig.json`, `package.json` → `apps/mobile/`. `src/types/*` → `packages/types/src/`. `src/design/*` → `packages/design/src/`. Everything else (docs, `.npmrc`-class root configs, `openspec/`, `.git/`) stays at root.

---

## 2. Architecture Decision Records

Numbered ADRs. Each one has Context, Decision, Consequences (+/-), and Alternatives considered.

### ADR-01: pnpm (vs npm workspaces / yarn)

| Field | Value |
|---|---|
| **Context** | Single-package `package-lock.json` today. Monorepo needs a workspace-aware PM that handles the Metro + Gradle resolver quirks. |
| **Decision** | Use **pnpm 9.x** with `pnpm-workspace.yaml`. |
| **Consequences (+)** | Fastest cold install; content-addressed global store; strict isolation (dev deps cannot leak); `workspace:*` protocol; per-package hoisting tunable via `.npmrc`. |
| **Consequences (–)** | Symlinked `node_modules` requires Metro `unstable_enableSymlinks: true`; Gradle autolinking needs a hoisted Expo/RN ecosystem (see ADR-04); devs must install pnpm via Corepack (ADR-07). |
| **Alternatives** | **npm workspaces** — slower installs, no `workspace:` protocol; **Yarn Classic (1.x)** — unmaintained; **Yarn Berry + PnP** — incompatible with Metro; **Bun workspaces** — too new, Expo toolchain unvalidated. |

### ADR-02: Turborepo (vs Nx / bare scripts)

| Field | Value |
|---|---|
| **Context** | Need a task runner that fans out `typecheck`, `lint`, `build`, and `dev` across workspaces with caching. |
| **Decision** | Use **Turborepo** with a minimal `turbo.json` declaring `build`, `typecheck`, `lint`, and persistent `dev`. |
| **Consequences (+)** | Trivial config; local cache out of the box; remote cache free on Vercel when web apps land; incremental re-runs based on inputs hash. |
| **Consequences (–)** | Another dep to learn; adds a `.turbo/` directory to `.gitignore`; persistent `dev` task semantics need explicit `"cache": false`. |
| **Alternatives** | **Nx** — heavier than needed for 1 app + 2 TS packages; opinionated project-graph model; **bare `pnpm -r` scripts** — no caching, no parallelism throttling, breaks down past 2 workspaces. |

### ADR-03: `git mv` (file-by-file) (vs `git filter-repo`)

| Field | Value |
|---|---|
| **Context** | Whole mobile app moves into `apps/mobile/`. Blame and `--follow` history must survive; mirror `Ramsesdb/motomoto` must remain fast-forwardable. |
| **Decision** | Use **plain `git mv`** (bulk, but per-path) in a single rename commit. No history rewrite. |
| **Consequences (+)** | No SHA rewrite → both remotes stay fast-forward compatible; `git log --follow` and `git blame` keep working; reviewers see a clean "renames 100%" diff in GitHub. |
| **Consequences (–)** | The rename commit is visually large (~hundreds of paths); noise in `git log --stat` unless reviewers use `git log --summary` or `git diff -M`. Mitigated by a dedicated commit that contains ONLY renames. |
| **Alternatives** | **`git filter-repo --to-subdirectory-filter apps/mobile`** — rewrites every SHA on `main`, breaks mirror, forces every contributor to re-clone; **`git subtree add`** — produces confusing merge commits; **`cp -r` + new commit** — destroys blame entirely. |

### ADR-04: `.npmrc` strategy — targeted `public-hoist-pattern` with `node-linker=hoisted` as documented fallback

| Field | Value |
|---|---|
| **Context** | pnpm's default strict isolation breaks RN: Metro's resolver does not walk pnpm's symlinked layout, and Gradle autolinking looks for native modules in a flat `node_modules/`. Two knobs fix it: (A) full `node-linker=hoisted` (npm-like flat tree), or (B) targeted `public-hoist-pattern` that only lifts the RN/Expo ecosystem. |
| **Decision** | Ship **(B) targeted `public-hoist-pattern`** as the primary strategy. Keep **(A) `node-linker=hoisted`** documented in `README.md` as the fallback if R1 (dev client fails post-migration) triggers. |
| **Consequences (+)** | Preserves pnpm's isolation guarantees for everything outside RN/Expo (will matter when `apps/landing` + `apps/admin` land); avoids accidental import of undeclared deps from web code. |
| **Consequences (–)** | Slightly more fragile: if a new Expo plugin expects a deeply nested native module to be hoisted, we may have to extend the pattern list. Mitigated by erring on the side of broad patterns (`*react*`, `*expo*`, `metro*`). |
| **Alternatives** | **`shamefully-hoist=true`** — legacy knob, deprecated in pnpm 8+; **default strict** — known-broken with Expo dev client; **full `node-linker=hoisted` from day one** — works, but gives up pnpm's isolation benefit for future web apps. |

### ADR-05: No build step for `@m2/types` / `@m2/design` (ship TS source)

| Field | Value |
|---|---|
| **Context** | Both packages are pure TypeScript with no runtime transformation needed. Metro compiles TS natively; `tsc --noEmit` reads source. |
| **Decision** | Ship **raw `.ts` source** with `"main": "src/index.ts"`. No `prepare`, `build`, or `prepublishOnly` script. No `dist/`. |
| **Consequences (+)** | Zero build latency during dev; no `dist/` drift; no watcher; Turborepo can cache `typecheck` directly; packages work with Metro's `watchFolders` without an intermediate emit step. |
| **Consequences (–)** | If a non-TS consumer (e.g., a Node script) ever imports these packages, it will need a TS loader. Not a concern today — only `@m2/mobile` consumes them, and Metro handles TS. Documented in `@m2/types/README` as a future consideration. |
| **Alternatives** | **tsup** — generates ESM+CJS+dts, but overkill for workspace-private packages; **tsc with emit to `dist/`** — adds a build step + watcher; **Rollup/esbuild** — even heavier. |

### ADR-06: `workspace:*` protocol for internal deps

| Field | Value |
|---|---|
| **Context** | `apps/mobile/package.json` must depend on `@m2/types` and `@m2/design`. pnpm offers three spec forms: `workspace:*`, `workspace:^`, and plain `file:../../packages/types`. |
| **Decision** | Use **`"@m2/types": "workspace:*"`** (and same for `@m2/design`). |
| **Consequences (+)** | pnpm validates that the workspace package exists and resolves to it; `pnpm install` fails loudly if a misspelled package name escapes review; zero accidental registry fetches. |
| **Consequences (–)** | `workspace:*` would be rewritten to a real version on publish — moot because these packages are `private: true` and never published. |
| **Alternatives** | **`file:`** protocol — does not participate in pnpm's dep graph, breaks `pnpm -r` ordering; **explicit semver** — meaningless for private workspace packages; **no version + `workspaces` field in `package.json`** — npm-workspaces-idiom, we're on pnpm. |

### ADR-07: Corepack + pinned pnpm 9.x

| Field | Value |
|---|---|
| **Context** | Dev machines need deterministic pnpm: a stray pnpm 7 or 10 will produce a different lockfile shape and may change hoisting semantics. |
| **Decision** | Pin in root `package.json`: `"packageManager": "pnpm@9.15.0"` (or the latest 9.x at the time of scaffolding). Devs use **Corepack** (`corepack enable`) so Node auto-fetches the pinned pnpm. |
| **Consequences (+)** | Lockfile reproducibility; no "works on my machine" due to pnpm version drift; Corepack ships with Node 20+ so no extra install. |
| **Consequences (–)** | Corepack must be explicitly enabled once per machine; some orgs disable it; documented in root `README.md` as the first post-clone step. |
| **Alternatives** | **Volta** — fine, but project already uses `.nvmrc`; **`npm i -g pnpm`** — no reproducibility; **unpinned `packageManager`** — lockfile drift. |

### ADR-08: Feature branch + PR (vs direct commit to main)

| Field | Value |
|---|---|
| **Context** | Migration touches hundreds of files via rename; a bad commit on `main` is expensive to revert across two remotes. |
| **Decision** | Work on **`feat/monorepo-migration`**, push to both remotes, open a PR targeting `raoole20/m2-front:main`. |
| **Consequences (+)** | Reviewable; atomic merge; revertable via `git revert <merge-sha>`; avoids a broken `main` on either mirror. |
| **Consequences (–)** | PR diff is large; mitigated by splitting into 6–8 atomic commits (see §5). |
| **Alternatives** | **Direct push to `main`** — blast radius unacceptable; **stacked PRs** — over-engineered for one-shot migration; **rebase-merge every sub-step individually to main** — loses atomicity. |

### ADR-09: Preserve `@/` alias inside mobile (still maps to `apps/mobile/src/`)

| Field | Value |
|---|---|
| **Context** | `@/` is used throughout `app/` and `src/components/**` for in-app imports. Rewriting all of them to relative paths would bloat the diff. |
| **Decision** | Keep `"@/*": ["./src/*"]` in `apps/mobile/tsconfig.json`. Only `@/types/*` and `@/design/*` are rewritten (they now live outside `apps/mobile/`). |
| **Consequences (+)** | Minimal in-mobile import churn; reviewers see only the rewrites that matter (types + design); behavior identical. |
| **Consequences (–)** | `@/` now has a narrower meaning (mobile-only) — documented in `CLAUDE.md` and `apps/mobile/README.md`. |
| **Alternatives** | **Rewrite all `@/` to relative paths** — massive diff, no benefit; **reuse `@/` at workspace root** — collides conceptually with `@m2/*`. |

### ADR-10: Dual remote push — `origin` → both `Ramsesdb/motomoto` and `raoole20/m2-front`

| Field | Value |
|---|---|
| **Context** | The repo lives on two GitHub remotes. `raoole20/m2-front` becomes the authoritative target for PRs; `Ramsesdb/motomoto` must keep receiving pushes as a mirror. |
| **Decision** | Configure `origin` with **two push URLs** via `git remote set-url --add --push origin <url>`. Register `m2front` as a named remote for manual fallback. Single `git push origin <branch>` fans out to both. |
| **Consequences (+)** | One command; no stale mirror; matches the spec requirement REQ-L-001/002. |
| **Consequences (–)** | If credentials differ per remote, one side can fail silently — verified by a post-push `git remote -v` and a quick check of both GitHub UIs. |
| **Alternatives** | **Manual push to each remote** — forgettable; **GitHub Action to mirror** — extra infra for two remotes; **single remote + cron-driven sync** — adds lag. |

---

## 3. Detailed Config Files (full content)

Every block below is the exact content to commit. No placeholders except `{{latest_pnpm_9}}` and `{{latest_turbo_2}}` which you resolve by running `pnpm add -wD turbo@latest` during scaffolding (the tool will record the version).

### 3.1 Root `package.json`

```json
{
  "name": "m2-front",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "typecheck": "turbo run typecheck",
    "lint": "turbo run lint",
    "clean": "turbo run clean && rimraf node_modules .turbo",
    "mobile": "pnpm --filter @m2/mobile",
    "mobile:start": "pnpm --filter @m2/mobile start"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "~5.9.2",
    "rimraf": "^5.0.10"
  },
  "engines": {
    "node": ">=20.19.4",
    "pnpm": ">=9.0.0"
  }
}
```

Notes:
- No `"workspaces"` field — pnpm reads `pnpm-workspace.yaml` (REQ-A-002).
- `"private": true` so a stray `pnpm publish` at root is a no-op.
- `engines` is advisory; Corepack enforces the pnpm version.
- `rimraf` is optional but makes `clean` portable to Windows devs.

### 3.2 `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Two globs, in this order, as REQ-A-001 requires. No negations.

### 3.3 `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    "tsconfig.base.json",
    ".npmrc"
  ],
  "globalEnv": [
    "NODE_ENV",
    "EXPO_PUBLIC_*"
  ],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": [
        "src/**",
        "package.json",
        "tsconfig.json"
      ],
      "outputs": ["dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"],
      "inputs": [
        "src/**",
        "app/**",
        "package.json",
        "tsconfig.json",
        "tsconfig.base.json"
      ],
      "outputs": []
    },
    "lint": {
      "inputs": [
        "src/**",
        "app/**",
        ".eslintrc*",
        "package.json"
      ],
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

Notes:
- Turborepo v2 uses `"tasks"` (v1 used `"pipeline"`). Pin v2.
- `typecheck` has empty `outputs` — we `--noEmit`, so Turbo caches on input hash only.
- `dev` is `persistent: true` (REQ-A-003). `cache: false` is required for persistent tasks.
- `globalDependencies` invalidate everything when `tsconfig.base.json` or `.npmrc` change.

### 3.4 Root `tsconfig.base.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "jsx": "react-native",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

Notes:
- `moduleResolution: "Bundler"` matches Metro and Vite/Turbopack semantics — needed for later web apps.
- `jsx: "react-native"` lives here because RN is today's only consumer; web apps will override with `"react-jsx"` in their own `tsconfig.json`.
- `noUncheckedIndexedAccess` + `noImplicitOverride` tighten strictness beyond `expo/tsconfig.base`. If this produces new errors in mobile, back them out and file a follow-up — do not lower strictness to hide bugs.

### 3.5 Root `.npmrc` (ADR-04 decision — targeted hoist)

```ini
# Targeted hoisting for React Native / Expo ecosystem (ADR-04 option B).
# Metro's resolver and Gradle autolinking require these to sit in a flat tree.
# If Expo dev client still fails after migration, fall back to `node-linker=hoisted`
# (commented below) and document the switch in README.md.

public-hoist-pattern[]=*react*
public-hoist-pattern[]=*expo*
public-hoist-pattern[]=metro*
public-hoist-pattern[]=@react-native*
public-hoist-pattern[]=@expo*
public-hoist-pattern[]=react-native-*

# Prefer workspace packages over the registry.
prefer-workspace-packages=true
link-workspace-packages=true

# Strict peer deps OFF — Expo's ecosystem still drifts on peer ranges.
strict-peer-dependencies=false
auto-install-peers=true

# Do NOT set node-linker unless falling back from option B.
# node-linker=hoisted
```

### 3.6 `packages/types/package.json`

```json
{
  "name": "@m2/types",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "sideEffects": false,
  "files": ["src"],
  "scripts": {
    "typecheck": "tsc --noEmit",
    "clean": "rimraf .turbo"
  },
  "devDependencies": {
    "typescript": "~5.9.2"
  }
}
```

Notes:
- `"main"` and `"types"` both point at `src/index.ts` — Metro resolves TS, `tsc` reads source (ADR-05).
- `"sideEffects": false` lets any future Webpack/Rollup bundler tree-shake symbols on web.
- No `"build"` script (REQ-D-001).
- No runtime deps — this is a pure-types package.

### 3.7 `packages/types/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "noEmit": true
  },
  "include": ["src/**/*.ts"]
}
```

Notes:
- `outDir` is declared for when/if we add a build later; currently `noEmit: true` suppresses the output.
- No `jsx` override — types are pure TS, no JSX.

### 3.8 `packages/design/package.json`

```json
{
  "name": "@m2/design",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "sideEffects": false,
  "files": ["src"],
  "scripts": {
    "typecheck": "tsc --noEmit",
    "clean": "rimraf .turbo"
  },
  "devDependencies": {
    "typescript": "~5.9.2"
  }
}
```

### 3.9 `packages/design/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "noEmit": true
  },
  "include": ["src/**/*.ts"]
}
```

### 3.10 `apps/mobile/package.json` (AFTER)

```json
{
  "name": "@m2/mobile",
  "version": "1.0.0",
  "private": true,
  "main": "index.ts",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "typecheck": "tsc --noEmit",
    "clean": "rimraf .turbo .expo"
  },
  "dependencies": {
    "@expo-google-fonts/inter": "^0.4.2",
    "@expo-google-fonts/manrope": "^0.4.2",
    "@expo/vector-icons": "^15.0.2",
    "@m2/design": "workspace:*",
    "@m2/types": "workspace:*",
    "@react-native-google-signin/google-signin": "^16.1.2",
    "axios": "^1.13.6",
    "babel-plugin-module-resolver": "^5.0.3",
    "expo": "~55.0.7",
    "expo-auth-session": "~55.0.8",
    "expo-blur": "~55.0.10",
    "expo-build-properties": "~55.0.10",
    "expo-constants": "~55.0.8",
    "expo-dev-client": "~55.0.17",
    "expo-font": "~55.0.4",
    "expo-haptics": "~55.0.9",
    "expo-image": "~55.0.6",
    "expo-linear-gradient": "~55.0.9",
    "expo-linking": "~55.0.7",
    "expo-router": "~55.0.6",
    "expo-secure-store": "~55.0.9",
    "expo-status-bar": "~55.0.4",
    "immer": "^11.1.4",
    "react": "19.2.0",
    "react-dom": "^19.2.0",
    "react-native": "0.83.2",
    "react-native-gesture-handler": "~2.30.0",
    "react-native-reanimated": "4.2.1",
    "react-native-safe-area-context": "~5.6.2",
    "react-native-screens": "~4.23.0",
    "react-native-worklets": "0.7.2",
    "zustand": "^5.0.12"
  },
  "devDependencies": {
    "@types/react": "~19.2.2",
    "babel-preset-expo": "^55.0.11",
    "typescript": "~5.9.2"
  }
}
```

Deltas vs pre-migration (REQ-C-003):
- `name`: `motomoto` → `@m2/mobile`.
- `dependencies`: `+@m2/types`, `+@m2/design` (both `workspace:*`). Nothing else added, nothing removed.
- `scripts`: `+typecheck`, `+clean`. Existing scripts unchanged.

### 3.11 `apps/mobile/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-native",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["expo"]
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ],
  "exclude": ["node_modules", ".expo", "dist"]
}
```

Notes:
- Extends the root base (REQ-C-004).
- Keeps `"@/*": ["./src/*"]` — in-mobile imports unchanged (ADR-09).
- No `@m2/types` or `@m2/design` path entry — resolved via `node_modules` symlinks.
- `types: ["expo"]` narrows ambient types.

### 3.12 `apps/mobile/metro.config.js`

```js
// Expo SDK 55 + pnpm workspace Metro config.
// Derived from @expo/metro-config's getDefaultConfig().
// Critical knobs:
//   - watchFolders: so Metro rebuilds when @m2/types or @m2/design source edits
//   - resolver.nodeModulesPaths: so Metro finds hoisted deps in the root node_modules
//   - resolver.unstable_enableSymlinks: required for pnpm's symlinked layout
//   - resolver.disableHierarchicalLookup: false (default) — we still want walking

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;                        // apps/mobile
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the two shared packages so edits trigger a hot reload (REQ-G-001).
config.watchFolders = [
  path.resolve(workspaceRoot, 'packages/types'),
  path.resolve(workspaceRoot, 'packages/design'),
];

// 2. Tell Metro to search both the app's node_modules AND the workspace root's (REQ-G-002).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. pnpm ships symlinked deps — Metro needs this flag to follow them.
config.resolver.unstable_enableSymlinks = true;

// 4. Keep hierarchical lookup enabled — Metro still walks up for normal deps.
config.resolver.disableHierarchicalLookup = false;

// 5. Ensure .ts / .tsx extensions are respected for workspace packages that ship source.
config.resolver.sourceExts = Array.from(
  new Set([...(config.resolver.sourceExts ?? []), 'ts', 'tsx', 'cjs', 'mjs'])
);

module.exports = config;
```

Notes:
- This is the file Metro loads when `expo start` runs. All four resolver knobs are required by the Expo monorepo guide + REQ-G-001/002/003.
- Does NOT set `resolver.disableHierarchicalLookup: true` — some docs recommend that for strict pnpm, but Expo SDK 55's resolver expects to walk.

---

## 4. Migration Mechanics (ordered shell plan)

All commands below assume you are in the repo root with `main` checked out and clean. Use Git Bash or WSL on Windows. Read the entire plan before running anything.

### 4.1 Prep

```bash
# 4.1.1 Confirm clean tree and authoritative main
git status                                        # must show "working tree clean"
git pull --ff-only origin main                    # ensure local main is current
git log --oneline -5                              # sanity check

# 4.1.2 Enable Corepack and verify pnpm resolves
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm --version                                    # must print 9.15.0

# 4.1.3 Baseline capture (for REQ-NFR-001/002/003)
#  (a) npm typecheck baseline — currently expected to be 0 errors
npx tsc --noEmit | tee /tmp/tsc-baseline.log
#  (b) dev-client cold boot: time from `npm start` to first bundle served.
#      Measure on-device against Android dev client; record the wall-clock.
#  (c) npm install cold time on a fresh clone — optional, record for NFR-003 comparison.
```

### 4.2 Feature branch

```bash
# 4.2.1 Create branch and push skeleton to both remotes so CI / reviewers can see it
git switch -c feat/monorepo-migration
```

### 4.3 Scaffold root configs (explicit order)

Order matters: `.npmrc` first so that any inadvertent `pnpm install` run during editing uses the correct hoisting.

```bash
# 4.3.1 .npmrc  (content: §3.5)
$EDITOR .npmrc

# 4.3.2 Root package.json  (content: §3.1)
#   Replace the existing root package.json with the monorepo-runner version.
#   At this point the repo has TWO package.json files at the root briefly: the old
#   mobile one and the new runner. We rename the old one in step 4.4.
$EDITOR package.json

# 4.3.3 pnpm-workspace.yaml  (content: §3.2)
$EDITOR pnpm-workspace.yaml

# 4.3.4 tsconfig.base.json  (content: §3.4)
$EDITOR tsconfig.base.json

# 4.3.5 turbo.json  (content: §3.3)
$EDITOR turbo.json
```

NOTE: we do not yet run `pnpm install` — there's no workspace yet. Continue to 4.4.

### 4.4 Create `apps/mobile/` and bulk-relocate

```bash
# 4.4.1 Make target directories
mkdir -p apps/mobile packages/types/src packages/design/src

# 4.4.2 Move everything mobile-shaped into apps/mobile/
#   Things that DO NOT move (stay at root):
#     .git/  .gitignore  .nvmrc  .mcp.json
#     .npmrc  pnpm-workspace.yaml  turbo.json  tsconfig.base.json
#     the NEW root package.json
#     README.md  CLAUDE.md  BEST_PRACTICES.md  PHASES.md
#     openspec/  .agent/  .claude/  .github/  .vscode/
#   Everything ELSE that is tracked at root moves.

# The old root package.json must first be renamed to avoid clashing with 4.3.2.
# Strategy: the new root package.json from 4.3.2 already overwrote the file, so the
# old one is gone on disk. We restore it from git, then move it:
git show main:package.json > apps/mobile/package.json
git add apps/mobile/package.json

# Now move the rest:
git mv App.tsx           apps/mobile/App.tsx
git mv index.ts          apps/mobile/index.ts
git mv app.json          apps/mobile/app.json
git mv eas.json          apps/mobile/eas.json
git mv babel.config.js   apps/mobile/babel.config.js
# metro.config.js does not exist pre-migration — we CREATE it in step 4.7 below.
git mv tsconfig.json     apps/mobile/tsconfig.json
git mv app/              apps/mobile/app/
git mv src/              apps/mobile/src/
# assets/, .expo/ (if tracked), and anything else app-shaped:
[ -d assets ]   && git mv assets apps/mobile/assets
[ -f package-lock.json ] && echo "defer deletion until §4.9"

# 4.4.3 Commit the pure rename (one commit, only renames + the root scaffold)
git add .npmrc package.json pnpm-workspace.yaml turbo.json tsconfig.base.json
git add apps/mobile/package.json
git commit -m "chore(repo): scaffold pnpm+turbo monorepo and relocate mobile to apps/mobile"
```

Reviewer note: this is commit #1 in §5. It should show up in GitHub as a massive rename with no content changes (outside the new root configs).

### 4.5 Extract `@m2/types`

```bash
# 4.5.1 Move all type source files
git mv apps/mobile/src/types/user.ts         packages/types/src/user.ts
git mv apps/mobile/src/types/channel.ts      packages/types/src/channel.ts
git mv apps/mobile/src/types/message.ts      packages/types/src/message.ts
git mv apps/mobile/src/types/conversation.ts packages/types/src/conversation.ts
git mv apps/mobile/src/types/api.ts          packages/types/src/api.ts
git mv apps/mobile/src/types/websocket.ts    packages/types/src/websocket.ts
git mv apps/mobile/src/types/index.ts        packages/types/src/index.ts

# 4.5.2 The now-empty src/types/ directory:
#   git mv auto-removes empty dirs. Verify:
[ ! -d apps/mobile/src/types ] || rmdir apps/mobile/src/types

# 4.5.3 Author package.json + tsconfig.json
$EDITOR packages/types/package.json          # content: §3.6
$EDITOR packages/types/tsconfig.json         # content: §3.7

git add packages/types/package.json packages/types/tsconfig.json
git commit -m "feat(types): extract src/types to @m2/types workspace package"
```

### 4.6 Extract `@m2/design`

```bash
# 4.6.1 Move design source
git mv apps/mobile/src/design/colors.ts     packages/design/src/colors.ts
git mv apps/mobile/src/design/typography.ts packages/design/src/typography.ts
git mv apps/mobile/src/design/spacing.ts    packages/design/src/spacing.ts
git mv apps/mobile/src/design/index.ts      packages/design/src/index.ts
[ ! -d apps/mobile/src/design ] || rmdir apps/mobile/src/design

# 4.6.2 Author package.json + tsconfig.json
$EDITOR packages/design/package.json         # content: §3.8
$EDITOR packages/design/tsconfig.json        # content: §3.9

git add packages/design/package.json packages/design/tsconfig.json
git commit -m "feat(design): extract src/design to @m2/design workspace package"
```

### 4.7 Update mobile imports (codemod)

See §6 for exact find/replace rules.

```bash
# 4.7.1 Scope: apps/mobile/ excluding node_modules
cd apps/mobile

# 4.7.2 Rewrite types imports. GNU sed (Git Bash on Windows has GNU sed).
#   Collapse subpath imports: '@/types/foo' → '@m2/types' (index re-exports all).
grep -rl --include='*.ts' --include='*.tsx' --exclude-dir=node_modules \
  "from ['\"]@/types" . \
  | xargs sed -i -E "s|from ['\"]@/types(/[^'\"]+)?['\"]|from '@m2/types'|g"

# 4.7.3 Same for design.
grep -rl --include='*.ts' --include='*.tsx' --exclude-dir=node_modules \
  "from ['\"]@/design" . \
  | xargs sed -i -E "s|from ['\"]@/design(/[^'\"]+)?['\"]|from '@m2/design'|g"

# 4.7.4 Verify REQ-F-001 (zero matches)
grep -rn --include='*.ts' --include='*.tsx' --exclude-dir=node_modules "from ['\"]@/types" . | wc -l   # expect 0
grep -rn --include='*.ts' --include='*.tsx' --exclude-dir=node_modules "from ['\"]@/design" . | wc -l  # expect 0

# 4.7.5 Verify REQ-F-002 (≥1 match each)
grep -rn --include='*.ts' --include='*.tsx' --exclude-dir=node_modules "from ['\"]@m2/types['\"]" . | wc -l   # expect ≥1
grep -rn --include='*.ts' --include='*.tsx' --exclude-dir=node_modules "from ['\"]@m2/design['\"]" . | wc -l  # expect ≥1

cd ../..
git add -u apps/mobile/
git commit -m "refactor(mobile): rewrite @/types and @/design imports to @m2/* packages"
```

### 4.8 Update mobile `tsconfig.json`, `metro.config.js`, and `package.json`

```bash
# 4.8.1 tsconfig.json — replace contents with §3.11
$EDITOR apps/mobile/tsconfig.json

# 4.8.2 metro.config.js — this file did NOT exist pre-migration. CREATE with §3.12.
$EDITOR apps/mobile/metro.config.js

# 4.8.3 package.json — replace name + add workspace deps (§3.10)
$EDITOR apps/mobile/package.json

git add apps/mobile/tsconfig.json apps/mobile/metro.config.js apps/mobile/package.json
git commit -m "feat(mobile): wire tsconfig base, metro workspace config, @m2/* workspace deps"
```

### 4.9 Atomic package-manager swap

```bash
# 4.9.1 Delete npm's lockfile
git rm package-lock.json

# 4.9.2 Run pnpm install — this generates pnpm-lock.yaml and hydrates node_modules
pnpm install

# 4.9.3 Sanity checks
pnpm why react                             # expect ONE react version
ls pnpm-lock.yaml                          # must exist at root only
find . -name "package-lock.json" -not -path "*/node_modules/*"   # must be empty

git add pnpm-lock.yaml
git commit -m "chore(repo): swap npm for pnpm; delete package-lock.json, commit pnpm-lock.yaml"
```

### 4.10 Verification gates

```bash
# 4.10.1 Typecheck green across workspace (REQ-J-001)
pnpm -w typecheck                          # exits 0

# 4.10.2 Packages typecheck in isolation (REQ-J-002)
( cd packages/types  && npx tsc --noEmit )
( cd packages/design && npx tsc --noEmit )

# 4.10.3 Metro boots (REQ-I-001)
pnpm --filter @m2/mobile start             # Android dev client: verify on-device

# 4.10.4 Hot reload on shared package (REQ-I-002)
#   Edit packages/design/src/colors.ts, flip a token value, save.
#   Confirm the running Android app reloads.

# 4.10.5 EAS build dry-run
( cd apps/mobile && eas build --platform android --dry-run )

# 4.10.6 History preserved (REQ-K-001)
git log --follow -- apps/mobile/src/components/ui/GlassCard.tsx | head
git log --follow -- packages/types/src/user.ts | head
```

### 4.11 Docs pass

```bash
# Rewrite for monorepo reality (REQ-O-001/002/003/004)
$EDITOR README.md
$EDITOR CLAUDE.md
$EDITOR BEST_PRACTICES.md
$EDITOR apps/mobile/README.md              # new, ≤40 lines
git add README.md CLAUDE.md BEST_PRACTICES.md apps/mobile/README.md
git commit -m "docs: rewrite root docs for monorepo + add apps/mobile/README"
```

### 4.12 Dual remote + push + PR

```bash
# 4.12.1 Configure origin's two push URLs (REQ-L-001)
git remote set-url --push origin https://github.com/Ramsesdb/motomoto.git
git remote set-url --add --push origin https://github.com/raoole20/m2-front.git

# 4.12.2 Register m2front fallback remote
git remote add m2front https://github.com/raoole20/m2-front.git 2>/dev/null || true

# 4.12.3 Verify
git remote -v                              # expect origin with TWO push URLs + m2front

# 4.12.4 Push
git push -u origin feat/monorepo-migration

# 4.12.5 Open PR via gh CLI
gh pr create --repo raoole20/m2-front \
  --base main \
  --head feat/monorepo-migration \
  --title "chore(repo): migrate to pnpm + Turborepo monorepo (mobile → apps/mobile)" \
  --body-file .github/PR_TEMPLATE_MIGRATION.md    # or inline; see spec REQ-L-003
```

---

## 5. Commit Plan

Seven atomic commits. Each commit listed with its title, the files it touches, and the spec REQs it satisfies. Commits are authored by `Ramsesdb <rdbriceno5@urbe.edu.ve>`, no `Co-Authored-By:` trailer (REQ-N-001, REQ-N-002).

| # | Commit title | Scope / Files | REQs |
|---|---|---|---|
| 1 | `chore(repo): scaffold pnpm+turbo monorepo and relocate mobile to apps/mobile` | `.npmrc`, `package.json` (root), `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, bulk `git mv` of `App.tsx`, `index.ts`, `app.json`, `eas.json`, `babel.config.js`, `tsconfig.json`, `app/`, `src/`, `assets/` into `apps/mobile/` + old root `package.json` into `apps/mobile/package.json` | A-001, A-002, A-003, B-001, B-002, C-001, H-001, H-002 |
| 2 | `feat(types): extract src/types to @m2/types workspace package` | `git mv apps/mobile/src/types/*.ts → packages/types/src/`, create `packages/types/package.json` + `tsconfig.json` | C-002, D-001, D-002, D-003, D-004 |
| 3 | `feat(design): extract src/design to @m2/design workspace package` | `git mv apps/mobile/src/design/*.ts → packages/design/src/`, create `packages/design/package.json` + `tsconfig.json` | C-002, E-001, E-002, E-003, E-004 |
| 4 | `refactor(mobile): rewrite @/types and @/design imports to @m2/* packages` | Codemod across `apps/mobile/**/*.{ts,tsx}` | F-001, F-002, F-003 |
| 5 | `feat(mobile): wire tsconfig base, metro workspace config, @m2/* workspace deps` | `apps/mobile/tsconfig.json`, `apps/mobile/metro.config.js` (new), `apps/mobile/package.json` (rename + deps) | C-003, C-004, G-001, G-002, G-003 |
| 6 | `chore(repo): swap npm for pnpm; delete package-lock.json, commit pnpm-lock.yaml` | `git rm package-lock.json`, add `pnpm-lock.yaml` | M-001, M-002, M-003 |
| 7 | `docs: rewrite root docs for monorepo + add apps/mobile/README` | `README.md`, `CLAUDE.md`, `BEST_PRACTICES.md`, `apps/mobile/README.md` | O-001, O-002, O-003, O-004 |

Reviewer guide (for PR body): commits **#4**, **#5**, and **#7** are the ones with content changes. Commits **#1**, **#2**, **#3**, **#6** are renames + new config scaffolding only.

---

## 6. Codemod Specifics

### 6.1 Find / replace rules

Scope: `apps/mobile/**/*.ts`, `apps/mobile/**/*.tsx`. Exclude `apps/mobile/node_modules/`.

| # | Find (regex) | Replace | Notes |
|---|---|---|---|
| R1 | `from ['"]@/types['"]` | `from '@m2/types'` | Root import collapse (no subpath) |
| R2 | `from ['"]@/types/[^'"]+['"]` | `from '@m2/types'` | Subpath collapse: `'@/types/user'` → `'@m2/types'` |
| R3 | `from ['"]@/design['"]` | `from '@m2/design'` | Root |
| R4 | `from ['"]@/design/[^'"]+['"]` | `from '@m2/design'` | Subpath collapse: `'@/design/colors'` → `'@m2/design'` |

Combined sed (one pass per scope):

```bash
# Types
grep -rl --include='*.ts' --include='*.tsx' --exclude-dir=node_modules \
  "from ['\"]@/types" apps/mobile/ \
  | xargs sed -i -E "s|from ['\"]@/types(/[^'\"]+)?['\"]|from '@m2/types'|g"

# Design
grep -rl --include='*.ts' --include='*.tsx' --exclude-dir=node_modules \
  "from ['\"]@/design" apps/mobile/ \
  | xargs sed -i -E "s|from ['\"]@/design(/[^'\"]+)?['\"]|from '@m2/design'|g"
```

### 6.2 Collapse vs preserve

Both `@m2/types/src/index.ts` and `@m2/design/src/index.ts` re-export **everything** from their module peers (`user.ts`, `channel.ts`, …). So an import like `import { User } from '@m2/types/user'` is functionally equivalent to `import { User } from '@m2/types'`.

**Recommendation: collapse to the package root.**

| Strategy | Pros | Cons |
|---|---|---|
| **Collapse** (chosen) | Single import path across the codebase; no "did you mean `@m2/types/user` or `@m2/types`?" ambiguity; matches how web apps will consume (future-proof) | One large import list at the top of files that use many types |
| **Preserve subpaths** | Slightly finer-grained tree-shaking for web (moot on mobile — Metro doesn't tree-shake TS source the same way) | Needs `exports` map in package.json to declare subpaths; more complex package setup |

We pick **collapse** for operational simplicity and because the packages are single-consumer today.

### 6.3 Post-codemod verification

```bash
# Zero hits expected (REQ-F-001)
grep -rE --include='*.ts' --include='*.tsx' --exclude-dir=node_modules \
  "from ['\"]@/(types|design)" apps/mobile/ | wc -l   # 0

# ≥1 hit each expected (REQ-F-002)
grep -rE --include='*.ts' --include='*.tsx' --exclude-dir=node_modules \
  "from ['\"]@m2/types['\"]" apps/mobile/ | wc -l      # ≥1
grep -rE --include='*.ts' --include='*.tsx' --exclude-dir=node_modules \
  "from ['\"]@m2/design['\"]" apps/mobile/ | wc -l     # ≥1
```

### 6.4 Other-`@/` imports untouched

Because R1–R4 all match only `@/types` or `@/design`, imports of the form `@/components/*`, `@/hooks/*`, `@/services/*`, `@/store/*`, `@/mock/*`, `@/constants` are left intact (REQ-F-003). The mobile `tsconfig.json` still maps `"@/*": ["./src/*"]`.

---

## 7. Metro + pnpm Gotchas Handbook

Operational notes for when things go sideways.

### 7.1 Symlinks on pnpm

pnpm stores every package in a content-addressed `~/.pnpm-store` and puts **symlinks** under `node_modules/`. Metro's default resolver does not follow symlinks unless `resolver.unstable_enableSymlinks: true` is set. If you see `Unable to resolve module @m2/types`, check this flag first.

### 7.2 React version hoisting

Today, `@m2/mobile` is the only React consumer; a single React 19.2.0 lives in the pnpm-hoisted tree. `pnpm why react` must print one version:

```bash
pnpm why react | head -5
# Expect: react@19.2.0 as a single hoisted entry
```

When `apps/landing` and `apps/admin` (Next.js) join in the follow-on change, add to root `package.json`:

```jsonc
{
  "pnpm": {
    "overrides": {
      "react": "19.2.0",
      "react-dom": "19.2.0"
    }
  }
}
```

This pins a single React instance across all apps — without it, Next.js and Expo may resolve different React copies and React dev-mode checks will throw `Invalid hook call` errors. **Not required for this change.** Noted as a future item.

### 7.3 Metro config preset + extensions

Always build `metro.config.js` from `getDefaultConfig` — hand-rolling a Metro config for Expo SDK 55 is a bug magnet. Expo's preset wires up SVG transformers, asset extensions, and the Hermes-friendly Babel transformer. All our monorepo tweaks are **additive** to the defaults.

Extra source extensions to include when workspace packages ship TS source:

```js
config.resolver.sourceExts = Array.from(
  new Set([...(config.resolver.sourceExts ?? []), 'ts', 'tsx', 'cjs', 'mjs'])
);
```

This is already in §3.12.

### 7.4 Hermes bytecode cache invalidation

After moving files, the Hermes bytecode cache in `.expo/` and `android/app/build/` may point at stale paths. Clear caches on first run post-migration:

```bash
cd apps/mobile
rm -rf .expo node_modules/.cache
pnpm start --clear          # Metro flag: clears Metro cache
# If Android still shows stale bundles:
cd android && ./gradlew clean && cd ..
```

### 7.5 Windows long-paths

pnpm's content-addressed store is shallow, but nested monorepo paths plus Windows' 260-char limit can still bite. Documented in `README.md`:

```bash
git config --global core.longpaths true
# If pnpm still fails:
pnpm config set long-paths true       # pnpm ≥9.x
```

### 7.6 EAS cwd

If `eas build` fails with "No package.json found", add to `eas.json`:

```jsonc
{
  "build": {
    "production": { "cwd": "apps/mobile" },
    "preview":    { "cwd": "apps/mobile" },
    "development":{ "cwd": "apps/mobile" }
  }
}
```

Only apply if the dry-run fails. Keep the diff minimal.

---

## 8. Rollback Plan

The migration lives entirely on `feat/monorepo-migration`. Rollback is source-control only; no data, no backend, no user state.

### 8.1 Before PR is merged

```bash
# Local — abandon branch
git switch main
git branch -D feat/monorepo-migration

# Remote — delete branch on both remotes (dual-push works for delete too)
git push origin --delete feat/monorepo-migration
git push m2front --delete feat/monorepo-migration     # belt + suspenders

# Local tree — recover the pre-migration node_modules if needed
rm -rf node_modules pnpm-lock.yaml .turbo
git restore package-lock.json                         # main still has it
npm install
```

### 8.2 After PR is merged (and something breaks)

Two options, user decides:

**Option A — revert (preserves history).**

```bash
git switch main
git pull --ff-only
git revert -m 1 <merge-sha>            # -m 1 for merge commits
git push origin main
```

**Option B — hard reset (destructive, requires team coordination).**

```bash
# ONLY with explicit user approval
git switch main
git reset --hard <pre-merge-sha>
git push --force-with-lease origin main
# Repeat for the second push URL if `git remote -v` shows a fan-out misfire
```

### 8.3 `package-lock.json` recovery

Even after the PR merges, the pre-migration `package-lock.json` is recoverable from any commit prior to the "pnpm swap" commit:

```bash
git show <pre-migration-sha>:package-lock.json > package-lock.json
```

### 8.4 Mirror sync after rollback

If `git revert` lands on `main`, `git push origin main` fans out to both remotes automatically. After a force-push (Option B), verify both mirrors with `gh repo view Ramsesdb/motomoto` and `gh repo view raoole20/m2-front` and ensure `HEAD` matches on both.

---

## 9. Verification Matrix

Every REQ mapped to a concrete command. Copy-paste from this table as the PR's acceptance checklist.

| REQ | What to verify | Command | Expected |
|---|---|---|---|
| REQ-A-001 | workspace globs | `cat pnpm-workspace.yaml` | `packages:` lines with `apps/*` and `packages/*` |
| REQ-A-002 | pnpm pin + private | `jq -r '.packageManager, .private' package.json` | `pnpm@9...`, `true` |
| REQ-A-002 | scripts wired to turbo | `jq -r '.scripts' package.json` | `dev/build/typecheck/lint` all `turbo run ...` |
| REQ-A-003 | turbo tasks exist | `jq -r '.tasks \| keys[]' turbo.json` | includes `build typecheck lint dev` |
| REQ-A-003 | dev persistent | `jq -r '.tasks.dev' turbo.json` | `{"cache": false, "persistent": true}` |
| REQ-B-001 | root tree sane | `ls -A` | matches allowed entries table |
| REQ-B-002 | no stray app files | `ls App.tsx index.ts app.json 2>&1` | `No such file or directory` for each |
| REQ-B-002 | no package-lock | `test -f package-lock.json && echo FAIL || echo OK` | `OK` |
| REQ-C-001 | mobile files present | `test -d apps/mobile/app && test -f apps/mobile/App.tsx && echo OK` | `OK` |
| REQ-C-002 | no types/design under mobile | `test -d apps/mobile/src/types -o -d apps/mobile/src/design && echo FAIL \|\| echo OK` | `OK` |
| REQ-C-003 | mobile name = @m2/mobile | `jq -r .name apps/mobile/package.json` | `@m2/mobile` |
| REQ-C-003 | workspace deps present | `jq -r '.dependencies["@m2/types"], .dependencies["@m2/design"]' apps/mobile/package.json` | `workspace:*` twice |
| REQ-C-004 | tsconfig extends base | `jq -r .extends apps/mobile/tsconfig.json` | `../../tsconfig.base.json` |
| REQ-C-004 | @/ alias preserved | `jq -r '.compilerOptions.paths["@/*"][0]' apps/mobile/tsconfig.json` | `./src/*` |
| REQ-D-001 | types name | `jq -r .name packages/types/package.json` | `@m2/types` |
| REQ-D-001 | types main | `jq -r .main packages/types/package.json` | `src/index.ts` |
| REQ-D-001 | no build script | `jq -r '.scripts.build, .scripts.prepare' packages/types/package.json` | `null null` |
| REQ-D-002 | types source files | `ls packages/types/src/` | `user.ts channel.ts message.ts conversation.ts api.ts websocket.ts index.ts` |
| REQ-D-003 | types export surface | `diff <(node -e 'console.log(Object.keys(require("@m2/types")))') <pre-migration-list>` | identical |
| REQ-D-004 | no types dist | `test -d packages/types/dist && echo FAIL \|\| echo OK` | `OK` |
| REQ-E-001 | design name | `jq -r .name packages/design/package.json` | `@m2/design` |
| REQ-E-002 | design source files | `ls packages/design/src/` | `colors.ts typography.ts spacing.ts index.ts` |
| REQ-E-004 | no design dist | `test -d packages/design/dist && echo FAIL \|\| echo OK` | `OK` |
| REQ-F-001 | no @/types imports | `grep -rE "from ['\"]@/types" apps/mobile/ --include='*.ts' --include='*.tsx' \| wc -l` | `0` |
| REQ-F-001 | no @/design imports | `grep -rE "from ['\"]@/design" apps/mobile/ --include='*.ts' --include='*.tsx' \| wc -l` | `0` |
| REQ-F-002 | @m2/types used | `grep -rE "from ['\"]@m2/types['\"]" apps/mobile/ \| wc -l` | `≥1` |
| REQ-F-002 | @m2/design used | `grep -rE "from ['\"]@m2/design['\"]" apps/mobile/ \| wc -l` | `≥1` |
| REQ-F-003 | @/components untouched | `grep -rE "from ['\"]@/components" apps/mobile/ \| wc -l` | same as pre-migration baseline |
| REQ-G-001 | watchFolders ok | `grep -E "packages/(types\|design)" apps/mobile/metro.config.js` | both lines present |
| REQ-G-002 | nodeModulesPaths | `grep "nodeModulesPaths" apps/mobile/metro.config.js` | present; both paths resolved |
| REQ-G-003 | getDefaultConfig | `grep "getDefaultConfig" apps/mobile/metro.config.js` | present |
| REQ-H-001 | .npmrc has hoist | `grep -E "^(public-hoist-pattern\|node-linker)" .npmrc \| wc -l` | `≥3` (option B) or `1` (option A) |
| REQ-H-002 | no nested .npmrc | `find apps packages -name .npmrc` | empty |
| REQ-I-001 | dev client boots | manual: `pnpm --filter @m2/mobile start`, connect Android dev client, verify login → home | visual parity |
| REQ-I-002 | hot reload across packages | manual: edit `packages/design/src/colors.ts`, observe device | reload fires |
| REQ-J-001 | workspace typecheck | `pnpm -w typecheck` | exit 0, 0 errors |
| REQ-J-002 | per-package typecheck | `(cd packages/types && npx tsc --noEmit) && (cd packages/design && npx tsc --noEmit)` | both exit 0 |
| REQ-K-001 | history on moved files | `git log --follow -- apps/mobile/src/components/ui/GlassCard.tsx \| head -20` | commits predate migration |
| REQ-K-001 | history on extracted types | `git log --follow -- packages/types/src/user.ts \| head -20` | commits from `src/types/user.ts` era |
| REQ-K-002 | blame attribution | `git blame apps/mobile/src/components/ui/GlassCard.tsx \| awk '{print $2}' \| sort \| uniq -c` | migration SHA is a minority |
| REQ-L-001 | dual push URLs | `git remote -v \| grep '^origin.*(push)' \| wc -l` | `2` |
| REQ-L-001 | m2front fallback | `git remote \| grep -x m2front` | present |
| REQ-L-002 | fan-out push | `git push origin feat/monorepo-migration --dry-run` | shows both URLs |
| REQ-L-003 | PR opened | `gh pr list --repo raoole20/m2-front --head feat/monorepo-migration --json url` | returns a PR URL |
| REQ-M-001 | no package-lock | `find . -name package-lock.json -not -path "*/node_modules/*"` | empty |
| REQ-M-002 | pnpm-lock at root only | `find . -name pnpm-lock.yaml -not -path "*/node_modules/*"` | `./pnpm-lock.yaml` only |
| REQ-M-003 | no yarn/bun locks | `find . \( -name yarn.lock -o -name bun.lockb \) -not -path "*/node_modules/*"` | empty |
| REQ-N-001 | commit author | `git log feat/monorepo-migration ^main --pretty='%an <%ae>' \| sort -u` | single line `Ramsesdb <rdbriceno5@urbe.edu.ve>` |
| REQ-N-002 | no co-authored | `git log feat/monorepo-migration ^main --pretty=%b \| grep -c Co-Authored-By` | `0` |
| REQ-O-001 | README monorepo | `grep -E "apps/\|packages/\|@m2/" README.md \| head` | multiple hits |
| REQ-O-002 | mobile README thin | `wc -l apps/mobile/README.md` | `≤40` |
| REQ-O-003 | CLAUDE.md updated | `grep -E "pnpm\|@m2/" CLAUDE.md \| wc -l` | `≥3` |
| REQ-O-004 | root docs preserved | `ls BEST_PRACTICES.md PHASES.md` | both exist at root |
| REQ-NFR-001 | boot time budget | stopwatch: cold-boot vs baseline | `T_mig ≤ 1.20 × T_base` |
| REQ-NFR-002 | typecheck budget | `rm -rf .turbo **/*.tsbuildinfo && time pnpm -w typecheck` | `< 5s` |
| REQ-NFR-003 | cold install budget | `time pnpm install` on fresh clone | `< 90s` |

---

## 10. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Expo dev client fails to boot after migration (Metro resolver, Gradle autolinking) | Medium | High | `.npmrc` option B (targeted hoist) ships first; option A (`node-linker=hoisted`) documented as fallback. Test on-device **inside the branch** before opening PR. If it fails, flip `.npmrc` to option A, re-run `pnpm install`, retest. Do NOT open PR until dev client boots. |
| R2 | `pnpm install` fails on Windows due to nested `node_modules` path length | Low | Medium | Run `git config --global core.longpaths true` and `pnpm config set long-paths true` before install. Documented in `README.md` (REQ-O-001). If still fails, the pnpm store location can be moved to a shorter path: `pnpm config set store-dir C:/pnpm-store`. |
| R3 | EAS build config assumes repo-root cwd | Medium | High | Run `eas build --platform android --dry-run` from `apps/mobile/` **inside the branch**. If it fails with "No package.json", apply `"cwd": "apps/mobile"` to each profile in `eas.json` (minimal patch). Commit as part of commit #5 or a separate patch commit. |
| R4 | Codemod misses files (e.g., lazy imports, dynamic `require`) | Low | Medium | `grep -rE "from ['\"]@/(types\|design)" apps/mobile/` returns 0 (REQ-F-001). `pnpm -w typecheck` catches any import that now fails to resolve. Manual spot-check `LoginScreen`, `HomeScreen`, `ChatInput`, AI screens. |
| R5 | pnpm fan-out push silently fails on one remote | Low | Medium | After first push, `gh repo view Ramsesdb/motomoto --json pushedAt` and same for `raoole20/m2-front` — both `pushedAt` must advance. Record in PR checklist. |
| R6 | React duplicated when web apps later land | Low (now) | Medium | Add `pnpm.overrides.react` / `react-dom` at root — deferred to follow-on change (`m2-web-monorepo-setup`). Noted in §7.2. |
| R7 | Turbo v2 caches stale outputs across machines | Low | Low | Local cache only (no remote cache yet); `pnpm run clean` wipes. Verified in §4.10. |
| R8 | pnpm 9.x lockfile incompatible if a dev accidentally uses pnpm 8 | Low | Medium | `packageManager` pin (ADR-07) + Corepack enforce the version. `engines.pnpm: ">=9.0.0"` as belt. Document in `README.md`. |
| R9 | Import rewrite collapses a subpath someone wanted to keep for tree-shaking | Low | Low | Packages are private and mobile-only today — tree-shaking via subpaths is moot (Metro doesn't tree-shake TS source the same way). Revisit in the web-apps follow-on. |
| R10 | Hermes bytecode cache returns stale bundle post-migration | Medium | Low | First post-migration launch uses `pnpm start --clear`; Android `./gradlew clean` if needed. Documented in §7.4. |
| R11 | Uncommitted work destroyed during bulk `git mv` | Low | High | §4.1.1 enforces clean tree before branching. Hard stop. |

---

## 11. Open Design Questions

Items flagged here before `sdd-tasks` runs. None of these should BLOCK `sdd-tasks` — all have a default choice encoded above — but flag them for the user to confirm.

- [ ] **Turbo remote cache**: defer to the follow-on web-apps change, or wire Vercel token now? Default: defer.
- [ ] **`eas.json` cwd patch**: apply proactively vs only-if-dry-run-fails? Default: only-if-fails (minimal-diff bias).
- [ ] **`pnpm.overrides.react`**: add now (noop for mobile) or defer to web-apps change? Default: defer (no value today).
- [ ] **`.npmrc` option A vs B**: we ship **B** by default. Confirm willingness to flip to A if R1 triggers.
- [ ] **Commit squash**: GitHub PR merge — rebase-merge (keeps 7 commits) or squash (single commit on main)? Default: rebase-merge (preserves the reviewable history + the `git log --follow` story).
- [ ] **Strictness delta**: the new `tsconfig.base.json` adds `noUncheckedIndexedAccess` and `noImplicitOverride` which `expo/tsconfig.base` did not set. If this produces new mobile TS errors, either (a) back these out or (b) fix the errors in a follow-up. Default: keep strict, file a follow-up if errors appear.
- [ ] **`packages/types/README.md` and `packages/design/README.md`**: not required by spec. Add thin stubs, or skip? Default: skip (spec doesn't ask).

If the user confirms all defaults, `sdd-tasks` proceeds unblocked.

---

*End of design.md.*
