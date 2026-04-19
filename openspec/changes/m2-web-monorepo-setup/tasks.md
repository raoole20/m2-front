# Tasks — m2-web-monorepo-setup

> Phase: `sdd-tasks` · Change: `m2-web-monorepo-setup` · Date: 2026-04-19
> Companion to: `proposal.md`, `spec.md` (60 REQ items), `design.md` (18 sections + trade-offs).
> Purpose: ordered, actionable checklist from empty repo to v1 deployed. Each task is 30-90 min for one dev.
>
> Conventions:
> - **Depends on**: must complete before this task can start.
> - **Satisfies**: REQ ids from `spec.md` this task contributes to (may span multiple tasks).
> - **Implements**: design section/ADR this task realizes.
> - **Acceptance**: single verifiable check.

---

## Phase 0 — Baseline verification & branch prep

> The precursor change `mobile-to-monorepo-migration` has ALREADY created the monorepo root, added `apps/mobile`, `packages/types`, `packages/design`, and the `.npmrc`/`pnpm-workspace.yaml`/`turbo.json`/`tsconfig.base.json`/root `package.json`/etc. These tasks verify that state and branch off — they DO NOT re-create anything the precursor already did.

### TASK-001: Verify precursor `mobile-to-monorepo-migration` has merged to `main`
- **Depends on:** none
- **Satisfies:** REQ-PREREQ-001
- **Implements:** design §2.1 (post-migration baseline), §19
- **Files:** none (verification only)
- **Steps:**
  1. `git fetch m2front main` (the `m2front` remote was added to local clones by the precursor — pointing at `raoole20/m2-front`; `origin` points at `Ramsesdb/motomoto`).
  2. Confirm the latest migration commit is present on `main` (e.g., a commit message referencing "mobile-to-monorepo-migration" or the archive entry in `openspec/changes/archive/`).
  3. If not merged → STOP. Do not proceed to TASK-002.
- **Acceptance:** `git log m2front/main --oneline | head -n 20` shows the precursor's merge/squash commit AND `openspec/changes/archive/mobile-to-monorepo-migration/` exists (or the equivalent artifact layout used by the project).

### TASK-002: Pull main, verify workspace structure, clean install
- **Depends on:** TASK-001
- **Satisfies:** REQ-PREREQ-001, REQ-MONO-001, REQ-MONO-002
- **Implements:** design §2.1, §19
- **Files:** none (verification only; may modify `pnpm-lock.yaml` implicitly)
- **Steps:**
  1. `git checkout main && git pull m2front main`.
  2. Verify these paths/files exist: `pnpm-workspace.yaml`, `turbo.json`, root `package.json` (pinning `packageManager: "pnpm@9.x"`), `tsconfig.base.json`, `.npmrc`, `.nvmrc` (`20.19.4`), `apps/mobile/`, `packages/types/`, `packages/design/`.
  3. `pnpm install` at the repo root — should resolve cleanly with no "missing workspace" errors.
  4. `pnpm list -r --depth=-1` — confirm at least `@m2/mobile`, `@m2/types`, `@m2/design` are listed.
  5. Smoke-test the mobile baseline: `pnpm --filter @m2/mobile typecheck` (not `start` — Metro is long-running; typecheck is sufficient for CI-like verification).
- **Acceptance:** `pnpm install` exits 0; `pnpm list -r --depth=-1` lists the three precursor workspaces; mobile typecheck passes.

### TASK-003: Create feature branch `feat/web-apps-scaffold`
- **Depends on:** TASK-002
- **Satisfies:** (workflow hygiene — per user memory `feedback_git_push.md`)
- **Implements:** design §14.1 (deployment workflow)
- **Files:** none (branch creation only)
- **Steps:**
  1. Confirm git identity: `git config user.email` → `rdbriceno5@urbe.edu.ve`; `git config user.name` → `Ramsesdb`. Fix if wrong.
  2. `git checkout -b feat/web-apps-scaffold` from `main`.
  3. All subsequent tasks commit to this branch; merge via PR on `raoole20/m2-front` when Phase 4 is done.
- **Acceptance:** `git branch --show-current` prints `feat/web-apps-scaffold`.

### TASK-004: Create `@m2/config` preset package (tsconfig + eslint + prettier + tailwind presets)
- **Depends on:** TASK-003
- **Satisfies:** REQ-MONO-003, REQ-MONO-004
- **Implements:** design §2.1, §3.5, §15
- **Files:**
  - `packages/config/package.json` (new — name `@m2/config`, private, `"type": "module"`, exports map)
  - `packages/config/tsconfig/base.json` (new — re-exports the root `tsconfig.base.json`; does NOT redefine strict flags)
  - `packages/config/tsconfig/nextjs.json` (extends base, jsx preserve, next plugin)
  - `packages/config/tsconfig/react-library.json` (extends base, declaration true, composite)
  - `packages/config/eslint/index.cjs` (flat-adjacent shape — typescript-eslint + next + import/order)
  - `packages/config/prettier/index.cjs`
  - `packages/config/tailwind/preset.js` (thin re-export of `@m2/design/tailwind-preset` — stub until TASK-013 lands the preset module)
- **Steps:**
  1. Scaffold `packages/config/package.json` with `exports` map for each preset path.
  2. If the precursor already created `packages/config/`, extend it rather than overwriting — reuse what exists, add only the missing web presets.
  3. Write the 3 tsconfig files per design §3.5 + §15. `base.json` extends from the root `tsconfig.base.json` (single source of strictness).
  4. Write eslint config including typescript-eslint, eslint-config-next, import/order rules.
  5. Write prettier config (100-char width, single quotes, trailing commas).
  6. Add `tailwind/preset.js` as a re-export placeholder (will wire to `@m2/design` after TASK-013).
- **Acceptance:** `pnpm install` resolves `@m2/config` and `node -e "require('@m2/config/prettier')"` prints the config.

### TASK-005: Add web-oriented tasks to root `turbo.json` and root scripts
- **Depends on:** TASK-004
- **Satisfies:** REQ-MONO-001, REQ-MONO-005
- **Implements:** design §15
- **Files:**
  - `turbo.json` (modified — add `generate:api` task; ensure `build` / `typecheck` / `lint` / `dev` tasks are compatible with adding `@m2/landing` and `@m2/admin` later)
  - root `package.json` (modified — add scripts `format`, `format:check`, `generate:api`; ensure existing `dev`/`build`/`typecheck`/`lint` scripts still delegate to `turbo run ...`)
  - `.eslintrc.base.cjs` (new — extends `@m2/config/eslint`; does NOT redefine rules)
  - `.prettierrc.cjs` (new — extends `@m2/config/prettier`)
