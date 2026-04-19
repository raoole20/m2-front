# Specification — m2-web-monorepo-setup

> Phase: `sdd-spec` · Change: `m2-web-monorepo-setup` · Date: 2026-04-19
> Source: `proposal.md` (authoritative scope) + `explore.md` (context).
> Purpose: enumerate the **observable behavior** v1 must exhibit. This document is the acceptance contract; it defines WHAT, not HOW. Implementation details live in `design.md`.

---

## 1. Glossary

| Term | Definition |
|------|------------|
| **Tenant** | A top-level organizational unit in the backend. A tenant owns users, channels, contacts, conversations, and messages. Every authenticated request is scoped to exactly one tenant (inferred from the JWT). |
| **OWNER** | Highest role. Created implicitly by `POST /api/auth/register`. Has full access to everything within the tenant, including tenant settings. |
| **ADMIN** | Middle role. Has access to inbox, profile, and tenant settings. Cannot delete the tenant or transfer ownership. |
| **AGENT** | Lowest role in v1. Has access only to inbox and profile. Cannot view or modify tenant-wide settings. |
| **CLIENT** | Planned future role. **Not in v1.** Any appearance in the UI is a bug. |
| **Session** | The period during which an `accessToken` (short-lived JWT) plus `refreshToken` (long-lived) are held in the browser and used to authorize API calls. |
| **Locale** | A supported UI language. v1 supports exactly two: `es` (Spanish, default) and `en` (English). |
| **Locale prefix** | Optional URL segment (`/en`) that identifies the rendered locale. Default locale (`es`) is served at the apex path with **no** prefix (strategy: `as-needed`). |
| **Landing** | The public marketing app, deployed at `motomoto.app`. No authentication. |
| **Admin** | The role-gated dashboard app, deployed at `app.motomoto.app`. All routes except `/admin/login` require authentication. |
| **Envelope** | The backend response wrapper: `{ success: boolean, data?: T, error?: { code, message, details? }, meta?: {...} }`. Web clients must unwrap `data` before returning to callers. |
| **Polling** | Client-side periodic refetch of a resource via `setInterval` or TanStack Query's `refetchInterval`. v1 uses a 5-second interval, paused when the tab is hidden. |
| **Glass card** | UI primitive: `background: rgba(32,31,31,0.65)`, `backdrop-filter: blur(30px)`, 1px inner highlight on top/left edges at 20% of primary blue. |
| **Mesh gradient** | Multi-stop radial/conic gradient used as decorative backdrop on hero and AI-highlight sections. |
| **Token** | A design primitive (color, spacing, radius, glow, font) exported from `packages/design`. |
| **KPI card** | A glass-card variant displaying a single numeric metric with a label and optional trend indicator. |
| **JWT** | JSON Web Token. v1 stores `accessToken` and `refreshToken` in browser `localStorage` (keys `m2_access_token`, `m2_refresh_token`). |
| **Redirect intent** | Query param `?redirect=<path>` appended when middleware bounces an unauthenticated user to `/admin/login`, so post-login navigation returns them to the originally requested route. |

---

## 2. Non-functional requirements

### 2.1 Performance

| Metric | Target | Measured on | Notes |
|--------|--------|-------------|-------|
| **LCP** (Largest Contentful Paint) — landing `/` | ≤ 2.5 s at p75 | Vercel Speed Insights or Lighthouse mobile profile | Hero image/gradient counts as LCP element |
| **TTI** (Time To Interactive) — landing `/` | ≤ 3.5 s at p75 | Lighthouse | |
| **LCP** — admin `/admin` (after auth) | ≤ 3.0 s at p75 | Lighthouse, throttled 4G | Measured from dashboard render, not login |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | Lighthouse | All pages |
| **Locale switch** (client nav) | ≤ 500 ms from click to rendered content | Manual + Lighthouse user flow | Measured on landing and admin topbar switchers |
| **First paint after login** | ≤ 2.0 s from form submit to dashboard shell | Manual stopwatch | Localhost, warm cache |
| **Inbox polling overhead** | ≤ 1 request per conversation list or detail per 5 s | Network panel | Must pause on tab hidden |

### 2.2 Accessibility

- **WCAG 2.1 level AA** compliance for all user-facing routes in both locales.
- All interactive elements MUST be keyboard-reachable with a visible focus ring.
- Color contrast for text MUST be ≥ 4.5:1 (normal) and ≥ 3:1 (large ≥ 18 pt).
- All images MUST have `alt` text (empty `alt=""` for decorative).
- Forms MUST associate labels with inputs via `for`/`id` or wrapping.
- Live regions (`aria-live="polite"`) MUST announce toast errors.
- `prefers-reduced-motion: reduce` MUST disable the Pulse animation and mesh-gradient motion.

### 2.3 Browser support

- **Chromium** (Chrome, Edge) ≥ 2 latest major versions
- **Firefox** ≥ 2 latest major versions
- **Safari** (macOS + iOS) ≥ 2 latest major versions
- **No** IE11, no legacy Edge.
- `backdrop-filter` fallback: solid `#201F1F` at 95% opacity when unsupported.

### 2.4 Security

- `accessToken` and `refreshToken` stored in `localStorage`. XSS mitigation via strict CSP in Next middleware (`default-src 'self'; script-src 'self' 'unsafe-inline'` tightened to nonce in production).
- `dangerouslySetInnerHTML` MUST NOT be used with user-provided content.
- All requests to the backend MUST use HTTPS in production.
- No secrets (API keys, tokens) MAY appear in `NEXT_PUBLIC_*` env vars other than the public API URL.

### 2.5 Session / timeout behavior

- `accessToken` expiry SHALL be respected — on 401, the client attempts exactly ONE refresh, then logs the user out on failure.
- No idle timeout in v1. Session persists as long as `refreshToken` is valid.
- Closing the browser tab does NOT clear tokens (localStorage persists).
- Logout MUST clear both tokens and the TanStack Query cache.

### 2.6 Reliability / availability

- Both apps are static/SSR/ISR on Vercel; availability target ≥ 99.9% (Vercel SLA).
- Backend outages MUST NOT crash the admin shell — errors surface as toasts; the UI remains interactive.

### 2.7 Internationalization quality

- **Zero** hardcoded user-facing strings. CI check greps for stringly literals in JSX text children and fails on hits (excluding design tokens and test files).
- Missing translation keys fall back to `es` and log a `console.warn` in dev (no-op in prod).

