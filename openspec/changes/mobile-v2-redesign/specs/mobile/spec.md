# Delta for `mobile` (`apps/mobile`)

> Migrates `apps/mobile` from placeholder UI + mock services to the V2 visual language and real `m2-back` integration. Six screens (Login + 5 product screens) consume V2 atoms, atmospheric backgrounds, and the floating glass tab bar; networked screens swap mocks for `@m2/api-client`. Out of scope per proposal §2.2: WebSocket realtime, the agent-send-message composer (visually disabled).

No prior `openspec/specs/mobile/spec.md` exists, so every requirement below is **ADDED**.

---

## ADDED Requirements

### Requirement: API base URL via `EXPO_PUBLIC_API_URL`

`apps/mobile` MUST resolve the backend base URL from `process.env.EXPO_PUBLIC_API_URL` at app start. No hardcoded URL MUST remain anywhere in `apps/mobile/`. A missing or empty value MUST surface a clear, developer-visible error at first network call (not a silent `undefined` URL request). `.env.example` MUST document the LAN-IP override pattern for Android dev clients (Risk R6).

#### Scenario: URL drives api-client init

- GIVEN `EXPO_PUBLIC_API_URL=http://localhost:3000/api` is set at Metro launch
- WHEN the app boots and `apps/mobile/src/lib/api.ts` initializes `@m2/api-client`
- THEN the api-client's base URL equals `http://localhost:3000/api`

#### Scenario: No hardcoded URL remains

- GIVEN the post-change `apps/mobile/` source tree
- WHEN it is searched for the substring `http://localhost:3000` or any literal IP
- THEN zero matches are found in non-doc, non-`.env.example` files

#### Scenario: Missing env var fails loudly

- GIVEN `EXPO_PUBLIC_API_URL` is unset or empty
- WHEN the app makes its first networked call
- THEN a developer-visible error is logged or thrown identifying the missing env var by name

### Requirement: Auth integration via `@m2/api-client`

The Login screen MUST authenticate against the real `m2-back` auth endpoint via `@m2/api-client`, persist tokens through `createSecureTokenStore()` (backed by `expo-secure-store`), and gate all `(app)` routes behind a valid session. No mock auth path MUST remain wired to screens.

#### Scenario: Login with valid credentials

- GIVEN the user enters a valid email + password on Login
- WHEN they submit
- THEN the api-client calls `m2-back`'s login endpoint, the returned access + refresh tokens are persisted via the secure store, and the app navigates into `(app)` (Inbox by default)

#### Scenario: Login with invalid credentials

- GIVEN the user enters credentials the backend rejects
- WHEN they submit
- THEN the screen displays an error affordance (toast or inline message), no token is persisted, AND the user remains on `/login`

#### Scenario: Session resume on cold start

- GIVEN tokens are already persisted from a prior session
- WHEN the app cold-starts
- THEN the `_layout` reads the secure store, treats the user as authenticated, AND the app boots directly into `(app)` without showing `/login`

#### Scenario: Unauthenticated guard

- GIVEN no valid token is present in the secure store
- WHEN any `(app)/*` route is opened (deep link or programmatic nav)
- THEN the user is redirected to `/login`

#### Scenario: Sign out clears tokens

- GIVEN a logged-in session and the user taps "Sign out" in Profile
- WHEN the action runs
- THEN both access and refresh tokens are cleared from the secure store, AND the app navigates to `/login`

### Requirement: Inbox screen — V2 visuals + real conversations

The Inbox screen MUST render an editorial header (display type, optional `Instrument Serif` italic moment), a glass search field, filter chips (`All` / `Unread` / `Mine` / `AI handled`), and a list of `ConvoRow` items fed from `@m2/api-client`'s conversations resource. Each row MUST include `AvatarV2` (with channel mark), `IntentBadgeV2`, message preview, timestamp, and an unread badge when `unread > 0`. Atmosphere mood MUST be `inbox`.

#### Scenario: Inbox renders real conversations

- GIVEN the user is logged in and `m2-back` has at least one conversation
- WHEN the Inbox screen mounts
- THEN it fetches conversations via `@m2/api-client`, renders one `ConvoRow` per conversation, and shows the running unread / awaiting counts in the editorial header

#### Scenario: Empty inbox state

- GIVEN the backend returns an empty conversation list (or all filters return zero items)
- WHEN the screen finishes loading
- THEN the `InboxEmpty` component renders ("Quietness." in serif) with no list rows visible

#### Scenario: Filter chips narrow the list client-side

- GIVEN the Inbox has at least one unread and one read conversation loaded
- WHEN the user taps the `Unread` filter chip
- THEN only conversations with `unread > 0` remain visible

#### Scenario: Tap row opens Conversation

- GIVEN a `ConvoRow` is rendered with conversation `id`
- WHEN the user taps it
- THEN the app navigates to `/inbox/[id]` with the same id, AND the Conversation screen mounts with that conversation in scope

#### Scenario: Loading and error affordances

