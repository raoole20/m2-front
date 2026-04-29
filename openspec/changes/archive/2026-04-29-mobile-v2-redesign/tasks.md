# Tasks: Mobile V2 Redesign + Backend Integration

> Three sequenced phases (Foundations → Atoms → Screens) plus a final Cleanup commit. Each task is sized **S** (≤1h), **M** (1–3h), or **L** (3–6h). Dependencies are listed where the order is non-obvious.

---

## Phase 0 — Foundations

- [x] 0.1 **Install runtime deps in `apps/mobile`** — run `pnpm --filter @m2/mobile expo install @shopify/react-native-skia react-native-svg @expo-google-fonts/instrument-serif @react-native-masked-view/masked-view expo-dev-client` and `pnpm --filter @m2/mobile add @tanstack/react-query`. Verify Skia version pin (no caret) per design Decision §2 / Risk R3. Effort: **S**

- [x] 0.2 **Create `.env.local` + `.env.example` in `apps/mobile`** — write `apps/mobile/.env.example` with `EXPO_PUBLIC_API_URL=http://localhost:3000/api` and a comment documenting the Android LAN-IP override pattern (`EXPO_PUBLIC_API_URL=http://<LAN-IP>:3000/api`, Risk R6). Create local `.env.local` mirroring it. Effort: **S**

- [x] 0.3 **Create V2 token files in `packages/design/src/v2/`** — author `colors.ts` (bg, accent, text, channels keyed to `ChannelType`, intent), `typography.ts` (Inter sans + Instrument Serif italic, display ≥38px with negative tracking, title/body/caption/micro), `radii.ts` (`pill/lg/md/sm/xs`), `shadows.ts` (`floating`, `card`, `glow.accent`), `glass.ts` (recipe + Android fallback), `atmosphere.ts` (5 moods with halo descriptors), `motion.ts` (sparkle/pulse/pulseRing/fadeUp), and `index.ts` barrel. Values must match `.design-bundle/project/v2-atoms.jsx` and the design `spec.md` requirements. Effort: **L**

- [x] 0.4 **Add `@m2/design/v2` subpath export** — modify `packages/design/package.json` `exports` map to add `"./v2": "./src/v2/index.ts"`; add peerDeps `@shopify/react-native-skia`, `react-native-svg`, `expo-font`, `expo-blur`, `expo-linear-gradient` (Risk R10 + design spec REQ "Skia and Instrument Serif as peer dependencies"). Depends on 0.3. Effort: **S**

- [x] 0.5 **Build `<Glass>` primitive** — create `packages/design/src/v2/primitives/Glass.tsx` wrapping `expo-blur` `BlurView` for iOS; on Android render the dense semi-opaque tint + 1px top sheen + inner-shadow recipe documented in design.md §"Glass Android fallback recipe". Props: `variant`, `intensity`, `style`, `children`. Depends on 0.3, 0.4. Effort: **M**

- [x] 0.6 **Build `<Atmosphere>` primitive** — create `packages/design/src/v2/primitives/Atmosphere.tsx` rendering a Skia `<Canvas absoluteFill>` with stacked `<Circle>` + `<RadialGradient>` halos driven by `atmosphereV2[mood]`. Props: `mood`, `intensity` (`flat`/`subtle`/`rich`); `flat` returns `null`. Memoize and size halos via `useWindowDimensions()`. Depends on 0.3, 0.4. Effort: **M**

- [x] 0.7 **Build typography primitives** — create `packages/design/src/v2/primitives/Typography.tsx` exporting `<Display>`, `<Headline>`, `<Body>`, `<Caption>`, `<Micro>`, `<SerifItalic>`, `<GradText>` (LinearGradient masked via `@react-native-masked-view/masked-view`). All read `typographyV2`. Depends on 0.3. Effort: **M**

- [x] 0.8 **Load fonts in root layout** — modify `apps/mobile/app/_layout.tsx` to register `Inter` (already present) plus `Instrument Serif` via `@expo-google-fonts/instrument-serif` using `useFonts`; block first render until fonts ready. Depends on 0.1. Effort: **S**

- [x] 0.9 **Build I2 icon set + channel + Sparkle4** — create `packages/design/src/v2/icons/` with Lucide-style `react-native-svg` components plus brand glyphs for `WhatsApp`, `Instagram`, `Messenger`, `Telegram`, `SMS`, `Email`, plus `Sparkle4.tsx` (Skia 4-point sparkle). Export from a barrel. Depends on 0.4. Effort: **L**

