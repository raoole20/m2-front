# Proposal: Mobile V2 Redesign + Backend Integration

> Migrates `apps/mobile` from its current placeholder UI + mock services to the **V2 design language** ("atmospheric, editorial, glassmorphic — Apple Vision Pro on a phone") and wires the app to the real **m2-back** NestJS API at `http://localhost:3000/api`. Builds new foundations in `@m2/design` (tokens, primitives) and `@m2/api-client` (`createSecureTokenStore()` + channels endpoint), then rebuilds atoms and the 5 product screens (Inbox, Conversation, Channels, AI Hub, Profile) plus Login.

---

## 1. Intent

The mobile app (`apps/mobile`, Expo SDK 55 / RN 0.83) is currently shipping with a placeholder UI that does **not** apply the V2 visual language approved by the user, services in `apps/mobile/src/services/*` return **mock data**, and the backend URL is **hardcoded**. None of this is acceptable for the MVP demo. This change is the bridge between "scaffold + mocks" and "demo-ready product":

- **Visual debt** — the approved V2 design (in `c:/proyectos en conjunto/m2/.design-bundle/`) introduces a new token system (atmospheric backgrounds, glass surfaces, conic gradients, instrument-serif typography at 38px+ with negative letter-spacing, sparkle iridescence) that the current `@m2/design` package and screen tree do not implement. The blueprint files are `project/v2-screens.jsx`, `project/v2-atoms.jsx`, `project/v2-icons.jsx`, `project/Motomoto Mobile.html`, `project/data.jsx`.
- **Integration debt** — `apps/mobile/src/services/*` returns mocks; the backend (NestJS 11) is ready for auth, conversations, messages, and channels but the app never calls it. A single `EXPO_PUBLIC_API_URL` env var should drive base URL resolution.
- **Foundation debt** — `@m2/api-client` lacks an Expo-friendly token store (it expects a generic `TokenStore` interface) and has **no channels resource**. Without `createSecureTokenStore()` (backed by `expo-secure-store`) and a channels client, the mobile screens cannot integrate even if their UI is correct.

Migrating to V2 + real integration is **blocking** for the MVP demo and for every downstream feature (WebSocket realtime, agent send-message endpoint) on the roadmap.

---

## 2. Scope

### 2.1 In Scope

**Foundations (Phase 0)**

- Install runtime deps: `@shopify/react-native-skia` (conic gradients), `react-native-svg` (icons), `instrument-serif` font asset (via `expo-font`).
- Extend `@m2/design`:
  - V2 tokens — atmospheric color palette, glass surface recipes, conic gradient stops, sparkle keyframes, typography scale (instrument-serif 38–56px, negative tracking).
  - Primitives — `<Glass>`, `<Atmosphere>`, `<Sparkle4>`, typography components (`<Display>`, `<Body>`, etc.), Lucide-style icon set + channel icons.
- Extend `@m2/api-client`:
  - `createSecureTokenStore()` factory using `expo-secure-store` (replaces the current generic `TokenStore` shim mobile uses today).
  - Channels resource — `list()`, `get()`, `create()`, `update()`, `delete()`, `connect()` matching `m2-back`'s `/channels` endpoints.
- Env vars — introduce `EXPO_PUBLIC_API_URL=http://localhost:3000/api` (read by `apps/mobile/src/lib/api.ts` initializer).

**Atoms (Phase 1)**

- Brandmark, Avatar (with conic ring), ChannelPill, IntentBadge, TodayDivider, StatusBar, FloatingTabBar (glass, conic active indicator). Implemented under `apps/mobile/src/components/v2/` consuming `@m2/design`.

**Screens with integration (Phase 2)**

- **Login** — wired to `@m2/api-client` auth (login + token persistence via `createSecureTokenStore()`).
- **Inbox** — fetches conversations via `@m2/api-client`.
- **Conversation detail** — fetches messages, supports the existing Evolution-API-driven inbound flow (no manual send yet — see out of scope).
- **Channels list** — full CRUD against the new channels resource.
- **AI Hub** — V2 layout, placeholder data only (no AI logic this change).
- **Profile** — V2 layout, reads current user from auth state.
- **Tab bar** — floating glass bar with conic active indicator, replaces current navigation shell.

**Deprecation**

- Remove `apps/mobile/src/services/api.ts` (axios instance, hardcoded URL) and the mock service stubs under `apps/mobile/src/services/*` once each screen migrates. Mocks under `apps/mobile/src/mock/` are kept for fallback during dev but unwired from screens.

### 2.2 Out of Scope (explicit)

