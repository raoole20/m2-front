# Proposal — m2-web-monorepo-setup

> Phase: `sdd-propose` · Change: `m2-web-monorepo-setup` · Date: 2026-04-19
> Input: `explore.md` (same folder) + authoritative user answers to the 10 open questions.
> This is a **proposal only** — no implementation, no scaffolding.

---

## 1. Summary

**Baseline (post-migration).** The precursor change `mobile-to-monorepo-migration` has already converted `raoole20/m2-front` (mirror: `Ramsesdb/motomoto`) into a **Turborepo + pnpm** monorepo. At the start of this change the repo already contains: root `pnpm-workspace.yaml`, `turbo.json`, root `package.json` (pnpm 9.x, `packageManager`), `tsconfig.base.json`, `.npmrc`, `.gitignore`, `.nvmrc`; `apps/mobile/` (the existing Motomoto Expo app); `packages/types` (`@m2/types`, shared TS types); `packages/design` (`@m2/design`, design tokens).

This change extends that baseline by adding two **Next.js 15 App Router** apps — `apps/landing` (public marketing, `motomoto.app`) and `apps/admin` (role-gated dashboard, `app.motomoto.app`) — plus three new shared packages: `packages/ui` (web-only React components), `packages/api-client` (typed fetch client + Swagger codegen; web-only in v1), and `packages/i18n` (next-intl config + shared messages; web-only in v1). Both apps ship bilingual (ES + EN, `es` default) via **next-intl** locale-prefixed routes, consume the existing `m2-back` REST API with typed clients generated from Swagger, and deploy to **Vercel** as two independent projects sourced from the `raoole20/m2-front` monorepo root. v1 intentionally defers realtime, Sentry, analytics, feature flags, invites, signup, and the `CLIENT` role.

---

## 2. Motivation

| Driver | Why now |
|---|---|
| **Backend is ready** | `m2-back` REST surface (`/api/auth/*`, `/api/conversations`, etc.) is stable; no data-layer blockers. |
| **Desktop inbox demand** | Prospects repeatedly ask for a desktop triage experience; agents on mobile-only is limiting. |
| **Sales needs a URL** | `motomoto.app` must exist for outbound, investor decks, and social bios. |
| **Design-system leverage** | Building UI primitives once (`packages/ui`) pays off across landing + admin + future surfaces (client portal, partner dashboards). |
| **Mobile is stable** | Phase-1 types + visual overhaul are complete — cognitive bandwidth is available for a web push. |
| **i18n from day one** | Cheap to add at greenfield, expensive to retrofit; market is primarily LatAm (`es`) but English docs/investors demand EN. |
| **Type safety end-to-end** | Generating types from Swagger locks the web against backend drift at compile time. |

---

## 3. Scope (IN — v1)

**Monorepo infrastructure (extends precursor baseline)**
- Baseline already set by `mobile-to-monorepo-migration`: pnpm workspaces + Turborepo, root configs, `.npmrc` hoisting for Expo, `.nvmrc`, `.gitattributes`, `apps/mobile/`, `packages/types`, `packages/design` all present on `main` of `raoole20/m2-front`.
- **This change adds:** `pnpm`/Turborepo **task additions** (`generate:api`), shared `eslint`, `prettier`, `tailwind` presets (new `packages/config` — if not already created by precursor; otherwise extended), and the new apps + packages listed below.
- Repo: **`raoole20/m2-front`** (primary) with `Ramsesdb/motomoto` retained as mirror. No new private repo.
- Node **20.19.4** continues to be pinned via `.nvmrc`.

**Apps**
- `apps/landing` — Next.js 15 App Router, static/ISR, bilingual
  - Hero, channels strip, feature grid, AI highlight, testimonials, **"Contact sales" CTA** (mailto), footer
  - Text-based "m2" logo, `simple-icons` / `lucide` channel icons, initials-circle testimonial avatars
  - Port `:3001` locally
- `apps/admin` — Next.js 15 App Router, client-side SPA-style auth, bilingual
  - `/[locale]/admin/login`, `/[locale]/admin`, `/[locale]/admin/inbox`, `/[locale]/admin/inbox/[id]`, `/[locale]/admin/profile`
  - Middleware guards all `/[locale]/admin/*` except `login`
  - Port `:3002` locally

