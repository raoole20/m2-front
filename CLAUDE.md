# Motomoto (m2-front) — Claude Code Context

Monorepo for the Motomoto mobile CRM and unified messaging platform.
**Package manager:** pnpm 9.x (via Corepack) · **Task runner:** Turborepo v2 · **Stack:** Expo SDK 55 · React Native 0.83 · TypeScript strict · Expo Router v55 · Zustand v5 · New Architecture (Fabric)

---

## Monorepo Structure

```
m2-front/
├── apps/
│   └── mobile/              — @m2/mobile (Expo app)
│       ├── app/             ← Expo Router screens (thin — logic in hooks/stores)
│       ├── src/
│       │   ├── components/  ← ui/, messaging/, ai/, navigation/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── store/       ← Zustand stores
│       │   ├── mock/
│       │   └── constants.ts
│       ├── App.tsx, index.ts, app.json, eas.json
│       ├── babel.config.js, metro.config.js
│       ├── tsconfig.json    ← extends ../../tsconfig.base.json
│       └── package.json
├── packages/
│   ├── types/               — @m2/types  (shared TypeScript interfaces)
│   │   └── src/{user,channel,message,conversation,api,websocket,index}.ts
│   └── design/              — @m2/design (color/spacing/typography tokens)
│       └── src/{colors,typography,spacing,index}.ts
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── package.json             ← workspace runner
```

## Path Aliases

- **Inside `apps/mobile/`**: `@/*` → `apps/mobile/src/*` (still works for components, hooks, services, store, mock, constants).
- **Across workspace**: types and design tokens come from `@m2/types` and `@m2/design` (`workspace:*` protocol). **Never** import types/design via `@/`.

Example:

```ts
// GOOD
import { User, ROLE_HIERARCHY } from '@m2/types';
import { colors, spacing } from '@m2/design';
import { ChatInput } from '@/components/messaging/ChatInput';

// BAD — @/types and @/design no longer exist
import { User } from '@/types';
import { colors } from '@/design';
```

---

## Routing Convention — `apps/landing`

El árbol de `apps/landing/app/[locale]/` se organiza con **dos route groups de primer nivel**. Cada grupo es un contenedor organizacional; el prefijo de URL lo da un segmento normal (sin paréntesis) dentro del grupo cuando aplica.

| Grupo | Contenido | URL prefix |
|---|---|---|
| `(landing)/` | Páginas públicas de marketing (contact, y futuros about/pricing/blog). | ninguno — `/es/contact` |
| `(admin)/admin/` | Toda la app admin. El segmento `admin/` dentro del grupo da el prefijo. El `layout.tsx` vive en `admin/`. | `/admin/*` |

La home (`[locale]/page.tsx`) se queda en la raíz del locale; hereda directo del layout de i18n y no necesita el wrapper de marketing.

### Reglas para crear rutas nuevas

1. **Paréntesis = organizacional, sin paréntesis = URL.** `(admin)` no aparece en URL; `admin/` sí. Nunca uses un segmento URL solo para agrupar — usa un route group.
2. **Página pública nueva** → `app/[locale]/(landing)/<segmento>/page.tsx`.
3. **Página admin nueva** → `app/[locale]/(admin)/admin/<segmento>/page.tsx`.
4. **Nueva área de primer nivel** (ej. portal cliente) → nuevo grupo `(portal)/portal/...` siguiendo el mismo patrón grupo + segmento.
5. **Componentes no-ruta** nunca viven dentro de `app/`. Van a `apps/landing/src/components/` con esta estructura:
   - `src/components/landing/` → componentes de la landing pública (Hero, Nav, Footer, Pricing, etc.)
   - `src/components/m2/` → componentes específicos del admin (AppShell, AppIcon, AuthVisual…)
   - `src/components/` (raíz) → componentes compartidos entre áreas (`Logo`, `ToastProvider`) y providers (`AdminProviders`)
   - `components/ui/` (raíz de landing) → primitivos tipo shadcn (button, carousel) — existente
   Importa con alias: `import { Hero } from "@/src/components/landing/Hero"`.
6. **Archivos SEO/CSS raíz** (`robots.ts`, `sitemap.ts`, `globals.css`, `m2.css`, `app/layout.tsx`) viven en `app/` y no se mueven — son especiales de Next.js.

