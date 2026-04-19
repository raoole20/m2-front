# m2-front (Motomoto)

Monorepo for the Motomoto mobile CRM and unified messaging platform. Manages customer conversations across WhatsApp, Instagram, Facebook, SMS, and Email — all in one place.

## Monorepo Layout

```
m2-front/
├── apps/
│   ├── mobile/          — @m2/mobile     : Expo SDK 55 + React Native 0.83
│   ├── landing/         — @m2/landing    : Next.js 15 marketing site
│   └── admin/           — @m2/admin      : Next.js 15 admin dashboard
├── packages/
│   ├── types/           — @m2/types      : shared TypeScript interfaces
│   ├── design/          — @m2/design     : design tokens + Tailwind preset
│   ├── ui/              — @m2/ui         : shared React components (web)
│   ├── api-client/      — @m2/api-client : typed client for m2-back
│   ├── i18n/            — @m2/i18n       : next-intl config + en/es messages
│   └── config/          — @m2/config     : shared tsconfig/eslint/prettier/tailwind presets
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── package.json         — workspace runner (pnpm + Turborepo)
```

| Package | Description |
|---|---|
| `@m2/mobile` | Expo/React Native app — the phone client |
| `@m2/landing` | Public marketing site (Next.js, SSG, i18n es/en) |
| `@m2/admin` | Auth-gated admin dashboard (Next.js, JWT via `@m2/api-client`) |
| `@m2/types` | Pure TypeScript interfaces consumed by mobile + web apps |
| `@m2/design` | Design tokens (colors, spacing, typography, radii, glows) + Tailwind preset |
| `@m2/ui` | Glassmorphism + gradient React components for web |
| `@m2/api-client` | Fetcher, token store, typed client; codegen from `/api/docs-json` |
| `@m2/i18n` | next-intl shared config + message catalogs |
| `@m2/config` | Shared tooling presets (tsconfig, eslint, prettier, tailwind) |

## Stack

| Layer | Technology |
|---|---|
| Package manager | **pnpm 9.x** (via Corepack) |
| Task runner | **Turborepo v2** |
| Framework | Expo SDK 55 + React Native 0.83 |
| Language | TypeScript (strict) |
| Navigation | Expo Router v55 (typed routes) |
| State | Zustand v5 |
| Architecture | New Architecture (Fabric enabled) |
| Animations | react-native-reanimated v4 |
| Auth tokens | expo-secure-store |
| Images | expo-image |
| UI effects | expo-blur (glassmorphism) |
| HTTP | Axios |

## Getting Started

```bash
# 1. Node 20.19.4 (nvm reads .nvmrc)
nvm use

# 2. Enable pnpm via Corepack (once per machine)
corepack enable
corepack prepare pnpm@9.15.0 --activate

# 3. Install dependencies at the workspace root
pnpm install

# 4. Start Metro for the mobile app
pnpm --filter @m2/mobile start
#  or equivalently:
pnpm mobile:start
```

> Expo Go does **not** support Google Sign-In. Use `expo-dev-client` for full native builds.

### Windows long paths

pnpm's hoisted tree plus nested monorepo paths can hit Windows' 260-char limit. If `pnpm install` fails with path errors:

```bash
git config --global core.longpaths true
# pnpm 9.x additional knob (optional):
pnpm config set long-paths true
```

## Common Commands

```bash
pnpm install                         # install all workspace deps
pnpm -w typecheck                    # typecheck all workspaces via Turbo
pnpm -w build                        # build all workspaces
pnpm -w lint                         # lint all workspaces

# Mobile
pnpm mobile start                    # start Metro for mobile
pnpm mobile android                  # open Android dev client
pnpm mobile ios                      # open iOS simulator

# Web apps
pnpm dev:landing                     # Landing at http://localhost:3001
pnpm dev:admin                       # Admin at http://localhost:3002
pnpm build:web                       # Build both landing + admin
pnpm --filter @m2/api-client generate:api   # codegen when backend is running
```

## Web Apps

| App | Local URL | Deploy target | Role |
|---|---|---|---|
| Landing (`@m2/landing`) | `http://localhost:3001` | `motomoto.app` | Public marketing + signup CTA |
| Admin (`@m2/admin`) | `http://localhost:3002` | `app.motomoto.app` | JWT-gated dashboard / inbox / profile |

### Environment variables

Copy each app's `.env.example` to `.env.local` and fill the values.

**Landing** (`apps/landing/.env.local`):
- `NEXT_PUBLIC_API_URL` — e.g. `http://localhost:3000`
- `NEXT_PUBLIC_SITE_URL` — e.g. `http://localhost:3001`
- `NEXT_PUBLIC_ADMIN_URL` — e.g. `http://localhost:3002`
- `NEXT_PUBLIC_DEFAULT_LOCALE` — `es` (default) or `en`

**Admin** (`apps/admin/.env.local`):
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_LANDING_URL`
- `NEXT_PUBLIC_DEFAULT_LOCALE`

### Backend CORS (local)

`m2-back` must allow both web origins. In its `.env`:

```env
CORS_ORIGIN=http://localhost:3001,http://localhost:3002
```

### Smoke test (manual)

1. Landing at `/` (es) and `/en` (en) — hero renders, locale switch works
2. Landing CTA "Iniciar sesión" opens `/admin/login`
3. Admin login with valid credentials → redirect to `/admin`
4. Dashboard shows KPI cards
5. Inbox list + detail load; 5s polling refreshes data
6. Profile page shows user; logout clears session
7. Middleware redirects unauthenticated users to `/admin/login`

### Vercel deploy

- **Landing project**: Root `apps/landing`, build `pnpm turbo run build --filter=@m2/landing...`
- **Admin project**: Root `apps/admin`, build `pnpm turbo run build --filter=@m2/admin...`
- Both projects import the same monorepo (`raoole20/m2-front`).

### Production DNS

- `motomoto.app` → Vercel landing
- `www.motomoto.app` → 308 redirect to `motomoto.app`
- `app.motomoto.app` → Vercel admin

## Path Aliases

- Inside `apps/mobile/`: `@/*` resolves to `apps/mobile/src/*` (screens, components, hooks, stores, services, mocks).
- Across the workspace: `@m2/types` and `@m2/design` resolve to `packages/*/src/index.ts` via pnpm's `workspace:*` protocol.

## Key Rules

- **No hardcoded values** — all colors/spacing from `@m2/design`
- **Role checks** — always `hasMinRole('manager')` via `ROLE_HIERARCHY`, never `=== 'manager'`
- **Zustand selectors** — wrap object/array selectors with `useShallow`
- **AI calls** — only through `apps/mobile/src/services/ai.ts`
- **Auth tokens** — `expo-secure-store` only, never `AsyncStorage`
- **Images** — `expo-image` only, never RN `<Image>`
- **Animations** — `react-native-reanimated` v4 `withSpring`, never `Animated` from RN
- **TypeScript** — `strict: true`, zero errors, no `any`, no `!` assertions
- **Typecheck cadence** — run `pnpm -w typecheck` before marking any phase complete

## Deep Links

Scheme: `motomoto://`

## Remotes

This repo is pushed to two GitHub remotes via dual-URL `origin`:

- `Ramsesdb/motomoto` (original mirror)
- `raoole20/m2-front` (authoritative — PRs target this)

A single `git push origin <branch>` fans out to both.