**Shared packages**
- `packages/ui` — design-system components (GlassCard, GradientButton, KPICard, MeshGradient, AuraGlow, FilterTab, SunkenInput, Avatar, ConversationCard, …)
- `packages/design` — tokens (colors, typography, spacing, radius, glows) as TS constants **and** CSS variables
- `packages/api-client` — `openapi-typescript`-generated types + thin `fetch` wrapper (auth header injection, envelope unwrap, 401 → refresh/logout)
- `packages/i18n` — shared `next-intl` config, locales list, and **common** message keys (brand, channel names, shared CTAs); app-specific copy lives in each app

**i18n**
- **next-intl** with locale-prefixed routes: `/es/...` (default), `/en/...`
- Middleware handles locale detection + redirect
- Supported locales: `['es', 'en']`
- `messages/{es,en}.json` per app; shared keys in `packages/i18n/messages/{es,en}.json`
- **No hardcoded user-facing strings** — every label/copy uses `useTranslations()`
- Placeholder copy in both locales (user refines later)

**Auth flow (v1)**
- `POST /api/auth/login` → `{ accessToken, refreshToken }` stored in `localStorage` (documented v2 migration to httpOnly cookies)
- `GET /api/auth/me` on app mount → hydrate user store
- `POST /api/auth/refresh` on 401 with one retry, then logout
- Route protection via middleware + client guard (role check: `OWNER | ADMIN | AGENT`)

**Data**
- TanStack Query for server state, Zustand for UI state
- Polling every 5s on inbox (pause on `visibilitychange`)
- Response envelope `{ success, data, meta }` unwrapped centrally

**Deploy**
- **Vercel**, two projects (landing, admin)
- Prod domains: `motomoto.app`, `app.motomoto.app`
- Preview URLs per PR

---

## 4. Non-goals (OUT — v1)