- GIVEN the conversations request is in flight
- WHEN the screen is observed
- THEN a non-blocking loading affordance is visible (skeleton or spinner)
- AND on a failed request, an error affordance with a retry path is shown — the screen does NOT crash and does NOT silently render zero rows

### Requirement: Conversation screen — V2 visuals + real messages + disabled composer

The Conversation screen MUST render a glass header (back button, `AvatarV2`, contact name, channel pill + online state), an optional AI summary card, a `TodayDivider`, and message clusters fetched from `@m2/api-client`. Atmosphere mood MUST be `conversation`. The message composer MUST be visually present (glass input + gradient send button) but **disabled with an explicit "Sending coming soon" affordance** until the backend agent-send endpoint ships (Risk R9).

#### Scenario: Messages render from backend

- GIVEN a conversation with at least one inbound message exists
- WHEN the Conversation screen mounts for that conversation id
- THEN it fetches the message list via `@m2/api-client`, groups consecutive same-sender messages into clusters, and renders each cluster with the V2 bubble styling

#### Scenario: Composer is visually disabled with explicit affordance

- GIVEN the Conversation screen is open
- WHEN the user inspects the composer
- THEN the textarea is non-editable OR the send button is non-tappable, AND a clear "Sending coming soon" label / tooltip is rendered (NOT just a greyed-out button)
- AND submitting (Enter / tap) does NOT call any send endpoint and does NOT throw

#### Scenario: Back navigation returns to Inbox

- GIVEN the Conversation screen is mounted
- WHEN the user taps the back button in the glass header
- THEN the app pops to `/inbox`

### Requirement: Channels screen — V2 visuals + full CRUD

The Channels screen MUST render an editorial header, a `ChannelTile` per connected channel (channel icon + brand halo, name, account count, status pill `LIVE`/`PAUSED`, open conversation count), and a "Connect another channel" CTA. The screen MUST perform full CRUD against `@m2/api-client`'s `channels` resource. Atmosphere mood MUST be `channels`.

#### Scenario: List channels

- GIVEN the user is logged in
- WHEN the Channels screen mounts
- THEN `channels.list()` is called and one `ChannelTile` is rendered per returned entity

#### Scenario: Connect a new channel

- GIVEN the user taps "Connect another channel" and completes the connect form for a supported channel type
- WHEN the form submits
- THEN `channels.create({...})` (and `channels.connect()` if applicable) is called, AND on success the new channel appears in the list without requiring a manual refresh

#### Scenario: Pause / resume a channel

- GIVEN a channel tile is rendered in `LIVE` status
- WHEN the user toggles its status (e.g. via tile action menu) to `paused`
- THEN `channels.update(id, { status: 'paused' })` is called AND the tile re-renders with the `PAUSED` pill

#### Scenario: Delete a channel

- GIVEN a channel tile is rendered
- WHEN the user confirms a delete action
- THEN `channels.delete(id)` is called AND the tile is removed from the list on success

### Requirement: AI Hub screen — V2 visuals (placeholder data)

The AI Hub screen MUST render the V2 layout: editorial header ("What I saw today" with serif moment), a hero insight card with iridescent glass and a hot-lead summary, a 3-column stats row (`StatCard`), and an `INSIGHTS` section with `InsightCard` items. Data MAY be placeholder per proposal §2.1 — no AI configuration / model picker / prompt editor. Atmosphere mood MUST be `ai`.

#### Scenario: Renders without AI backend

- GIVEN no AI backend is wired
- WHEN the AI Hub screen mounts
- THEN it renders all V2 sections (hero, stats, insights) with placeholder copy and does NOT make any AI-related network call

### Requirement: Profile screen — V2 visuals + current-user data

The Profile screen MUST render the V2 layout: centered `BrandmarkV2`, identity block (name + role from current auth user, optional serif "at Motomoto"), a glass stats grid ("This week"), and three `SettingSection`s (Account, Workspace, Support). The "Sign out" item MUST trigger the auth clear flow (REQ "Auth integration"). Atmosphere mood MUST be `profile`.

#### Scenario: Renders current user identity

- GIVEN the user is logged in with a known display name and role
- WHEN the Profile screen mounts
- THEN the name and role are read from the auth state (not hardcoded) and rendered in the identity block

#### Scenario: Sign out from Profile clears session

- GIVEN the Profile screen is mounted
- WHEN the user taps "Sign out"
- THEN tokens are cleared from the secure store AND the app navigates to `/login` (per the auth integration requirement)

### Requirement: Floating glass tab bar replaces nav shell

`apps/mobile/app/(app)/_layout.tsx` MUST mount a `<FloatingTabBar>` (consuming `<Glass>` from `@m2/design`) with four tabs: `Inbox`, `Channels`, `AI`, `Profile`. The active tab MUST show a conic-gradient highlight rendered by Skia and a small accent dot below the icon (per `v2-atoms.jsx`). The legacy nav shell MUST be removed. The tab bar MUST NOT be visible inside the Conversation screen (which is a stack push from Inbox).

#### Scenario: Four tabs visible by default

