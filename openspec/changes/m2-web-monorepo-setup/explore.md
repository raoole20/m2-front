# Explore — m2-web-monorepo-setup

> Phase: `sdd-explore` · Change: `m2-web-monorepo-setup` · Date: 2026-04-19
> Output of this phase: scope, constraints, options weighed, open questions.
> This is **exploration only** — no implementation, no file scaffolding yet.

---

## 1. Problem Statement

Motomoto today exists as a **mobile-only** product: an Expo/React Native CRM and unified-messaging app for agents on the go. The backend (`m2-back`, NestJS 11 + Prisma + Postgres + Redis, multi-tenant) already exposes a full REST API under `/api` and is stable enough to consume.

What is missing is the **web surface**:

1. A **public landing page** to explain the product, the AI value proposition, and drive signups/contact (marketing).
2. A **role-gated admin dashboard** where OWNERs and ADMINs can log in from desktop, triage conversations, review KPIs, and manage their tenant — without needing a phone.

We are launching v1 of both in a single **monorepo** (`m2-web`) so that a **shared design system** (a web port of the mobile app's visual language, using the Stitch "Luminous Executive / Digital Nebula" theme) stays in sync across landing and admin, and future surfaces (e.g. client portal) slot in without re-doing tokens, components, or the API client.

**Why now**
- Backend REST is ready (`/api/auth/*`, `/api/conversations`, etc.) — no blockers on data.
- Mobile MVP is feature-stable (phase 1 types + visual overhaul complete); cognitive load is free for a web push.
- Prospects repeatedly ask for a desktop inbox; sales needs a landing URL to point at.

---

## 2. Current State

### 2.1 What exists today

| Surface | Path | Status |
|---|---|---|
| Mobile app | `c:/Users/ramse/OneDrive/Documents/vacas/motomoto/` | Live, Expo SDK 55, dev client running on Android |
| Backend API | `c:/Users/ramse/OneDrive/Documents/vacas/_m2-back-scratch/` (scratch ref) | NestJS 11, Postgres, Redis, multi-tenant, port `:3000` |
| Web frontend | `c:/Users/ramse/OneDrive/Documents/vacas/m2-web/` | **Empty** — only `openspec/` bootstrap folder exists |

### 2.2 Backend surface we can consume (read-only for v1)

- Global prefix: `/api`
- Dev port: **3000**
- Swagger JSON: `GET /api/docs-json` (usable by `openapi-typescript` or `orval` for typed client codegen)
- Auth:
  - `POST /api/auth/register` — creates a **new tenant + OWNER** (not for end-users in v1)
  - `POST /api/auth/login` → `{ accessToken, refreshToken }`
  - `POST /api/auth/refresh`
  - `GET /api/auth/me`
- Resources: `auth`, `tenants/me`, `channels`, `contacts`, `conversations`, `messages`, `ai-contexts`, `actions`, `webhooks`
- Roles enum: `OWNER | ADMIN | AGENT` (no `CLIENT` yet)
- Response envelope: `{ success: true, data: T, meta?: {...} }`
- CORS: wildcard `*` (will tighten before prod)
- **No WebSocket gateway yet** — realtime is v2
- **No public user-invite endpoint** — admins cannot yet create ADMINs/AGENTs from UI

### 2.3 Design language to mirror

The mobile app's design tokens live at `c:/Users/ramse/OneDrive/Documents/vacas/motomoto/src/design/{colors,typography,spacing,index}.ts`. The Stitch project **"The Luminous Executive"** (`projects/16030392972368277844`) is the canonical source of truth for the web port. Key motifs:

- Dark-first background `#0A0A0A`, surface-container `#201F1F`
- Primary blue `#ADC6FF`, secondary purple `#E9B3FF`, tertiary green `#6CFF81`, error `#FFB4AB`
- Glass: `rgba(32,31,31,0.65)` + `backdrop-blur: 30px` + 1px top/left inner highlight (primary @ 20%)
- Typography: **Manrope** (display 700–800) + **Inter** (body 400–500)
- Radius default **8px**, base-4 spacing scale
- **No black shadows** — colored glows only, e.g. `0 8px 24px rgba(173,198,255,0.15)`
- Motifs: mesh-gradient backdrops, glass panels, "Pulse" breathing animation for fresh data

### 2.4 What's missing

- No package manager setup, no framework, no deploy target
- No typed API client
- No shared design tokens in CSS/Tailwind form
- No auth flow on the web
- No admin routes or middleware
- No landing copy or imagery

---

## 3. Goals

### 3.1 v1 Goals (in scope)

- **Monorepo** with `pnpm` workspaces + **Turborepo** orchestrating tasks (`dev`, `build`, `lint`, `typecheck`)
- **Apps**
  - `apps/landing` — Next.js 15 App Router, public marketing site, Spanish copy (LatAm)
  - `apps/admin` — Next.js 15 App Router, role-gated dashboard
- **Shared packages**
  - `packages/ui` — design system (tokens + components: GlassCard, GradientButton, KPICard, MeshGradient, AuraGlow, FilterTab, SunkenInput…)
  - `packages/tokens` — color/typography/spacing/radius/glow primitives shipped as both TS constants and CSS vars
  - `packages/api-client` — generated OpenAPI types + fetch wrapper with auth header injection + response envelope unwrap
  - `packages/config` — shared `tsconfig`, `eslint`, `prettier`, `tailwind` presets
- **Landing surfaces**
  - Hero, channels logos strip, feature grid (glass cards), AI highlight block, testimonials, pricing/CTA, footer
  - "Iniciar sesión" CTA → `/admin/login` (cross-app link)
- **Admin surfaces**
  - `/admin/login` — email + password → `POST /api/auth/login` → stash JWT in `localStorage`
  - `/admin` — dashboard home (KPIs, quick links)
  - `/admin/inbox` — list (GET `/api/conversations`) + detail (GET `/api/conversations/:id` + messages), polling every 5s
  - `/admin/profile` — `GET /api/auth/me` + logout
  - Middleware guards all `/admin/*` except `/admin/login`
  - Client-side role check based on `user.role`
- **Ports**: landing `:3001`, admin `:3002` (so backend `:3000` stays clear)
- **Design parity**: every token (color, spacing, radius, glow, font) is a direct web port of the mobile `src/design/` source
- **Type safety**: `tsc --noEmit` passes across all packages; API types regenerated from Swagger

### 3.2 Non-Goals (explicitly deferred)

- Signup / registration UI (backend `register` creates a new tenant — not for end-user signup)
- Password reset / email verification flow
- User invites (create ADMIN/AGENT from the UI)
- WebSocket / realtime inbox updates (v1 uses 5s polling)
- `CLIENT` role handling (not in backend yet)
- File uploads / media previews in messages
- SSR auth (v1 is client-side JWT in `localStorage`; migration to httpOnly cookies deferred)
- i18n framework (v1 ships Spanish only; no language switcher)
- Analytics / telemetry wiring
- E2E tests (Playwright) in v1 — unit/component tests only if time permits
- Storybook / component catalogue
- PWA / offline support
- Multi-tenant subdomain routing (single domain in v1, tenant inferred from JWT)

---

## 4. Constraints

### 4.1 Locked-in user decisions

| Area | Decision | Rationale |
|---|---|---|
| Monorepo tool | **Turborepo + pnpm workspaces** | Fast, Vercel-native, low config, good remote cache story |
| Landing framework | **Next.js 15 App Router** | SEO, ISR for marketing pages, shared tooling with admin |
| Admin framework | **Next.js 15 App Router** | Middleware for route guards, RSC for static shell, same stack as landing |
| Repo location | `c:/Users/ramse/OneDrive/Documents/vacas/m2-web/` (sibling to motomoto/) | Keeps mobile and web independently versioned but side-by-side |
| Auth v1 | Client-side JWT in `localStorage` | Backend has no session cookies yet; migrate later |
| Realtime v1 | **Polling every 5s** | No WS gateway in backend yet |
| Design source | Stitch "The Luminous Executive" | Already designed; dark-first, glass, mesh gradients |
| Language | Spanish (LatAm) | Matches mobile app and target market |

### 4.2 Backend constraints (cannot modify in v1)

- No cookie-based auth → web must store tokens client-side
- No WS endpoint → polling only
- No user-invite API → admin panel cannot manage non-OWNER accounts
- No `CLIENT` role → admin UI must not reference it
- Response envelope `{ success, data, meta }` must be unwrapped client-side before typed types are usable
- CORS is currently `*` (fine for dev, will tighten — web must not rely on it staying open)

### 4.3 Environment constraints

- Node **20.19.4** (matches mobile `.nvmrc`) — use same across monorepo
- Windows 11 dev machine — path separators, `cross-env`, and line endings (`.gitattributes` with `text=auto eol=lf`) must be handled
- Landing and admin must run concurrently with mobile metro bundler + backend on the same machine — port collisions avoided by `:3001` / `:3002`

---

## 5. Options Considered

### 5.1 Monorepo tool

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Turborepo + pnpm** (chosen) | Minimal config, `turbo.json` is 20 lines, Vercel-native, great remote cache on Vercel, pnpm is fast + strict | Turbo is newer than Nx; fewer "generators"; plugin ecosystem smaller | **Pick** — we don't need Nx's codegen; the cache + task graph is enough |
| Nx | Powerful generators, module boundary enforcement, mature plugins | Heavier config, opinionated project graph, more to learn, `nx.json` + `project.json` proliferation | Reject — overkill for 2 apps + 4 packages |
| Plain pnpm workspaces (no Turbo) | Zero extra tool | No task caching → slower CI, manual task orchestration | Reject — caching alone is worth Turbo |
| Yarn Berry workspaces | PnP mode, zero-installs | PnP trips up Next.js and some libs; node_modules mode works but pnpm is faster | Reject |
| Bun workspaces | Fastest installs | Ecosystem stability for Next 15 + Prisma-adjacent tooling still immature on Windows | Reject for now |

### 5.2 Framework(s)

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Next.js 15 App Router for both** (chosen) | One framework to learn, RSC, built-in middleware for auth guard, ISR for landing, Vercel-native deploy | Admin doesn't need SEO/RSC; slight overkill | **Pick** — unification wins over minor overkill |
| Astro landing + Next.js admin | Astro is perfect for marketing (zero JS by default) | Two frameworks = two mental models, two toolchains, harder to share components | Reject |
| Remix for both | Loader/action model is great for dashboards | Smaller ecosystem, less team familiarity, Vercel story weaker | Reject |
| Vite + React Router for admin | Lightweight SPA | Loses Next middleware → manual auth guard; bundle tuning harder | Reject |

### 5.3 Styling

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Tailwind v4 + CSS variables** (lean) | Fastest iteration, tokens as CSS vars map cleanly to Stitch design, dark-first is trivial | No runtime theming primitives; need discipline on custom utilities | **Pick** — tokens-as-CSS-vars in `packages/tokens` consumed by all apps |
| Tailwind + CSS Modules | Scoped styles for complex components | Mixing two systems bloats config | Reject |
| Vanilla-extract | Type-safe styles, zero-runtime | Heavier setup, slower iteration | Reject |
| Stitches / Panda CSS | Variants API feels native for a design system | Panda v1 adds a compile step we don't need; Stitches is unmaintained | Reject |
| Emotion / styled-components | Familiar | Runtime cost; RSC integration awkward | Reject |

### 5.4 API client

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **`openapi-typescript` + thin `fetch` wrapper** (chosen) | Just types, no runtime bloat; wrapper handles auth header + envelope unwrap; works in RSC and client | We write our own fetcher | **Pick** — minimal surface, easy to maintain |
| Orval | Generates full SDK with React Query hooks | Heavier, opinionated output, harder to customize | Reject for v1; reconsider if we adopt React Query broadly |
| `@hey-api/openapi-ts` | Active, good DX | Still settling; less battle-tested | Reject |
| Hand-written client | Total control | Drifts from Swagger; type-safety burden | Reject |

### 5.5 Auth storage

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **`localStorage` JWT (v1)** (chosen) | Works today with existing backend; no backend change | XSS-vulnerable; not SSR-friendly | **Pick for v1** — documented migration path |
| httpOnly cookies + SSR | XSS-safe, SSR-ready | Backend must issue `Set-Cookie` with `SameSite` + refresh rotation — not yet implemented | Defer to v2 (requires backend change) |
| `sessionStorage` | Auto-clears on tab close | Bad UX (logs out on refresh in new tab) | Reject |
| In-memory + silent refresh | Safer than localStorage | Complicated; still vulnerable without httpOnly | Reject |

### 5.6 State management (admin)

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **TanStack Query for server state + Zustand for UI state** (chosen) | Polling, caching, stale-while-revalidate for free; Zustand matches mobile-app mental model | Two libraries | **Pick** — best-in-class for admin dashboards |
| Just `fetch` + `useState` | Minimal | We'd re-invent polling + caching; painful for inbox | Reject |
| SWR | Similar to TanStack Query | TQ ecosystem is richer | Reject |
| Redux Toolkit | Battle-tested | Heavier than we need | Reject |

### 5.7 Realtime strategy

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **5s polling via TanStack Query `refetchInterval`** (chosen) | Works today; zero backend change | Wasteful at scale | **Pick for v1** |
| SSE | Half the complexity of WS, still pushes | Backend has neither; needs implementation | Defer |
| WebSocket | Real push | Backend gateway doesn't exist | Defer |

### 5.8 Testing

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Vitest + Testing Library** (chosen, lean) | Fast, Vite-native, works in monorepo | ESM quirks occasionally | **Pick** — only for critical utilities and auth guard in v1 |
| Jest | Ubiquitous | Slower, heavier ESM story with Next 15 | Reject |
| Playwright | Great E2E | Out of scope for v1 | Defer |

### 5.9 Deploy target

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Vercel** (expected) | Native Next + Turbo remote cache, preview URLs per PR | Vendor lock-in (minor) | **Lean pick** — confirm in proposal |
| Cloudflare Pages | Fast edge | Next 15 App Router edge compat still has sharp edges | Defer |
| Self-host (Docker) | Full control | Ops burden | Reject v1 |

---

## 6. Open Questions (need user input before `sdd-propose`)

1. **Domain / URLs**: What are the intended production hostnames? (e.g. `motomoto.app` for landing, `app.motomoto.app` for admin?) This affects CORS, cookie scope in v2, and whether we need `rewrites`/`redirects` across apps.
2. **Deploy target confirmation**: Vercel assumed — confirm so we can wire `turbo.json` remote cache and `vercel.json` per app.
3. **Analytics**: Should landing ship with Plausible / PostHog / Vercel Analytics in v1, or zero telemetry until v2?
4. **Tenant identification in web**: Will we ever need subdomain-per-tenant (e.g. `acme.motomoto.app`)? If so, monorepo routing needs planning now. Assumed **no** for v1.
5. **Error monitoring**: Sentry now, or later? (If now, which package shape do we want — shared `packages/observability`?)
6. **Copy / content ownership**: Who writes landing copy — is there draft text, or does this phase produce placeholder Spanish?
7. **Brand assets**: Logo, channel icons (WhatsApp, Instagram, etc.), testimonial avatars — do we have final assets or use placeholders?
8. **Pricing section**: Real tiers, or "Contact sales" CTA only in v1?
9. **Feature flagging**: Do we need a flag system (e.g. `NEXT_PUBLIC_FEATURE_*`) from day one, or YAGNI?
10. **License / repo visibility**: Private GitHub repo (`Ramsesdb/m2-web`) assumed — confirm name and visibility.

---

## 7. Risks

### 7.1 Technical

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Backend Swagger drift → client types go stale | Medium | Medium | Add `pnpm generate:api` script + CI check; run on backend release tags |
| CORS tightens mid-development and breaks local dev | Low | High | Document `ALLOWED_ORIGINS` env var request to backend team; fail loudly with helpful error |
| `localStorage` JWT + XSS exposure | Medium | High | Strict CSP headers in Next middleware; no `dangerouslySetInnerHTML` without sanitizer; plan v2 migration to cookies |
| Polling at 5s × many tabs hammers backend | Low | Medium | Pause polling when tab hidden (`visibilitychange`); exponential backoff on 429 |
| Tailwind v4 + Next 15 + monorepo config quirks on Windows | Medium | Low | Pin versions; document a known-good `pnpm` version; `.gitattributes` for line endings |
| Design drift between mobile (React Native) and web (Tailwind) tokens | High | Medium | Single source: export tokens from `packages/tokens` as TS consts; write a codegen that emits the same values to mobile's `src/design/` (one-way) later |
| Turbo remote cache not configured → CI slow | Low | Low | Wire in first PR to Vercel |
| RSC vs client component confusion for auth'd pages | Medium | Medium | Clear convention: admin pages are client components by default; only layout + landing are RSC |

### 7.2 Scope / process

| Risk | Mitigation |
|---|---|
| Scope creep from "admin should also do X" | Explicit non-goals list; defer to v2 backlog |
| Design parity becomes bikeshedding | Tokens are law; components are implementation detail; ship first, refine later |
| Two apps = 2× maintenance | Shared `packages/*` absorb 80% of the surface; apps stay thin |
| Parallel development with mobile | Monorepo is isolated from `motomoto/`; no shared files in v1 |

---

## 8. Recommended Direction

Stand up a **Turborepo + pnpm workspaces** monorepo at `c:/Users/ramse/OneDrive/Documents/vacas/m2-web/` containing two **Next.js 15 App Router** apps (`apps/landing` on `:3001`, `apps/admin` on `:3002`) and four shared packages (`tokens`, `ui`, `api-client`, `config`). Port the mobile app's "Luminous Executive" design tokens into `packages/tokens` (TS + CSS vars), build the admin as a client-side SPA that talks to the existing `m2-back` REST API with JWT-in-`localStorage` and 5s polling, and keep the landing fully static/ISR.

This unblocks the desktop inbox and marketing URL on a single stack the team already knows, shares a single design system across surfaces, and leaves clear migration seams for cookie auth and WebSocket realtime in v2 without rewrites.

---

## 9. Ready for `sdd-propose`?

**Yes — with caveats.** The 10 open questions in §6 should be triaged by the user before proposal. Items 1–2 (domains, deploy target) and 6–8 (content, assets, pricing) are the highest-signal gating questions; the rest can default to sensible "v1 = off" answers inside the proposal.