- **No** signup / registration UI (backend `register` creates a new tenant — not end-user flow)
- **No** password reset / email verification
- **No** user invites (admin cannot create ADMIN/AGENT accounts from UI)
- **No** WebSocket / SSE realtime — 5s polling only
- **No** `CLIENT` role support (backend doesn't expose it)
- **No** file uploads / media previews
- **No** SSR auth / httpOnly cookies
- **No** Sentry or error monitoring
- **No** analytics / telemetry (Plausible, PostHog, Vercel Analytics all deferred)
- **No** feature flag system (YAGNI)
- **No** subdomain-per-tenant routing (single `app.motomoto.app` for all tenants)
- **No** E2E tests (Playwright); unit tests only if time permits
- **No** Storybook or component catalogue
- **No** PWA / offline support
- **No** real brand assets (logo, channel logos, testimonial photos) — placeholders only
- **No** real pricing tiers (single "Contact sales" CTA)
- **No** language switcher UI polish — minimal dropdown only
- **No** Turbo remote cache tuning beyond Vercel defaults

---

## 5. High-level approach

- **Build on the post-migration baseline**: `raoole20/m2-front` already contains `apps/mobile`, `packages/types`, `packages/design`, root pnpm+Turborepo configs, and `.npmrc` hoisting compatible with Expo. This change does not re-bootstrap any of that; it adds on top.
- **One framework, two NEW apps**: Next.js 15 App Router for both landing and admin — shared tooling, one mental model, Vercel-native. Mobile continues to live in `apps/mobile/` (unchanged by this change; Expo + RN + Metro).
- **Tokens as the source of truth (already shared)**: `packages/design` (already created by the precursor) is consumed by mobile today; this change extends it with web-facing outputs (CSS custom properties / Tailwind preset building blocks) so both surfaces stay in sync.
- **Thin apps, fat packages**: Apps contain routes, layouts, and copy; all reusable UI, fetching, and i18n primitives live in `packages/*`.
- **Split web vs native packages explicitly**: `packages/ui` is **web-only** (React DOM). Mobile keeps `apps/mobile/src/components/` and does not import from `@m2/ui` in v1. `packages/api-client` and `packages/i18n` are likewise web-only in v1; mobile retains its own `src/services/` (axios-based) and does not use next-intl.
- **i18n-first routing (web)**: Every user-facing web route is locale-prefixed (`/[locale]/...`); middleware handles detection, redirect, and default (`es`). No string is hardcoded.
- **Typed API client (web)**: `openapi-typescript` generates types from `GET /api/docs-json`; a hand-written ~80-line `fetch` wrapper handles auth + envelope + refresh.
- **Client-state dashboard**: Admin is a client-rendered SPA under Next; only layouts/shells are RSC. Keeps auth logic simple with `localStorage`.
- **Polling over push**: TanStack Query `refetchInterval: 5000` with visibility-aware pause; zero backend changes required.
- **Two Vercel projects, one monorepo**: Each app deploys independently with its own `vercel.json`, both pointing at `raoole20/m2-front` as the source; Turborepo handles monorepo-aware builds. Mobile is NOT on Vercel — EAS Build handles mobile releases.
- **Spanish-first, English-parity**: `es` is the default locale; `en` is a first-class citizen but copy is placeholder until product writes real.

---

## 6. Architecture diagram

> **Workspace count after v1**: 3 apps (`mobile`, `landing`, `admin`) + 5 packages (`types`, `design`, `ui`, `api-client`, `i18n`) = **8 total workspaces**. `mobile`, `types`, `design` and the root infra files exist BEFORE this change (added by precursor `mobile-to-monorepo-migration`); everything else below is added by THIS change.

```
m2-front/                               # raoole20/m2-front (primary) · Ramsesdb/motomoto (mirror)
├── .github/workflows/ci.yml            # typecheck + lint + build on PR  (extended in this change)
├── .nvmrc                              # 20.19.4                          [precursor]
├── .gitattributes                      # text=auto eol=lf                 [precursor]
├── .npmrc                              # pnpm hoisting for Expo           [precursor]
├── pnpm-workspace.yaml                 # apps/* + packages/*              [precursor]
├── turbo.json                          # pipeline additions this change  [extended]
├── tsconfig.base.json                  # strict base                      [precursor]
├── package.json                        # pnpm@9, packageManager           [precursor]
│
├── apps/
│   ├── mobile/                         # Expo · @m2/mobile          [precursor — unchanged by this change]
│   ├── landing/                        # motomoto.app  (port :3001)
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │   ├── (landing)/
│   │   │   │   │   ├── page.tsx        # hero, features, testimonials, CTA
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   └── contact/page.tsx (optional v1 form)
│   │   │   │   └── layout.tsx          # NextIntlClientProvider
│   │   │   └── layout.tsx              # root html
│   │   ├── messages/{es,en}.json
│   │   ├── middleware.ts               # next-intl locale middleware
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts          # extends @m2/config/tailwind
│   │   └── vercel.json
│   │
│   └── admin/                          # app.motomoto.app  (port :3002)
│       ├── app/
│       │   ├── [locale]/
│       │   │   └── admin/
│       │   │       ├── login/page.tsx
│       │   │       ├── page.tsx              # dashboard home
│       │   │       ├── inbox/page.tsx
│       │   │       ├── inbox/[id]/page.tsx
│       │   │       ├── profile/page.tsx
│       │   │       └── layout.tsx            # auth guard (client)
│       │   └── layout.tsx
│       ├── messages/{es,en}.json
│       ├── middleware.ts                     # next-intl + auth redirect
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       └── vercel.json
│
└── packages/
    ├── types/                          # @m2/types  [precursor — shared TS types]
    │   └── (user, channel, message, conversation, api, websocket)
    │
    ├── design/                         # @m2/design  (tokens only)  [precursor — extended here for web]
    │   ├── src/
    │   │   ├── colors.ts               # (already present; extend with web-facing outputs)
    │   │   ├── typography.ts
    │   │   ├── spacing.ts
    │   │   ├── radii.ts                # NEW (this change)
    │   │   ├── glows.ts                # NEW (this change)
    │   │   ├── tailwind-preset.ts      # NEW (this change — web-only building blocks)
    │   │   └── index.ts
    │   ├── css/tokens.css              # NEW (this change — CSS variables for web)
    │   └── package.json
    │
    ├── ui/                             # @m2/ui  (React components — WEB ONLY)
    │   ├── src/
    │   │   ├── GlassCard.tsx
    │   │   ├── GradientButton.tsx
    │   │   ├── KPICard.tsx
    │   │   ├── MeshGradient.tsx
    │   │   ├── AuraGlow.tsx
    │   │   ├── FilterTab.tsx
    │   │   ├── SunkenInput.tsx
    │   │   ├── Avatar.tsx
    │   │   ├── ConversationCard.tsx
    │   │   └── index.ts
    │   └── package.json
    │
    ├── api-client/                     # @m2/api-client
    │   ├── src/
    │   │   ├── generated/schema.d.ts   # from openapi-typescript
    │   │   ├── fetcher.ts              # auth header + envelope unwrap + 401 refresh
    │   │   ├── auth.ts                 # login, refresh, logout, me
    │   │   ├── conversations.ts
    │   │   ├── contacts.ts
    │   │   └── index.ts
    │   ├── scripts/generate.ts         # fetches /api/docs-json → schema.d.ts
    │   └── package.json
    │
    ├── i18n/                           # @m2/i18n
    │   ├── src/
    │   │   ├── config.ts               # locales, defaultLocale, routing
    │   │   └── index.ts
    │   ├── messages/{es,en}.json       # shared keys (brand, channels, shared CTAs)
    │   └── package.json
    │
    └── config/                         # @m2/config (presets, not runtime)
        ├── tsconfig/base.json
        ├── tsconfig/nextjs.json
        ├── tsconfig/react-library.json
        ├── eslint/index.js
        ├── prettier/index.js
        └── tailwind/preset.js
```

---

## 7. Tech stack decisions

| Choice | Alternatives considered | Rationale |
|---|---|---|
| **Turborepo** | Nx, plain pnpm workspaces, Bun | Minimal config (~20 lines `turbo.json`), Vercel-native remote cache, task graph + caching without Nx's ceremony. Nx's generators are overkill for 2 apps + 5 packages. |
| **pnpm 9** | npm, Yarn Berry, Bun | Fast, disk-efficient, strict peer resolution catches monorepo bugs early; matches what the mobile team knows. Bun on Windows + Next 15 still has sharp edges. |
| **Next.js 15 (App Router)** for both apps | Astro landing + Next admin; Remix; Vite+RR | One framework, one mental model, one deploy pattern. RSC + ISR suit landing; middleware suits admin auth guard. Two-framework split doubles maintenance for minor landing JS savings. |
| **TypeScript strict** | Loose TS, JS | Matches mobile; catches envelope/role bugs at compile time. Non-negotiable. |
| **Tailwind CSS v4** | CSS Modules, vanilla-extract, Panda, Emotion | **Picked**. Tailwind v4's `@theme` directive maps cleanly to `packages/design` CSS vars; zero-runtime, fastest iteration, dark-first is trivial. CSS Modules would force bespoke utility layers — slower DX for no meaningful gain. Panda adds a compile step we don't need. |
| **next-intl** | react-i18next, next-i18next, Lingui | First-class App Router support, static-rendering-friendly, typed message keys, tree-shakeable. react-i18next's App Router story is weaker; next-i18next is Pages-Router-era. |
| **openapi-typescript** for Swagger codegen | Orval, @hey-api/openapi-ts, hand-written | **Picked**. Types only — no runtime bloat. We write one small `fetch` wrapper (auth + envelope + refresh). Orval generates a full SDK with React Query hooks but bakes in assumptions about error shape + auth that don't match our envelope; customization costs more than it saves. Reconsider Orval if we adopt TanStack Query codegen patterns broadly post-v1. |
| **TanStack Query v5 + Zustand** | SWR, Redux Toolkit, plain fetch | TanStack Query gives polling, stale-while-revalidate, and cache invalidation out of the box; Zustand mirrors the mobile app's state shape. SWR is a peer — TQ's ecosystem is richer. |
| **localStorage JWT (v1 only)** | httpOnly cookies, sessionStorage, in-memory | Works with existing backend (no `Set-Cookie` yet); documented v2 migration. Strict CSP mitigates XSS. |
| **Vitest + Testing Library** | Jest, Playwright | Fast, ESM-native, Vite-native; used sparingly in v1 for critical utilities + auth guard. Playwright deferred. |
| **Vercel** deploy | Cloudflare Pages, self-host Docker | Native Next 15 + Turbo remote cache, preview URLs per PR, two independent projects from one repo. Cloudflare edge has App Router compat sharp edges; self-host = ops burden we don't need. |
| **`simple-icons` + `lucide`** | Font Awesome, custom SVGs, real brand assets | Legal-safe official brand marks (`simple-icons`) + consistent utility icons (`lucide`); no designer bottleneck for v1. |
| **bcrypt-parity** | — | **Not needed**. Password hashing is backend-only; web never handles raw passwords beyond HTTPS POST. |

---

## 8. Auth flow

### 8.1 Login
1. User visits `/[locale]/admin/login`.
2. Submits email + password → `POST /api/auth/login`.
3. Response: `{ success: true, data: { accessToken, refreshToken, user } }`.
4. Client wrapper unwraps envelope, writes tokens to `localStorage`, hydrates Zustand `authStore` with `user`.
5. Redirect to `/[locale]/admin` (or original intent if present).

### 8.2 Session bootstrap (app mount)
1. On mount, admin layout reads `accessToken` from `localStorage`.
2. If present → `GET /api/auth/me`; on success, hydrate `authStore`.
3. If `401` → attempt refresh (see 8.3); on failure → redirect to login.
4. If absent → redirect to `/[locale]/admin/login`.

### 8.3 Refresh (401 recovery)
1. Any `fetch` wrapped call returning 401 triggers a single refresh attempt.
2. `POST /api/auth/refresh` with `refreshToken` → new `accessToken` (+ possibly new `refreshToken`).
3. On success: retry original request once.
4. On failure: clear `localStorage`, clear `authStore`, redirect to `/[locale]/admin/login?reason=expired`.

### 8.4 Logout
1. Clear `localStorage` tokens.
2. Clear `authStore` + TanStack Query cache (`queryClient.clear()`).
3. Redirect to `/[locale]/admin/login`.

### 8.5 Route protection
- **Next middleware** on admin app: if path matches `/[locale]/admin/*` (except `/login`) AND no `accessToken` cookie hint (we set a **non-httpOnly sentinel cookie** on login purely for SSR redirect decisions; auth of record stays in `localStorage`) → redirect to `/[locale]/admin/login`.
- **Client guard** in admin layout: if `authStore.user` is null after bootstrap → redirect.

### 8.6 Role gating
- Roles: `OWNER | ADMIN | AGENT` (no `CLIENT` in v1).
- Client helper `hasMinRole(role, required)` using a fixed hierarchy constant (mirrors mobile `ROLE_HIERARCHY`).
- Menu items, buttons, and whole routes hide/disable via `hasMinRole()` checks — never raw equality (`user.role === 'OWNER'`).
- Attempting to hit a gated route from URL → soft redirect to `/[locale]/admin` with a toast.

---

## 9. Backend integration

### 9.1 Consuming `/api/*`
- All calls go through `@m2/api-client`'s `fetcher(path, init)`.
- Fetcher responsibilities:
  1. Prepend `process.env.NEXT_PUBLIC_API_URL` (e.g. `http://localhost:3000/api` dev, `https://api.motomoto.app/api` prod — TBD).
  2. Inject `Authorization: Bearer <accessToken>` if present.
  3. Parse response; if `response.success === false` → throw typed `ApiError`.
  4. Return `response.data` only (envelope unwrapped).
  5. On 401 → refresh once, retry once (see §8.3).
- Higher-level resource modules (`auth.ts`, `conversations.ts`, `contacts.ts`) are **thin typed wrappers** over `fetcher` using generated types.

### 9.2 Codegen workflow
- Script `packages/api-client/scripts/generate.ts`:
  1. `curl http://localhost:3000/api/docs-json` (or prod URL in CI) → JSON.
  2. Pipe through `openapi-typescript` → `src/generated/schema.d.ts`.
- Exposed as root script: `pnpm generate:api`.
- CI check: run `pnpm generate:api` and fail if `git diff` is non-empty → forces regeneration on backend changes.
- Versioned into git (committed types), not generated at build time — keeps builds reproducible and offline.

### 9.3 Envelope unwrapping
- Backend always returns `{ success: boolean, data?: T, error?: { code, message, details? }, meta?: {...} }`.
- Fetcher unwraps `data` on success, throws structured `ApiError` on failure.
- Resource modules return `T` directly (not envelope) to callers — callers never see `{ success, data }`.
- Pagination: when backend returns paginated payloads, `meta` is preserved on a secondary return shape (`{ data, meta }`) for list endpoints.

---

## 10. Deployment plan

### 10.1 Vercel projects

| Project | Root dir | Framework | Prod domain | Preview |
|---|---|---|---|---|
| `m2-web-landing` | `apps/landing` | Next.js | `motomoto.app` (+ `www.motomoto.app` redirect) | `*.vercel.app` per PR |
| `m2-web-admin` | `apps/admin` | Next.js | `app.motomoto.app` | `*.vercel.app` per PR |

Both projects configured with:
- **Root Directory**: respective `apps/*`
- **Install Command**: `pnpm install --frozen-lockfile` (from repo root; Vercel monorepo-aware)
- **Build Command**: `turbo build --filter=<app>...`
- **Node**: 20.x

### 10.2 Environment variables

| Var | Where | Dev | Prod |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | both apps | `http://localhost:3000/api` | `https://api.motomoto.app/api` (TBD) |
| `NEXT_PUBLIC_LANDING_URL` | admin (for "Back to site" links) | `http://localhost:3001` | `https://motomoto.app` |
| `NEXT_PUBLIC_ADMIN_URL` | landing (for "Log in" CTA) | `http://localhost:3002` | `https://app.motomoto.app` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | both | `es` | `es` |

No secrets in v1 (no Sentry, no analytics). Backend URL is public by design.

### 10.3 Preview deploys
- Every PR produces two preview URLs (landing + admin).
- Preview admin points at **staging backend** (TBD) via `NEXT_PUBLIC_API_URL` preview override.
- `.vercelignore` excludes the other app's dir per project to keep builds fast.

### 10.4 DNS
- `motomoto.app` → Vercel (landing)
- `www.motomoto.app` → redirect to apex
- `app.motomoto.app` → Vercel (admin)
- `api.motomoto.app` → (backend team; out of scope for this change)

---

## 11. Milestones

| # | Milestone | Deliverable |
|---|-----------|-------------|
| 0 | **Post-migration baseline verified** | Precursor change `mobile-to-monorepo-migration` has merged to `main` on `raoole20/m2-front`; `pnpm install` succeeds from a fresh clone; `apps/mobile` boots via `pnpm --filter @m2/mobile start`; `packages/types` and `packages/design` resolve. (NOT a deliverable of THIS change — a gating precondition.) |
| 1 | Shared config | `packages/config` with tsconfig/eslint/prettier/tailwind presets (extends precursor's `tsconfig.base.json`) |
| 2 | Design tokens (web outputs) | `packages/design` extended with `radii`, `glows`, `tailwind-preset.ts`, and `css/tokens.css` for web consumption — mobile consumption unchanged |
| 4 | UI primitives | `packages/ui` with GlassCard, GradientButton, MeshGradient, etc. |
| 5 | API client | `packages/api-client` with generated types + fetcher + auth/conversations/contacts modules |
| 6 | i18n package | `packages/i18n` with next-intl config, locales, shared messages |
| 7 | Landing skeleton | `apps/landing` boots on `:3001`, renders bilingual hero + footer using tokens + UI |
| 8 | Admin skeleton + auth | `apps/admin` boots on `:3002`, login flow works end-to-end against local backend, middleware + route guard active |
| 9 | Inbox MVP | `/admin/inbox` lists conversations (polling 5s), detail view shows messages |
| 10 | Profile + logout | `/admin/profile` shows `me`, logout clears state and redirects |
| 11 | Landing content v1 | Features grid, AI highlight, testimonials (placeholder), "Contact sales" CTA, full ES + EN placeholder copy |
| 12 | Vercel deploy | Both apps deployed to Vercel, previews working on PRs, prod domains connected |
| 13 | v1 launch | Tag `v0.1.0`, post-launch smoke test on `motomoto.app` + `app.motomoto.app` |

---

## 12. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Backend Swagger drift → stale client types | Medium | Medium | `pnpm generate:api` + CI diff check; run on every backend release tag |
| CORS tightens mid-development, breaks local dev | Low | High | Document `ALLOWED_ORIGINS` request to backend team; fail loudly with actionable error |
| `localStorage` JWT + XSS | Medium | High | Strict CSP headers via Next middleware; ban `dangerouslySetInnerHTML` without sanitizer; plan v2 cookie migration; document in README |
| 5s polling × many tabs hammers backend | Low | Medium | Pause polling on `visibilitychange: hidden`; exponential backoff on 429 |
| Tailwind v4 + Next 15 + pnpm on Windows quirks | Medium | Low | Pin exact versions; `.gitattributes` `eol=lf`; documented known-good `pnpm` version |
| Design drift between mobile and web tokens | High | Medium | One source of truth in `packages/design`; future one-way codegen into mobile's `src/design/` |
| RSC vs client-component confusion in admin | Medium | Medium | Convention: admin pages default to `"use client"`; only outer layouts + landing are RSC; document in repo CLAUDE.md |
| next-intl middleware conflicts with auth middleware | Medium | Medium | Compose a single middleware chain: i18n first, then auth redirect; write an integration test |
| Vercel monorepo build misconfig → wrong app deploys | Low | Medium | Explicit `Root Directory` per project; `turbo` filter in build command; validate on first deploy |
| Missing `CLIENT` role leaks into admin UI | Low | Low | Role enum typed from backend codegen; TypeScript prevents unknown roles |
| **NEW — i18n key sprawl** between apps | Medium | Low | Enforce: shared keys in `packages/i18n`, app-specific in app; lint rule can be added later |
| **NEW — "Contact sales" mailto is spam magnet** | Medium | Low | Use `contact@motomoto.app` alias with aggressive server-side filtering; migrate to form + reCAPTCHA post-v1 |
| **NEW — Preview deploys need staging backend** | Medium | Medium | Coordinate with backend team for a `api-staging.motomoto.app` before production launch; fall back to pointing previews at prod API read-only if needed |
| **NEW — SEO on `/` without locale prefix** | Medium | Medium | next-intl middleware must serve default locale at `/` (not force redirect to `/es`) OR accept the redirect hit; pick the "as-needed" prefix strategy (`localePrefix: 'as-needed'`) so `motomoto.app` → ES content without redirect |

---

## 13. Success criteria

v1 is done when **all** of the following are true:

- [ ] `pnpm install && pnpm dev` from a fresh clone starts both apps on `:3001` and `:3002` with zero manual steps (assuming backend on `:3000`).
- [ ] `pnpm typecheck` passes across all packages and apps (zero errors, no `any`, no `!`).
- [ ] `pnpm generate:api` regenerates types from running backend's Swagger JSON.
- [ ] Landing renders at `/` (ES, default) and `/en` with hero, features, testimonials, "Contact sales" CTA, and footer — all strings from message files.
- [ ] Admin login works: credentials → logged in, tokens in `localStorage`, `/admin` shows dashboard.
- [ ] Admin inbox lists conversations and auto-refreshes every 5s; detail view shows messages.
- [ ] Protected routes redirect unauthenticated users to `/[locale]/admin/login`.
- [ ] Role gating demonstrably hides at least one OWNER-only UI element from AGENT users.
- [ ] Language switcher toggles between ES and EN with URL prefix; page content updates.
- [ ] Both apps deploy to Vercel on push to `main`; PRs produce working preview URLs.
- [ ] Prod domains `motomoto.app` and `app.motomoto.app` serve their respective apps over HTTPS.
- [ ] Design tokens visibly match the mobile app's "Luminous Executive" theme (dark bg, glass cards, primary `#ADC6FF`, Manrope + Inter, colored glows, no black shadows).
- [ ] `raoole20/m2-front` has CI passing on `main` (covering mobile typecheck + web typecheck + lint + next build), and has a README with setup instructions for all three apps.
- [ ] Mobile (`apps/mobile`) continues to build and run unchanged; `pnpm --filter @m2/mobile start` still launches Expo.

---

## 14. Follow-ups (post-v1 backlog)

- **CLIENT role** — once backend adds it, extend `ROLE_HIERARCHY` and add client-portal routes
- **User invites** — backend endpoint + admin UI to invite ADMIN/AGENT to a tenant
- **Signup / self-service registration** — public tenant signup flow
- **Password reset + email verification** — standard auth hygiene before public launch
- **WebSocket realtime** — replace 5s polling with push once backend gateway ships
- **Cookie-based auth (httpOnly)** — migrate off `localStorage` JWT once backend issues `Set-Cookie`
- **Sentry** — add `packages/observability`; wire both apps before production launch
- **Analytics** — Plausible or Vercel Analytics on landing; optional on admin
- **Feature flags** — revisit if we need staged rollouts
- **File uploads / media previews** — attach files to messages, render in conversation
- **CSP headers + security audit** — lock down before public launch
- **E2E tests** — Playwright for critical flows (login, send message)
- **Storybook** — component catalogue for design-system consumers
- **Subdomain-per-tenant** — if product needs `acme.motomoto.app` branded portals
- **Mobile ↔ web token sync codegen** — one-way emit from `packages/design` to mobile `src/design/`
- **Real content & assets** — replace placeholder copy, logo, testimonials, channel icons
- **Pricing page** — real tiers + self-serve checkout (Stripe)

---

## 15. Rollback plan

Because this change **adds** to an existing monorepo (it does NOT create or replace the repo) and has no prod web traffic yet:

- **Pre-prod-domain stage**: Rollback = delete the two Vercel projects (`m2-web-landing`, `m2-web-admin`) and revert the feature branch. The monorepo, mobile app, shared packages, and all git history remain intact. **Do NOT delete `raoole20/m2-front`** — it contains the live mobile app.
- **Post-domain, pre-launch**: Point `motomoto.app` / `app.motomoto.app` DNS back to a holding page; redeploy web when fixed. Mobile unaffected.
- **Post-launch**: v1 is read-mostly against a stable backend; rolling a bad web deploy = `vercel rollback` to previous good deployment per project (Vercel retains last 100). Mobile release lifecycle is independent (EAS).
- No database migrations to undo (we don't own the DB).
- No auth schema changes (we consume existing backend auth).

---

## 16. Dependencies

- **External**
  - `m2-back` backend reachable at a documented URL (local `:3000` for dev; staging + prod TBD)
  - `raoole20/m2-front` monorepo available and precursor change `mobile-to-monorepo-migration` merged to `main`
  - Vercel account + project creation permissions (two new projects will point at `raoole20/m2-front`)
  - DNS control for `motomoto.app` (to be done before deploy milestone)

- **Internal (this project)**
  - Post-migration baseline: `apps/mobile`, `packages/types`, `packages/design`, root pnpm+Turborepo configs already on `main`
  - Stitch "Luminous Executive" project for visual truth
  - Backend Swagger JSON available at `/api/docs-json`

---

## 17. Contradictions with explore.md (flagged, not silently overridden)

| # | explore.md said | User answer (authoritative) | Resolution |
|---|-----------------|------------------------------|------------|
| 6 | "v1 ships Spanish only; no language switcher" (explicit non-goal, §3.2) | i18n required from v1, ES + EN, next-intl, locale-prefixed routes | **Overridden** — i18n is IN scope. This is a material scope expansion over exploration; budget reflects it (locale-prefixed routes, messages files, middleware composition). |
| 8 | Pricing section open question — "Real tiers, or Contact sales only?" | Single "Contact sales" CTA | **Clarified** — no tiers, mailto CTA. |
| 7 | Brand assets open question | No real assets; text "m2" + simple-icons/lucide + initials avatars | **Clarified** — placeholder strategy locked in. |
| — | Exploration recommended `packages/tokens` | Task asks for `packages/design` | **Renamed** — semantic equivalent; picked `packages/design` to match mobile's `src/design/` naming for parity. No functional change. |

---

## 18. New risks surfaced during proposal (not in explore.md)

1. **i18n key sprawl** between apps (added to §12)
2. **"Contact sales" mailto is spam magnet** (added to §12)
3. **Preview deploys need a staging backend** — explore.md assumed local backend for dev; Vercel previews don't have that (added to §12)
4. **SEO with locale prefix on apex `/`** — next-intl's `localePrefix` strategy needs deliberate choice (`as-needed`) to avoid `motomoto.app` → `/es` redirects that hurt sharing + SEO (added to §12)
5. **Middleware composition** — next-intl + auth redirect must be a single chained middleware; documented as a known integration point (added to §12)

---

## 19. Ready for `sdd-spec`?

**Yes.** All 10 open questions from exploration are answered with authoritative user decisions. Scope, non-goals, architecture, auth flow, and deployment plan are concrete. Spec phase can now enumerate requirements and scenarios per surface (landing, admin login, admin inbox, auth guard, i18n routing, api-client).