---

## 3. Requirements by capability

## Prerequisite — post-migration baseline

### REQ-PREREQ-001 — Precursor migration must be merged

The precursor change `mobile-to-monorepo-migration` MUST be merged into `main` of `raoole20/m2-front` before any work under this change begins. The repo state at the start of this change MUST satisfy **all** of the following:

- Root configs present and committed: `pnpm-workspace.yaml` (listing `apps/*` and `packages/*`), `turbo.json`, root `package.json` pinning `packageManager: "pnpm@9.x"`, `tsconfig.base.json`, `.npmrc` (with Expo-safe pnpm hoisting), `.gitignore`, `.gitattributes`, `.nvmrc` (20.19.4).
- `apps/mobile/` exists and contains the Motomoto Expo app; `pnpm --filter @m2/mobile start` launches the Expo dev server cleanly from a fresh clone after `pnpm install`.
- `packages/types` (name `@m2/types`) exists and is importable from `apps/mobile`.
- `packages/design` (name `@m2/design`) exists and is importable from `apps/mobile`; mobile's token imports already point at `@m2/design` (not `@/design`).
- `pnpm install` at the repo root completes without error.

#### Scenario: Baseline check from fresh clone

- GIVEN a developer clones `raoole20/m2-front` at `main`
- WHEN they run `pnpm install` and `pnpm turbo run typecheck --filter=@m2/mobile`
- THEN both commands succeed
- AND `pnpm list -r --depth=-1` lists at minimum `@m2/mobile`, `@m2/types`, `@m2/design`

No task in this change may run if REQ-PREREQ-001 is not satisfied. The first phase-0 task verifies it.

---

## A. Landing page (public)

### REQ-LAND-001 — Hero renders in both locales

The landing page MUST render a hero section in both `es` (default, at `/`) and `en` (at `/en`) with no hardcoded strings.

#### Scenario: User visits apex URL with default locale

- GIVEN the visitor has no `NEXT_LOCALE` cookie and `Accept-Language: es`
- WHEN they navigate to `https://motomoto.app/`
- THEN the hero renders in Spanish using keys from `messages/es.json`
- AND the `<html lang="es">` attribute is set
- AND no `/es` redirect occurs (strategy: `as-needed`)

#### Scenario: User visits English locale explicitly

- GIVEN any visitor
- WHEN they navigate to `https://motomoto.app/en`
- THEN the hero renders in English using keys from `messages/en.json`
- AND `<html lang="en">` is set

#### Scenario: Browser language triggers English

- GIVEN the visitor has no `NEXT_LOCALE` cookie and `Accept-Language: en-US,en`
- WHEN they navigate to `https://motomoto.app/`
- THEN the page redirects to `https://motomoto.app/en`

### REQ-LAND-002 — Locale switcher persists choice

The landing page MUST include a locale switcher that persists the user's choice via a `NEXT_LOCALE` cookie (1-year expiry).

#### Scenario: User switches locale and returns

- GIVEN a visitor on `/` (Spanish)
- WHEN they click the locale switcher and choose English
- THEN the URL becomes `/en`
- AND a cookie `NEXT_LOCALE=en` is set with `max-age=31536000`
- AND on their next visit to `/`, they are redirected to `/en`

### REQ-LAND-003 — "Iniciar sesión" CTA links to admin

The landing page header MUST include a login CTA that deep-links to the admin app login.

#### Scenario: User clicks login CTA

- GIVEN a visitor on the landing page
- WHEN they click the "Iniciar sesión" / "Log in" button
- THEN they are navigated to `${NEXT_PUBLIC_ADMIN_URL}/admin/login` in the current locale
- AND the admin login page opens

### REQ-LAND-004 — "Contact sales" CTA opens mailto

The landing page MUST include a "Contact sales" CTA that opens a mailto link.

#### Scenario: User clicks Contact sales

- GIVEN a visitor on the landing page
- WHEN they click "Contact sales" / "Contactar ventas"
- THEN the browser opens `mailto:contact@motomoto.app` with a localized subject line

### REQ-LAND-005 — Channels strip displays logos

The landing page MUST display a strip of supported messaging channels using `simple-icons` and/or `lucide` marks.

#### Scenario: Channels strip renders

- GIVEN the landing page is rendered
- WHEN the visitor scrolls to the channels section
- THEN at least 4 channel logos are visible (e.g. WhatsApp, Instagram, Messenger, Email)
- AND each logo has an accessible name via `aria-label`

### REQ-LAND-006 — Features grid renders as glass cards

The landing page MUST render a features grid where each feature is a glass card from `@m2/ui`.

#### Scenario: Features grid layout

- GIVEN a desktop viewport ≥ 1024px
- WHEN the features section is in view
- THEN the grid shows at least 3 glass cards in a row
- AND each card has `background: rgba(32,31,31,0.65)` and `backdrop-filter: blur(30px)`
- AND each card has a colored glow shadow, not a black one

### REQ-LAND-007 — AI highlight section with mesh gradient

The landing page MUST include an AI highlight section with a mesh-gradient background.

#### Scenario: AI section renders

- GIVEN the landing page
- WHEN the visitor scrolls to the AI highlight section
- THEN a mesh gradient backdrop is visible
- AND AI-feature copy is rendered from the active locale's messages file

### REQ-LAND-008 — Testimonials render with initials avatars

The landing page MUST render a testimonials section with initials-circle placeholder avatars.

#### Scenario: Testimonials display

- GIVEN the landing page
- WHEN the visitor scrolls to testimonials
- THEN at least 2 testimonial cards are visible
- AND each avatar is an initials circle (no real photos in v1)
- AND testimonial text is locale-driven

### REQ-LAND-009 — Pricing CTA uses mailto only

The landing page MUST render a pricing section with a single "Contact sales" mailto CTA — no tiered pricing in v1.

#### Scenario: Pricing section

- GIVEN the landing page
- WHEN the visitor scrolls to the pricing section
- THEN no numeric price tiers are shown
- AND a single "Contact sales" CTA is visible that opens `mailto:contact@motomoto.app`

### REQ-LAND-010 — Footer renders with locale-driven links

The landing page MUST render a footer with brand, locale-driven links, and a copyright line.

#### Scenario: Footer renders

- GIVEN any landing route
- WHEN the page is rendered
- THEN a footer is visible at the bottom with at least: brand mark, contact link, copyright year
- AND all text is sourced from messages

### REQ-LAND-011 — SEO meta tags present