- **Steps:**
  1. Inspect existing `turbo.json`; append the `generate:api` task entry. DO NOT remove existing task entries used by mobile.
  2. Add scripts to root `package.json` without removing ones the precursor set up.
  3. Write `.eslintrc.base.cjs` / `.prettierrc.cjs` as thin re-exports.
- **Acceptance:** `pnpm turbo run typecheck --filter=@m2/mobile` still passes; `pnpm exec prettier --check .` runs; new `generate:api` task exists.

---

## Phase 1 — Shared packages

> Packages `@m2/design`, `@m2/i18n`, `@m2/api-client` have no inter-package deps and can run in **parallel**. `@m2/ui` depends on `@m2/design` and `@m2/i18n`.

### TASK-010: Verify `@m2/design` package shell, extend exports map for web
- **Depends on:** TASK-005
- **Satisfies:** REQ-DS-007, REQ-MONO-002, REQ-MONO-003
- **Implements:** design §3.1, §2.1, §19.4
- **Context:** `packages/design/` and its `package.json` ALREADY exist (precursor). This task extends the `exports` map so web consumers can import `./tailwind-preset` and `./css/tokens.css`. It does NOT create the package from scratch.
- **Files:**
  - `packages/design/package.json` (modified — add export entries for `./tailwind-preset` and `./css/tokens.css`; preserve existing exports mobile depends on)
  - `packages/design/tsconfig.json` (existing — verify it extends `@m2/config/tsconfig/react-library` or equivalent)
- **Steps:**
  1. Read the existing `package.json`; add `./tailwind-preset` and `./css/tokens.css` to the `exports` map without touching existing entries.
  2. Confirm `tsconfig.json` inherits strict/bundler settings (from root `tsconfig.base.json` or `@m2/config`).
  3. Run `pnpm --filter @m2/mobile typecheck` — MUST still pass.
- **Acceptance:** `pnpm --filter @m2/design typecheck` passes; mobile typecheck is unchanged.

### TASK-011: Verify `@m2/design` baseline and extend with web-oriented tokens
- **Depends on:** TASK-010
- **Satisfies:** REQ-DS-002, REQ-DS-003, REQ-DS-004, REQ-DS-005, REQ-DS-007
- **Implements:** design §3.1, §10, §19.4
- **Context:** Precursor already populated `packages/design/src/colors.ts`, `typography.ts`, `spacing.ts`, and `index.ts` and wired mobile to import from `@m2/design`. This task audits the existing exports and adds the web-facing pieces (`radii`, `glows`, type helpers) that the mobile overhaul did not ship.
- **Files:**
  - `packages/design/src/colors.ts` (existing — audit only; DO NOT rewrite)
  - `packages/design/src/typography.ts` (existing — audit only)
  - `packages/design/src/spacing.ts` (existing — audit only)
  - `packages/design/src/radii.ts` (new if absent)
  - `packages/design/src/glows.ts` (new if absent — colored shadow tokens; no black)
  - `packages/design/src/types.ts` (new or extended — `DesignTokens`, `ColorScale`, `GlowToken`)
  - `packages/design/src/index.ts` (modified — barrel-export the newly added modules without removing existing exports)
- **Steps:**
  1. Read the existing files; confirm primary blue `#ADC6FF`, surface container `#201F1F`, gradient stops `#1A2A4A → #ADC6FF` are present. If any are missing, flag in the phase handoff instead of silently changing mobile's token values.
  2. Add `radii.ts` and `glows.ts` with values per spec (`glows.primary` = `0 0 24px rgba(173,198,255,0.35), 0 0 48px rgba(173,198,255,0.15)` etc.).
  3. Add type definitions; export via `src/index.ts` barrel.
  4. Run `pnpm --filter @m2/mobile typecheck` — MUST still pass (the new exports are additive; no rename).
- **Acceptance:** `pnpm --filter @m2/design typecheck` passes, `pnpm --filter @m2/mobile typecheck` STILL passes, and `import { radii, glows } from '@m2/design'` resolves.

### TASK-012: CSS variables file — `packages/design/css/tokens.css`
- **Depends on:** TASK-011
- **Satisfies:** REQ-DS-007
- **Implements:** design §3.1, §4.4, §10
- **Files:**
  - `packages/design/css/tokens.css` (new — `:root { --color-primary: #ADC6FF; … }` mirroring every TS token)
- **Steps:**
  1. For each token in colors/typography/spacing/radii/glows, emit a matching CSS custom property under `:root`.
  2. Follow the naming map in design §10 (`--color-surface-container`, `--font-display`, `--space-4`, `--radius-lg`, `--glow-primary`, …).
- **Acceptance:** File imports cleanly and grep `--color-primary:` returns a match with `#ADC6FF`.

### TASK-013: Tailwind v4 preset — `packages/design/src/tailwind-preset.ts`
- **Depends on:** TASK-011
- **Satisfies:** REQ-DS-002, REQ-DS-005, REQ-DS-006, REQ-DS-007
- **Implements:** design §3.1, §4.1, §4.3, §10
- **Files:**
  - `packages/design/src/tailwind-preset.ts` (new)
  - `packages/design/package.json` (modified — ensure `./tailwind-preset` export)
- **Steps:**
  1. Build a Tailwind preset (`{ theme: { extend: { colors, spacing, borderRadius, fontFamily, boxShadow, backgroundImage } } }`) sourced from token consts.
  2. Add a Tailwind plugin that registers `shadow-glow-primary`, `shadow-glow-success`, `shadow-glow-warning`, `shadow-glow-danger`.
  3. Add `bg-mesh-primary` and `bg-mesh-dusk` utilities via plugin with multi-stop radial gradients.
  4. Add `font-display` (Manrope stack) and `font-body` (Inter stack) utilities.
- **Acceptance:** `import { tailwindPreset } from '@m2/design'` compiles and `tailwindPreset.theme.extend.colors.primary.DEFAULT === '#ADC6FF'`.