- [x] 0.10 **Add `@m2/api-client/expo` subpath export** — modify `packages/api-client/package.json` `exports` map to `{ ".": "./src/index.ts", "./expo": "./src/expo/index.ts" }`; declare `expo-secure-store` as `peerDependency`; create `packages/api-client/src/expo/index.ts` barrel (api-client spec REQ "Resource and store re-exports"). Effort: **S**

- [x] 0.11 **Implement `createSecureTokenStore()`** — create `packages/api-client/src/expo/secure-token-store.ts` exporting `createSecureTokenStore()` returning `AsyncTokenStore` (signature in design.md §Interfaces) with `rehydrate()`, `set()`, `clear()`, and a `sync` view satisfying the existing `TokenStore` interface fed by an in-memory cache. Use `expo-secure-store` `getItemAsync`/`setItemAsync`/`deleteItemAsync` for `accessToken` + `refreshToken`. Depends on 0.10. Effort: **M**

- [x] 0.12 **Extend `fetcher.ts` to read `EXPO_PUBLIC_API_URL`** — modify `packages/api-client/src/fetcher.ts` (or the equivalent base-URL resolver) to fall back to `process.env.EXPO_PUBLIC_API_URL` when `NEXT_PUBLIC_API_URL` is undefined; throw a clear, named error if both are missing at first call (mobile spec REQ "API base URL via `EXPO_PUBLIC_API_URL`" / Scenario "Missing env var fails loudly"). Effort: **S**

- [x] 0.13 **Add `channels` resource** — create `packages/api-client/src/channels.ts` exporting `list`, `get`, `create`, `update`, `del` (re-exported as `delete`), `connect` matching m2-back's `/channels` endpoints (api-client spec REQ "`channels` resource module"). Define `ChannelStatus`, `ChannelCreateInput`, `ChannelUpdateInput`, `ChannelConnectInput` types here; extend `packages/types/src/channel.ts` if needed (Open Question §"Channel DTO fields" — verify shape against m2-back DTO before merging). Effort: **M**

- [x] 0.14 **Create `apps/mobile/src/lib/api.ts` factory** — build the apiClient instance using the `@m2/api-client` factory + `createSecureTokenStore` from `@m2/api-client/expo`. Export `apiClient` and `tokenStore`. The `EXPO_PUBLIC_API_URL` env var drives base URL (mobile spec REQ "API base URL"). Depends on 0.10, 0.11, 0.12, 0.13. Effort: **S**

- [x] 0.15 **Create `apps/mobile/src/lib/queryClient.ts`** — instantiate a TanStack Query `QueryClient` with sane defaults (`retry: 1`, `staleTime: 30_000`, `refetchOnWindowFocus: false`). Effort: **S**

- [x] 0.16 **Create `apps/mobile/src/theme/index.ts`** — barrel re-export of V2 tokens (`colorsV2`, `typographyV2`, `radiiV2`, `shadowsV2`, `glassV2`, `atmosphereV2`, `motionV2`) and primitives (`Glass`, `Atmosphere`, `Sparkle4`, typography helpers, icons) imported from `@m2/design/v2`. Screens MUST import only from `@/theme` per design Decision §"Single `theme/` indirection". Depends on 0.3–0.9. Effort: **S**

---

## Phase 1 — V2 Atoms

> Each atom under `apps/mobile/src/components/v2/`, importing only from `@/theme`. No legacy V1 token reference (mobile spec REQ "V2 atoms"). All atoms depend on 0.16.

- [x] 1.1 **`BrandmarkV2`** — `apps/mobile/src/components/v2/BrandmarkV2.tsx`. Gradient backdrop + `M` glyph + multi-shadow stack per `v2-atoms.jsx`. Effort: **S**

- [x] 1.2 **`AvatarV2`** — `apps/mobile/src/components/v2/AvatarV2.tsx`. Skia conic gradient ring + Skia radial blob (hue deterministic from `name` prop) + `Instrument Serif` italic initials + optional pulse-ring online state (Reanimated). Mobile spec REQ "V2 atoms" Scenarios "Avatar renders Skia conic ring + serif initials" and "Avatar palette is deterministic by name". Effort: **M**