- **WebSocket / realtime** — `m2-back` has no WS gateway today (known gap). Screens render snapshots only; no live updates.
- **Agent send-message endpoint** — `m2-back` exposes inbound message ingestion (Evolution API webhooks) but **not** an authenticated "agent sends a message" endpoint. The Conversation screen renders messages but the composer is **disabled** (visual only) until backend ships this endpoint. Bloqueante para sección 4.0 del roadmap, fuera de este cambio.
- **Light mode** — dark only.
- **AI Hub configuration** — visual placeholder only; no settings, no model picker, no prompt editor.
- **Web alignment** — `@m2/design` tokens are restructured so web *can* consume them later, but no `apps/landing` or `apps/admin` work in this change.
- **Bundle-size optimization for Skia** — accept the ~5MB hit for now; revisit if it blocks shipping.
- **Test suite** — no unit/integration tests added (mobile has none today; introducing the harness is out of scope, deferred per existing project convention).
- **CI pipeline** — unchanged.
- **Expo SDK / RN bumps** — stay on SDK 55 / RN 0.83.
- **Push notifications, analytics, Sentry** — unchanged.

---

## 3. Approach

Three sequenced phases, each independently shippable to `feat/mobile-v2-redesign`:

**Phase 0 — Foundations** (lands first, no UI change visible until Phase 2)

1. Install Skia, svg, instrument-serif font; register the font in `apps/mobile/app/_layout.tsx`.
2. Author V2 tokens in `packages/design/src/v2/` (palette, gradients, typography, motion). Re-export from `@m2/design` index alongside legacy v1 tokens (no breaking removal yet).
3. Author primitives `<Glass>`, `<Atmosphere>`, `<Sparkle4>`, typography in `packages/design/src/components/`.
4. In `packages/api-client/`: add `createSecureTokenStore()` (peer-deps `expo-secure-store`), add `channels` resource module + types, expose from package index.
5. Add `EXPO_PUBLIC_API_URL` to `.env.example`; thread through the api-client initializer.

**Phase 1 — Atoms** (no integration, pure visual building blocks)

- Build the 7 atoms listed in scope under `apps/mobile/src/components/v2/` consuming the Phase 0 primitives. Each atom is verified visually (Storybook-equivalent dev screen if needed; no test harness).

**Phase 2 — Screens with integration** (each screen lands as its own commit/sub-PR)

- Order: Login → Inbox → Conversation → Channels → AI Hub → Profile.
- Each screen swaps mock service calls for `@m2/api-client` calls and applies V2 atoms.
- The composer in Conversation stays **disabled** (visual + tooltip "coming soon") because the backend send endpoint doesn't exist yet.
- Final step: replace the navigation shell with the V2 floating tab bar; delete `apps/mobile/src/services/api.ts`.

The phase boundary discipline matches the existing `mobile-to-monorepo-migration` change — small commits, each one independently buildable.

---

## 4. Tech Decisions