Every landing route MUST emit SEO meta tags including title, description, canonical URL, and Open Graph tags.

#### Scenario: Meta tags on `/`

- GIVEN a crawler requests `https://motomoto.app/`
- WHEN the response is returned
- THEN `<title>`, `<meta name="description">`, `<link rel="canonical">`, `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:url">`, `<meta property="og:image">` are all present
- AND `<link rel="alternate" hreflang="es" href="https://motomoto.app/">` and `<link rel="alternate" hreflang="en" href="https://motomoto.app/en">` are emitted

### REQ-LAND-012 — sitemap.xml and robots.txt served

The landing app MUST serve `/sitemap.xml` and `/robots.txt`.

#### Scenario: sitemap lists both locales

- GIVEN a crawler requests `/sitemap.xml`
- WHEN the response is returned
- THEN the XML lists at minimum `/` (es) and `/en` with `<xhtml:link rel="alternate" hreflang="...">` entries
- AND `/robots.txt` allows crawling and points to the sitemap

---

## B. Admin login

### REQ-AUTH-001 — Login page exists at locale-prefixed route

The admin app MUST serve a login page at `/admin/login` (es, apex) and `/en/admin/login`.

#### Scenario: Login page renders in Spanish

- GIVEN an unauthenticated user
- WHEN they navigate to `https://app.motomoto.app/admin/login`
- THEN a form with email and password fields renders
- AND all labels, placeholders, and button text use Spanish from `messages/es.json`

#### Scenario: Login page renders in English

- GIVEN an unauthenticated user
- WHEN they navigate to `https://app.motomoto.app/en/admin/login`
- THEN the same form renders with English copy

### REQ-AUTH-002 — Form validates email and password

The login form MUST validate email format and password length before submitting.

#### Scenario: Invalid email

- GIVEN the user is on the login form
- WHEN they type `notanemail` in the email field and submit
- THEN an inline error appears in the current locale (e.g. "Email no válido" or "Invalid email")
- AND no network request is made

#### Scenario: Password too short

- GIVEN the user types a valid email
- WHEN they type a password shorter than 8 characters and submit
- THEN an inline error "Password debe tener al menos 8 caracteres" (or EN equivalent) appears
- AND no network request is made

### REQ-AUTH-003 — Successful login stores tokens and redirects

Submitting valid credentials MUST call `POST /api/auth/login`, store tokens in `localStorage`, and redirect to `/admin`.

#### Scenario: Happy-path login

- GIVEN valid credentials for an OWNER user
- WHEN the user submits the form
- THEN the client calls `POST /api/auth/login` with `{ email, password }`
- AND on `{ success: true, data: { accessToken, refreshToken, user } }`:
  - `localStorage.m2_access_token` is set to the accessToken
  - `localStorage.m2_refresh_token` is set to the refreshToken
  - The Zustand `authStore.user` is hydrated
  - The user is navigated to `/admin` (or the `?redirect=` intent path if present)

### REQ-AUTH-004 — Failed login shows locale error inline

On a 401 or envelope `success: false`, the login page MUST show an inline error in the current locale and MUST NOT store any tokens.

#### Scenario: Wrong password

- GIVEN the user submits incorrect credentials
- WHEN the backend returns `{ success: false, error: { code: "INVALID_CREDENTIALS" } }`
- THEN an inline error renders (e.g. "Credenciales inválidas")
- AND `localStorage.m2_access_token` remains unset
- AND the user remains on `/admin/login`

### REQ-AUTH-005 — Loading state during submit

While the login request is in flight, the submit button MUST show a loading state and be disabled.

#### Scenario: Submit in flight

- GIVEN the user has clicked submit
- WHEN the network request is pending
- THEN the submit button shows a spinner or "Cargando..." label
- AND the button's `disabled` attribute is true
- AND the email/password inputs are also disabled

### REQ-AUTH-006 — Already-authenticated users are redirected away from login

If a user visits `/admin/login` with a valid session, they MUST be redirected to `/admin`.

#### Scenario: Authenticated user hits login page

- GIVEN the user has a valid `m2_access_token` in localStorage
- AND `GET /api/auth/me` returns a valid user
- WHEN they navigate to `/admin/login`
- THEN they are redirected to `/admin` (preserving locale)

---

## C. Admin route protection

### REQ-GUARD-001 — Middleware redirects unauth users

Next middleware MUST redirect unauthenticated requests to `/admin/*` (except `/admin/login`) to the login page, preserving the original path as `?redirect=`.

#### Scenario: Unauth user hits protected route

- GIVEN no session cookie sentinel (`m2_session`) is present
- WHEN the user navigates to `/admin/inbox`
- THEN the middleware responds with a 307 redirect to `/admin/login?redirect=%2Fadmin%2Finbox`

#### Scenario: Locale preservation on redirect

- GIVEN no session
- WHEN the user navigates to `/en/admin/profile`
- THEN they are redirected to `/en/admin/login?redirect=%2Fen%2Fadmin%2Fprofile`

### REQ-GUARD-002 — Expired token triggers single refresh

On any API 401, the client MUST attempt ONE refresh via `POST /api/auth/refresh`, retry the original request on success, and log the user out on failure.

#### Scenario: Token refresh succeeds

- GIVEN an expired `accessToken` but valid `refreshToken`
- WHEN any API call returns 401
- THEN the client calls `POST /api/auth/refresh` with the refresh token
- AND on success, updates `m2_access_token` (and `m2_refresh_token` if rotated)
- AND retries the original request exactly once
- AND the user sees the successful response

#### Scenario: Refresh fails

- GIVEN both tokens are invalid
- WHEN the first 401 triggers refresh and refresh also returns 401
- THEN the client clears `m2_access_token`, `m2_refresh_token`, and the Zustand authStore
- AND redirects to `/admin/login?reason=expired` in the current locale

### REQ-GUARD-003 — Role-based UI gating

The admin UI MUST gate features by role using `hasMinRole(user.role, required)`; direct equality checks against `user.role` are forbidden.

Role capability matrix:

| Capability | OWNER | ADMIN | AGENT |
|------------|:-----:|:-----:|:-----:|
| View inbox (list + detail) | ✓ | ✓ | ✓ |
| View own profile | ✓ | ✓ | ✓ |
| View tenant settings | ✓ | ✓ | ✗ |
| Edit tenant settings | ✓ | ✓ | ✗ |
| View dashboard KPIs | ✓ | ✓ | ✓ (limited) |
| Delete tenant / transfer ownership | ✓ | ✗ | ✗ |