### TASK-014: Create `@m2/i18n` package (NEW — shared message keys + next-intl config)
- **Depends on:** TASK-005 (parallel with TASK-010/011/012/013)
- **Satisfies:** REQ-I18N-001, REQ-I18N-002, REQ-I18N-006, REQ-MONO-002
- **Implements:** design §3.4, §8, §19.4 (web-only package)
- **Files:**
  - `packages/i18n/package.json` (new — name `@m2/i18n`, peerDeps `next-intl`, exports `.`, `./messages`)
  - `packages/i18n/tsconfig.json` (extends react-library)
  - `packages/i18n/src/config.ts` (`locales = ['es','en'] as const`, `defaultLocale = 'es'`, `localePrefix = 'as-needed'`, `Locale` type)
  - `packages/i18n/src/request.ts` (shared `getRequestConfig` that deep-merges shared + app messages; `onError` warns on missing key in dev; falls back to `es`)
  - `packages/i18n/src/navigation.ts` (wrapper around `createLocalizedPathnamesNavigation`)
  - `packages/i18n/src/messages.ts` (loads + exports shared messages)
  - `packages/i18n/src/index.ts` (barrel)
- **Steps:**
  1. Install `next-intl` as peer.
  2. Write `config.ts` with exact tuple + default per REQ-I18N-001/002.
  3. Write `request.ts` that imports both shared and app messages and deep-merges, falling back to `es` per REQ-I18N-006.
  4. Write `navigation.ts` that re-exports `Link`, `redirect`, `usePathname`, `useRouter` bound to the config.
- **Acceptance:** `pnpm --filter @m2/i18n typecheck` passes; `import { locales } from '@m2/i18n'` yields `['es','en']`.

### TASK-015: Shared i18n messages (brand, channels, common CTAs) — es + en
- **Depends on:** TASK-014
- **Satisfies:** REQ-I18N-004, REQ-LAND-005, REQ-LAND-003, REQ-LAND-004
- **Implements:** design §3.4, §8.3
- **Files:**
  - `packages/i18n/messages/es.json` (new)
  - `packages/i18n/messages/en.json` (new)
- **Steps:**
  1. Populate both files with shared keys: `brand.name`, `brand.tagline`, `channels.whatsapp`, `channels.instagram`, `channels.messenger`, `channels.email`, `channels.telegram`, `channels.sms`, `cta.login`, `cta.logout`, `cta.continue`, `cta.cancel`, `cta.contactSales`, `form.errors.emailInvalid`, `form.errors.passwordTooShort`, `form.errors.required`, `toast.forbidden`, `toast.serverError`, `toast.networkError`.
  2. Ensure 1:1 key parity between es and en.
- **Acceptance:** `jq 'keys_unsorted | length' messages/es.json == jq '... | length' messages/en.json`.

### TASK-016: Create `@m2/api-client` package (NEW — Swagger codegen + fetcher, web-only)
- **Depends on:** TASK-005 (parallel with TASK-010 and TASK-014)
- **Satisfies:** REQ-API-001, REQ-MONO-002
- **Implements:** design §3.3, §7.5, §19.4 (web-only in v1)
- **Files:**
  - `packages/api-client/package.json` (new — name `@m2/api-client`, devDeps `openapi-typescript`, `tsx`, `typescript`; script `generate:api`)
  - `packages/api-client/tsconfig.json` (extends react-library)
  - `packages/api-client/scripts/generate.ts` (new — fetches `http://localhost:3000/api/docs-json` or `$API_DOCS_URL`, pipes through `openapi-typescript`, writes `src/generated/schema.d.ts`)
  - `packages/api-client/src/generated/.gitkeep`
- **Steps:**
  1. Write `package.json` with exports, scripts `generate:api`, `typecheck`, `build`.
  2. Write `scripts/generate.ts` using `tsx`: fetch `process.env.API_DOCS_URL ?? 'http://localhost:3000/api/docs-json'`, invoke `openapi-typescript`, write to `src/generated/schema.d.ts`; fail loudly on non-200.
- **Acceptance:** `pnpm --filter @m2/api-client typecheck` passes (empty sources OK).

### TASK-017: Run initial API codegen against local backend
- **Depends on:** TASK-016
- **Satisfies:** REQ-API-001
- **Implements:** design §7.5
- **Files:**
  - `packages/api-client/src/generated/schema.d.ts` (new — committed output)
- **Steps:**
  1. Ensure local `m2-back` is running on `http://localhost:3000`.
  2. `pnpm --filter @m2/api-client generate:api`.
  3. Verify `paths` and `components` types are emitted.
  4. Commit the generated file.
- **Acceptance:** `packages/api-client/src/generated/schema.d.ts` exists and exports `paths` + `components` types.

### TASK-018: Envelope unwrap helper + typed errors
- **Depends on:** TASK-016
- **Satisfies:** REQ-API-002, REQ-API-003
- **Implements:** design §7.2, §7.3
- **Files:**
  - `packages/api-client/src/unwrap.ts` (new — generic `unwrap<T>(env)` throws `ApiError` on `success: false`)
  - `packages/api-client/src/errors.ts` (new — `ApiError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ServerError`, `NetworkError` — all extending `ApiError`)
- **Steps:**
  1. Define `Envelope<T>` discriminated union per design §7.2.
  2. Implement `unwrap<T>`.
  3. Define the 6 error classes with `code`, `message`, `details` fields; ensure `instanceof` checks work (extend `Error` properly + set `name`).
- **Acceptance:** Unit-style TS check: `unwrap({ success: true, data: 1 })` returns `1`; `unwrap({ success:false, error:{code:'X',message:'y'} })` throws `ApiError`.

### TASK-019: TokenStore interface + browser implementation + sentinel cookie helpers
- **Depends on:** TASK-016
- **Satisfies:** REQ-AUTH-003, REQ-GUARD-001, REQ-GUARD-002, REQ-PROF-002
- **Implements:** design §5.5, §7.4
- **Files:**
  - `packages/api-client/src/token-store.ts` (new — `TokenStore` interface + `createBrowserTokenStore()` using `localStorage` keys `m2_access_token`, `m2_refresh_token`)
  - `packages/api-client/src/session-cookie.ts` (new — `setSessionSentinel()`, `clearSessionSentinel()` writing `m2_session=1; Path=/; SameSite=Lax; Secure` in prod)
- **Steps:**
  1. Implement `TokenStore` interface (`getAccess`, `getRefresh`, `set`, `clear`).
  2. Implement browser impl guarded by `typeof window !== 'undefined'`.
  3. Implement sentinel cookie set/clear helpers with correct attributes per design §5.5.
- **Acceptance:** `createBrowserTokenStore().set({accessToken:'a',refreshToken:'b'})` then `.getAccess() === 'a'` in a jsdom-like env (manual check).

