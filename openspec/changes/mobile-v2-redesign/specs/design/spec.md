# Delta for `design` (`@m2/design`)

> Adds the V2 design language to the canonical token package. V1 tokens stay importable; V2 lives under a dedicated subpath until the v1 → v2 cutover lands as a follow-up change.

No prior `openspec/specs/design/spec.md` exists, so every requirement below is **ADDED**.

---

## ADDED Requirements

### Requirement: V2 atmospheric color palette

`@m2/design` MUST expose a V2 color token tree covering: deep canvas background, surface ramp (glass tints), accent (indigo/violet) ramp, semantic text ramp, channel brand colors, and intent semantic colors. All values MUST match the tokens in `Motomoto Mobile.html` and `v2-atoms.jsx`.

The token tree MUST be importable as `import { colorsV2 } from '@m2/design/v2'` and SHOULD also be importable as a flat object `import { colorsV2 } from '@m2/design'`. V1 `colors` MUST remain importable from the existing entrypoint without breakage.

#### Scenario: Background and accent ramps available

- GIVEN a consumer imports `colorsV2` from `@m2/design/v2`
- WHEN it reads `colorsV2.bg.base`, `colorsV2.bg.deep`, `colorsV2.accent[100..400]`
- THEN the values equal `#0b0f1a`, `#07090f`, `#b4b5fb`, `#8b8cf7`, `#6366f1`, `#5b5cd6` respectively

#### Scenario: Text ramp available

- GIVEN `colorsV2.text` is read
- WHEN the consumer accesses `primary`, `secondary`, `muted`, `disabled`
- THEN the values equal `#f1f3fa`, `#c2c8d6`, `#8892a6`, `#5e687c`

#### Scenario: Channel brand colors are keyed by channel id

- GIVEN `colorsV2.channels` is read
- WHEN the consumer accesses `whatsapp`, `instagram`, `messenger`, `email`, `telegram`, `sms`
- THEN each entry is a single hex string matching the design bundle (`v2-atoms.jsx` `CHANNELS_V2`)
- AND the keys map 1:1 to `ChannelType` from `@m2/types`

#### Scenario: Intent colors are keyed by intent id

- GIVEN `colorsV2.intent` is read
- WHEN the consumer accesses `pricing`, `support`, `lead`, `urgent`
- THEN the values equal `#a78bfa`, `#34d399`, `#5fa8ff`, `#ef4444`

#### Scenario: V1 tokens remain importable

- GIVEN existing screens still import `colors` from `@m2/design`
- WHEN typecheck or runtime resolution runs
- THEN the V1 export resolves with the same shape it had pre-change (no removal, no rename)

### Requirement: V2 typography scale (Inter + Instrument Serif)

`@m2/design` MUST expose a V2 typography scale that pairs `Inter` (sans, body / UI) with `Instrument Serif` (italic display, editorial moments). Sizes MUST cover at minimum: `display` (38–56 px, negative letter-spacing), `title` (22–28 px), `body` (13–15 px), `caption` (11–12 px), `micro` (9–10 px, uppercase, letter-spacing 0.10em).

#### Scenario: Display token has negative tracking

- GIVEN `typographyV2.display` is read
- WHEN the consumer inspects `fontSize` and `letterSpacing`
- THEN `fontSize >= 38` and `letterSpacing` is a negative em value (e.g. `-0.04em`)

#### Scenario: Serif family is the editorial italic

- GIVEN `typographyV2.serif` is read
- WHEN the consumer inspects `fontFamily` and `fontStyle`
- THEN `fontFamily` includes `Instrument Serif` and `fontStyle === 'italic'`

#### Scenario: Sans family is Inter

- GIVEN `typographyV2.sans` is read
- WHEN inspected
- THEN `fontFamily` starts with `Inter` and falls back to system sans

### Requirement: V2 radii, shadow presets, and glass recipe

`@m2/design` MUST expose:

- `radiiV2` covering `pill` (999), `lg` (24), `md` (18), `sm` (14), `xs` (10).
- `shadowsV2` with at minimum `floating` (heavy outer + inner highlight, used by tab bar), `card` (medium ambient + accent halo), `glow.accent` (accent-tinted blur).
- `glassV2` recipe object with `tint` (rgba), `blurRadius` (px), `saturation` (%), `borderColor` (rgba), `innerHighlight` (rgba). Values MUST match the `.glass` rule in `Motomoto Mobile.html` and the floating tab bar style in `v2-atoms.jsx`.

#### Scenario: Glass recipe matches the bundle

- GIVEN `glassV2` is read
- WHEN inspected
- THEN `blurRadius >= 24`, `saturation >= 160`, `tint` rgba alpha is in `[0.40, 0.70]`, and `borderColor` is a translucent white

#### Scenario: Floating shadow has both outer and inner components