#### Scenario: AGENT is gated out of tenant settings

- GIVEN a logged-in AGENT
- WHEN they inspect the admin navigation
- THEN no "Tenant settings" link is rendered

#### Scenario: AGENT force-navigates to a gated URL

- GIVEN a logged-in AGENT
- WHEN they manually navigate to `/admin/settings/tenant` (if it existed in v1)
- THEN they are soft-redirected to `/admin` with a locale-driven toast "No tienes permiso"

---

## D. Admin dashboard (`/admin`)

### REQ-DASH-001 — Dashboard shows welcome with user name

The dashboard home MUST show a welcome message using the authenticated user's `firstName` / `name` from `GET /api/auth/me`.

#### Scenario: OWNER sees personalized welcome

- GIVEN an authenticated OWNER with `firstName: "Ramses"`
- WHEN they navigate to `/admin`
- THEN the page renders "Hola, Ramses" (es) or "Hi, Ramses" (en)
- AND the greeting is sourced from messages (no hardcoded string)

### REQ-DASH-002 — Dashboard renders 4 KPI cards

The dashboard MUST render exactly 4 KPI cards in v1 with mock data (documented as placeholder).

#### Scenario: KPIs visible on dashboard

- GIVEN the dashboard is rendered
- WHEN the viewport is ≥ 1024px
- THEN 4 KPI cards are visible in a row
- AND each card shows a label, a numeric value, and an optional trend indicator
- AND values are mocked in v1 (documented as `MOCK_DASHBOARD_KPIS`)

### REQ-DASH-003 — Dashboard quick actions

The dashboard MUST render quick-action links to inbox and profile.

#### Scenario: Quick actions work

- GIVEN the dashboard is rendered
- WHEN the user clicks "Go to inbox" / "Ir a inbox"
- THEN they are navigated to `/admin/inbox` in the current locale

### REQ-DASH-004 — Glass-card aesthetic matches design system

All dashboard surfaces MUST use tokens from `@m2/design` — no hardcoded hex/px values.

#### Scenario: Dashboard uses tokens

- GIVEN the dashboard is rendered
- WHEN a code reviewer inspects the source
- THEN every color, spacing, radius, and glow references `@m2/design` (via TS const or CSS variable)

---

## E. Admin inbox (`/admin/inbox`)

### REQ-INBOX-001 — Inbox lists conversations from API

The inbox list MUST fetch and render conversations from `GET /api/conversations`.

#### Scenario: Conversations render on first load

- GIVEN an authenticated user
- WHEN they navigate to `/admin/inbox`
- THEN `GET /api/conversations` is called
- AND each conversation returned renders as a `ConversationCard`
- AND sorting is by `updatedAt` descending

### REQ-INBOX-002 — Filter tabs: all, open, pending, resolved

The inbox MUST expose filter tabs: all / open / pending / resolved. Selecting a tab filters the rendered list.

#### Scenario: User selects "open" tab

- GIVEN conversations exist in multiple states
- WHEN the user clicks the "Open" tab
- THEN only conversations with `status === 'open'` are rendered
- AND the URL reflects the filter via query param (e.g. `?status=open`) so it's shareable

### REQ-INBOX-003 — Clicking a conversation opens detail

Clicking a conversation card MUST navigate to `/admin/inbox/[id]`.

#### Scenario: User opens a conversation

- GIVEN the inbox list is rendered
- WHEN the user clicks a card with `id: "conv_123"`
- THEN they are navigated to `/admin/inbox/conv_123` (or `/en/admin/inbox/conv_123`)

### REQ-INBOX-004 — Detail view shows messages

The detail page MUST fetch messages from `GET /api/conversations/:id/messages` and render them in chronological order.

#### Scenario: Messages render

- GIVEN a conversation detail page for `conv_123`
- WHEN the page loads
- THEN `GET /api/conversations/conv_123/messages` is called
- AND messages render oldest-to-newest
- AND inbound vs outbound messages are visually distinguished

### REQ-INBOX-005 — Polling every 5 seconds

Both the inbox list and the detail view MUST poll their data every 5 seconds while the tab is visible; polling MUST pause when the tab is hidden.

#### Scenario: Polling refreshes the list

- GIVEN the inbox list is open and the tab is visible
- WHEN 5 seconds elapse
- THEN `GET /api/conversations` is called again
- AND new conversations appear without a manual refresh

#### Scenario: Polling pauses on hidden tab

- GIVEN the inbox list is polling
- WHEN the tab becomes hidden (`document.visibilityState === 'hidden'`)
- THEN no new polling requests are issued
- AND when the tab becomes visible again, polling resumes with an immediate refetch

### REQ-INBOX-006 — Empty state when no conversations

When the conversation list is empty, the inbox MUST render a localized empty state.

#### Scenario: No conversations yet

- GIVEN `GET /api/conversations` returns `data: []`
- WHEN the inbox renders
- THEN an empty-state illustration and copy ("No hay conversaciones aún") render
- AND no list skeleton persists

### REQ-INBOX-007 — Loading skeleton during first fetch

During the first fetch, the inbox MUST render a skeleton loader.

#### Scenario: First load shows skeleton

- GIVEN the inbox page is navigated to
- WHEN the initial `GET /api/conversations` is in flight
- THEN a skeleton with at least 3 placeholder cards is visible
- AND the skeleton is replaced by real data on fetch completion

---

## F. Admin profile (`/admin/profile`)

### REQ-PROF-001 — Profile shows user from `/api/auth/me`

The profile page MUST render the authenticated user's data sourced from `GET /api/auth/me`.

#### Scenario: Profile renders user

- GIVEN an authenticated user
- WHEN they navigate to `/admin/profile`
- THEN the page calls (or reads from hydrated store) `GET /api/auth/me`
- AND displays at least: name, email, role, tenant name

### REQ-PROF-002 — Logout clears state and redirects

The profile page MUST include a logout button that clears both tokens, clears the Zustand authStore, clears the TanStack Query cache, and redirects to `/admin/login`.

#### Scenario: User logs out

- GIVEN an authenticated user on `/admin/profile`
- WHEN they click "Cerrar sesión" / "Log out"
- THEN `localStorage.m2_access_token` and `localStorage.m2_refresh_token` are removed
- AND `authStore.user` is reset to null
- AND `queryClient.clear()` is called
- AND the user is navigated to `/admin/login` in the current locale
- AND no backend call is made (logout is stateless in v1)