| # | Choice | Alternatives | Rationale |
|---|---|---|---|
| D1 | **`@shopify/react-native-skia`** for conic gradients (avatar ring, AI iridescent border, active tab indicator) | `expo-linear-gradient` (no conic), `react-native-svg` gradients (limited), CSS via Lottie | Skia is the only RN solution that renders true conic gradients with Skia shaders, animations on UI thread, and matches the design bundle's CSS spec. Bundle cost (~5MB) is acceptable for the visual fidelity required. |
| D2 | **Tokens centralized in `@m2/design`** | duplicate tokens in `apps/mobile/src/design/`, web-only token package | `@m2/design` already exists as the canonical token home (per `mobile-to-monorepo-migration`). Centralizing V2 tokens here means `apps/landing` and `apps/admin` can consume them later without re-extraction. |
| D3 | **Extend `@m2/api-client` with `createSecureTokenStore()` + channels** | keep using `apps/mobile/src/services/api.ts` (axios), generic store + screen-level adapter | The api-client already abstracts a generic `TokenStore` interface — adding an Expo-flavored factory is a tiny lift and removes the only barrier to mobile importing the package directly. Channels resource is a hard requirement (backend has the endpoint, client doesn't expose it). |
| D4 | **`EXPO_PUBLIC_API_URL` env var** | hardcoded URL, app-config-driven URL, multi-env JSON | Expo's documented pattern for runtime-readable env vars; works in dev client, EAS builds, and `expo start`. Single source of truth for "where is the backend right now." |
| D5 | **Per-screen integration order: Login → Inbox → Conversation → Channels → AI Hub → Profile** | big-bang integration, integration-first then UI, UI-first then integration | Login first unlocks every other screen (auth tokens). Inbox + Conversation are the highest-value flows. Channels is independent. AI Hub + Profile are last because they're the simplest and least integration-heavy. |

---

## 5. Affected Areas

| Area | Impact | Description |
|---|---|---|
| `packages/design/src/v2/` | New | V2 tokens (palette, gradients, typography, motion, glass recipes) |
| `packages/design/src/components/` | New | `<Glass>`, `<Atmosphere>`, `<Sparkle4>`, typography components, icon set |
| `packages/design/src/index.ts` | Modified | Re-export V2 tokens + primitives alongside v1 tokens |
| `packages/design/package.json` | Modified | Add peerDeps for `@shopify/react-native-skia`, `react-native-svg`, `expo-font` |
| `packages/api-client/src/auth/secure-token-store.ts` | New | `createSecureTokenStore()` factory backed by `expo-secure-store` |
| `packages/api-client/src/channels/` | New | Channels resource (`list/get/create/update/delete/connect`) + types |
| `packages/api-client/src/index.ts` | Modified | Re-export `createSecureTokenStore` and channels resource |
| `packages/api-client/package.json` | Modified | Add peerDep for `expo-secure-store` |
| `apps/mobile/package.json` | Modified | Add `@shopify/react-native-skia`, `react-native-svg`, font asset deps; `expo-secure-store` already present |
| `apps/mobile/app/_layout.tsx` | Modified | Register instrument-serif font; mount `<Atmosphere>` background |
| `apps/mobile/src/lib/api.ts` | New | Initializes `@m2/api-client` with `EXPO_PUBLIC_API_URL` and `createSecureTokenStore()` |
| `apps/mobile/src/components/v2/` | New | Brandmark, Avatar, ChannelPill, IntentBadge, TodayDivider, StatusBar, FloatingTabBar |
| `apps/mobile/app/(auth)/login.tsx` | Modified | V2 layout + auth integration |
| `apps/mobile/app/(app)/inbox/index.tsx` | Modified | V2 layout + conversations integration |
| `apps/mobile/app/(app)/inbox/[id]/index.tsx` | Modified | V2 layout + messages integration; composer disabled |
| `apps/mobile/app/(app)/channels/` | New (or Modified) | V2 layout + channels CRUD |
| `apps/mobile/app/(app)/ai/index.tsx` | Modified | V2 layout, placeholder data |
| `apps/mobile/app/(app)/profile/index.tsx` | Modified | V2 layout, current-user data |
| `apps/mobile/app/(app)/_layout.tsx` | Modified | Replace nav shell with `<FloatingTabBar>` |
| `apps/mobile/src/services/api.ts` | Removed | Replaced by `@m2/api-client` |
| `apps/mobile/src/services/*` (mock service stubs) | Removed | Replaced by `@m2/api-client` resource calls |
| `apps/mobile/src/mock/` | Unchanged | Kept for dev fallback; no longer imported by screens |
| `.env.example` (root or `apps/mobile/`) | New/Modified | Document `EXPO_PUBLIC_API_URL` |

---

## 6. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Skia adds ~5MB to release bundle | High | Medium | Accept for now; track in follow-ups. Skia is already a common Expo dep; revisit if it blocks store submission. |
| R2 | Backdrop-filter / glass effect renders weakly on Android (vs iOS) | High | Medium | `<Glass>` primitive uses `expo-blur` with platform-specific tints; Android falls back to a denser semi-opaque surface + subtle inner shadow that reads as "glass" without true backdrop blur. Document the iOS/Android visual delta in `<Glass>`'s JSDoc. |
| R3 | Conic gradients render differently on iOS vs Android via Skia | Medium | Medium | Pin Skia version, test on both platforms during Phase 0 atoms (Avatar ring, FloatingTabBar active indicator, AI iridescent border). Snapshot a reference render per platform. |
| R4 | Instrument-serif at 38px+ with negative letter-spacing renders inconsistently iOS vs Android | Medium | Low | Use `expo-font` with both `.otf` and `.ttf` variants; verify on both platforms during Phase 1. Fall back to system serif if license or bundling becomes an issue (acceptable visual degradation). |
| R5 | Mock-to-real service migration causes regressions (no integration tests exist) | High | High | Each screen migrates in a separate commit. Manual smoke test on Android dev client after every screen. Keep mocks under `apps/mobile/src/mock/` so a screen can be temporarily reverted to mock data if backend is down. |
| R6 | `m2-back` localhost URL doesn't resolve from Android dev client | Medium | High | Document the LAN IP override pattern (`EXPO_PUBLIC_API_URL=http://<LAN-IP>:3000/api`) in `.env.example` and the mobile README. Standard Expo gotcha. |
| R7 | `expo-secure-store` peer-dep on `@m2/api-client` leaks Expo dependency into a "platform-agnostic" package | Medium | Low | Make `createSecureTokenStore()` an opt-in subpath import (`@m2/api-client/expo`) so web consumers never pull `expo-secure-store`. Generic `TokenStore` interface stays in the main entry. |
| R8 | Backend channels endpoint shape diverges from what we type in `@m2/api-client` | Medium | Medium | Author types from the m2-back DTOs (mirror manually until OpenAPI generation lands). Keep types in `packages/types/` so a single source of truth governs both client and screens. |
| R9 | Composer disabled in Conversation looks like a bug to demo audience | Low | Medium | Render an explicit "Sending coming soon" affordance, not just a greyed-out button. Documented in screens spec when it lands. |
| R10 | `@m2/design` v2 token exports collide with v1 exports | Low | Medium | Namespace v2 under `@m2/design/v2` subpath until v1 is removed in a follow-up change. Existing screens keep importing v1 until they migrate. |

---

## 7. Rollback Plan

The migration is staged and reversible at three levels:

1. **Per-screen rollback** — each screen lands in its own commit. Reverting a single commit returns that screen to its mock-driven state without touching others. Manual `git revert <screen-commit-sha>`.
2. **Phase rollback** — Phase 0 (foundations), Phase 1 (atoms), Phase 2 (screens) each form a contiguous commit range. `git revert <range>` returns the app to the last green Phase boundary. Mocks and the legacy axios `services/api.ts` stay reachable until the *final* Phase 2 commit.
3. **Full rollback** — abandon the branch. `git checkout main && git branch -D feat/mobile-v2-redesign`. `@m2/design` v1 tokens stay untouched throughout, so `main` is unaffected. Backend remains untouched (this change adds **no** server-side modifications).

No data migration, no schema change, no auth-flow change for existing users (the auth endpoints are already live in `m2-back`). Rolling back is purely a source-control + `pnpm install` operation.

---

## 8. Dependencies

- **Backend** — `m2-back` running at `http://localhost:3000/api` with auth, conversations, messages, channels endpoints live. **Confirmed**.
- **Design bundle** — `c:/proyectos en conjunto/m2/.design-bundle/project/*`. **Confirmed**.
- **No new infra** — no new env in CI, no new secrets, no new external service.

Blocking gaps tracked but **not** part of this change:

- `m2-back` WebSocket gateway (for realtime) — deferred.
- `m2-back` agent send-message endpoint (for outbound from app) — deferred; composer ships disabled.

---

## 9. Success Criteria

- [ ] `@m2/design` exposes V2 tokens (palette, gradients, typography, motion) and primitives (`<Glass>`, `<Atmosphere>`, `<Sparkle4>`, typography, icons) under a stable subpath; v1 tokens remain importable.
- [ ] `@m2/api-client` exposes `createSecureTokenStore()` and a complete channels resource matching `m2-back`'s `/channels` contract.
- [ ] `apps/mobile` imports `@m2/api-client` for all networked resources; `apps/mobile/src/services/api.ts` is deleted.
- [ ] `EXPO_PUBLIC_API_URL` drives the api-client base URL in dev, dev-client, and EAS builds; no hardcoded URL remains in `apps/mobile/`.
- [ ] All 7 V2 atoms (Brandmark, Avatar, ChannelPill, IntentBadge, TodayDivider, StatusBar, FloatingTabBar) render correctly on Android dev client.
- [ ] All 6 V2 screens (Login, Inbox, Conversation, Channels, AI Hub, Profile) render correctly on Android dev client and consume real backend data (where applicable; AI Hub and Profile may be partial).
- [ ] Login flow signs in against `m2-back` and persists the token via `expo-secure-store`; subsequent app launches resume the session.
- [ ] Inbox renders real conversations from `m2-back`; tapping a conversation opens the Conversation screen with real messages.
- [ ] Channels screen performs full CRUD against `m2-back`'s `/channels` endpoints.
- [ ] Conversation composer is **visually disabled** with a clear affordance (no broken send action).
- [ ] FloatingTabBar replaces the legacy nav shell; conic active indicator animates on tab change.
- [ ] `pnpm -w typecheck` passes with zero TS errors after the change lands.
- [ ] Android dev client boots and a manual smoke test of all 6 screens passes (login → inbox → conversation → channels → AI Hub → profile → logout).

---

## 10. Follow-ups (out of this change, captured here)

- **WebSocket realtime** — once `m2-back` ships its WS gateway, wire conversations and messages to live updates via Zustand store actions (per `CLAUDE.md` rules).
- **Agent send-message** — once `m2-back` exposes the outbound endpoint, enable the Conversation composer (separate change).
- **AI Hub real configuration** — model picker, prompt editor, AI context settings.
- **Web alignment** — `apps/landing` and `apps/admin` consume the same `@m2/design` v2 tokens (separate change).
- **Skia bundle audit** — measure release bundle delta on Android + iOS; consider lazy-loading Skia if it materially affects cold start.
- **OpenAPI generation** — generate `@m2/api-client` types from `m2-back`'s OpenAPI spec instead of hand-mirroring DTOs.
- **Light mode** — design tokens already structured for it; deferred until a product requirement lands.
- **Storybook / visual regression harness** — would help future V2 atom work; deferred.