- GIVEN `shadowsV2.floating` is read
- WHEN serialized to a CSS-equivalent string (or RN `shadowOffset/shadowOpacity/shadowRadius`)
- THEN it produces both a deep outer shadow and an inner-highlight component

### Requirement: Atmosphere mood presets

`@m2/design` MUST expose `atmosphereV2`, an object keyed by mood id (`inbox`, `conversation`, `channels`, `ai`, `profile`) where each value is an array of radial-gradient halo descriptors `{ color: rgbString, size: string, position: string, opacity: number }`. Values MUST mirror the `moods` table in `v2-atoms.jsx`'s `Atmosphere`.

#### Scenario: Each mood has at least 2 halos

- GIVEN `atmosphereV2[mood]` for any mood in the keyed set
- WHEN the consumer reads it
- THEN it returns an array with at least 2 halo descriptors

#### Scenario: AI mood is the most intense

- GIVEN `atmosphereV2.ai` and `atmosphereV2.profile`
- WHEN their primary halo opacities are compared
- THEN AI's primary halo opacity is strictly greater than profile's primary halo opacity

### Requirement: V2 motion tokens (sparkle keyframes, pulse, fade-up)

`@m2/design` MUST expose `motionV2` covering durations and easings for: `sparkle` (iridescent shimmer, ~3.6s loop), `pulse` (unread badge, ~1.6s), `pulseRing` (online dot, ~2.0s), `fadeUp` (list item enter, ~360ms). Each entry MUST include `durationMs` and `easing` (cubic-bezier or named); keyframe descriptors MAY be exposed for consumers that want to replay them with Reanimated.

#### Scenario: Durations are present

- GIVEN `motionV2` is read
- WHEN the consumer reads any preset
- THEN `durationMs` is a positive number and `easing` is a non-empty string

### Requirement: V2 primitive components

`@m2/design` MUST expose three React Native primitive components consuming the V2 tokens above:

- `<Glass>` — wraps `expo-blur` `BlurView`, applies `glassV2` recipe, falls back on Android to a denser semi-opaque surface + subtle inner shadow when backdrop blur is unreliable. Props: `tint?`, `intensity?`, `style?`.
- `<Atmosphere mood intensity>` — full-screen absolute-positioned background of stacked radial halos, driven by `atmosphereV2[mood]`. Supports `intensity ∈ {'flat', 'subtle', 'rich'}` (default `rich`); `flat` renders nothing.
- `<Sparkle4 size color>` — Skia-driven 4-point sparkle/iridescent dot used in the AI hub and AI suggestion chip.

Plus typography helpers `<Display>`, `<Body>`, `<Micro>` that read `typographyV2`.

#### Scenario: Glass renders on iOS with backdrop blur

- GIVEN a `<Glass>` is mounted on an iOS device
- WHEN the screen is captured
- THEN the rendered surface shows a true backdrop blur (content behind is blurred)

#### Scenario: Glass degrades gracefully on Android

- GIVEN a `<Glass>` is mounted on an Android device where backdrop blur is unsupported or weak
- WHEN the screen is captured
- THEN the surface renders as a denser semi-opaque tint with an inner highlight, NOT a transparent box, AND the visual reads as "frosted glass" rather than a flat panel
- AND no runtime error or warning is logged

#### Scenario: Atmosphere flat intensity is a no-op

- GIVEN `<Atmosphere mood="inbox" intensity="flat" />` is mounted
- WHEN the tree is inspected
- THEN it renders nothing (returns `null`) and contributes no view to the layout

### Requirement: Skia and Instrument Serif as peer dependencies

`packages/design/package.json` MUST declare `@shopify/react-native-skia`, `react-native-svg`, and `expo-font` as `peerDependencies` (not direct deps), so consumers (`apps/mobile`, future `apps/landing`/`admin`) install them at the app level. The package MUST NOT bundle the Instrument Serif font asset; the asset is registered by the consuming app (per `apps/mobile/app/_layout.tsx`).

#### Scenario: Peer deps declared

- GIVEN `packages/design/package.json` after the change
- WHEN the file is parsed
- THEN `peerDependencies` includes `@shopify/react-native-skia`, `react-native-svg`, `expo-font`
- AND `dependencies` does not include any of those three

### Requirement: V2 exports do not collide with V1

V2 tokens and primitives MUST be reachable via the `@m2/design/v2` subpath. The root `@m2/design` entrypoint MAY re-export V2 names alongside V1, but MUST NOT shadow or rename existing V1 exports. (See Risk R10 in proposal.)

#### Scenario: Both V1 and V2 importable side by side

- GIVEN a file that imports `colors` from `@m2/design` AND `colorsV2` from `@m2/design/v2`
- WHEN typecheck runs
- THEN both imports resolve without name collision and both objects are usable