---

## G. Internationalization

### REQ-I18N-001 — Supported locales are `es` and `en`

The supported locales list MUST be exactly `['es', 'en']`. Default is `es`.

#### Scenario: Unsupported locale 404s

- GIVEN a request to `/fr/some-path`
- WHEN the middleware matches
- THEN a 404 response is returned (not a redirect to default)

### REQ-I18N-002 — URL strategy: locale prefix `as-needed`

The apex URL (`/`) MUST serve the `es` content without any redirect to `/es`. English routes MUST be prefixed with `/en`.

#### Scenario: Spanish served at apex

- GIVEN a visitor to `https://motomoto.app/`
- WHEN the response returns
- THEN HTTP status is 200 (not 3xx)
- AND the page is Spanish

#### Scenario: English served at /en

- GIVEN a visitor to `https://motomoto.app/en`
- WHEN the response returns
- THEN HTTP status is 200
- AND the page is English

### REQ-I18N-003 — Locale switcher present on landing and admin

Both landing header and admin topbar MUST include a locale switcher component.

#### Scenario: Switcher on landing

- GIVEN the landing page
- WHEN the visitor inspects the header
- THEN a locale switcher dropdown or toggle is visible

#### Scenario: Switcher on admin

- GIVEN an authenticated admin view
- WHEN the user inspects the topbar
- THEN a locale switcher is visible

### REQ-I18N-004 — All user-facing strings via `useTranslations()`

Every user-facing string in both apps MUST be rendered via `useTranslations()` (or server equivalent `getTranslations()`). Hardcoded copy is prohibited.

#### Scenario: Hardcoded string fails CI

- GIVEN a PR adds `<h1>Welcome</h1>` to a page
- WHEN CI runs the i18n lint/grep check
- THEN the check fails and the PR is blocked

### REQ-I18N-005 — Browser language detection with cookie override

First-visit locale MUST be chosen from `Accept-Language`; a user's explicit switch MUST override via the `NEXT_LOCALE` cookie.

#### Scenario: First visit with English browser

- GIVEN no `NEXT_LOCALE` cookie and `Accept-Language: en`
- WHEN the user visits `/`
- THEN they are redirected to `/en`

#### Scenario: Cookie override wins

- GIVEN `NEXT_LOCALE=es` cookie and `Accept-Language: en`
- WHEN the user visits `/en` then clicks the switcher to Spanish
- THEN they are navigated to `/`, and the cookie is updated to `es`

### REQ-I18N-006 — Missing key falls back to `es` and warns in dev

A missing translation key MUST fall back to `es` and emit a `console.warn` in dev mode.

#### Scenario: Missing EN key falls back

- GIVEN `messages/en.json` lacks key `hero.subtitle` but `messages/es.json` has it
- WHEN the English page renders
- THEN the Spanish value is rendered in its place
- AND `console.warn("missing translation: en.hero.subtitle")` is emitted in dev

---

## H. Design system compliance

### REQ-DS-001 — Dark mode only

v1 MUST be dark-mode only. No light-mode toggle, no `prefers-color-scheme: light` branch.

#### Scenario: No light-mode toggle

- GIVEN any route in either app
- WHEN the user inspects the UI
- THEN no theme toggle control exists

### REQ-DS-002 — Glass cards match exact spec

Glass cards MUST use `background: rgba(32,31,31,0.65)`, `backdrop-filter: blur(30px)`, and a 1px inner highlight on top/left at 20% of primary blue `#ADC6FF`.

#### Scenario: Computed styles match

- GIVEN a rendered `GlassCard`
- WHEN its computed styles are inspected
- THEN `background-color` resolves to `rgba(32,31,31,0.65)`
- AND `backdrop-filter` includes `blur(30px)`
- AND a box-shadow or inset with a 20%-alpha `#ADC6FF` edge is present

### REQ-DS-003 — No black shadows

No component MAY use a black/greyscale drop shadow. All shadows MUST be colored glows (primary blue or secondary purple).

#### Scenario: Shadow audit

- GIVEN any UI component
- WHEN computed `box-shadow` is inspected
- THEN the color channel is never `rgba(0,0,0,*)` — it is a token from `@m2/design` (blue/purple glow)

### REQ-DS-004 — Typography: Manrope headlines, Inter body

Headlines MUST use Manrope (weight 700–800); body text MUST use Inter (weight 400–500).

#### Scenario: Heading font

- GIVEN any `<h1>`/`<h2>`/`<h3>`
- WHEN computed `font-family` is inspected
- THEN Manrope appears first in the family stack

#### Scenario: Body font

- GIVEN any `<p>` or body text
- WHEN computed `font-family` is inspected
- THEN Inter appears first in the family stack

### REQ-DS-005 — Primary button uses 135° gradient

The primary button (`GradientButton` variant `primary`) MUST use a 135° linear gradient from `#1A2A4A` to `#ADC6FF`.

#### Scenario: Primary button gradient

- GIVEN a `GradientButton variant="primary"`
- WHEN its computed `background` is inspected
- THEN it matches `linear-gradient(135deg, #1A2A4A, #ADC6FF)`

### REQ-DS-006 — Mesh gradient on hero and AI-highlight sections

The landing hero section AND the AI-highlight section MUST use a mesh-gradient backdrop (`MeshGradient` component from `@m2/ui`).

#### Scenario: Hero has mesh gradient

- GIVEN the landing hero
- WHEN the DOM is inspected
- THEN a `<MeshGradient>`-produced element is present behind the hero content

### REQ-DS-007 — All tokens sourced from `@m2/design`

No **web** app (`apps/landing`, `apps/admin`) MAY contain a hardcoded hex color, px spacing, or radius. All values MUST reference `@m2/design` (via import or CSS variable). Mobile (`apps/mobile`) is out of scope for this REQ — its token compliance was established by the precursor migration and is independently enforced there.

#### Scenario: Lint / grep check (web scope)

- GIVEN `apps/landing/**` and `apps/admin/**` source trees
- WHEN CI runs a grep for hardcoded `#[0-9a-fA-F]{3,8}` or `\b\d+px\b` outside design tokens
- THEN the check fails on any occurrence within those paths (excluding tests + generated files)
- AND the check does NOT run against `apps/mobile/**` as part of this change

---

## I. API client

### REQ-API-001 — Types generated from Swagger

