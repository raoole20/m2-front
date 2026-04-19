# Design — m2-web-monorepo-setup

> Phase: `sdd-design` · Change: `m2-web-monorepo-setup` · Date: 2026-04-19
> Companion to: `proposal.md` (WHY/WHAT) and `spec.md` (observable behavior).
> This document describes **HOW** the change will be implemented at an architecture level.
> Not a task list. Not a behavioral spec. Cross-references to proposal sections use `[proposal §N]`.

---

## 1. Architecture overview

### 1.1 System view — browsers → Vercel → backend

```
                    ┌────────────────────────────────────┐
                    │        End users (browsers)        │
                    │   ES (default) + EN, LatAm / US    │
                    └──────────────┬─────────────────────┘
                                   │ HTTPS
                ┌──────────────────┴───────────────────┐
                ▼                                      ▼
   ┌────────────────────────┐              ┌────────────────────────┐
   │  motomoto.app          │              │  app.motomoto.app      │
   │  Vercel: m2-web-landing│              │  Vercel: m2-web-admin  │
   │  Next.js 15 App Router │              │  Next.js 15 App Router │
   │  RSC + ISR (marketing) │              │  Client SPA (auth'd)   │
   │  :3001 local           │              │  :3002 local           │
   └─────────────┬──────────┘              └────────────┬───────────┘
                 │                                      │
                 │ (no API calls in v1 —                │ fetch /api/*
                 │  mailto CTA only)                    │ (Bearer JWT)
                 │                                      ▼
                 │                          ┌──────────────────────────┐
                 │                          │  api.motomoto.app        │
                 │                          │  m2-back (NestJS)        │
                 │                          │  /api/auth/*             │
                 │                          │  /api/conversations/*    │
                 │                          │  /api/contacts/*         │
                 │                          │  /api/docs-json (Swagger)│
                 │                          └──────────────────────────┘
                 │
                 ▼ (future, post-v1)
         Analytics / Plausible
```

### 1.2 Monorepo view — apps vs packages vs external

```
┌─────────────────────────────── m2-web (Turborepo + pnpm) ─────────────────────────────┐
│                                                                                        │
│  ┌───────────────────────────┐     ┌───────────────────────────┐                      │
│  │  apps/landing             │     │  apps/admin               │                      │
│  │  Next.js 15               │     │  Next.js 15               │                      │
│  │  - marketing pages        │     │  - login / dashboard      │                      │
│  │  - next-intl middleware   │     │  - inbox / profile        │                      │
│  │                           │     │  - auth + i18n middleware │                      │
│  └──────────┬────────────────┘     └──────────┬────────────────┘                      │
│             │ imports                         │ imports                               │
│             ▼                                 ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐                       │
│  │                packages/ui  (@m2/ui)                        │◀── React components  │
│  └──────────┬───────────────────────────┬─────────────────────┘                       │
│             │ uses tokens               │ uses shared i18n keys                       │
│             ▼                           ▼                                              │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐  │
│  │ packages/design        │  │ packages/i18n          │  │ packages/api-client    │  │
│  │ (@m2/design)           │  │ (@m2/i18n)             │  │ (@m2/api-client)       │  │
│  │ - colors, type, space  │  │ - next-intl config     │  │ - generated types      │  │
│  │ - radii, glows         │  │ - locales, routing     │  │ - fetcher + auth flow  │  │
│  │ - TS consts + CSS vars │  │ - shared messages      │  │ - resource modules     │  │
│  └────────────────────────┘  └────────────────────────┘  └───────────┬────────────┘  │
│                                                                       │ HTTP           │
│  ┌────────────────────────┐                                           │               │
│  │ packages/config        │   (presets, not runtime)                  │               │
│  │ - tsconfig, eslint,    │                                           │               │
│  │   prettier, tailwind   │                                           │               │
│  └────────────────────────┘                                           │               │
│                                                                       │               │
└───────────────────────────────────────────────────────────────────────┼───────────────┘
                                                                        │
                                                                        ▼
                                                           ┌──────────────────────────┐
                                                           │  External: m2-back API   │
                                                           │  /api/docs-json Swagger  │
                                                           └──────────────────────────┘
```

The rule is **thin apps, fat packages** [proposal §5]. Apps own routes, layouts, and app-specific copy; everything reusable (tokens, components, API client, i18n plumbing) lives in `packages/*`.

---

## 2. Monorepo topology

### 2.1 Directory tree (authoritative)

> Entries marked `[precursor]` were created by `mobile-to-monorepo-migration` and exist on `main` before this change. Entries marked `[this change]` are added by `m2-web-monorepo-setup`. Entries without annotation may exist already (created by precursor) or be authored here; reuse any precursor file rather than overwriting.