### TASK-020: Fetcher with auth header, envelope unwrap, 401 refresh serialization
- **Depends on:** TASK-017, TASK-018, TASK-019
- **Satisfies:** REQ-API-002, REQ-API-003, REQ-API-004, REQ-GUARD-002
- **Implements:** design §5.3, §7.1, §7.3, §7.4
- **Files:**
  - `packages/api-client/src/fetcher.ts` (new — base URL from `NEXT_PUBLIC_API_URL`; throws at module load if unset; attaches `Authorization: Bearer <accessToken>`; unwraps envelope; on 401 runs single serialized refresh via module-level `refreshing: Promise<void> | null`; on refresh failure clears tokens + sentinel, redirects to `/admin/login?reason=expired`)
  - `packages/api-client/src/index.ts` (modified — re-export fetcher, unwrap, errors, token-store)
- **Steps:**
  1. Read `NEXT_PUBLIC_API_URL`; if absent at runtime in browser, throw a loud error.
  2. Implement `setTokenStore(store)` module-level injection.
  3. Implement `fetcher<T>(path, init)` mapping HTTP status to error classes per design §7.3.
  4. Implement 401 → refresh serialization as described in design §5.3.
- **Acceptance:** `typecheck` passes; manual stub test: two concurrent 401s result in exactly one `POST /api/auth/refresh`.

### TASK-021: Resource modules — auth, conversations, contacts
- **Depends on:** TASK-020
- **Satisfies:** REQ-AUTH-003, REQ-GUARD-002, REQ-INBOX-001, REQ-INBOX-004, REQ-PROF-001, REQ-DASH-001
- **Implements:** design §3.3
- **Files:**
  - `packages/api-client/src/auth.ts` (new — `login`, `refresh`, `logout`, `me`)
  - `packages/api-client/src/conversations.ts` (new — `list`, `get`, `messages`)
  - `packages/api-client/src/contacts.ts` (new — `list`, `get`)
  - `packages/api-client/src/index.ts` (modified — add barrel exports)
- **Steps:**
  1. For each endpoint, type the request/response via `paths[...]` from generated schema.
  2. Wire through `fetcher` + `unwrap` so callers receive typed `T`.
  3. In `auth.login`, after success, call `tokenStore.set(...)` + `setSessionSentinel()`. In `auth.logout`, call `tokenStore.clear()` + `clearSessionSentinel()` (fire-and-forget backend call).
- **Acceptance:** `pnpm --filter @m2/api-client typecheck` passes; `auth.login` return type is `{ accessToken, refreshToken, user }`.

### TASK-030: Create `@m2/ui` package (NEW — web-only React DOM components)
- **Depends on:** TASK-013, TASK-014
- **Satisfies:** REQ-MONO-002
- **Implements:** design §3.2, §2.1, §19.4, §19.5 (web-only; mobile keeps its own components)
- **Files:**
  - `packages/ui/package.json` (new — name `@m2/ui`, deps `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`; peerDeps `react`, `react-dom`, `next-intl`; workspace deps `@m2/design`, `@m2/i18n`)
  - `packages/ui/tsconfig.json` (extends react-library)
  - `packages/ui/src/index.ts` (barrel — empty)
- **Acceptance:** `pnpm --filter @m2/ui typecheck` passes.

### TASK-031: UI primitives — Button, Input
- **Depends on:** TASK-030
- **Satisfies:** REQ-AUTH-002, REQ-AUTH-005, REQ-DS-007
- **Implements:** design §3.2
- **Files:**
  - `packages/ui/src/primitives/Button.tsx` (CVA variants: `primary`, `secondary`, `ghost`; sizes `sm`, `md`, `lg`; loading + disabled states)
  - `packages/ui/src/primitives/Input.tsx` (with label, error text, aria-describedby, disabled state)
  - `packages/ui/src/primitives/index.ts` (barrel)
- **Acceptance:** Both components typecheck and only reference tokens via Tailwind classes (no raw hex).

### TASK-032: UI surfaces — GlassCard, MeshGradient, AuraGlow
- **Depends on:** TASK-031
- **Satisfies:** REQ-DS-002, REQ-DS-003, REQ-DS-006, REQ-LAND-006, REQ-LAND-007
- **Implements:** design §3.2, §4.3
- **Files:**
  - `packages/ui/src/surfaces/GlassCard.tsx` (bg `rgba(32,31,31,0.65)`, `backdrop-blur-xl`, inner highlight at 20% `#ADC6FF`, colored-glow shadow prop)
  - `packages/ui/src/surfaces/MeshGradient.tsx` (SVG-backed multi-stop mesh, variants `primary`, `dusk`, with `prefers-reduced-motion` static fallback)
  - `packages/ui/src/surfaces/AuraGlow.tsx`
- **Acceptance:** Computed styles on a rendered `GlassCard` match REQ-DS-002 exactly.

### TASK-033: UI controls — GradientButton, FilterTab, SunkenInput, LocaleSwitcher
- **Depends on:** TASK-031, TASK-014
- **Satisfies:** REQ-DS-005, REQ-INBOX-002, REQ-I18N-003
- **Implements:** design §3.2, §8.5
- **Files:**
  - `packages/ui/src/controls/GradientButton.tsx` (primary uses `linear-gradient(135deg,#1A2A4A,#ADC6FF)` via token class)
  - `packages/ui/src/controls/FilterTab.tsx`
  - `packages/ui/src/controls/SunkenInput.tsx`
  - `packages/ui/src/controls/LocaleSwitcher.tsx` (uses `@m2/i18n/navigation` `useRouter` + `usePathname`; writes `NEXT_LOCALE` cookie 1y)
- **Acceptance:** `GradientButton variant="primary"` computed background matches REQ-DS-005; `LocaleSwitcher` sets cookie with `max-age=31536000`.

### TASK-034: UI data components — KPICard, Avatar, ConversationCard, FeatureCard
- **Depends on:** TASK-032
- **Satisfies:** REQ-DASH-002, REQ-INBOX-001, REQ-LAND-006, REQ-LAND-008
- **Implements:** design §3.2
- **Files:**
  - `packages/ui/src/data/KPICard.tsx` (label, value, optional trend)
  - `packages/ui/src/data/Avatar.tsx` (initials-circle variant — no photo fallback)
  - `packages/ui/src/data/ConversationCard.tsx`
  - `packages/ui/src/data/FeatureCard.tsx` (glass card variant used on landing features grid)
- **Acceptance:** All typecheck; `Avatar` with no `src` renders initials only.