- GIVEN the user is on any top-level `(app)` route
- WHEN the screen is rendered
- THEN exactly four tab buttons are visible (`Inbox`, `Channels`, `AI`, `Profile`) inside a glass surface floating above the bottom of the screen

#### Scenario: Active tab indicator animates

- GIVEN the user is on `Inbox` and taps `Channels`
- WHEN the tap is processed
- THEN the active highlight transitions to the `Channels` tab and the accent dot moves accordingly (no instant snap mid-tap)

#### Scenario: Tab bar hidden inside Conversation

- GIVEN the user opens a conversation from the Inbox
- WHEN the Conversation screen is mounted
- THEN the floating tab bar is NOT rendered over it

#### Scenario: Glass renders on iOS, degrades on Android

- GIVEN the tab bar is mounted on iOS
- WHEN the screen is captured
- THEN the bar shows true backdrop blur of content behind it
- AND on Android, where backdrop blur is unsupported or weak, the bar renders with a denser semi-opaque tint per the `<Glass>` Android fallback (REQ "V2 primitive components" in the `design` delta)

### Requirement: V2 atoms in `apps/mobile/src/components/v2/`

`apps/mobile/src/components/v2/` MUST host the seven V2 atoms — `Brandmark`, `Avatar`, `ChannelPill`, `IntentBadge`, `TodayDivider`, `StatusBar`, `FloatingTabBar` — each consuming `@m2/design` V2 tokens / primitives only. No legacy V1 token MUST be referenced from V2 atoms.

#### Scenario: Avatar renders Skia conic ring + serif initials

- GIVEN `<Avatar name="Sofía Ramírez" size={44} />` is mounted
- WHEN the screen is captured
- THEN a conic-gradient ring (rendered via Skia) surrounds a radial-gradient blob whose hue is deterministic from `name`, AND the initials `SR` are drawn in `Instrument Serif` italic white over the blob

#### Scenario: Avatar palette is deterministic by name

- GIVEN two `<Avatar>` instances are mounted with the same `name` prop
- WHEN both are captured
- THEN their hue / palette is identical pixel-for-pixel (modulo anti-aliasing)

#### Scenario: ChannelPill matches channel id

- GIVEN `<ChannelPill id="whatsapp" />` is mounted
- WHEN inspected
- THEN the label is `WHATSAPP`, the icon is the WhatsApp glyph, and the pill border + tinted background use `colorsV2.channels.whatsapp`

#### Scenario: IntentBadge shows glow dot per intent

- GIVEN `<IntentBadge intent="urgent" />` is mounted
- WHEN inspected
- THEN a 5px glowing dot in `colorsV2.intent.urgent` precedes the uppercase label `URGENT`

### Requirement: Per-screen atmosphere

Each of the five product screens MUST mount `<Atmosphere mood={...}>` at z-index 0 with the mood matching the screen (`inbox`, `conversation`, `channels`, `ai`, `profile`). The Login screen MAY mount an atmosphere with the `inbox` mood at `subtle` intensity (proposal does not pin this, but consistency is acceptable).

#### Scenario: Each screen mounts its mood

- GIVEN any of the five product screens is mounted
- WHEN the rendered view tree is inspected
- THEN exactly one `<Atmosphere>` is present at the bottom of the stack, AND its `mood` prop equals the screen's id

### Requirement: Removal of `apps/mobile/src/services/api.ts` and mock service stubs

After this change lands, `apps/mobile/src/services/api.ts` (the legacy axios instance with hardcoded URL) MUST be deleted. Mock service stubs under `apps/mobile/src/services/*` that are replaced by `@m2/api-client` calls MUST also be deleted. Mock data under `apps/mobile/src/mock/` MAY remain on disk for dev fallback per proposal §2.1, but MUST NOT be imported by any screen.

#### Scenario: No legacy axios instance

- GIVEN the post-change `apps/mobile/` source tree
- WHEN searched for `apps/mobile/src/services/api.ts`
- THEN the file does not exist

#### Scenario: Mocks unwired from screens

- GIVEN the post-change `apps/mobile/` source tree
- WHEN searched for imports `from '@/mock/'` or `from '@/mock'`
- THEN no screen file under `apps/mobile/app/` matches

### Requirement: Out-of-scope behavior is NOT implemented

Per proposal §2.2, the following MUST NOT be implemented in this change:

- WebSocket realtime updates to conversations or messages.
- A working agent-send-message composer (the composer ships visually present but disabled — see "Conversation screen" requirement).
- Light mode.
- AI Hub configuration UI (model picker, prompt editor, settings).

#### Scenario: No WebSocket connection at runtime

- GIVEN the app is running post-change
- WHEN network activity is monitored
- THEN no WebSocket connection is opened to `m2-back`

#### Scenario: Composer never POSTs to a send endpoint

- GIVEN the Conversation screen is open
- WHEN any user interaction with the composer is attempted (typing, Enter, button tap)
- THEN no HTTP request is sent to a `/messages` POST or equivalent agent-send endpoint