```
m2-front/                                   # raoole20/m2-front · Ramsesdb/motomoto (mirror)
├── .github/
│   └── workflows/
│       └── ci.yml                          # typecheck + lint + build matrix [extended]
├── .nvmrc                                  # 20.19.4                         [precursor]
├── .gitattributes                          # * text=auto eol=lf               [precursor]
├── .gitignore                              # node_modules, .next, .turbo, .vercel [precursor; extended]
├── .npmrc                                  # pnpm hoisting for Expo           [precursor]
├── .editorconfig                           #                                   [precursor]
├── pnpm-workspace.yaml                     # apps/*, packages/*               [precursor]
├── turbo.json                              # pipeline definitions             [precursor; extended]
├── package.json                            # root scripts, pnpm@9, engines: node 20.19.4 [precursor; extended]
├── tsconfig.base.json                      # strict base, bundler resolution  [precursor]
├── .eslintrc.base.cjs                      # shared ESLint flat config wrapper [this change]
├── .prettierrc.cjs                         #                                   [this change]
├── README.md                               # setup, dev, deploy               [precursor; extended]
│
├── apps/
│   ├── mobile/                             # Expo · @m2/mobile                [precursor — NOT touched by this change]
│   │   └── (app/, src/, app.json, eas.json, babel.config.js, metro.config.js, tsconfig.json, package.json)
│   │
│   ├── landing/                            # motomoto.app (:3001)             [this change]
│   │   ├── app/
│   │   │   ├── layout.tsx                  # root <html> (no locale) — delegates to [locale]
│   │   │   └── [locale]/
│   │   │       ├── layout.tsx              # NextIntlClientProvider, fonts, CSS vars
│   │   │       ├── page.tsx                # marketing home (hero, features, CTA)
│   │   │       └── (marketing)/
│   │   │           └── contact/
│   │   │               └── page.tsx        # (optional v1)
│   │   ├── messages/
│   │   │   ├── en.json
│   │   │   └── es.json
│   │   ├── public/
│   │   │   └── og-image.png                # placeholder
│   │   ├── middleware.ts                   # createMiddleware(nextIntlConfig)
│   │   ├── next.config.ts                  # next-intl plugin, transpilePackages
│   │   ├── tailwind.config.ts              # extends @m2/config/tailwind
│   │   ├── postcss.config.cjs
│   │   ├── tsconfig.json                   # extends @m2/config/tsconfig/nextjs
│   │   ├── vercel.json                     # per-app overrides
│   │   └── package.json
│   │
│   └── admin/                              # app.motomoto.app (:3002)
│       ├── app/
│       │   ├── layout.tsx                  # root <html>
│       │   └── [locale]/
│       │       ├── layout.tsx              # NextIntlClientProvider + QueryClientProvider
│       │       └── admin/
│       │           ├── layout.tsx          # "use client" — auth guard, nav chrome
│       │           ├── page.tsx            # dashboard home
│       │           ├── login/
│       │           │   └── page.tsx        # excluded from guard
│       │           ├── inbox/
│       │           │   ├── page.tsx        # list + polling
│       │           │   └── [id]/
│       │           │       └── page.tsx    # conversation detail
│       │           └── profile/
│       │               └── page.tsx        # /api/auth/me + logout
│       ├── messages/
│       │   ├── en.json
│       │   └── es.json
│       ├── middleware.ts                   # composed: i18n → auth
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── postcss.config.cjs
│       ├── tsconfig.json
│       ├── vercel.json
│       └── package.json
│
└── packages/
    ├── types/                              # @m2/types                        [precursor — NOT touched]
    │   ├── src/
    │   │   ├── user.ts, channel.ts, message.ts, conversation.ts,
    │   │   │   api.ts, websocket.ts, index.ts
    │   │   └── (…)
    │   └── package.json
    │
    ├── design/                             # @m2/design                       [precursor; extended]
    │   ├── src/
    │   │   ├── colors.ts                   # already populated by precursor
    │   │   ├── typography.ts               # already populated by precursor
    │   │   ├── spacing.ts                  # already populated by precursor
    │   │   ├── radii.ts                    # [this change] — add if not already present
    │   │   ├── glows.ts                    # [this change] — colored shadow presets
    │   │   ├── tailwind-preset.ts          # [this change] — Tailwind v4 preset consuming consts
    │   │   └── index.ts                    # extend barrel for new exports
    │   ├── css/
    │   │   └── tokens.css                  # [this change] — :root { --color-primary-container: #ADC6FF; ... }
    │   ├── tsconfig.json
    │   └── package.json
    │
    ├── ui/                                 # @m2/ui                           [this change — WEB-ONLY]
    │   ├── src/
    │   │   ├── primitives/
    │   │   │   ├── Button.tsx
    │   │   │   ├── Input.tsx
    │   │   │   └── index.ts
    │   │   ├── surfaces/
    │   │   │   ├── GlassCard.tsx
    │   │   │   ├── MeshGradient.tsx
    │   │   │   └── AuraGlow.tsx
    │   │   ├── controls/
    │   │   │   ├── GradientButton.tsx
    │   │   │   ├── FilterTab.tsx
    │   │   │   ├── SunkenInput.tsx
    │   │   │   └── LocaleSwitcher.tsx
    │   │   ├── data/
    │   │   │   ├── KPICard.tsx
    │   │   │   ├── Avatar.tsx
    │   │   │   └── ConversationCard.tsx
    │   │   └── index.ts                    # barrel export
    │   ├── tsconfig.json
    │   └── package.json
    │
    ├── api-client/                         # @m2/api-client
    │   ├── src/
    │   │   ├── generated/
    │   │   │   └── schema.d.ts             # openapi-typescript output (committed)
    │   │   ├── fetcher.ts                  # fetch wrapper (auth, envelope, 401 refresh)
    │   │   ├── token-store.ts              # TokenStore interface + browser impl
    │   │   ├── errors.ts                   # ApiError, NetworkError, ForbiddenError, …
    │   │   ├── unwrap.ts                   # generic envelope unwrap
    │   │   ├── auth.ts                     # login, refresh, logout, me
    │   │   ├── conversations.ts
    │   │   ├── contacts.ts
    │   │   └── index.ts
    │   ├── scripts/
    │   │   └── generate.ts                 # curl /api/docs-json → openapi-typescript
    │   ├── tsconfig.json
    │   └── package.json
    │
    ├── i18n/                               # @m2/i18n
    │   ├── src/
    │   │   ├── config.ts                   # locales, defaultLocale, pathname map
    │   │   ├── request.ts                  # getRequestConfig helper (shared)
    │   │   ├── navigation.ts               # createLocalizedPathnamesNavigation wrapper
    │   │   └── index.ts
    │   ├── messages/
    │   │   ├── en.json                     # shared keys (brand, channels, shared CTAs)
    │   │   └── es.json
    │   ├── tsconfig.json
    │   └── package.json
    │
    └── config/                             # @m2/config (presets only — no runtime)
        ├── tsconfig/
        │   ├── base.json                   # strict, bundler, lib: ES2023
        │   ├── nextjs.json                 # extends base, jsx: preserve, Next types
        │   └── react-library.json          # extends base, declaration: true
        ├── eslint/
        │   └── index.cjs                   # flat config, @typescript-eslint + next
        ├── prettier/
        │   └── index.cjs
        ├── tailwind/
        │   └── preset.js                   # re-exports @m2/design tailwind preset
        └── package.json
```

### 2.2 Purpose of each top-level entry

| Entry | Purpose | Origin |
|---|---|---|
| `apps/mobile` | Motomoto Expo app (RN 0.83, Expo SDK 55, Metro bundler). **Not touched by this change** — kept working. | Precursor |
| `apps/landing` | Public marketing site, statically renderable, bilingual, no auth | This change |
| `apps/admin` | Authenticated dashboard, client-rendered SPA over Next, bilingual | This change |
| `packages/types` | Shared TypeScript types (user, channel, message, conversation, api, websocket). Consumed by mobile today; Next apps may consume via standard pnpm workspace resolution. | Precursor |
| `packages/design` | Design tokens as TS consts + (new) CSS vars + (new) Tailwind preset — the visual source of truth, consumed by BOTH mobile (TS consts) and web (TS consts + CSS vars + Tailwind preset). | Precursor (extended here) |
| `packages/ui` | Reusable React DOM components composing tokens. **Web-only** (uses `<div>`, Tailwind, next-intl). Mobile does NOT import from this package in v1. | This change |
| `packages/api-client` | Typed HTTP client + token store + envelope/error handling. **Web-only** in v1; mobile keeps `apps/mobile/src/services/` with its own axios-based client. | This change |
| `packages/i18n` | Shared next-intl config, navigation helpers, and common message keys. **Web-only** in v1; mobile does not use next-intl. | This change |
| `packages/config` | Dev-time presets: tsconfig, eslint, prettier, tailwind — not imported at runtime. Extends (not replaces) root `tsconfig.base.json`. | This change (or precursor if already present) |
| `turbo.json` | Task graph: `dev`, `build`, `lint`, `typecheck`, `generate:api` | Precursor (extended) |
| `pnpm-workspace.yaml` | Lists `apps/*` and `packages/*` as workspace roots | Precursor |
| `tsconfig.base.json` | Strict base every package/app extends | Precursor |
| `.npmrc` | pnpm hoisting config (Expo-safe: `node-linker=hoisted` + hoist patterns for `*expo*`, `*react-native*`); preserved as-is in this change | Precursor |
| `.eslintrc.base.cjs` | Shared lint rules (typescript-eslint + import order) | This change |

---

## 3. Package design

### 3.1 `packages/design` — `@m2/design`

**Purpose.** Single source of truth for visual tokens — colors, typography, spacing, radii, and colored glow shadows — exported both as TS constants (for JS logic, inline styles, and token-aware components) and as CSS variables (for Tailwind theme and raw CSS usage).

**Public API (exports).**

```ts
// @m2/design
export { colors }      from './colors';      // { primary, surface, text, semantic, glow }
export { typography }  from './typography';  // { fontFamily, fontSize, fontWeight, lineHeight }
export { spacing }     from './spacing';     // { 0, 1, 2, 3, 4, 6, 8, 12, 16, 24, … } (rem scale)
export { radii }       from './radii';       // { none, sm, md, lg, xl, 2xl, full }
export { glows }       from './glows';       // { primary, success, warning, danger } — colored shadows
export { tailwindPreset } from './tailwind-preset';
// Types
export type { DesignTokens, ColorScale, GlowToken } from './types';
```