### TASK-035: UI barrel + package export surface
- **Depends on:** TASK-031, TASK-032, TASK-033, TASK-034
- **Satisfies:** REQ-MONO-002
- **Implements:** design §3.2
- **Files:**
  - `packages/ui/src/index.ts` (barrel — export every component + type listed in design §3.2)
- **Acceptance:** `import { GlassCard, GradientButton, KPICard, LocaleSwitcher } from '@m2/ui'` resolves in a dependent app.

---

## Phase 2 — Landing app (`apps/landing`)

> Can start as soon as TASK-013 (design preset), TASK-015 (shared messages), and TASK-035 (ui barrel) are complete. Landing does NOT consume `@m2/api-client`.

### TASK-050: Init Next.js 15 in `apps/landing`
- **Depends on:** TASK-007, TASK-035
- **Satisfies:** REQ-MONO-002, REQ-MONO-005
- **Implements:** design §2.1, §9.1, §14.1
- **Files:**
  - `apps/landing/package.json` (new — name `@m2/landing`, Next 15, scripts `dev --port 3001`, `build`, `start`, `lint`, `typecheck`)
  - `apps/landing/next.config.ts` (new — next-intl plugin via `createNextIntlPlugin`, `transpilePackages: ['@m2/ui','@m2/design','@m2/i18n']`)
  - `apps/landing/tsconfig.json` (extends `@m2/config/tsconfig/nextjs`)
  - `apps/landing/app/layout.tsx` (RSC `<html>` stub)
  - `apps/landing/app/[locale]/layout.tsx` (NextIntlClientProvider, fonts, imports global CSS)
  - `apps/landing/app/[locale]/page.tsx` (placeholder hero — replaced in TASK-053)
  - `apps/landing/app/globals.css` (imports `@m2/design/css/tokens.css` and Tailwind v4)
  - `apps/landing/postcss.config.cjs`
  - `apps/landing/tailwind.config.ts` (presets: `@m2/config/tailwind/preset`)
  - `apps/landing/messages/es.json`, `apps/landing/messages/en.json` (empty stubs)
- **Acceptance:** `pnpm --filter @m2/landing dev` starts on port 3001 and `/` renders placeholder.

### TASK-051: Landing middleware + i18n wiring
- **Depends on:** TASK-050, TASK-014
- **Satisfies:** REQ-I18N-001, REQ-I18N-002, REQ-I18N-005, REQ-LAND-001
- **Implements:** design §6.1, §8
- **Files:**
  - `apps/landing/middleware.ts` (new — `createMiddleware({locales, defaultLocale, localePrefix})`; matcher excludes api/_next/assets)
  - `apps/landing/i18n/request.ts` (new — wraps `@m2/i18n/request` with app-specific message loader)
- **Acceptance:** Request to `/` returns 200 with Spanish; `/en` returns 200 English; `/fr` returns 404.

### TASK-052: Landing — Navbar and Footer sections
- **Depends on:** TASK-051, TASK-035
- **Satisfies:** REQ-LAND-003, REQ-LAND-010, REQ-I18N-003
- **Implements:** design §9.1
- **Files:**
  - `apps/landing/app/[locale]/_components/Navbar.tsx` (brand, locale switcher, "Iniciar sesión" CTA → `${NEXT_PUBLIC_ADMIN_URL}/admin/login`)
  - `apps/landing/app/[locale]/_components/Footer.tsx` (brand, contact link, copyright year)
- **Acceptance:** Login CTA href resolves to admin URL from env; `LocaleSwitcher` toggles `/` ↔ `/en`.

### TASK-053: Landing — Hero + ChannelsStrip sections
- **Depends on:** TASK-052
- **Satisfies:** REQ-LAND-001, REQ-LAND-005, REQ-DS-006
- **Implements:** design §9.1
- **Files:**
  - `apps/landing/app/[locale]/_components/Hero.tsx` (MeshGradient backdrop, headline + subhead from messages, CTA buttons)
  - `apps/landing/app/[locale]/_components/ChannelsStrip.tsx` (≥4 channel logos from `simple-icons`/`lucide`, each with `aria-label` from shared i18n)
  - `apps/landing/app/[locale]/page.tsx` (modified — compose sections)
- **Acceptance:** `/` shows mesh-gradient hero in es; `/en` shows it in English; channels strip has 4+ logos with aria-labels.

### TASK-054: Landing — FeaturesGrid, AIHighlight, Testimonials, PricingCTA sections
- **Depends on:** TASK-053
- **Satisfies:** REQ-LAND-006, REQ-LAND-007, REQ-LAND-008, REQ-LAND-009, REQ-LAND-004, REQ-DS-002, REQ-DS-006
- **Implements:** design §9.1, §4.3
- **Files:**
  - `apps/landing/app/[locale]/_components/FeaturesGrid.tsx` (≥3 `FeatureCard` glass cards)
  - `apps/landing/app/[locale]/_components/AIHighlight.tsx` (MeshGradient backdrop, AI copy from messages)
  - `apps/landing/app/[locale]/_components/Testimonials.tsx` (≥2 cards with initials avatars)
  - `apps/landing/app/[locale]/_components/PricingCTA.tsx` (single mailto CTA `mailto:contact@motomoto.app`)
  - `apps/landing/app/[locale]/page.tsx` (modified — compose all sections)
- **Acceptance:** All sections render in both locales; pricing has exactly one mailto CTA and zero numeric tiers.

### TASK-055: Landing — populate es + en message files
- **Depends on:** TASK-054
- **Satisfies:** REQ-I18N-004, REQ-LAND-001 … REQ-LAND-010
- **Implements:** design §3.4, §8.3
- **Files:**
  - `apps/landing/messages/es.json` (modified — all hero/features/ai/testimonials/pricing/footer copy)
  - `apps/landing/messages/en.json` (same keys, English)
- **Acceptance:** No hardcoded user-facing literals in JSX grep of `apps/landing/app`; key parity between es and en.

### TASK-056: Landing — SEO metadata, OG tags, hreflang alternates
- **Depends on:** TASK-055
- **Satisfies:** REQ-LAND-011
- **Implements:** design §9.1
- **Files:**
  - `apps/landing/app/[locale]/layout.tsx` (modified — `generateMetadata` with title, description, canonical per locale, OG tags, `alternates.languages` with `es` + `en` URLs using `NEXT_PUBLIC_SITE_URL`)
  - `apps/landing/public/og-image.png` (placeholder)
  - `apps/landing/public/favicon.ico` (placeholder)
- **Acceptance:** `curl /` returns a response containing `<meta property="og:title">` and `<link rel="alternate" hreflang="en" href="…/en">`.

