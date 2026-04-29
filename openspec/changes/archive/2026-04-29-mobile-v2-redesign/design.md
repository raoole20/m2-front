# Design: Mobile V2 Redesign + Backend Integration

## Technical Approach

Three sequenced phases (Foundations -> Atoms -> Screens) build out V2 in `@m2/design`, extend `@m2/api-client` with an Expo-flavored secure token store + channels resource, then rewrite all six screens to consume real `m2-back` data through `apps/mobile/src/lib/api.ts`. Visual fidelity ("Apple Vision Pro on a phone") is delivered by three new primitives — `<Glass>` (expo-blur + Android fallback recipe), `<Atmosphere>` (stacked radial halos via Skia), `<Sparkle4>` (Skia conic) — plus typography helpers backed by `Instrument Serif` loaded through `expo-font`. Zustand stays for UI/auth state; TanStack Query is **added** for server-state caching since `apps/landing` already uses it (single mental model across the monorepo). The current sync `TokenStore` interface is preserved on web; mobile uses a thin async-cache adapter that satisfies the same shape after `await rehydrate()`.

References: `proposal.md`, specs/`{design,api-client,mobile}/spec.md`, `.design-bundle/project/{v2-screens,v2-atoms,v2-icons}.jsx`.

## Architecture Decisions

### Decision: Skia for conic gradients only; SVG/LinearGradient for everything else

**Choice**: `@shopify/react-native-skia` ONLY for conic (avatar ring, AI iridescent border, active tab) and radial halos in `<Atmosphere>` and `<Sparkle4>`. Use `expo-linear-gradient` and `react-native-svg` for linear gradients, dividers, icons, and `<GradText>` masking.
**Alternatives**: All-Skia (unified API, but ~5MB extra and overkill); CSS-only via `react-native-css-interop` (no conic support); pure `react-native-svg` `<Pattern>` hacks (poor performance, lossy).
**Rationale**: Skia is the only RN solution that renders true conic with shader-based animation on the UI thread. Bundle cost is paid once; everywhere else, lighter primitives are faster to mount and easier to debug. Matches Risk R1 mitigation in proposal.

### Decision: Expo SDK 55 — install Skia via `expo install`, **dev-client required**

**Choice**: Install `@shopify/react-native-skia` with `pnpm --filter @m2/mobile expo install @shopify/react-native-skia`. Continue using `expo-dev-client` (already in `package.json`); Skia native code requires it. No prebuild needed — Expo's CNG handles autolinking on `eas build` / `expo run:android`.
**Alternatives**: Eject to bare RN (loses managed workflow benefits); use `react-native-svg` `<Path>` to fake conic (visually inferior, no animation on UI thread).
**Rationale**: SDK 55 supports Skia v2.x with autolinking; `expo-dev-client` is already a dep so no marginal cost. Document the "rebuild dev client after install" step in mobile README.

### Decision: TokenStore stays sync on root entry, **async on `/expo` subpath**

**Choice**: Keep the existing sync `TokenStore` interface (`getAccess(): string | null`) unchanged on the root export. Add a NEW interface `AsyncTokenStore` exported only from `@m2/api-client/expo`. `createSecureTokenStore()` returns `AsyncTokenStore` and additionally implements an in-memory cache that exposes the SAME sync `TokenStore` shape after `rehydrate()` resolves; `setTokenStore()` accepts the cached sync view. Bootstrap pattern: `const store = createSecureTokenStore(); await store.rehydrate(); setTokenStore(store.sync);` before first networked call.
**Alternatives**:
- Make root `TokenStore` async (breaks `apps/landing`, requires fetcher rewrite).
- AsyncStorage instead of expo-secure-store (violates CLAUDE.md non-negotiable rule "auth tokens — `expo-secure-store` only").
- Keep sync but block UI on `getAccess()` per call (unsafe, expo-secure-store is async-only).
**Rationale**: Zero breaking change for web. The fetcher's `tokenStore?.getAccess()` call at request time stays sync because the in-memory cache is populated at bootstrap and on every `set()`. Discovered risk (R-async, see §11) is fully mitigated by the cache pattern.

### Decision: Subpath exports map for `@m2/api-client/expo`