**Internal structure.**
- `src/colors.ts`, `src/typography.ts`, `src/spacing.ts`, `src/radii.ts`, `src/glows.ts` — plain TS objects, no React Native imports.
- `src/tailwind-preset.ts` — emits Tailwind v4 preset (theme extensions) from the consts.
- `css/tokens.css` — manually maintained CSS var layer that mirrors the TS values; imported by app global CSS. (Long-term a codegen emits this from TS.)

**Dependencies.** None at runtime. Dev: `typescript`.
**Consumed by.** `@m2/ui`, `apps/landing`, `apps/admin`.
**Versioning.** Internal workspace: `"@m2/design": "workspace:*"`. No semver; never published to npm in v1.

### 3.2 `packages/ui` — `@m2/ui`

**Purpose.** Shared React components built with `@m2/design` tokens. Framework-neutral React (no Next-specific APIs) so both apps consume identically.

**Public API (exports).** Components required by spec:

```ts
// @m2/ui
export { GlassCard }       from './surfaces/GlassCard';
export { MeshGradient }    from './surfaces/MeshGradient';
export { AuraGlow }        from './surfaces/AuraGlow';
export { GradientButton }  from './controls/GradientButton';
export { FilterTab }       from './controls/FilterTab';
export { SunkenInput }     from './controls/SunkenInput';
export { LocaleSwitcher }  from './controls/LocaleSwitcher';
export { Button }          from './primitives/Button';
export { Input }           from './primitives/Input';
export { KPICard }         from './data/KPICard';
export { Avatar }          from './data/Avatar';
export { ConversationCard } from './data/ConversationCard';
// Types
export type { ButtonProps, InputProps, GlassCardProps, … } from './types';
```

**Internal structure.** Folders by role: `primitives/`, `surfaces/`, `controls/`, `data/`. Each component is a single `.tsx` file colocated with its types. No stories (Storybook deferred [proposal §4]).

**Styling approach.** Tailwind classes composed with `clsx` + `tailwind-merge`; variant props use `class-variance-authority` (CVA) for type-safe variants. Components never declare inline hex values — always tokens via Tailwind classes or CSS vars.

**Dependencies.**
- Runtime: `react`, `react-dom` (peer), `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`.
- Internal: `@m2/design` (tokens), `@m2/i18n` (only `LocaleSwitcher` uses it).

**Consumed by.** `apps/landing`, `apps/admin`.
**Versioning.** `workspace:*`.

**Pick and justify: Tailwind vs CSS-in-JS.** **Picked Tailwind v4** (see §4).

### 3.3 `packages/api-client` — `@m2/api-client`

**Purpose.** Typed HTTP client. Generates TypeScript types from the backend Swagger JSON, provides a `fetch` wrapper that handles auth header injection, envelope unwrapping, and 401 → refresh → retry.

**Public API (exports).**

```ts
// @m2/api-client
export { fetcher }        from './fetcher';        // low-level
export { unwrap }         from './unwrap';         // envelope helper
export { createBrowserTokenStore } from './token-store';
export type { TokenStore } from './token-store';
export { ApiError, NetworkError, ForbiddenError, ServerError, UnauthorizedError } from './errors';

// Resource modules (thin typed wrappers)
export * as auth          from './auth';          // login, refresh, logout, me
export * as conversations from './conversations'; // list, get, messages
export * as contacts      from './contacts';

// Generated types (ambient)
export type { paths, components } from './generated/schema';
```

**Internal structure.**
- `src/fetcher.ts` — single place for base URL, auth header, 401 refresh interceptor, envelope unwrap (see §7).
- `src/token-store.ts` — `TokenStore` interface + `createBrowserTokenStore()` (localStorage impl). Future: `createCookieTokenStore()` for SSR.
- `src/errors.ts` — typed error classes discriminable via `instanceof`.
- `src/auth.ts`, `src/conversations.ts`, `src/contacts.ts` — thin wrappers using `paths['/api/...']` types from generated schema.
- `scripts/generate.ts` — Node script: fetches `/api/docs-json`, pipes through `openapi-typescript` CLI, writes `src/generated/schema.d.ts`.

**Dependencies.**
- Runtime: none beyond `fetch` (native in Node 20 + browsers).
- Dev: `openapi-typescript`, `typescript`, `tsx` (to run the script).
- Internal: none.

**Consumed by.** `apps/admin` (only).
**Versioning.** `workspace:*`. Generated types are committed — no build-time codegen.

**Pick and justify: `openapi-typescript` vs `orval`.** See §17 trade-off table.

### 3.4 `packages/i18n` — `@m2/i18n`

**Purpose.** Shared next-intl configuration: locales list, default locale, pathname map helper, shared message keys (brand, channel names, shared CTAs). App-specific copy stays in each app's `messages/{locale}.json`.

**Public API (exports).**

```ts
// @m2/i18n
export { locales, defaultLocale, localePrefix } from './config';
// locales: ['es', 'en'] as const
// defaultLocale: 'es'
// localePrefix: 'as-needed'

export { getRequestConfig } from './request';   // shared next-intl request config
export { Link, redirect, usePathname, useRouter } from './navigation';

// Shared message keys (merged into each app's messages at build time via a helper)
export { sharedMessages } from './messages';    // { es: {...}, en: {...} }

export type { Locale } from './config';         // 'es' | 'en'
```

**Internal structure.**
- `src/config.ts` — locales, defaultLocale, localePrefix, optional pathnames map for localized routes.
- `src/request.ts` — `getRequestConfig` that merges shared + app messages. Apps override by passing their own loader.
- `src/navigation.ts` — `createLocalizedPathnamesNavigation(config)` wrapper.
- `messages/es.json`, `messages/en.json` — shared namespace (brand names, channel labels `whatsapp|instagram|email|telegram|sms`, common CTAs).

**Messages: per-app or shared? (addressing proposal §18 risk).**

**Decision: per-app messages + shared package for cross-app keys.**

- **Per-app `messages/{locale}.json`** holds copy unique to that app (landing hero, admin inbox labels, etc.).
- **Shared `@m2/i18n/messages/{locale}.json`** holds keys used by ≥ 2 surfaces: brand (`Motomoto`, tagline), channel labels, generic CTAs (`Continue`, `Cancel`, `Log in`), shared form validation messages.
- At request time, `getRequestConfig` deep-merges shared + app (app keys override shared on collision — escape hatch for app-specific phrasing).

**Rationale.** Pure per-app duplicates brand/channel/CTA strings → translation drift. Pure shared couples landing copy with admin copy → cognitive load. Hybrid keeps ownership local while giving us one place to change `Motomoto → m2` brand in future.

**Dependencies.**
- Runtime: `next-intl` (peer).
- Internal: none.

**Consumed by.** `apps/landing`, `apps/admin`, `@m2/ui` (only `LocaleSwitcher`).
**Versioning.** `workspace:*`.

### 3.5 `packages/config` — `@m2/config` (presets only)

Not a runtime package. Holds `tsconfig/*.json`, `eslint/index.cjs`, `prettier/index.cjs`, `tailwind/preset.js`. Apps and packages `extends` or `import` these in their own config files. No runtime code, no `main` field.

---

## 4. Styling approach

### 4.1 Recommendation: Tailwind CSS v4 with a shared preset in `@m2/design`

**Choice.** Tailwind v4. The preset (exported from `@m2/design/tailwind-preset`) extends the Tailwind theme with our tokens so class names like `bg-surface-container` and `text-primary` resolve to our values. `packages/design/css/tokens.css` additionally exposes CSS variables for raw CSS use (e.g. inline styles, non-Tailwind consumers).