### TASK-057: Landing — sitemap.xml and robots.txt
- **Depends on:** TASK-056
- **Satisfies:** REQ-LAND-012
- **Implements:** design §9.1
- **Files:**
  - `apps/landing/app/sitemap.ts` (new — emits `/` + `/en` with `xhtml:link rel="alternate" hreflang=...`)
  - `apps/landing/app/robots.ts` (new — `Allow: /`, `Sitemap: ${NEXT_PUBLIC_SITE_URL}/sitemap.xml`)
- **Acceptance:** `curl /sitemap.xml` returns XML listing both locales; `curl /robots.txt` returns a `Sitemap:` line.

### TASK-058: Landing — vercel.json + env example
- **Depends on:** TASK-057
- **Satisfies:** REQ-DEPLOY-001, REQ-DEPLOY-003
- **Implements:** design §14.1, §14.2
- **Files:**
  - `apps/landing/vercel.json` (new — `"installCommand": "pnpm install --frozen-lockfile"`, `"buildCommand": "turbo build --filter=@m2/landing..."`, `"ignoreCommand": "git diff --quiet HEAD^ HEAD -- apps/landing packages"`, `"framework": "nextjs"`, rewrite/redirect for `www.motomoto.app → motomoto.app`)
  - `apps/landing/.env.example` (new — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_DEFAULT_LOCALE=es`)
- **Acceptance:** `pnpm --filter @m2/landing build` succeeds locally with env vars present.

---

## Phase 3 — Admin app (`apps/admin`)

> Requires ALL four packages: `@m2/design`, `@m2/i18n`, `@m2/ui`, `@m2/api-client`.

### TASK-070: Init Next.js 15 in `apps/admin`
- **Depends on:** TASK-007, TASK-035, TASK-021
- **Satisfies:** REQ-MONO-002, REQ-MONO-005
- **Implements:** design §2.1, §9.2, §14.1
- **Files:**
  - `apps/admin/package.json` (new — name `@m2/admin`, Next 15, `@tanstack/react-query`, `zod`, scripts `dev --port 3002`, `build`, `start`, `lint`, `typecheck`)
  - `apps/admin/next.config.ts` (next-intl plugin, `transpilePackages: ['@m2/ui','@m2/design','@m2/i18n','@m2/api-client']`)
  - `apps/admin/tsconfig.json` (extends `@m2/config/tsconfig/nextjs`)
  - `apps/admin/app/layout.tsx`, `apps/admin/app/[locale]/layout.tsx`
  - `apps/admin/app/globals.css` (imports design tokens + Tailwind)
  - `apps/admin/postcss.config.cjs`, `apps/admin/tailwind.config.ts`
  - `apps/admin/messages/es.json`, `apps/admin/messages/en.json` (empty stubs)
- **Acceptance:** `pnpm --filter @m2/admin dev` starts on port 3002.

### TASK-071: Admin — chained middleware (i18n + auth) and matcher
- **Depends on:** TASK-070, TASK-019
- **Satisfies:** REQ-GUARD-001, REQ-I18N-001, REQ-I18N-002
- **Implements:** design §6.1
- **Files:**
  - `apps/admin/middleware.ts` (new — exactly per design §6.1 code block: intl first, then auth guard checking `m2_session` cookie, excluding `/admin/login`, redirecting to `/{locale}/admin/login?redirect=...`)
- **Acceptance:** Request to `/admin/inbox` without cookie → 307 to `/admin/login?redirect=%2Fadmin%2Finbox`; same for `/en/admin/profile` → `/en/admin/login?redirect=...`.

### TASK-072: Admin — QueryClient provider, auth-store hook, token-store bootstrap
- **Depends on:** TASK-070, TASK-021
- **Satisfies:** REQ-AUTH-003, REQ-GUARD-002, REQ-PROF-002
- **Implements:** design §5, §11, §12
- **Files:**
  - `apps/admin/app/[locale]/admin/layout.tsx` (new — `"use client"`; hydrates `TokenStore` via `setTokenStore(createBrowserTokenStore())`; wraps in `QueryClientProvider`; calls `auth.me()` via `useQuery(['me'])`; redirects on missing token; renders nav chrome + `<LocaleSwitcher/>`)
  - `apps/admin/src/lib/query-client.ts` (new — `QueryClient` with `staleTime: 0`, `refetchOnWindowFocus: false`)
  - `apps/admin/src/hooks/use-auth.ts` (new — thin wrapper around `['me']` query with `hasMinRole` helper)
- **Acceptance:** Dashboard page mounts, calls `/api/auth/me`, `useAuth().user.role` is typed correctly.

### TASK-073: Admin — Login page (form, validation, submit, redirect)
- **Depends on:** TASK-072
- **Satisfies:** REQ-AUTH-001, REQ-AUTH-002, REQ-AUTH-003, REQ-AUTH-004, REQ-AUTH-005, REQ-AUTH-006
- **Implements:** design §5.1
- **Files:**
  - `apps/admin/app/[locale]/admin/login/page.tsx` (new — form with email/password; `zod` validation client-side; submit calls `auth.login`; on success sets sentinel cookie + tokens and navigates to `?redirect=` or `/admin`; on failure shows inline localized error; disables inputs + shows spinner while pending; if already authed (`me` query succeeds) redirects to `/admin`)
- **Acceptance:** All 6 REQ-AUTH scenarios pass manually.

### TASK-074: Admin — Dashboard page with 4 mock KPIs + quick actions
- **Depends on:** TASK-072, TASK-035
- **Satisfies:** REQ-DASH-001, REQ-DASH-002, REQ-DASH-003, REQ-DASH-004
- **Implements:** design §9.2
- **Files:**
  - `apps/admin/app/[locale]/admin/page.tsx` (new — personalized greeting from `useAuth().user.firstName`; grid of 4 `KPICard` with `MOCK_DASHBOARD_KPIS`; quick-action cards linking to inbox and profile)
  - `apps/admin/src/mock/dashboard.ts` (new — `MOCK_DASHBOARD_KPIS` const, documented as placeholder)
- **Acceptance:** `/admin` shows "Hola, {firstName}" in es and renders 4 KPI cards at ≥1024px viewport.

### TASK-075: Admin — Inbox list with filter tabs, polling, empty state, skeleton
- **Depends on:** TASK-072, TASK-035
- **Satisfies:** REQ-INBOX-001, REQ-INBOX-002, REQ-INBOX-003, REQ-INBOX-005, REQ-INBOX-006, REQ-INBOX-007
- **Implements:** design §9.2, §11
- **Files:**
  - `apps/admin/app/[locale]/admin/inbox/page.tsx` (new — reads `status` query param; `useQuery(['conversations', {status}], conversations.list, { refetchInterval: 5000, refetchIntervalInBackground: false })`; filter tabs all/open/pending/resolved updating URL; renders `ConversationCard` list; Skeleton (≥3 placeholders) during first load; localized empty state; clicking a card navigates to `/admin/inbox/[id]`)
- **Acceptance:** Polling observed every 5s in Network panel with visible tab; paused when hidden; filter tabs round-trip via URL.

### TASK-076: Admin — Inbox detail page (messages, polling)
- **Depends on:** TASK-075
- **Satisfies:** REQ-INBOX-004, REQ-INBOX-005
- **Implements:** design §9.2, §11
- **Files:**
  - `apps/admin/app/[locale]/admin/inbox/[id]/page.tsx` (new — `useQuery(['messages', id], conversations.messages, { refetchInterval: 5000, refetchIntervalInBackground: false })`; renders chronologically oldest→newest; inbound vs outbound visually distinct via Tailwind classes)
- **Acceptance:** Messages render in order and refresh every 5s.

### TASK-077: Admin — Profile page with logout
- **Depends on:** TASK-072
- **Satisfies:** REQ-PROF-001, REQ-PROF-002
- **Implements:** design §5.4, §9.2
- **Files:**
  - `apps/admin/app/[locale]/admin/profile/page.tsx` (new — reads `useAuth().user` for name/email/role/tenant; logout button calls `auth.logout()` → clears tokens, sentinel, `queryClient.clear()`, navigates to `/{locale}/admin/login`)
- **Acceptance:** After click: localStorage keys gone, sentinel cookie gone, query cache empty, at login URL.

### TASK-078: Admin — role-based UI gating via `hasMinRole`
- **Depends on:** TASK-072, TASK-074, TASK-075, TASK-077
- **Satisfies:** REQ-GUARD-003
- **Implements:** design §9.2
- **Files:**
  - `apps/admin/src/lib/roles.ts` (new — `ROLE_HIERARCHY = { OWNER:3, ADMIN:2, AGENT:1 }`; `hasMinRole(role, required)`)
  - `apps/admin/app/[locale]/admin/layout.tsx` (modified — nav chrome hides "Tenant settings" for AGENT)
  - grep-check: no `user.role === ...` anywhere in `apps/admin/src`
- **Acceptance:** AGENT sees no tenant-settings link; forced navigation to a gated URL shows toast "No tienes permiso" and soft-redirects.

### TASK-079: Admin — toast system + error mapping (403/5xx/network)
- **Depends on:** TASK-072
- **Satisfies:** REQ-API-003
- **Implements:** design §7.3
- **Files:**
  - `apps/admin/src/components/ToastProvider.tsx` (new — `aria-live="polite"` region per §2.2)
  - `apps/admin/src/lib/error-toast.ts` (maps `ForbiddenError`/`ServerError`/`NetworkError` to localized toast keys from `@m2/i18n`)
  - QueryClient `queryCache.onError` hook wired in `query-client.ts`
- **Acceptance:** A 403 from any query triggers a localized toast; a 500 triggers "Error del servidor".

### TASK-080: Admin — populate es + en messages (login, dashboard, inbox, profile, errors)
- **Depends on:** TASK-073 … TASK-079
- **Satisfies:** REQ-I18N-004, REQ-AUTH-001 … REQ-PROF-002
- **Implements:** design §8.3
- **Files:**
  - `apps/admin/messages/es.json` (modified)
  - `apps/admin/messages/en.json` (same keys)
- **Acceptance:** Grep for hardcoded strings in `apps/admin/app` and `apps/admin/src` returns zero hits in JSX text children (excluding tokens, tests, mock data).

### TASK-081: Admin — vercel.json + env example
- **Depends on:** TASK-080
- **Satisfies:** REQ-DEPLOY-001, REQ-DEPLOY-003
- **Implements:** design §14.1, §14.2
- **Files:**
  - `apps/admin/vercel.json` (new — install/build/ignore commands per design §14.1)
  - `apps/admin/.env.example` (new — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_LANDING_URL`, `NEXT_PUBLIC_DEFAULT_LOCALE=es`)