**Choice**: Update `packages/api-client/package.json` `exports` to:
```json
{ ".": "./src/index.ts", "./expo": "./src/expo/index.ts" }
```
The `./expo` entry is the only one that imports `expo-secure-store` (declared as `peerDependency`). Web bundlers never traverse this entry.
**Alternatives**: Single entry with runtime `Platform.OS` check (still pulls expo-secure-store into web bundle graph); separate package `@m2/api-client-expo` (premature, more wiring).
**Rationale**: Standard Node `exports` convention; isolates platform deps cleanly. Matches Risk R7 mitigation.

### Decision: TanStack Query for server state, Zustand for UI/auth/drafts

**Choice**: Add `@tanstack/react-query` v5 to `apps/mobile`. Wrap app in `<QueryClientProvider>` in `app/_layout.tsx`. Server state (conversations, messages, channels, current user) goes through `useQuery`/`useMutation` keys (`['conversations']`, `['conversation', id, 'messages']`, etc.). Existing `useAuthStore`, `useThemeStore`, `useInboxStore` keep handling auth flag, theme, draft text, and any UI-only filters. `useWebSocketStore` stays as a no-op shell for the future WS gateway (out of scope this change).
**Alternatives**: Pure `useEffect` + Zustand setters (`apps/landing` already proved this leaks loading/error logic into stores); SWR (less idiomatic, fewer features).
**Rationale**: `apps/landing` runs on TanStack Query — adopting it on mobile aligns the monorepo's data-fetching mental model. Optimistic updates not needed (composer disabled per spec).

### Decision: Single `theme/` indirection; NEVER import `@m2/design/v2` deep paths from screens

**Choice**: Create `apps/mobile/src/theme/index.ts` that re-exports the V2 tokens and primitives the app uses (`colorsV2`, `typographyV2`, `Glass`, `Atmosphere`, etc.). Screens and atoms import `from '@/theme'`. The atoms layer is the ONLY consumer of `@m2/design/v2` directly.
**Alternatives**: Import `@m2/design/v2` everywhere (couples every screen to package internals); duplicate tokens locally (defeats §M migration).
**Rationale**: One choke point for future v1 -> v2 cutover. Lets us swap the V2 namespace later without touching screens.

### Decision: V1 components stay during implementation, deleted in the final commit of Phase 2

**Choice**: Keep `apps/mobile/src/components/{ui,messaging,ai,navigation}/` intact. Build V2 in parallel under `apps/mobile/src/components/v2/`. Each screen migrates one-by-one (per integration order in proposal D5); when the last screen drops V1 imports, a single cleanup commit deletes legacy `components/{ui,messaging,ai,navigation}/`, legacy `services/{api,auth,conversations,ai}.ts`, and the unused `home/`/`reports/`/`settings/`/`team/` route folders.
**Alternatives**: Big-bang delete + rebuild (breaks every skeleton screen mid-flight, no green commits); permanent V1/V2 coexistence (token sprawl).
**Rationale**: Keeps every commit independently buildable per proposal §3 phase boundary discipline.

## Data Flow