### 4.2 Justification vs alternatives

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Tailwind v4 + preset** | Zero runtime; fastest DX; `@theme` directive maps 1:1 to tokens; utility classes are searchable/greppable; huge ecosystem; dark-first trivial | Verbose class lists in JSX (mitigated by CVA + `tailwind-merge`) | **Picked** |
| CSS Modules | No class-name collisions; pure CSS | Bespoke utility layer needed; slower iteration; loses colocation with tokens | Rejected |
| vanilla-extract | Typed CSS-in-TS; theme-aware | Extra build step; smaller ecosystem; Tailwind v4 already type-friendly | Rejected |
| Panda CSS | Token-first design | Compile step; another abstraction to learn; Tailwind v4 tokens solve the same problem | Rejected |
| CSS-in-JS (Emotion/Stitches) | Dynamic styling | Runtime cost; RSC compatibility caveats; slower than atomic CSS | Rejected |

### 4.3 Mapping "Luminous Executive" effects to Tailwind

**Glass effect** (translucent + blur):
- Tailwind utilities: `backdrop-blur-xl`, `backdrop-saturate-150`, `bg-surface-container/60`, `border-white/5`.
- Component `GlassCard` encapsulates the exact recipe so consumers never re-derive it.

**Mesh gradients** (multi-stop radial):
- Not expressible with built-in Tailwind utilities cleanly → implement as a **custom Tailwind plugin** exported from `@m2/design/tailwind-preset` that adds `bg-mesh-primary`, `bg-mesh-dusk` utilities backed by `background-image: radial-gradient(...) , radial-gradient(...)`.
- Alternative: the `MeshGradient` component just renders an SVG layer — picked for complex meshes; plugin picked for simple 2-stop radials.

**Colored glows** (NOT black shadows):
- Custom plugin adds `shadow-glow-primary`, `shadow-glow-success`, etc. Each resolves to `box-shadow: 0 0 24px 0 rgb(from <token> r g b / 0.35), 0 0 48px 0 rgb(...)`.
- Arbitrary values discouraged — all glows are named tokens to preserve visual consistency.

See §10 for the complete token → Tailwind class mapping table.

### 4.4 Global CSS

Each app's `app/globals.css`:

```css
@import "@m2/design/css/tokens.css";   /* :root CSS vars */
@import "tailwindcss";                  /* Tailwind v4 */

@theme {
  /* Reference CSS vars so Tailwind and raw CSS stay in sync */
  --color-primary: var(--color-primary);
  --color-surface-container: var(--color-surface-container);
  /* … */
}
```

---

## 5. Auth flow (sequence diagrams)

### 5.1 Login

```
User          LoginPage            @m2/api-client          m2-back               Middleware
 │                │                      │                      │                     │
 │──submit──────▶ │                      │                      │                     │
 │                │──auth.login(email,pw)▶│                      │                     │
 │                │                      │──POST /api/auth/login▶│                     │
 │                │                      │                      │                     │
 │                │                      │◀─{ success, data:   ─│                     │
 │                │                      │   { accessToken,     │                     │
 │                │                      │     refreshToken,    │                     │
 │                │                      │     user } }         │                     │
 │                │                      │                      │                     │
 │                │                      │ tokenStore.set(...)  │                     │
 │                │                      │ document.cookie =    │                     │
 │                │                      │   "m2_session=1;     │                     │
 │                │                      │    Path=/; Secure;   │                     │
 │                │                      │    SameSite=Lax"     │                     │
 │                │◀─user ───────────────│                      │                     │
 │                │                      │                      │                     │
 │                │ router.push(          │                      │                     │
 │                │   redirect ??         │                      │                     │
 │                │   /admin)             │                      │                     │
 │                │                      │                      │                     │
 │──navigate────▶ │                      │                      │                     │
 │                │──────────────────────────GET /admin──────────────────────────────▶│
 │                │                      │                      │  reads m2_session   │
 │                │                      │                      │  present → allow    │
 │                │◀──RSC stream──────────────────────────────────────────────────────│
```

### 5.2 Protected page load (middleware + client guard)

```
Browser                 Middleware (edge)                        Layout ("use client")
   │                          │                                         │
   │──GET /admin/inbox───────▶│                                         │
   │                          │ 1. next-intl: parse locale,             │
   │                          │    set NEXT_LOCALE cookie if needed     │
   │                          │                                         │
   │                          │ 2. auth guard:                          │
   │                          │    if pathname matches                  │
   │                          │      /[locale]/admin/** AND             │
   │                          │      NOT /[locale]/admin/login AND      │
   │                          │      m2_session cookie is ABSENT        │
   │                          │    → redirect 307                       │
   │                          │       /[locale]/admin/login             │
   │                          │       ?redirect=/admin/inbox            │
   │                          │                                         │
   │                          │ else → pass through                     │
   │◀──RSC stream─────────────│                                         │
   │                                                                    │
   │──hydrate──────────────────────────────────────────────────────────▶│
   │                                                                    │ 3. on mount:
   │                                                                    │    const token =
   │                                                                    │      tokenStore.get()
   │                                                                    │    if (!token)
   │                                                                    │      → router.push(login)
   │                                                                    │    else
   │                                                                    │      auth.me()
   │                                                                    │      → authStore.set(user)
   │                                                                    │      if 401 → refresh flow
```

### 5.3 Refresh on 401

```
Component     TanStack Query       fetcher              m2-back
   │                │                │                     │
   │──useQuery─────▶│                │                     │
   │                │──fetcher(...)─▶│                     │
   │                │                │──GET /api/… ───────▶│
   │                │                │                     │
   │                │                │◀─401 Unauthorized──│
   │                │                │                     │
   │                │                │ if !refreshing:     │
   │                │                │   refreshing = true │
   │                │                │   const rt =        │
   │                │                │     tokenStore      │
   │                │                │       .getRefresh() │
   │                │                │                     │
   │                │                │──POST /api/auth/    │
   │                │                │    refresh ({rt})──▶│
   │                │                │                     │
   │                │                │◀─{ success, data:──│
   │                │                │   { accessToken,    │
   │                │                │     refreshToken }} │
   │                │                │                     │
   │                │                │ tokenStore.set(...) │
   │                │                │                     │
   │                │                │ retry original req  │
   │                │                │──GET /api/… ───────▶│
   │                │                │◀─200 OK, { data }──│
   │                │                │ unwrap envelope     │
   │                │◀─data─────────│                     │
   │◀─data─────────│                │                     │
   │                                  (failure path ↓)
   │                │                │                     │
   │                │                │ POST /api/auth/     │
   │                │                │   refresh returns   │
   │                │                │   4xx/5xx           │
   │                │                │ tokenStore.clear()  │
   │                │                │ document.cookie =   │
   │                │                │   "m2_session=;     │
   │                │                │    Max-Age=0; …"    │
   │                │                │ queryClient.clear() │
   │                │                │ window.location =   │
   │                │                │   '/admin/login     │
   │                │                │    ?reason=expired' │
```

**Concurrency.** A module-level `refreshing: Promise<void> | null` serializes concurrent 401s: only one refresh runs; all pending requests await it, then retry with the new token.

### 5.4 Logout

```
User           ProfilePage          @m2/api-client           React Query
  │                 │                      │                      │
  │──click logout─▶│                      │                      │
  │                 │──auth.logout()─────▶ │                      │
  │                 │                      │ tokenStore.clear()   │
  │                 │                      │ document.cookie =    │
  │                 │                      │   "m2_session=;      │
  │                 │                      │    Max-Age=0"        │
  │                 │                      │──POST /api/auth/     │
  │                 │                      │   logout (fire&      │
  │                 │                      │   forget)            │
  │                 │                      │ queryClient.clear()──▶│
  │                 │                      │                      │
  │                 │ router.push(login)   │                      │
  │◀─redirect──────│                      │                      │
```

### 5.5 Why sentinel cookie + localStorage (and migration path)