> `apps/mobile` ya usa su propia convención con route groups `(auth)` y `(app)` de Expo Router. No aplica la regla de arriba.

---

## Phases Status

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Project initialization | Done |
| 1 | TypeScript types | Done |
| 2 | Design system | Done |
| 3 | Mock data | Done |
| 4 | Service stubs | Done |
| 5 | Zustand stores | Done |
| M | Monorepo migration (pnpm + Turborepo) | Done |
| 6 | Base UI components | Done |
| 7 | Messaging components | Done |
| 8 | Navigation shell | Done |
| 9 | Screens | In progress |

---

## Phase 1 — Types (Done)

All files live in `packages/types/src/` (importable as `@m2/types`):

| File | Key exports |
|------|-------------|
| `user.ts` | `UserRole`, `UserStatus`, `User`, `AuthUser`, `ROLE_HIERARCHY` |
| `channel.ts` | `ChannelType`, `Channel` |
| `message.ts` | `Message`, `MessageStatus`, `MessageRole`, `MessageClassification`, `MessageAttachment` |
| `conversation.ts` | `Conversation`, `Contact`, `AIContext`, `ConversationStatus`, `ConversationPriority` |
| `api.ts` | `ApiResponse<T>`, `ApiError`, `PaginationParams`, `PaginatedResponse<T>` |
| `websocket.ts` | `WebSocketEvent`, `WebSocketMessage` (discriminated union), 12 payload types |
| `index.ts` | re-exports all |

---

## Non-Negotiable Rules

### TypeScript
- `strict: true` — zero errors always
- No `any` — use `unknown` + type guards
- No `!` non-null assertions — use `?.` or explicit checks
- AI fields are **always optional**: `aiContext?`, `suggestedReply?`, `classification?`
- Run `pnpm -w typecheck` before marking any phase complete (replaces the old `npx tsc --noEmit`)

### Architecture
- **Role checks** — always `hasMinRole('manager')` via `ROLE_HIERARCHY`, never `user.role === 'manager'`
- **Zustand selectors** — wrap object/array selectors with `useShallow` from `zustand/react/shallow`
- **AI calls** — only through `apps/mobile/src/services/ai.ts` (never direct from components)
- **WebSocket events** — dispatch to Zustand store actions directly, never through React Context
- **Auth tokens** — `expo-secure-store` only, never `AsyncStorage`
- **Images** — `expo-image` only, never RN's built-in `<Image>`
- **Screens are thin** — all logic lives in stores and hooks

### Styling
- No hardcoded colors, spacing, or radii — all values from `@m2/design`
- Blur/glass → `GlassCard` component (wraps `expo-blur`)
- Animations → `react-native-reanimated` v4 with `withSpring`, never `Animated` from RN
- Keyboard → `<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>`

### Mock Data
- All mock objects must satisfy interfaces exactly — no `any`, no `Partial<>`
- Names and messages in **Spanish** (Latin American)
- `MOCK_CURRENT_USER` defaults to `role: 'manager'`

### Tooling
- **Package manager is pnpm 9.x** — never `npm install` at any level
- **Workspace installs**: always run `pnpm install` from the repo root
- **Filtered commands**: `pnpm --filter @m2/mobile <cmd>` or shortcut `pnpm mobile <cmd>`
- **Typecheck**: `pnpm -w typecheck` (fans out to all three workspaces via Turbo)
- **Never commit** `node_modules/`, `.turbo/`, `.expo/`, or `pnpm-lock.yaml` outside the repo root

---

## Key Dependencies

```json
"expo": "~55.0.7"
"react-native": "0.83.2"
"expo-router": "~55.0.6"
"zustand": "^5.0.12"
"react-native-reanimated": "4.2.1"
"expo-secure-store": "~55.0.9"
"expo-image": "~55.0.6"
"expo-blur": "~55.0.10"
"axios": "^1.13.6"
"immer": "^11.1.4"
```

Node: **20.19.4** (`nvm use` reads `.nvmrc` automatically)

---

## App Config Highlights

- `scheme: "motomoto"` — deep links use `motomoto://`
- `newArchEnabled: true` — do not disable
- `typedRoutes: true` — use typed `href` props, not raw strings
- Expo Go won't work for Google Sign-In → use `expo-dev-client`
- `USE_NATIVE_GOOGLE_SIGNIN` flag in `apps/mobile/src/constants.ts` controls auth flow