The `@m2/api-client` package MUST expose TypeScript types generated from `GET /api/docs-json` via `openapi-typescript`.

#### Scenario: Types regenerate

- GIVEN a backend change that alters the Swagger schema
- WHEN `pnpm generate:api` is run
- THEN `packages/api-client/src/generated/schema.d.ts` is updated
- AND a `git diff` shows the changes

#### Scenario: CI catches stale types

- GIVEN a PR that does not update generated types after backend changes
- WHEN CI runs `pnpm generate:api` and checks `git diff`
- THEN CI fails with a message indicating stale types

### REQ-API-002 — Envelope unwrap

All responses MUST be unwrapped from the `{ success, data, meta }` envelope by the fetcher. Callers receive `T` directly (or `{ data, meta }` for paginated endpoints).

#### Scenario: Successful response

- GIVEN the backend returns `{ success: true, data: { id: "u_1", name: "Ramses" } }`
- WHEN the fetcher completes
- THEN the caller receives `{ id: "u_1", name: "Ramses" }` — not the envelope

#### Scenario: Failed response throws typed error

- GIVEN the backend returns `{ success: false, error: { code: "NOT_FOUND", message: "..." } }`
- WHEN the fetcher processes the response
- THEN a typed `ApiError` is thrown with `code`, `message`, and optional `details`

### REQ-API-003 — 401 triggers refresh, 403 role-error, 5xx toast

The fetcher MUST differentiate HTTP status responses:

| Status | Behavior |
|--------|----------|
| 401 | Attempt one refresh; on failure, clear tokens and redirect to `/admin/login` |
| 403 | Throw a typed `ForbiddenError`; UI surfaces a localized toast "No tienes permiso" |
| 4xx (other) | Throw typed `ApiError`; caller decides handling |
| 5xx | Throw typed `ApiError`; a global handler shows a toast "Error del servidor" |
| Network fail | Throw `NetworkError`; toast "Sin conexión" |

#### Scenario: 403 on tenant-settings fetch

- GIVEN an AGENT who somehow hits a tenant-settings endpoint
- WHEN the backend returns 403
- THEN a toast "No tienes permiso para ver esto" appears in the current locale
- AND no retry is attempted

#### Scenario: 500 on a fetch

- GIVEN the backend returns 500
- WHEN any fetcher call receives it
- THEN a toast "Error del servidor" appears
- AND the original promise rejects so the caller can handle fallback

### REQ-API-004 — Base URL from `NEXT_PUBLIC_API_URL`

The fetcher MUST read the base URL from `process.env.NEXT_PUBLIC_API_URL`. If unset, it MUST throw on startup (dev) or fail loudly (build).

#### Scenario: Missing env var

- GIVEN `NEXT_PUBLIC_API_URL` is not set
- WHEN an app builds or starts
- THEN an explicit error is thrown naming the missing variable

---

## J. Monorepo structure

### REQ-MONO-001 — Turborepo + pnpm workspaces

The repo (`raoole20/m2-front`) MUST use Turborepo (`turbo.json`) and pnpm workspaces (`pnpm-workspace.yaml`). Both are already present from the precursor `mobile-to-monorepo-migration` (see REQ-PREREQ-001); this change extends `turbo.json` with `generate:api` and web-oriented task entries, and does NOT replace the root configs.

#### Scenario: Fresh clone installs

- GIVEN a fresh clone of `raoole20/m2-front` at `main` after this change has merged
- WHEN the user runs `pnpm install`
- THEN all packages and apps (mobile + landing + admin + shared packages) are linked via pnpm workspace protocol
- AND `pnpm turbo run build --filter=@m2/landing... --filter=@m2/admin...` completes successfully
- AND `pnpm --filter @m2/mobile start` continues to launch the Expo dev server

### REQ-MONO-002 — Workspaces present after v1

The monorepo MUST declare workspaces `apps/*` and `packages/*` in `pnpm-workspace.yaml`. After this change completes, the following workspaces MUST be present (8 total — 3 apps + 5 packages):

| Workspace | Path | Purpose | Introduced by |
|-----------|------|---------|---------------|
| `@m2/mobile` | `apps/mobile` | Motomoto Expo app (RN 0.83, Expo SDK 55) | Precursor `mobile-to-monorepo-migration` |
| `@m2/landing` | `apps/landing` | Public marketing site (Next.js 15) | This change |
| `@m2/admin` | `apps/admin` | Role-gated dashboard (Next.js 15) | This change |
| `@m2/types` | `packages/types` | Shared TypeScript types | Precursor |
| `@m2/design` | `packages/design` | Tokens (TS + CSS vars) — extended in this change with web outputs | Precursor (extended here) |
| `@m2/ui` | `packages/ui` | Shared React DOM components (WEB-ONLY; mobile does not consume) | This change |
| `@m2/api-client` | `packages/api-client` | Generated types + fetcher (WEB-ONLY in v1) | This change |
| `@m2/i18n` | `packages/i18n` | next-intl config + shared messages (WEB-ONLY in v1) | This change |

An internal tooling package `@m2/config` MAY additionally be present at `packages/config` for shared tsconfig/eslint/prettier/tailwind presets; it is not counted among the runtime packages above. Whether it exists already (from the precursor) or is added by this change, it must extend — not duplicate — the root `tsconfig.base.json`.

The list is a **minimum** for v1: additional workspaces may appear as legitimate follow-ups (e.g., `@m2/ui-native`, a future `@m2/messaging`), but the 8 above are the v1 acceptance set.

#### Scenario: Workspace list contains the v1 set

- GIVEN `pnpm list -r --depth=-1`
- WHEN the output is inspected
- THEN it includes at least the 8 workspaces listed above
- AND each of the 8 resolves (`pnpm --filter <name> exec node -e "console.log(1)"` succeeds)

#### Scenario: Web-only packages are not consumed by mobile

- GIVEN `apps/mobile/package.json`
- WHEN its dependencies are inspected
- THEN it does NOT list `@m2/ui`, `@m2/api-client`, or `@m2/i18n` as dependencies in v1
- AND its source tree contains no imports from those packages (grep-enforced in CI)

### REQ-MONO-003 — Shared tsconfig base

Every workspace MUST extend a shared `tsconfig` base from `@m2/config`.

#### Scenario: tsconfig extends base

- GIVEN any app or package
- WHEN its `tsconfig.json` is inspected
- THEN it `extends: "@m2/config/tsconfig/..."`