**Problem.** Edge middleware runs before any JavaScript — it **cannot read localStorage**. But the backend currently doesn't issue httpOnly cookies, so we can't rely on a real session cookie for auth.

**Solution: hybrid model.**
- **Tokens of record**: `localStorage` (written by the API client after login).
- **Sentinel cookie**: `m2_session=1`, non-httpOnly, `SameSite=Lax`, `Secure` in prod, set by the client immediately after login, cleared on logout/refresh-failure. The middleware reads **only this sentinel** to decide "is there a session?" and redirect unauthenticated users at the edge.
- **Security posture**: The sentinel is **not an auth token** — it carries no secret. Even if forged, the client guard and server API calls still require the real `accessToken` from localStorage / Authorization header. Worst-case forgery lets an attacker reach the protected shell, which then bounces them on first API call.

**Why not store tokens in cookies?** Backend doesn't set httpOnly cookies yet (proposal §3 / §12 risk #3). Non-httpOnly cookies are strictly worse than localStorage (XSS accessible + sent on every request + larger).

**Why not just check localStorage client-side?** Middleware-level redirect gives a cleaner UX (no flash of protected shell, proper 307 to login) and simpler SEO signals.

**Migration path (v2).** When backend issues `Set-Cookie` with httpOnly + `Secure` + `SameSite=Lax` on `/api/auth/login`:
1. Drop `tokenStore` localStorage impl; switch API client to rely on browser cookie jar (`credentials: 'include'`).
2. Drop sentinel cookie; replace middleware check with presence of the real session cookie name.
3. Remove refresh interceptor (backend rotates on its own).
4. No consumer code changes — `@m2/api-client` public API unchanged.

---

## 6. Middleware composition

### 6.1 Order: i18n FIRST, then auth

**Landing.** Only next-intl needed (no auth).

```ts
// apps/landing/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale, localePrefix } from '@m2/i18n';

export default createMiddleware({ locales, defaultLocale, localePrefix });

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

**Admin.** Chained: i18n handler first (normalizes locale + cookie), then auth guard.

```ts
// apps/admin/middleware.ts
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale, localePrefix } from '@m2/i18n';

const intl = createIntlMiddleware({ locales, defaultLocale, localePrefix });

const PUBLIC_ADMIN_PATHS = ['/admin/login'];
const SESSION_COOKIE = 'm2_session';

function stripLocale(pathname: string): string {
  // '/es/admin/login' → '/admin/login'
  const first = pathname.split('/')[1];
  return locales.includes(first as any) ? pathname.slice(first.length + 1) : pathname;
}