```
                          ┌──────────────────────────────────────────────┐
                          │            apps/mobile/app/_layout.tsx       │
                          │  loads fonts, rehydrate auth, mount providers│
                          └─────┬────────────────────────────────────────┘
                                │
            ┌───────────────────┼─────────────────────┐
            ▼                   ▼                     ▼
    QueryClientProvider   ToastProvider     <Atmosphere mood=...>  (per screen)
            │                                          ▲
            ▼                                          │
    Screen (e.g. Inbox)                                │
       │                                               │
       │ useQuery(['conversations'], () =>             │
       │   apiClient.conversations.list())             │
       ▼                                               │
  @m2/api-client.fetcher                               │
       │ Authorization: Bearer <token>                 │
       │ ◄── tokenStore.sync.getAccess()  (in-memory cache, hydrated at boot)
       ▼
  m2-back  http://EXPO_PUBLIC_API_URL/conversations

  Auth bootstrap (cold start):
    SecureStore.getItemAsync(*)
        ─► createSecureTokenStore.rehydrate()
            ─► populates in-memory cache
                ─► setTokenStore(store.sync)
                    ─► first networked render proceeds
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `packages/design/src/v2/colors.ts` | Create | V2 atmospheric palette (bg, accent, text, channels, intent) |
| `packages/design/src/v2/typography.ts` | Create | V2 scale (Inter sans + Instrument Serif italic, display/title/body/caption/micro) |
| `packages/design/src/v2/radii.ts` | Create | `pill/lg/md/sm/xs` |
| `packages/design/src/v2/shadows.ts` | Create | `floating`, `card`, `glow.accent` |
| `packages/design/src/v2/glass.ts` | Create | Glass recipe object + Android fallback recipe |
| `packages/design/src/v2/atmosphere.ts` | Create | 5 mood presets mirroring `v2-atoms.jsx` |
| `packages/design/src/v2/motion.ts` | Create | `sparkle/pulse/pulseRing/fadeUp` durations + easings |
| `packages/design/src/v2/index.ts` | Create | Barrel re-export |
| `packages/design/src/components/Glass.tsx` | Create | `<Glass variant intensity>` — iOS BlurView / Android fallback |
| `packages/design/src/components/Atmosphere.tsx` | Create | `<Atmosphere mood intensity>` Skia canvas of stacked radial halos |
| `packages/design/src/components/Sparkle4.tsx` | Create | Skia 4-point sparkle |
| `packages/design/src/components/Typography.tsx` | Create | `<Display><Headline><Body><Caption><Micro><SerifItalic><GradText>` |
| `packages/design/src/components/index.ts` | Create | Barrel |
| `packages/design/src/index.ts` | Modify | Re-export V2 alongside V1 (no removal) |
| `packages/design/package.json` | Modify | Add `peerDependencies` for skia, svg, expo-font, expo-blur, expo-linear-gradient, react-native, react |
| `packages/api-client/src/expo/secure-token-store.ts` | Create | `createSecureTokenStore()` — async store + sync cache adapter |
| `packages/api-client/src/expo/index.ts` | Create | Subpath barrel |
| `packages/api-client/src/channels.ts` | Create | `list/get/create/update/delete/connect` resource |
| `packages/api-client/src/index.ts` | Modify | Re-export `channels`; do NOT export `createSecureTokenStore` here |
| `packages/api-client/package.json` | Modify | Add `"./expo"` to `exports`; declare `expo-secure-store` peerDep |
| `packages/types/src/channel.ts` | Modify | Extend `Channel` with `status`, `accountIdentifier`, etc. mirroring m2-back DTO |
| `apps/mobile/src/theme/index.ts` | Create | Re-export of V2 tokens/primitives — single import path for screens |
| `apps/mobile/src/lib/api.ts` | Create | Builds api-client w/ `EXPO_PUBLIC_API_URL` + `createSecureTokenStore()` |
| `apps/mobile/src/lib/queryClient.ts` | Create | TanStack Query client config |
| `apps/mobile/src/components/v2/{Brandmark,Avatar,ChannelPill,IntentBadge,TodayDivider,StatusBar,FloatingTabBar}.tsx` | Create | The 7 V2 atoms |
| `apps/mobile/app/_layout.tsx` | Modify | Register Instrument Serif via `@expo-google-fonts/instrument-serif`; mount QueryClientProvider; bootstrap secure token store |
| `apps/mobile/app/(auth)/login.tsx` | Modify | V2 layout + `apiClient.auth.login()` |
| `apps/mobile/app/(app)/_layout.tsx` | Modify | Replace nav shell with `<FloatingTabBar>`; auth guard |
| `apps/mobile/app/(app)/inbox/index.tsx` | Modify | V2 + `useQuery(['conversations'])` |
| `apps/mobile/app/(app)/inbox/[id]/index.tsx` | Modify | V2 + `useQuery(['conversation', id, 'messages'])`; composer disabled |
| `apps/mobile/app/(app)/channels/index.tsx` | Create | V2 list + CRUD mutations |
| `apps/mobile/app/(app)/ai/index.tsx` | Modify | V2 placeholder layout (no fetch) |
| `apps/mobile/app/(app)/profile/index.tsx` | Modify | V2 + `useQuery(['me'])` + sign-out |
| `apps/mobile/src/store/useAuthStore.ts` | Modify | Replace `services/auth` calls with `apiClient.auth.*`; trim `expiresAt` rehydrate logic into store's responsibility only |
| `apps/mobile/src/services/{api,auth,conversations,ai}.ts` | Delete (final cleanup commit) | Replaced by `@m2/api-client` |
| `apps/mobile/src/components/{ui,messaging,ai,navigation}/` | Delete (final cleanup commit) | Replaced by V2 atoms |
| `apps/mobile/app/(app)/{home,reports,settings,team}/` | Delete (final cleanup commit) | Out of V2 nav |
| `.env.example` | Create / Modify | `EXPO_PUBLIC_API_URL=http://localhost:3000/api` + LAN-IP doc |