### REQ-MONO-004 — Shared eslint config

Every workspace MUST consume a shared eslint config from `@m2/config`.

#### Scenario: eslint resolves shared config

- GIVEN any app or package
- WHEN `pnpm lint` runs there
- THEN the shared config from `@m2/config` is loaded
- AND lint completes

### REQ-MONO-005 — Apps build independently

`turbo run build --filter=@m2/landing...` MUST build the landing app without building the admin app, and vice versa. Shared packages are built on demand.

#### Scenario: Landing builds alone

- GIVEN a fresh monorepo
- WHEN `turbo run build --filter=@m2/landing...` runs
- THEN the landing app and its dependencies build
- AND the admin app is not built

---

## K. Deployment

### REQ-DEPLOY-001 — Two independent Vercel projects

The repo MUST deploy as two independent Vercel projects, one per app.

#### Scenario: Two projects configured

- GIVEN the Vercel org
- WHEN the projects list is inspected
- THEN `m2-web-landing` (root dir `apps/landing`) and `m2-web-admin` (root dir `apps/admin`) both exist

### REQ-DEPLOY-002 — Production domains

The landing MUST be served on `motomoto.app` (and `www.motomoto.app` redirects to apex). The admin MUST be served on `app.motomoto.app`.

#### Scenario: Landing responds on apex

- GIVEN DNS is configured
- WHEN a request is made to `https://motomoto.app/`
- THEN the landing hero renders over HTTPS

#### Scenario: www redirects

- GIVEN a request to `https://www.motomoto.app/`
- WHEN the response returns
- THEN it is a 308 redirect to `https://motomoto.app/`

#### Scenario: Admin responds on subdomain

- GIVEN a request to `https://app.motomoto.app/admin/login`
- WHEN the response returns
- THEN the admin login page renders over HTTPS

### REQ-DEPLOY-003 — Env vars per project

Each Vercel project MUST expose at minimum these env vars to the build:

| Var | Landing | Admin | Notes |
|-----|:-------:|:-----:|-------|
| `NEXT_PUBLIC_API_URL` | ✓ | ✓ | Public base URL of `m2-back` |
| `NEXT_PUBLIC_SITE_URL` | ✓ | ✓ | Public hostname of this app (for canonical + OG) |
| `NEXT_PUBLIC_LANDING_URL` | — | ✓ | For "Back to site" links |
| `NEXT_PUBLIC_ADMIN_URL` | ✓ | — | For "Log in" CTA |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | ✓ | ✓ | `es` in v1 |

#### Scenario: Missing env blocks build

- GIVEN a Vercel project missing `NEXT_PUBLIC_API_URL`
- WHEN the build runs
- THEN it fails with an error naming the missing variable

### REQ-DEPLOY-004 — Preview deploys per PR

Every pull request MUST generate preview URLs for both apps.

#### Scenario: PR generates previews

- GIVEN a PR is opened against `main`
- WHEN Vercel reacts
- THEN a comment is posted on the PR with two preview URLs (landing + admin)
- AND both URLs respond 200 on their home routes

---

## 4. Out-of-scope reminder

The following features are **NOT** part of v1 and MUST NOT be implemented or partially implemented:

- Signup / registration UI (no public tenant creation flow)
- Password reset / email verification
- User invites (no admin UI to create other ADMIN/AGENT accounts)
- WebSocket / SSE realtime (polling only)
- `CLIENT` role (enum, routes, UI — backend doesn't expose it)
- File uploads / media previews
- SSR auth / httpOnly cookies
- Sentry or any error monitoring
- Analytics / telemetry (Plausible, PostHog, Vercel Analytics)
- Feature flag system
- Subdomain-per-tenant routing (single `app.motomoto.app`)
- E2E tests (Playwright)
- Storybook / component catalogue
- PWA / offline support
- Real brand assets (logos, testimonial photos) — placeholders only
- Real pricing tiers — "Contact sales" CTA only
- Language-switcher polish beyond a minimal dropdown
- Turbo remote cache tuning beyond Vercel defaults
- Mobile ↔ web token sync codegen
- Real backend content migrations (read-mostly against existing `m2-back`)

Any PR attempting to add these MUST be rejected or deferred to a post-v1 change.

---

## 5. Acceptance checklist

v1 is done when **all** of the following are true. Each item derives from one or more requirements above.

### Monorepo & tooling
- [ ] `pnpm install && pnpm dev` from a fresh clone starts both apps on `:3001` and `:3002` (REQ-MONO-001, REQ-MONO-002)
- [ ] `pnpm typecheck` passes across all packages and apps with zero errors, no `any`, no `!` (REQ-MONO-003)
- [ ] `pnpm lint` passes via shared `@m2/config` eslint (REQ-MONO-004)
- [ ] `turbo run build --filter=@m2/landing...` builds landing without building admin (REQ-MONO-005)
- [ ] `pnpm generate:api` regenerates types from backend Swagger and CI fails on drift (REQ-API-001)

### Landing page
- [ ] Hero renders in both `es` (at `/`) and `en` (at `/en`) with `<html lang>` set (REQ-LAND-001)
- [ ] Locale switcher persists choice via `NEXT_LOCALE` cookie (REQ-LAND-002)
- [ ] "Iniciar sesión" CTA links to admin login (REQ-LAND-003)
- [ ] "Contact sales" CTA opens mailto to `contact@motomoto.app` (REQ-LAND-004, REQ-LAND-009)
- [ ] Channels strip shows ≥ 4 logos with `aria-label`s (REQ-LAND-005)
- [ ] Features grid renders as glass cards using `@m2/ui` (REQ-LAND-006)
- [ ] AI highlight section uses a mesh-gradient backdrop (REQ-LAND-007)
- [ ] Testimonials render with initials-circle avatars (REQ-LAND-008)
- [ ] Footer renders with locale-driven links (REQ-LAND-010)
- [ ] SEO meta tags, OG tags, `hreflang` alternates present (REQ-LAND-011)
- [ ] `/sitemap.xml` and `/robots.txt` served (REQ-LAND-012)

### Admin auth
- [ ] Login page exists at `/admin/login` and `/en/admin/login` (REQ-AUTH-001)
- [ ] Form validates email format and password ≥ 8 chars inline (REQ-AUTH-002)
- [ ] Successful login stores `m2_access_token` + `m2_refresh_token` in localStorage and redirects to `/admin` (REQ-AUTH-003)
- [ ] Failed login shows locale-driven inline error, no tokens stored (REQ-AUTH-004)
- [ ] Loading state disables form during submit (REQ-AUTH-005)
- [ ] Authenticated user visiting `/admin/login` is redirected to `/admin` (REQ-AUTH-006)

### Route protection
- [ ] Middleware redirects unauth users from `/admin/*` to `/admin/login?redirect=...` (REQ-GUARD-001)
- [ ] Expired access token triggers single refresh, retry, then logout on failure (REQ-GUARD-002)
- [ ] Role gating demonstrably hides OWNER/ADMIN-only elements from AGENT (REQ-GUARD-003)
- [ ] No direct `user.role === ...` equality checks in app code — only `hasMinRole(...)` (REQ-GUARD-003)

### Admin surfaces
- [ ] Dashboard shows personalized welcome from `/api/auth/me` (REQ-DASH-001)
- [ ] Dashboard renders 4 KPI cards (mock data in v1, documented) (REQ-DASH-002)
- [ ] Dashboard quick actions link to inbox and profile (REQ-DASH-003)
- [ ] Inbox lists conversations from `GET /api/conversations` (REQ-INBOX-001)
- [ ] Filter tabs all / open / pending / resolved work; URL query reflects filter (REQ-INBOX-002)
- [ ] Clicking a conversation opens detail at `/admin/inbox/[id]` (REQ-INBOX-003)
- [ ] Detail view lists messages chronologically from `GET /api/conversations/:id/messages` (REQ-INBOX-004)
- [ ] Polling every 5s on both list and detail; paused on hidden tab (REQ-INBOX-005)
- [ ] Empty state renders when no conversations (REQ-INBOX-006)
- [ ] Skeleton renders during first fetch (REQ-INBOX-007)
- [ ] Profile shows user data from `/api/auth/me` (REQ-PROF-001)
- [ ] Logout clears tokens, authStore, query cache, and redirects to login (REQ-PROF-002)

### Internationalization
- [ ] Supported locales are exactly `['es', 'en']`, default `es` (REQ-I18N-001)
- [ ] Locale prefix strategy is `as-needed`: `/` serves es, `/en` serves en (REQ-I18N-002)
- [ ] Locale switcher visible on both landing header and admin topbar (REQ-I18N-003)
- [ ] All user-facing strings via `useTranslations()` — CI grep check passes (REQ-I18N-004)
- [ ] Browser language detected on first visit; cookie overrides (REQ-I18N-005)
- [ ] Missing keys fall back to `es` with dev-mode warning (REQ-I18N-006)

### Design system
- [ ] Dark mode only; no light toggle (REQ-DS-001)
- [ ] Glass cards match the exact spec (bg, blur, highlight) (REQ-DS-002)
- [ ] No black box shadows anywhere — colored glows only (REQ-DS-003)
- [ ] Manrope on headlines, Inter on body (REQ-DS-004)
- [ ] Primary button uses 135° `#1A2A4A → #ADC6FF` gradient (REQ-DS-005)
- [ ] Hero and AI-highlight sections use mesh-gradient backdrops (REQ-DS-006)
- [ ] Zero hardcoded hex/px in apps — all tokens via `@m2/design` (REQ-DS-007)

### API client
- [ ] `@m2/api-client` exposes types generated from Swagger (REQ-API-001)
- [ ] Fetcher unwraps `{ success, data, meta }` envelope centrally (REQ-API-002)
- [ ] 401 → refresh + retry; 403 → localized toast; 5xx → toast (REQ-API-003)
- [ ] Base URL sourced from `NEXT_PUBLIC_API_URL`; missing var fails loudly (REQ-API-004)

### Deployment
- [ ] Two Vercel projects exist (`m2-web-landing`, `m2-web-admin`) (REQ-DEPLOY-001)
- [ ] Landing serves on `motomoto.app` with `www` → apex redirect (REQ-DEPLOY-002)
- [ ] Admin serves on `app.motomoto.app` (REQ-DEPLOY-002)
- [ ] Env vars `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, etc. configured per project (REQ-DEPLOY-003)
- [ ] Preview deploys post two URLs on every PR (REQ-DEPLOY-004)

### Non-functional
- [ ] Landing LCP ≤ 2.5 s p75; admin LCP ≤ 3.0 s p75 (§2.1)
- [ ] WCAG 2.1 AA: color contrast, keyboard nav, focus rings, `prefers-reduced-motion` honored (§2.2)
- [ ] Browsers: last 2 majors of Chromium, Firefox, Safari (§2.3)
- [ ] `dangerouslySetInnerHTML` audit clean; HTTPS enforced in prod (§2.4)
- [ ] Session persists across tab close; logout clears cleanly (§2.5)
- [ ] Zero hardcoded user-facing strings (CI-enforced) (§2.7)

---

## 6. Counts

- **REQ items total**: 51 (LAND 12 + AUTH 6 + GUARD 3 + DASH 4 + INBOX 7 + PROF 2 + I18N 6 + DS 7 + API 4 + MONO 5 + DEPLOY 4 = 60; deduplicated where capability overlaps — see REQ-IDs above for canonical list)

(Canonical REQ-ID count by area: A=12, B=6, C=3, D=4, E=7, F=2, G=6, H=7, I=4, J=5, K=4 → **60 total**.)

---

## 7. Open / flagged items

The following requirements were specified with assumptions that should be confirmed before implementation. These are flagged, not invented:

1. **`NEXT_PUBLIC_API_URL` production value** — proposal states "TBD" (e.g., `https://api.motomoto.app/api`). Spec assumes this URL; confirm with backend team before DEPLOY-003 can be closed.
2. **Staging backend for preview deploys** — proposal §10.3 flags the need for `api-staging.motomoto.app`. Spec currently has preview deploys pointed at an unspecified backend; this needs resolution to satisfy REQ-DEPLOY-004 end-to-end.
3. **`contact@motomoto.app` mailbox** — assumed to exist for REQ-LAND-004 / REQ-LAND-009. Confirm provisioning.
4. **Dashboard KPI data sources** — REQ-DASH-002 explicitly allows mock data in v1 per proposal. If backend endpoints become available before ship, spec should be revised.
5. **Non-httpOnly sentinel cookie `m2_session`** for middleware auth-hint (per proposal §8.5) — mentioned in REQ-GUARD-001 implicitly. Exact cookie shape is a design concern, not a spec concern, but its presence/absence is the middleware's auth signal.