- **Acceptance:** `pnpm --filter @m2/admin build` succeeds locally with env vars present.

---

## Phase 4 — Integration and polish

### TASK-090: CORS — document adding `CORS_ORIGIN` to local `m2-back` env
- **Depends on:** TASK-073
- **Satisfies:** (enables REQ-AUTH-003 e2e against local)
- **Implements:** design §18 (open item: backend CORS allowed origins)
- **Files:**
  - `README.md` (modified — add "Local setup" note instructing user to set `CORS_ORIGIN=http://localhost:3001,http://localhost:3002` in their local `m2-back/.env`; DO NOT push to m2-back repo)
- **Steps:**
  1. Tell the user (in the phase handoff message) exactly what to add to their local `m2-back/.env`.
  2. Add a short `README.md` section noting this prerequisite.
- **Acceptance:** `README.md` has a "Local backend CORS" section; no changes pushed to the m2-back repo.

### TASK-091: End-to-end manual test against local backend
- **Depends on:** TASK-090, TASK-058, TASK-081
- **Satisfies:** (verifies most REQ-AUTH, REQ-GUARD, REQ-INBOX, REQ-DASH, REQ-PROF)
- **Implements:** design §13
- **Files:**
  - `README.md` (modified — checklist appended)
- **Steps:**
  1. Start `m2-back` locally on :3000 with seeded data.
  2. `pnpm dev` (both apps).
  3. Walk through: landing → login → dashboard → inbox list → inbox detail → profile → logout → middleware redirect.
  4. Exercise locale switcher on both apps.
- **Acceptance:** All 6 REQ-AUTH, 3 REQ-GUARD, 7 REQ-INBOX scenarios pass by manual observation.

### TASK-092: Lighthouse check on landing
- **Depends on:** TASK-058
- **Satisfies:** §2.1 perf NFRs, REQ-LAND-011
- **Implements:** design §16
- **Steps:**
  1. Run Lighthouse mobile profile against `http://localhost:3001/` and `/en`.
  2. Record LCP, TTI, CLS, bundle size.
  3. If LCP > 2.5s, identify culprit (hero image, fonts, mesh gradient) — fix or document as tech debt.