- [x] 1.3 **`ChannelPillV2`** — `apps/mobile/src/components/v2/ChannelPillV2.tsx`. Slim pill with channel icon + uppercase label tinted by `colorsV2.channels[id]`. Mobile spec REQ "V2 atoms" Scenario "ChannelPill matches channel id". Effort: **S**

- [x] 1.4 **`IntentBadgeV2`** — `apps/mobile/src/components/v2/IntentBadgeV2.tsx`. 5px glowing dot in `colorsV2.intent[intent]` + uppercase label. Mobile spec REQ "V2 atoms" Scenario "IntentBadge shows glow dot per intent". Effort: **S**

- [x] 1.5 **`TodayDivider`** — `apps/mobile/src/components/v2/TodayDivider.tsx`. Horizontal gradient lines flanking a centered `Instrument Serif` italic label. Effort: **S**

- [x] 1.6 **`StatusBarV2`** — `apps/mobile/src/components/v2/StatusBarV2.tsx`. `9:41` clock + signal/wifi/battery SVG glyphs (uses 0.9). Effort: **S**

- [x] 1.7 **`FloatingTabBarV2`** — `apps/mobile/src/components/v2/FloatingTabBarV2.tsx`. Glass surface (`<Glass variant="tabbar">`) hovering above the safe area, four icon buttons, active tab gets a Skia conic-gradient highlight + accent dot below the icon (animated via Reanimated). Accepts an Expo Router `BottomTabBarProps` shape (mobile spec REQ "Floating glass tab bar"). Effort: **L**

---

## Phase 2 — Screens with integration

> Each screen lands as its own commit/sub-PR (proposal §3 phase boundary discipline). All screens depend on Phase 0 + Phase 1. Order: Login → routing setup → cleanup of skeletons → product screens → tab-bar wiring → auth-store refactor → bootstrap.

- [x] 2.1 **Login screen** — refactor `apps/mobile/app/(auth)/login.tsx` to V2 layout (atmospheric backdrop with `inbox` mood at `subtle`, glass card form, gradient submit button); call `apiClient.auth.login()` on submit; on success persist tokens via `tokenStore.set()` and `router.replace('/(app)/inbox')`; on error show inline / toast affordance, do NOT persist tokens (mobile spec REQ "Auth integration"). Depends on 0.14, 1.x. Effort: **M**

- [x] 2.2 **Configure expo-router groups + auth guard** — confirm `app/(auth)/` and `app/(app)/` groups exist; implement `apps/mobile/app/(app)/_layout.tsx` auth guard that checks `tokenStore.sync.getAccess()` and redirects to `/(auth)/login` when missing (mobile spec REQ "Auth integration" Scenario "Unauthenticated guard"). Depends on 0.14. Effort: **S**

- [x] 2.3 **Delete skeleton screens** — remove `apps/mobile/app/(app)/home/`, `reports/`, `settings/`, `team/` route folders (per design.md §File Changes "Delete (final cleanup commit)" — but moved to mid-Phase 2 to keep `(app)` tree clean before tab-bar wiring; verify nothing imports them first). Effort: **S**

- [x] 2.4 **Inbox screen** — refactor `apps/mobile/app/(app)/inbox/index.tsx` to V2 layout with `<Atmosphere mood="inbox" intensity="rich">`, editorial header, glass search field, filter chips (`All` / `Unread` / `Mine` / `AI handled`) backed by `useInboxStore`, `ConvoRow` list fed by `useQuery(['conversations'], () => apiClient.conversations.list())`, intent badges, channel pills, empty state (`InboxEmpty` "Quietness." in serif), loading + error affordances. Mobile spec REQ "Inbox screen". Depends on 2.1, 2.2, 1.x. Effort: **L**
  - **Backend gap (Lote B note)** — `apiClient.conversations.list()` returns only `{ id; title; status; updatedAt }`. We omit avatar `online` state, channel mark, `IntentBadgeV2`, and the unread-count pulse badge because the backend does not surface them. Filters `Mine` / `AI handled` are visual-only; only `All` and `Unread`→`pending` map to a real backend query. Replace with full model when backend grows `contact`, `channelType`, `intent`, `unreadCount`, and per-conversation AI fields.