## Interfaces / Contracts

```ts
// packages/api-client/src/expo/secure-token-store.ts
import type { TokenStore, Tokens } from "../token-store";

export interface AsyncTokenStore {
  rehydrate(): Promise<void>;
  set(tokens: Tokens): Promise<void>;
  clear(): Promise<void>;
  /** Sync view satisfying the existing TokenStore — usable only after rehydrate(). */
  readonly sync: TokenStore;
}

export function createSecureTokenStore(): AsyncTokenStore;
```

```ts
// packages/api-client/src/channels.ts
import type { Channel, ChannelType } from "@m2/types";

export type ChannelStatus = "connected" | "paused" | "disconnected" | "error";

export type ChannelCreateInput = {
  type: ChannelType;
  name: string;
  accountIdentifier?: string;
};

export type ChannelUpdateInput = Partial<Pick<Channel, "name" | "status">>;

export type ChannelConnectInput = {
  /** Provider-specific credential payload. */
  credentials: Record<string, unknown>;
};

export async function list(): Promise<Channel[]>;
export async function get(id: string): Promise<Channel>;
export async function create(payload: ChannelCreateInput): Promise<Channel>;
export async function update(id: string, payload: ChannelUpdateInput): Promise<Channel>;
export async function del(id: string): Promise<void>;          // exported as `delete` from index
export async function connect(id: string, payload: ChannelConnectInput): Promise<Channel>;
```

```ts
// packages/design/src/components/Glass.tsx (signature)
type GlassVariant = "card" | "tabbar" | "input" | "chip";
type GlassIntensity = "subtle" | "medium" | "strong";

export function Glass(props: {
  variant?: GlassVariant;            // default: "card"
  intensity?: GlassIntensity;        // default: "medium"
  style?: ViewStyle;
  children?: ReactNode;
}): JSX.Element;
```

**Glass Android fallback recipe** (no real backdrop blur):
```
backgroundColor: 'rgba(19,24,40,0.78)'                                  // dense tint
borderTopWidth: StyleSheet.hairlineWidth                                // top highlight
borderTopColor: 'rgba(255,255,255,0.12)'
+ absolute LinearGradient overlay at top, 1px tall:
   colors: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']
   start: {x:0,y:0} end: {x:1,y:0}                                      // horizontal sheen
+ absolute View overlay (inner shadow sim): 1px bottom inset shadow via shadowColor + shadowOpacity
```

## Skia integration patterns

**Conic gradient (avatar ring / tab indicator / AI border)**:
```tsx
<Canvas style={{ width: ringSize, height: ringSize }}>
  <Circle cx={r} cy={r} r={r - 1.5} color="transparent">
    <SweepGradient
      c={vec(r, r)}
      colors={["#b4b5fb", "#8b8cf7", "#6366f1", "#5fa8ff", "#b4b5fb"]}
      start={90}
    />
    <Paint style="stroke" strokeWidth={1.5} />
  </Circle>
</Canvas>
```

**Radial halo (Atmosphere)**: one `<Canvas absoluteFill>` per mounted screen containing 2–3 `<Circle>` nodes with `RadialGradient` paint, sized via percentages of `useWindowDimensions()`. Halo descriptors mapped from `atmosphereV2[mood]`. `intensity` multiplies the alpha channel of every stop (`flat` returns `null`).

**Memoization**: every Skia subtree wrapped in `React.memo` keyed on its prop set. Color arrays computed inside `useMemo`. NO `useDerivedValue` unless animating (only the tab indicator and pulse ring animate; all other Skia content is static and renders once).

**Performance budget**: max **2 Canvases mounted per screen** (Atmosphere + active interactive Skia element). Avatars use a SHARED Canvas pattern via `<Canvas><Group>` siblings rather than one Canvas per avatar; if list virtualization makes this awkward, fall back to one `Canvas` per row but lazy-mount via `IntersectionObserver`-equivalent (`onLayout`-based). Cold-mount Atmosphere uses static `<Circle>` + `<RadialGradient>` paints — no shaders compiled at runtime — so no extra precompute step is required.