- **Acceptance:** LCP ≤ 2.5s p75 recorded in README or design follow-ups.

### TASK-093: Typecheck + lint clean across all workspaces
- **Depends on:** TASK-091
- **Satisfies:** REQ-MONO-001, REQ-MONO-003, REQ-MONO-004
- **Implements:** design §13, §15
- **Steps:**
  1. `pnpm typecheck` at root.
  2. `pnpm lint` at root.
  3. Fix any failures (no `any`, no `!`, no hardcoded tokens in apps).
  4. Run i18n grep check for hardcoded JSX strings.
- **Acceptance:** Both commands exit 0; i18n grep returns zero hits.

### TASK-094: Commit, open PR against `raoole20/m2-front`, mirror to `Ramsesdb/motomoto`
- **Depends on:** TASK-093
- **Satisfies:** (per user memory `feedback_git_push.md`, `feedback_no_coauthored.md`)
- **Files:**
  - `README.md` (modified — final polish)
- **Context:** No new repo is created here. The monorepo already lives at `raoole20/m2-front` (primary, reachable via the `m2front` remote added by the precursor) with `Ramsesdb/motomoto` kept as a mirror (`origin`).
- **Steps (user executes; tasks.md documents the exact commands for manual execution per CLI-permissions policy):**
  1. Verify git identity: `git config user.email` returns `rdbriceno5@urbe.edu.ve`; `git config user.name` returns `Ramsesdb`. Fix if wrong (`git config user.email rdbriceno5@urbe.edu.ve`, same for name).
  2. Confirm remotes: `git remote -v` should show BOTH `origin → Ramsesdb/motomoto` AND `m2front → raoole20/m2-front`. If `m2front` is missing, add it: `git remote add m2front https://github.com/raoole20/m2-front.git`.
  3. Stage + commit. DO NOT include a `Co-Authored-By` trailer (user memory `feedback_no_coauthored.md`). Example:
     ```
     git add -A
     git commit -m "feat(web): scaffold landing + admin Next.js apps and web packages"
     ```
  4. Push to BOTH remotes:
     ```
     git push m2front feat/web-apps-scaffold
     git push origin  feat/web-apps-scaffold
     ```
  5. Open a PR against `raoole20/m2-front` main via `gh pr create --repo raoole20/m2-front --base main --head feat/web-apps-scaffold --title "..." --body "..."`. (A mirror PR on `Ramsesdb/motomoto` is optional — the primary review happens on `raoole20/m2-front`.)
- **Acceptance:** PR visible on `raoole20/m2-front` with the feature branch pushed; the mirror branch also exists on `Ramsesdb/motomoto`; no `Co-Authored-By` trailer in any commit of this branch (`git log feat/web-apps-scaffold ^main --format="%B" | grep -i "co-authored-by"` returns nothing).

---

## Phase 5 — Deploy

### TASK-100: Create Vercel project `m2-web-landing` pointing at `raoole20/m2-front`
- **Depends on:** TASK-094
- **Satisfies:** REQ-DEPLOY-001, REQ-DEPLOY-004
- **Implements:** design §14.1
- **Steps:**
  1. In Vercel, import the GitHub repo **`raoole20/m2-front`** (NOT a new repo — the monorepo that already contains mobile, landing, and admin).
  2. Create project `m2-web-landing` with Root Directory `apps/landing`, framework Next.js.
  3. Set install/build/ignore commands per design §14.1 (install from repo root; build filters to `@m2/landing...`; ignore step uses `git diff` on `apps/landing` + `packages`).
- **Acceptance:** First preview build succeeds and the project's "Source" in Vercel shows `raoole20/m2-front`.

### TASK-101: Create Vercel project `m2-web-admin` pointing at `raoole20/m2-front`
- **Depends on:** TASK-094
- **Satisfies:** REQ-DEPLOY-001, REQ-DEPLOY-004
- **Implements:** design §14.1
- **Steps:**
  1. In Vercel, import the **same** `raoole20/m2-front` repo (both web Vercel projects share the monorepo; Vercel supports multiple projects per repo with different Root Directories).
  2. Create project `m2-web-admin` with Root Directory `apps/admin`.
  3. Set install/build/ignore commands per design §14.1.
- **Acceptance:** First preview build succeeds; BOTH Vercel projects list `raoole20/m2-front` as their Source.

### TASK-102: Configure env vars on both Vercel projects (placeholders)
- **Depends on:** TASK-100, TASK-101
- **Satisfies:** REQ-DEPLOY-003, REQ-API-004
- **Implements:** design §14.2
- **Steps:**
  1. On landing: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_DEFAULT_LOCALE`.
  2. On admin: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_LANDING_URL`, `NEXT_PUBLIC_DEFAULT_LOCALE`.
  3. Use placeholder values where production URL unknown (document open items §7 of spec); user updates real values later.
- **Acceptance:** Both projects list the required env vars in their Vercel settings.

### TASK-103: Document DNS configuration for production domains
- **Depends on:** TASK-102
- **Satisfies:** REQ-DEPLOY-002
- **Implements:** design §14.3
- **Files:**
  - `README.md` (modified — DNS section)
- **Steps:**
  1. Document CNAME/A records: `motomoto.app` → Vercel landing, `www.motomoto.app` 308→ apex, `app.motomoto.app` → Vercel admin. Note: mobile has no Vercel domain — it ships via EAS.
  2. Tell user (in phase handoff message) to perform DNS changes; do not attempt yourself.
- **Acceptance:** `README.md` has a "Production DNS" section with exact record values and an explicit note that mobile is NOT on Vercel.

### TASK-104: Ship preview deploy and verify both URLs point at the same monorepo
- **Depends on:** TASK-102
- **Satisfies:** REQ-DEPLOY-004
- **Implements:** design §14.1
- **Steps:**
  1. Open a small test PR against `raoole20/m2-front`; confirm Vercel posts BOTH preview URLs (landing + admin) referencing the same commit SHA.
  2. Hit both preview URLs and verify 200.
  3. Confirm the Vercel deployment logs for both projects reference `raoole20/m2-front` (not two separate repos).
- **Acceptance:** Preview URLs return 200 for `/` (landing) and `/admin/login` (admin); both deployments reference the same monorepo commit.

---

## REQ coverage note

Every REQ id from `spec.md` (60 total across A-K) is referenced by at least one task above. No REQ ids were found uncovered during authoring. Non-functional items (§2) are covered by TASK-092 (perf) and TASK-093 (typecheck/lint/i18n grep).