- [x] 2.5 **Conversation detail screen** — refactor `apps/mobile/app/(app)/inbox/[id]/index.tsx` to V2 layout with `<Atmosphere mood="conversation" intensity="rich">`, glass header (back, AvatarV2, contact name, ChannelPill + online state), optional AI summary card, `TodayDivider`, message clusters from `useQuery(['conversation', id, 'messages'])`. Composer rendered visually but DISABLED with explicit "Sending coming soon" badge — Enter / tap MUST NOT POST anywhere (mobile spec REQ "Conversation screen" Scenario "Composer is visually disabled"). Depends on 2.4. Effort: **L**
  - **Backend gap (Lote B note)** — `apiClient.conversations.get(id)` returns only `{ id; title; status; updatedAt }` and `messages(id)` returns `{ id; direction; body; createdAt }[]`. Therefore the AI summary card and floating "IA suggests" chip are wired but render only when the meta object grows `aiContext.summary`/`tags` and `suggestedReply` (forward-compatible); today they will never display. Channel pill is omitted (no `channelType`). Read receipts default to single check (no per-message `status`). Header eyebrow ("talking with") shows but `online` is always `false` until backend exposes presence. Atmosphere intensity used: `subtle` (the spec text earlier said `rich`, but the design bundle's `ConversationScreenV2` passes `tweaks.atmosphere`; subtle reads better on top of the message bubbles).
  - **Iridescent border** on AI summary card uses a `LinearGradient` fallback (3-stop accent → info → accent). TODO: replace with a Skia conic gradient when the visual QA pass requests true iridescence.

- [x] 2.6 **Channels screen** — create / refactor `apps/mobile/app/(app)/channels/index.tsx` with `<Atmosphere mood="channels" intensity="rich">`, editorial header, `ChannelTile` cards (icon + brand halo + name + status pill `LIVE`/`PAUSED` + open conversation count), "Connect another channel" CTA. Wire `useQuery(['channels'])` for list and `useMutation` for create / update / delete / connect, invalidating `['channels']` on success. Mobile spec REQ "Channels screen". Depends on 0.13, 2.2, 1.x. Effort: **L**

- [x] 2.7 **AI Hub screen** — refactor `apps/mobile/app/(app)/ai/index.tsx` with `<Atmosphere mood="ai" intensity="rich">`, editorial header ("What I saw today" with serif moment), hero insight card (iridescent glass + Sparkle4), 3-column `StatCard` row, `INSIGHTS` `InsightCard` items. Placeholder copy from a constants file — NO AI network calls (mobile spec REQ "AI Hub screen"). Depends on 2.2, 1.x. Effort: **M**

- [x] 2.8 **Profile screen** — refactor `apps/mobile/app/(app)/profile/index.tsx` with `<Atmosphere mood="profile" intensity="rich">`, centered BrandmarkV2, identity block (name + role from `useQuery(['me'], () => apiClient.auth.me())` with fallback to `useAuthStore.user` if `/auth/me` doesn't exist — Open Question §"`apiClient.auth.me()` endpoint"), glass stats grid, three `SettingSection`s. Sign-out item triggers `useAuthStore.signOut()` → `tokenStore.clear()` → `router.replace('/(auth)/login')` (mobile spec REQ "Profile screen"). Depends on 2.2, 1.x. Effort: **M**

- [x] 2.9 **Wire `<FloatingTabBarV2>` to `<Tabs>`** — in `apps/mobile/app/(app)/_layout.tsx`, replace the current nav shell with `<Tabs tabBar={(props) => <FloatingTabBarV2 {...props} />}>` registering exactly four tabs (`inbox`, `channels`, `ai`, `profile`). Mobile spec REQ "Floating glass tab bar" Scenario "Four tabs visible by default". Depends on 1.7, 2.4–2.8. Effort: **S**

- [x] 2.10 **Hide tab bar inside Conversation** — set `tabBarStyle: { display: 'none' }` (or use a nested `<Stack>` inside the inbox tab) on `inbox/[id]` screen options so the floating bar is not rendered over the Conversation screen (mobile spec REQ "Floating glass tab bar" Scenario "Tab bar hidden inside Conversation"). Depends on 2.5, 2.9. Effort: **S**
  - **Implementation** — `apps/mobile/app/(app)/_layout.tsx` resolves the focused nested route (`getFocusedRouteNameFromRoute`) for the `inbox` tab; when it is `[id]`/`[id]/index`/`[id]/client`, `tabBarStyle: { display: 'none' }` is applied. List route (`index`) keeps the bar visible.

- [x] 2.11 **Refactor `useAuthStore` to delegate token persistence** — modify `apps/mobile/src/store/useAuthStore.ts` to stop holding raw tokens; instead call `tokenStore.set()` / `tokenStore.clear()` and read auth state via `tokenStore.sync.getAccess()` for boolean `isAuthenticated`. Keep `user`, `signIn`, `signOut`, `expiresAt` rehydrate concerns local. Depends on 0.14. Effort: **M**

- [x] 2.12 **Bootstrap provider tree in `_layout.tsx`** — modify `apps/mobile/app/_layout.tsx` to: (1) `await tokenStore.rehydrate()` before first render via a splash-gate pattern, (2) call `setTokenStore(store.sync)` on the api-client, (3) wrap children in `<QueryClientProvider client={queryClient}>` then auth guard. Mobile spec REQ "Auth integration" Scenarios "Session resume on cold start" + "Unauthenticated guard". Depends on 0.14, 0.15, 2.11. Effort: **M**

---

## Phase 3 — Cleanup commit (final)

> Single commit at the end of Phase 2 once every screen is on V2 + real API. Verify nothing imports each target before deletion.

- [x] 3.1 **Delete `apps/mobile/src/services/api.ts`** — legacy axios instance, hardcoded URL (mobile spec REQ "Removal of `apps/mobile/src/services/api.ts`"). Effort: **S**

- [x] 3.2 **Delete mock service stubs** — remove `apps/mobile/src/services/auth.ts`, `conversations.ts`, `ai.ts`. Effort: **S**

- [x] 3.3 **Delete `apps/mobile/src/mock/` directory** — verified unused by any screen post-Phase 2 (mobile spec REQ "Mocks unwired from screens"). Effort: **S**

- [x] 3.4 **Delete legacy V1 components** — remove `apps/mobile/src/components/{ui,messaging,ai,navigation}/` after grepping that no screen V2 still imports them. Depends on 2.4–2.10. Effort: **S**
  - **Preserved** — `apps/mobile/src/components/ui/Toast.tsx` is still consumed by `apps/mobile/app/_layout.tsx` (`ToastProvider`); kept as the sole survivor of `components/ui/`. All other V1 atoms (`AuraGlow`, `Avatar`, `FilterTab`, `GlassCard`, `GradientButton`, `KPICard`, `Logo`, `MeshGradient`, `Pressable`, `RoleGate`, `Skeleton`, `SunkenInput`, `TeamMemberCard`) deleted along with the entire `messaging/`, `navigation/`, and `ai/` V1 trees.
  - **Bonus cleanup** — `apps/mobile/app/(auth)/onboarding.tsx` (V1 stub, unreachable: no `router.push`/`Link` references it anywhere) was also deleted.

- [x] 3.5 **Delete WebSocket store + service** — remove `apps/mobile/src/store/useWebSocketStore.ts` and `apps/mobile/src/services/websocket.ts` (out of scope per proposal §2.2; not used by any V2 screen). Mobile spec REQ "Out-of-scope behavior" Scenario "No WebSocket connection at runtime". Effort: **S**

- [x] 3.6 **Delete `useWebSocket` hook** — remove `apps/mobile/src/hooks/useWebSocket.ts` (out of scope). Effort: **S**

- [x] 3.7 **Final smoke: `pnpm -w typecheck`** — must pass with zero TS errors (proposal §9 Success Criteria). Effort: **S**

---

## Notes

- **Per-screen commit discipline** — every Phase 2 screen lands in its own commit. Phase 3 is a single cleanup commit after Phase 2 is fully merged.
- **Manual smoke** — `sdd-verify` will run the per-screen checklist on Android dev client (login valid + invalid, cold-start session resume, inbox + filters, conversation + disabled composer, channels CRUD, AI Hub, Profile sign-out).
- **No test harness added** — out of scope per proposal §2.2; visual / integration verification is manual.
- **Open Questions (verify before / during sdd-apply)** — Channel DTO shape (task 0.13), `apiClient.auth.me()` existence (task 2.8), Skia version pin (task 0.1), Reanimated keyframe specifics (atom + tab-bar tasks).