## Per-screen integration

| Screen | Data fetch | Mutations | Atmosphere |
|---|---|---|---|
| Login `(auth)/login` | none on mount | `apiClient.auth.login()` -> `tokenStore.set()` -> `router.replace('/(app)/inbox')` | `inbox` mood, `subtle` intensity |
| Inbox `(app)/inbox` | `useQuery(['conversations'])` -> `apiClient.conversations.list()` | none | `inbox`, `rich` |
| Conversation `(app)/inbox/[id]` | `useQuery(['conversation', id, 'messages'])` | none (composer disabled, "Próximamente" badge) | `conversation`, `rich` |
| Channels `(app)/channels` | `useQuery(['channels'])` | `useMutation` for create/update/delete/connect; invalidate `['channels']` on success | `channels`, `rich` |
| AI Hub `(app)/ai` | none — placeholder copy from constants | none | `ai`, `rich` |
| Profile `(app)/profile` | `useQuery(['me'])` -> `apiClient.auth.me()` | sign-out: `useAuthStore.signOut()` -> `tokenStore.clear()` -> `router.replace('/(auth)/login')` | `profile`, `rich` |

`useInboxStore` keeps responsibility for: filter chip state (`all/unread/mine/ai`), search query text. Server data flows in through `useQuery` and is **not** mirrored into the store.

## Routing

- Two existing route groups stay: `(auth)` (login) and `(app)` (everything else).
- `(app)/_layout.tsx` swaps the current `<Stack>` for `<Tabs tabBar={(p) => <FloatingTabBarV2 {...p} />}>`. The four tabs are `inbox`, `channels`, `ai`, `profile`. The `home/`, `reports/`, `settings/`, `team/` folders under `(app)` are deleted in the cleanup commit (out of V2 nav).
- `inbox/[id]` is a stack push from `inbox`, not a tab. It hides the tab bar via `tabBarStyle: { display: 'none' }` in its screen options (or via a nested `<Stack>` inside the inbox tab).
- Auth guard in `app/_layout.tsx` (already wired) keeps redirecting unauthenticated traffic to `/(auth)/login`.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | None added | Mobile has no test harness today (proposal §2.2). Out of scope. |
| Integration | `createSecureTokenStore()` round-trip; channels resource against a mocked fetcher | Defer; capture as TODO in `sdd-tasks` per change owner. |
| E2E / manual | Per-screen smoke checklist on Android dev client | `sdd-verify` runs the manual checklist: login w/ valid + invalid creds, cold-start session resume, inbox list + filter chips, conversation detail + disabled composer, channels CRUD, AI Hub render, Profile sign-out. Documented in `sdd-verify` step. |
| Visual | iOS vs Android Glass parity, Skia conic parity, Instrument Serif rendering | Manual snapshot check per atom during Phase 1 commit. |

## Migration / Rollout

Same three-layer rollback as proposal §7: per-screen revert, per-phase revert, full branch abandon. No data migration. No backend change. No EAS / CI change. The v1 `@m2/design` token tree stays importable throughout — its removal is a separate follow-up change.

## Open Questions

- [ ] **Channel DTO fields** — final shape of `Channel` (status enum values, whether `accountIdentifier` is required) needs to be confirmed against `m2-back`'s actual Prisma model + DTO before `packages/types/src/channel.ts` is patched. Capture in `sdd-tasks` as a "verify against m2-back" task.
- [ ] **`apiClient.auth.me()` endpoint** — does `m2-back` expose `GET /auth/me`? If not, Profile reads from the locally stored `AuthUser` (already in `useAuthStore`) and we file a follow-up.
- [ ] **TanStack Query peer dep on `apps/landing`** — confirm `apps/landing` and `apps/mobile` can share a single QueryClient version without RN/Web hydration conflicts (likely fine since they don't share a runtime; flag for review).
- [ ] **Reanimated keyframe specifics** — exact spring configs and timings for sparkle, pulse-ring, fade-up, tab-indicator slide are deferred to implementation (sdd-apply). Tokens give the durations/easings; the call sites are free to choose `withSpring` vs `withTiming`.
- [ ] **Skia version pin** — pin to the exact patch tested on iOS + Android in Phase 0; lock it in `package.json` (no caret) until R3 (cross-platform conic parity) is verified.