export default function middleware(req: NextRequest) {
  // 1) Delegate to next-intl first — it may rewrite or redirect for locale negotiation.
  const intlResponse = intl(req);
  if (intlResponse.status !== 200 && intlResponse.headers.get('location')) {
    return intlResponse; // i18n redirect (e.g. /admin → /es/admin)
  }

  // 2) Auth guard on the (possibly locale-normalized) pathname.
  const pathnameNoLocale = stripLocale(req.nextUrl.pathname);
  const requiresAuth =
    pathnameNoLocale.startsWith('/admin') &&
    !PUBLIC_ADMIN_PATHS.some((p) => pathnameNoLocale === p || pathnameNoLocale.startsWith(`${p}/`));

  if (requiresAuth && !req.cookies.has(SESSION_COOKIE)) {
    const loginUrl = req.nextUrl.clone();
    const locale = req.nextUrl.pathname.split('/')[1];
    loginUrl.pathname = locales.includes(locale as any)
      ? `/${locale}/admin/login`
      : `/${defaultLocale}/admin/login`;
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return intlResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

**Key properties.**
- Locale is authoritative **before** auth — so the redirect to `/login` preserves locale.
- Excluded from matcher: `api/*`, `_next/*`, files with extensions.
- `stripLocale` keeps the guard logic locale-agnostic.

---

## 7. API client design

### 7.1 Base URL

- Read from `process.env.NEXT_PUBLIC_API_URL` at build time.
- Hard-fail in the fetcher module if unset (`throw new Error('NEXT_PUBLIC_API_URL missing')`).
- No defaulting to localhost in production bundles.

### 7.2 Envelope unwrapping

Backend response shape (proposal §9.3):

```ts
type Envelope<T> =
  | { success: true;  data: T; meta?: Record<string, unknown> }
  | { success: false; error: { code: string; message: string; details?: unknown } };

export function unwrap<T>(res: Envelope<T>): T {
  if (res.success) return res.data;
  throw new ApiError(res.error.code, res.error.message, res.error.details);
}
```

Callers of resource modules never see the envelope — they always get `T`.

### 7.3 Error mapping

| HTTP | Handling |
|---|---|
| 2xx | `unwrap` returns `data` |
| 400 | `throw new ApiError(code, message)` |
| 401 | Refresh flow (§5.3); on failure → `throw new UnauthorizedError()` + redirect |
| 403 | `throw new ForbiddenError(message)` |
| 404 | `throw new NotFoundError(message)` |
| 5xx | `throw new ServerError(message)` |
| Network fail (no response) | `throw new NetworkError(cause)` |

All errors extend a base `ApiError` so callers can `catch (e) { if (e instanceof ApiError) ... }`.

### 7.4 TokenStore abstraction

```ts
export interface TokenStore {
  getAccess():  string | null;
  getRefresh(): string | null;
  set(tokens: { accessToken: string; refreshToken: string }): void;
  clear(): void;
}

export function createBrowserTokenStore(): TokenStore { /* localStorage impl */ }
// Future: createCookieTokenStore() for SSR (v2 migration).
```

The fetcher receives a `TokenStore` via a module-level injection point (`setTokenStore(store)`) called once at app boot. Keeps the fetcher pure and testable.

### 7.5 Codegen command

```json
// packages/api-client/package.json (excerpt)
{
  "scripts": {
    "generate:api": "tsx scripts/generate.ts"
  }
}
```

```json
// root package.json
{
  "scripts": {
    "generate:api": "pnpm --filter @m2/api-client generate:api"
  }
}
```

Run **manually** whenever backend changes. Output (`src/generated/schema.d.ts`) is committed. CI verifies the committed file matches regeneration against the staging backend — fails PR on drift (proposal §9.2).

---

## 8. i18n architecture

### 8.1 Library: next-intl (vs next-i18next)

| Option | Verdict |
|---|---|
| **next-intl** | **Picked.** First-class App Router + RSC support, typed messages, static-render-friendly, tree-shakeable, minimal boilerplate, locale routing built in. |
| next-i18next | Pages-Router era; App Router story is weak; needs bespoke wrapping |
| Lingui | Extraction-based; richer but higher ceremony; overkill for 2 locales |

### 8.2 Routing: `localePrefix: 'as-needed'`

- Default locale (`es`) served without prefix: `motomoto.app/` → Spanish home.
- Non-default locales prefixed: `motomoto.app/en` → English home.
- Admin: `app.motomoto.app/admin/...` (Spanish) and `app.motomoto.app/en/admin/...` (English).
- **Rationale.** Addresses proposal §18 SEO risk — canonical URL for the primary LatAm market stays clean; `/es` redirect penalty is avoided.
- Uses `createLocalizedPathnamesNavigation` from next-intl for typed `<Link>` + `useRouter`.

### 8.3 Messages location

Confirmed in §3.4: **per-app** `messages/{locale}.json` + **shared** `@m2/i18n/messages/{locale}.json` deep-merged at request time.

### 8.4 Fallback behavior

- Missing key in the requested locale → fall back to `es`.
- Still missing → dev warning via `onError` handler in `getRequestConfig`; production renders the key itself (uglier than a translation but obvious).
- **No silent English fallback** — Spanish is the anchor locale.

### 8.5 Locale detection

| Scenario | Behavior |
|---|---|
| First visit, no `NEXT_LOCALE` cookie | `Accept-Language` header negotiated against `['es','en']`; writes `NEXT_LOCALE` cookie |
| Subsequent visits | `NEXT_LOCALE` cookie authoritative (regardless of `Accept-Language`) |
| User toggles via `LocaleSwitcher` | Client updates `NEXT_LOCALE` cookie + `router.replace({ pathname }, { locale: newLocale })` |

---

## 9. Routing

### 9.1 Landing (`apps/landing`)

| Path | File | Render | Notes |
|---|---|---|---|
| `/` → `/es` (default) | `app/[locale]/page.tsx` | RSC/static | Hero, features, CTA |
| `/en` | same | RSC/static | English copy |
| `/[locale]/contact` (optional v1) | `app/[locale]/(marketing)/contact/page.tsx` | RSC | Mailto CTA or simple form |
| locale layout | `app/[locale]/layout.tsx` | RSC | NextIntlClientProvider, fonts |
| root layout | `app/layout.tsx` | RSC | `<html>` stub |
| middleware | `middleware.ts` | edge | next-intl only |

### 9.2 Admin (`apps/admin`)

| Path | File | Render | Notes |
|---|---|---|---|
| `/[locale]/admin/login` | `app/[locale]/admin/login/page.tsx` | client | Excluded from auth guard |
| `/[locale]/admin` | `app/[locale]/admin/page.tsx` | client | Dashboard home, KPI cards |
| `/[locale]/admin/inbox` | `app/[locale]/admin/inbox/page.tsx` | client | List + 5s polling |
| `/[locale]/admin/inbox/[id]` | `app/[locale]/admin/inbox/[id]/page.tsx` | client | Conversation detail |
| `/[locale]/admin/profile` | `app/[locale]/admin/profile/page.tsx` | client | `/api/auth/me` + logout |
| admin layout | `app/[locale]/admin/layout.tsx` | `"use client"` | Auth guard, nav chrome, QueryClientProvider |
| locale layout | `app/[locale]/layout.tsx` | RSC | NextIntlClientProvider |
| root layout | `app/layout.tsx` | RSC | `<html>` stub |
| middleware | `middleware.ts` | edge | i18n + auth chain (§6) |

**RSC/client convention.** Outer layouts (`app/layout.tsx`, `app/[locale]/layout.tsx`) are RSC for HTML/meta/font setup. Admin shell from `admin/layout.tsx` down is `"use client"` — simplifies auth + localStorage access. Documented in repo root CLAUDE.md (proposal §12 risk).

---

## 10. Design tokens → Tailwind mapping

Non-exhaustive; the preset in `@m2/design` covers the full set. Sample to lock convention:

| Token (TS path)                             | CSS var                       | Tailwind class                     | Example value |
|---|---|---|---|
| `colors.primary.DEFAULT`                    | `--color-primary`             | `bg-primary` / `text-primary`      | `#ADC6FF` |
| `colors.primary.container`                  | `--color-primary-container`   | `bg-primary-container`             | `#ADC6FF` |
| `colors.surface.DEFAULT`                    | `--color-surface`             | `bg-surface`                       | `#161515` |
| `colors.surface.container`                  | `--color-surface-container`   | `bg-surface-container`             | `#201F1F` |
| `colors.surface.containerHigh`              | `--color-surface-container-high` | `bg-surface-container-high`     | `#2B2A2A` |
| `colors.text.primary`                       | `--color-text-primary`        | `text-text-primary`                | `#E7E3E3` |
| `colors.text.muted`                         | `--color-text-muted`          | `text-text-muted`                  | `#A8A4A4` |
| `colors.semantic.success`                   | `--color-success`             | `bg-success` / `text-success`      | `#8AE5A8` |
| `colors.semantic.warning`                   | `--color-warning`             | `bg-warning` / `text-warning`      | `#FFD580` |
| `colors.semantic.danger`                    | `--color-danger`              | `bg-danger` / `text-danger`        | `#FF9AA2` |
| `typography.fontFamily.display`             | `--font-display`              | `font-display`                     | `Manrope, …` |
| `typography.fontFamily.body`                | `--font-body`                 | `font-body`                        | `Inter, …` |
| `spacing.4`                                 | `--space-4`                   | `p-4 / m-4 / gap-4`                | `1rem` |
| `radii.lg`                                  | `--radius-lg`                 | `rounded-lg`                       | `0.75rem` |
| `radii.2xl`                                 | `--radius-2xl`                | `rounded-2xl`                      | `1.5rem` |
| `glows.primary`                             | `--glow-primary`              | `shadow-glow-primary` (plugin)     | `0 0 24px rgb(173 198 255 / .35)` |
| `glows.success`                             | `--glow-success`              | `shadow-glow-success` (plugin)     | `0 0 24px rgb(138 229 168 / .35)` |
| mesh gradient "dusk"                        | n/a (bg-image utility)        | `bg-mesh-dusk` (plugin)            | `radial-gradient(...) , radial-gradient(...)` |

Token values are illustrative — actual values come from mobile `src/design/colors.ts` (ported 1:1 as required by proposal §5).

---

## 11. Polling strategy (inbox)

### 11.1 Choice: React Query (TanStack Query v5) with `refetchInterval: 5000`

```ts
const { data } = useQuery({
  queryKey: ['conversations', filters],
  queryFn: () => conversations.list(filters),
  refetchInterval: 5000,
  refetchIntervalInBackground: false, // pause when tab hidden
  staleTime: 0,
});
```

### 11.2 Rationale vs vanilla fetch + setInterval

| Aspect | React Query | Vanilla fetch + setInterval |
|---|---|---|
| Automatic stop on unmount | Yes | Manual `clearInterval` |
| De-duplication across components | Yes (query key cache) | No |
| Pause on tab hidden | `refetchIntervalInBackground: false` | Manual `visibilitychange` listener |
| Retry/backoff on error | Built in | Manual |
| Optimistic updates (future) | Built in | Manual |
| Cache invalidation on logout | `queryClient.clear()` | Manual |
| SSR story | Hydration helpers | None |

Polling pauses automatically when `document.visibilityState === 'hidden'` thanks to `refetchIntervalInBackground: false`, satisfying proposal §12 risk #4.

### 11.3 Query key conventions

- `['conversations', filters]`, `['conversation', id]`, `['messages', conversationId]`, `['me']`.
- Invalidation on logout: `queryClient.clear()`.
- Invalidation on send-message (future): `queryClient.invalidateQueries({ queryKey: ['messages', convId] })`.

---

## 12. State management

| Layer | Tool | Scope |
|---|---|---|
| Server state (API data) | TanStack Query v5 | All `/api/*` reads and mutations |
| Auth tokens | `TokenStore` (not state) | Module-level singleton, localStorage-backed |
| Current user | TanStack Query (`['me']`) | Single source from `/api/auth/me` |
| Local UI state | React `useState` / `useReducer` | Form fields, toggles, modals |
| Global UI state (toasts, modals) | React context + `useReducer` | Keep minimal; avoid store sprawl |

**No Zustand/Redux in web.** Proposal §5 notes mobile uses Zustand; web stays simpler because TanStack Query + React state cover everything admin needs in v1. Reconsider only if a truly cross-cutting, client-only UI state emerges (unlikely).

---

## 13. Testing strategy (v1 — lightweight)

| Layer | Approach | v1 status |
|---|---|---|
| Type safety | `pnpm typecheck` (tsc --noEmit) across all packages/apps | **Required, gates CI** |
| Lint | `pnpm lint` (eslint + typescript-eslint) | **Required, gates CI** |
| Unit tests | None in v1 (debt) | Deferred |
| Integration tests | None in v1 (debt) | Deferred |
| E2E | Manual against seeded local backend | Manual only |
| Visual regression | None | Deferred |

Flagged as debt in proposal §14 follow-ups. Post-v1 adds Vitest for critical utilities (token store, envelope unwrap, role check) and Playwright for login + inbox flows.

---

## 14. Deployment mechanics

### 14.1 Vercel project settings

| Setting | Landing | Admin |
|---|---|---|
| Project name | `m2-web-landing` | `m2-web-admin` |
| Root Directory | `apps/landing` | `apps/admin` |
| Framework preset | Next.js | Next.js |
| Install command | `pnpm install --frozen-lockfile` | `pnpm install --frozen-lockfile` |
| Build command | `turbo build --filter=landing...` | `turbo build --filter=admin...` |
| Output directory | `.next` (default) | `.next` (default) |
| Node version | 20.x | 20.x |
| Ignored build step | `git diff --quiet HEAD^ HEAD -- apps/landing packages` | `git diff --quiet HEAD^ HEAD -- apps/admin packages` |

### 14.2 Env var table

| Var | Local dev | Preview | Production |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api` | `https://staging-api.motomoto.app/api` (TBD) | `https://api.motomoto.app/api` (TBD) |
| `NEXT_PUBLIC_LANDING_URL` (admin) | `http://localhost:3001` | Vercel preview URL | `https://motomoto.app` |
| `NEXT_PUBLIC_ADMIN_URL` (landing) | `http://localhost:3002` | Vercel preview URL | `https://app.motomoto.app` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `es` | `es` | `es` |

**Preview risk (proposal §18.3).** Preview deploys need a stable staging backend. If `staging-api.motomoto.app` isn't ready at deploy time, fall back to pointing previews at prod API **read-only** (safe because v1 has no destructive endpoints) until staging is up.

### 14.3 Domains

| Domain | Target | Notes |
|---|---|---|
| `motomoto.app` | Vercel: m2-web-landing (Root Dir `apps/landing` in `raoole20/m2-front`) | Apex — serves ES content directly (no `/es` redirect) |
| `www.motomoto.app` | 308 redirect → `motomoto.app` | Vercel redirect rule |
| `app.motomoto.app` | Vercel: m2-web-admin (Root Dir `apps/admin` in `raoole20/m2-front`) | |
| `api.motomoto.app` | Out of scope (backend team) | Referenced by env vars only |
| (mobile) | **EAS Build — not Vercel** | `apps/mobile` ships via EAS + App Store + Play Store + OTA updates. EAS config lives at `apps/mobile/eas.json`. Mobile release lifecycle is independent of Vercel. |

---

## 15. Shared tooling

| Tool | Config location | Notes |
|---|---|---|
| TypeScript | `tsconfig.base.json` (strict, bundler, `ES2023`) | Apps extend `@m2/config/tsconfig/nextjs`; packages extend `@m2/config/tsconfig/react-library` |
| ESLint | `.eslintrc.base.cjs` + `@m2/config/eslint` | `@typescript-eslint`, `eslint-config-next`, `import/order` |
| Prettier | `.prettierrc.cjs` at root | Single config; no per-package overrides |
| pnpm | `pnpm-workspace.yaml` | `packageManager: "pnpm@9.x"` pinned in root `package.json` |
| Turborepo | `turbo.json` | Tasks: `dev`, `build`, `lint`, `typecheck`, `generate:api` |
| Husky / lint-staged | **Skipped in v1** | User preference (CLAUDE.md memory): avoid hooks |

Husky/lint-staged deliberately skipped. CI is the authoritative gate.

---

## 16. Performance budgets

| App | Metric | Budget | Enforcement |
|---|---|---|---|
| Landing | LCP (4G, Moto G4 class) | < 2.0 s | Manual Lighthouse in v1 |
| Landing | JS shipped (home route) | < 180 KB gzipped | Manual + `@next/bundle-analyzer` spot-check |
| Landing | CLS | < 0.05 | Manual Lighthouse |
| Admin | TTI (after login) | < 3.5 s | Manual |
| Admin | JS shipped (inbox route) | < 350 KB gzipped | Manual; acceptable because auth'd |

No automated performance CI in v1 (deferred).

---

## 17. Trade-offs (explicit)

| Dimension | Options | Picked | Rationale |
|---|---|---|---|
| Styling | Tailwind v4 · CSS Modules · vanilla-extract · Panda | **Tailwind v4** | Zero-runtime, token mapping via `@theme`, fastest DX, huge ecosystem |
| API codegen | `openapi-typescript` · `orval` · hand-written | **`openapi-typescript`** | Types only, no runtime; we want custom envelope/refresh logic — `orval` bakes in assumptions about error shape and auth that would need escape hatches |
| Token storage | `localStorage` · httpOnly cookie · sessionStorage · in-memory | **`localStorage` (v1)** | Works with current backend (no `Set-Cookie` yet); strict CSP mitigates XSS; documented v2 migration to httpOnly cookies |
| i18n lib | next-intl · next-i18next · Lingui | **next-intl** | First-class App Router + RSC support; typed messages; `localePrefix: 'as-needed'` solves SEO risk |
| Server cache | React Query · SWR · RTK Query | **React Query (TanStack v5)** | Polling + visibility-aware + optimistic updates + ecosystem; SWR is peer-level but TQ has richer APIs |
| Client state | React useState · Zustand · Redux | **React useState/context** | Server state is in TQ; token is module-singleton; no cross-cutting UI state warrants a store in v1 |

---

## 18. Open design questions

- [ ] **Staging backend URL** — confirmed target for `NEXT_PUBLIC_API_URL` preview (proposal §18.3). If unavailable at deploy time, fallback = point previews at prod read-only until ready.
- [ ] **CSP header policy** — exact policy for both apps (especially `connect-src` once real domains are known and `script-src` for Next inline scripts). v1 starts permissive; tighten before public launch.
- [ ] **LocaleSwitcher UX** — minimal dropdown vs toggle vs flag icons. Spec allows minimal; pick a single pattern for `packages/ui` to avoid per-app drift.
- [ ] **Shared brand strings in `@m2/i18n`** — exact initial key set (brand name, channel labels, common CTAs). Locked list needed before `sdd-tasks` so message files can be stubbed without drift.
- [ ] **Backend CORS allowed origins** — need `motomoto.app`, `app.motomoto.app`, `*.vercel.app` (preview) added to backend `ALLOWED_ORIGINS`. Coordination item, not a design gap.
- [ ] **Pathname localization** — do we want `/es/admin/bandeja` ↔ `/en/admin/inbox` (localized pathnames) or keep `/admin/inbox` across locales? v1 design assumes **non-localized** paths for simplicity; revisit if marketing requires localized URLs for SEO on landing.

No design question blocks implementation start; the above are refinements that can be resolved during or after `sdd-tasks`.

---

## 19. React Native + Next.js coexistence (post-migration reality)

The precursor change `mobile-to-monorepo-migration` established that mobile (Expo/RN) and the forthcoming Next.js apps share the same `raoole20/m2-front` monorepo. This section documents the coexistence decisions so web work added by this change does not regress mobile.

### 19.1 Hoisting policy (pnpm)

- **Baseline (precursor):** `.npmrc` at repo root with:
  - `node-linker=hoisted` — required by Expo Dev Client + Metro; Metro's flat-`node_modules` assumption breaks under pnpm's default isolated linker.
  - `public-hoist-pattern[]=*expo*`
  - `public-hoist-pattern[]=*react-native*`
- **Additions this change may make:** none required. Next.js 15 works correctly under `node-linker=hoisted`. If a specific web dependency later demands isolated linking, we will document a targeted `.pnpmfile.cjs` override — not a global switch.
- **Rationale:** one hoisting policy across the repo is simpler than per-workspace overrides; Expo is the stricter consumer so the conservative choice wins.

### 19.2 Bundler isolation

- **Metro** (mobile) and **Next.js / Turbopack / webpack** (web) are fully isolated: each app owns its own bundler config (`apps/mobile/metro.config.js`, `apps/landing/next.config.ts`, `apps/admin/next.config.ts`). No cross-contamination; no shared plugin set.
- Metro's `watchFolders` (set by precursor) covers the monorepo root so shared packages are resolvable at runtime; Next.js uses standard pnpm workspace resolution via `transpilePackages` (see §19.4) — no Metro involvement.
- **Consequence:** a web-side bundler change cannot break mobile's build. Conversely, mobile Metro config changes are invisible to web.

### 19.3 React version alignment

- **Single React version pinned at root.** Expo SDK 55 ships React 19 with RN 0.83. Next.js 15 supports React 19. Both apps MUST resolve the same React.
- **Mechanism:** `pnpm.overrides` in root `package.json`:
  ```json
  {
    "pnpm": {
      "overrides": {
        "react": "19.x.y",
        "react-dom": "19.x.y"
      }
    }
  }
  ```
  (Exact patch version matches whatever `expo@~55.0.7` resolves to; `react-dom` aligned to the same major/minor.)
- **Why this matters:** two React copies on Metro's watch path → "Invalid Hook Call" errors at RN runtime. Pinning via `pnpm.overrides` prevents a transitive Next.js dep from pulling in a second React copy.
- **Scope split:** `react-dom` is a web concern only; it MAY be present in `apps/landing`, `apps/admin`, and `packages/ui` `dependencies`/`peerDependencies`. It MUST NOT appear in `apps/mobile/package.json`.

### 19.4 Shared package consumption matrix

| Package | Mobile (Metro) | Web (Next.js) | Notes |
|---|:---:|:---:|---|
| `@m2/types` | ✓ (today) | ✓ | Pure TS; consumed by mobile via Metro `watchFolders` (precursor); consumed by Next via standard pnpm workspace resolution (OOB). |
| `@m2/design` | ✓ (today) | ✓ | TS consts consumed by both. Web additionally consumes `@m2/design/css/tokens.css` + `@m2/design/tailwind-preset`. Mobile does NOT consume the Tailwind preset (RN has no Tailwind). |
| `@m2/ui` | ✗ | ✓ | **Web-only.** Mobile keeps `apps/mobile/src/components/`. RN primitives (`View`, `Text`, `Pressable`) are not interchangeable with `<div>`/`<span>`/`<button>`; no cross-surface component abstraction in v1. |
| `@m2/api-client` | ✗ (v1) | ✓ | Web uses `fetch` (browser + Node 20 runtime). Mobile keeps its axios-based `apps/mobile/src/services/`. Mobile may consume **types only** from `@m2/api-client` (generated schema) post-v1; that is a follow-up, not v1 scope. |
| `@m2/i18n` | ✗ (v1) | ✓ | next-intl is web-only. Mobile has no i18n requirement in v1. |

**Next.js `transpilePackages`.** Both Next apps MUST declare:

```ts
// apps/{landing,admin}/next.config.ts
transpilePackages: ['@m2/ui', '@m2/design', '@m2/i18n', '@m2/types']
```

This ensures Next.js compiles the TS sources shipped in each package (rather than expecting pre-built dist output). `@m2/api-client` ships generated `.d.ts` + compiled JS, so it is optional in the list.

### 19.5 Packages out of scope (documented follow-ups)

- **`packages/ui-native`** — future home for RN-primitive components that parallel `@m2/ui`. Explicitly NOT built in v1. When mobile and web need a truly shared component (e.g., a rich chat bubble), the plan is:
  1. Extract headless logic into `packages/ui-core` (framework-agnostic React).
  2. Build `packages/ui` (DOM wrappers) and `packages/ui-native` (RN wrappers) as thin presentation layers.
  Do not attempt this in v1; the mobile visual-overhaul component set and the web component set diverge enough that premature unification costs more than it saves.

### 19.6 Type-check orchestration

- Each workspace has its own `tsconfig.json` extending the root `tsconfig.base.json`. Web apps additionally layer `@m2/config/tsconfig/nextjs.json`; web packages use `@m2/config/tsconfig/react-library.json`; mobile continues to use its existing `apps/mobile/tsconfig.json` (unchanged).
- `turbo run typecheck` at the repo root covers every workspace. Per-workspace invocation (`pnpm --filter <workspace> typecheck`) is also supported.
- **CI gate:** the repo's CI workflow runs `turbo run typecheck lint` across the matrix: mobile, shared packages, and web apps. A change touching `packages/design` invalidates mobile's typecheck cache and triggers a mobile recheck — this is the core monorepo benefit and MUST be preserved in CI.

### 19.7 Build orchestration

- **Web apps:** `turbo run build --filter=@m2/landing... --filter=@m2/admin...` is the canonical production build. Vercel projects run a per-app variant (§14.1).
- **Mobile dev:** `pnpm --filter @m2/mobile start` continues to be the primary developer command. Turbo is NOT used to invoke Metro; Metro is a long-running dev server and does not fit the Turbo task-graph model.
- **Mobile production builds:** handled by **EAS Build** (`eas build --profile production`), triggered manually or via EAS-side CI. Turborepo does not orchestrate EAS.
- **Implication:** "building the monorepo" has two distinct meanings. For web CI, `turbo build` is authoritative. For mobile releases, EAS is authoritative. Do not force one tool across the boundary.

### 19.8 Dependency drift guardrails

- CI MUST fail if `apps/mobile/package.json` adds a dependency on `@m2/ui`, `@m2/api-client`, or `@m2/i18n` in v1. (grep/AST check; v1 only — remove guard when the "shared" question is revisited.)
- CI MUST fail if more than one version of `react` resolves across the workspace graph (`pnpm why react` contains only one entry).
- CI MUST fail if `@m2/ui` adds a direct dependency on `react-native` (would break web consumers) or on Next-specific APIs.

These guardrails encode the §19.4 matrix so accidental coupling cannot land silently.

### 19.9 ADR-019 — web-only shared packages in v1

**Decision.** `@m2/ui`, `@m2/api-client`, and `@m2/i18n` are web-only in v1. Mobile consumes none of them.

**Alternatives considered.**
1. Build `@m2/ui` as a cross-surface library (React DOM + RN primitives via conditional exports).
2. Move mobile's axios services into `@m2/api-client` immediately.
3. Add next-intl to mobile (or build a shared `@m2/i18n-core` consumed by both).

**Rejected because.**
1. Cross-surface components force lowest-common-denominator APIs and inflate v1 scope by weeks. The mobile visual overhaul and web landing have different component needs today.
2. Mobile's services are axios-based and work fine; converting them to `fetch` is a migration, not a port, and introduces risk on the live mobile surface.
3. Mobile has no near-term i18n requirement; adding one is pure overhead.

**Consequences.**
- Two component implementations exist for concepts that share a name (`GlassCard`, `MeshGradient`, etc.). Diff-readers must remember: `apps/mobile/src/components/` is RN; `packages/ui/src/` is web. **Signatures are NOT guaranteed to match** across surfaces.
- A future change (post-v1) can revisit by introducing `packages/ui-core` + `packages/ui-native`.

**Trigger to revisit.** If ≥ 3 components need cross-surface parity (e.g., identical props for `KPICard`), plan the extraction. Until then, accept the duplication.

