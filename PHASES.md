# Motomoto — Implementation Phases

Each phase should be done in a **separate Claude chat** to keep context focused.
At the end of each chat, Claude will give you the prompt to paste into the next one.

---

## Phase 0 — Project Initialization ✅ DONE
**Goal:** Expo project running, all deps installed, configs locked in.

What was done:
- Created Expo SDK 55 project with blank-typescript template
- Node.js set to 20.19.4 via nvm (`.nvmrc` file added)
- Installed all dependencies (see `package.json`)
- Configured `babel.config.js` with `module-resolver` + `reanimated/plugin` (last)
- Configured `tsconfig.json` with `strict: true` + `@/*` path alias
- Configured `app.json` with `scheme: "motomoto"`, `newArchEnabled: true`, dark UI, plugins
- Created full `src/` and `app/` directory structure

---

## Phase 1 — TypeScript Types
**Goal:** All type definitions that the rest of the codebase depends on.

Files to create:
- `src/types/user.ts` — UserRole, UserStatus, User, AuthUser, ROLE_HIERARCHY
- `src/types/channel.ts` — ChannelType, Channel
- `src/types/message.ts` — Message, MessageStatus, MessageRole, MessageClassification, MessageAttachment
- `src/types/conversation.ts` — Conversation, Contact, AIContext, ConversationStatus, ConversationPriority
- `src/types/api.ts` — ApiResponse<T>, ApiError, PaginationParams
- `src/types/websocket.ts` — WebSocketEvent, WebSocketMessage (discriminated union), all payload types
- `src/types/index.ts` — re-exports all

---

## Phase 2 — Design System
**Goal:** All visual tokens used by every component.

Files to create:
- `src/design/colors.ts` — backgrounds, glass tokens, accents, channel colors, status, text, separators
- `src/design/typography.ts` — full iOS HIG type scale + fontFamily platform select
- `src/design/spacing.ts` — spacing scale + borderRadius + shadows
- `src/design/index.ts` — re-exports all

---

## Phase 3 — Mock Data
**Goal:** Typed realistic mock data for development (Spanish names, all channels).

Files to create:
- `src/mock/users.ts` — 3 users (agent, manager, admin) + MOCK_CURRENT_USER = manager
- `src/mock/conversations.ts` — 5 conversations (one per channel), 2+ with unread, one with aiContext
- `src/mock/messages.ts` — messages per conversation, at least one with suggestedReply per conversation
- `src/mock/index.ts` — re-exports all

---

## Phase 4 — Service Stubs
**Goal:** Typed API + service layer (all stubs, no real calls).

Files to create:
- `src/services/api.ts` — Axios instance, interceptors, error normalization
- `src/services/auth.ts` — signInWithGoogle (feature-flagged), signOut, refreshToken
- `src/services/conversations.ts` — getConversations, getMessages, sendMessage stubs
- `src/services/ai.ts` — getSuggestion, summarizeConversation, classifyMessage, getChatbotStatus stubs
- `src/services/websocket.ts` — WebSocketService class with connect/disconnect/onEvent stubs
- `src/constants.ts` — USE_NATIVE_GOOGLE_SIGNIN flag

---

## Phase 5 — Zustand Stores
**Goal:** Global state management for auth + inbox + websocket.

Files to create:
- `src/store/useAuthStore.ts` — user, isAuthenticated, hasMinRole, expo-secure-store persistence
- `src/store/useInboxStore.ts` — conversations, messages, filters, lastSyncTimestamp, appendMessage
- `src/store/useWebSocketStore.ts` — connection status only
- `src/hooks/useRole.ts` — convenience hook wrapping hasMinRole
- `src/hooks/useWebSocket.ts` — exposes WS connection status

---

## Phase 6 — Base UI Components
**Goal:** Primitive components used by all other components.

Files to create:
- `src/components/ui/GlassCard.tsx` — BlurView + glass tokens, Android fallback
- `src/components/ui/Avatar.tsx` — image + initials fallback + online status dot
- `src/components/ui/RoleGate.tsx` — renders children only if hasMinRole passes
- `src/components/ui/Pressable.tsx` — Reanimated spring scale on press

---

## Phase 7 — Messaging Components
**Goal:** All components specific to the chat/inbox experience.

Files to create:
- `src/components/messaging/ChannelBadge.tsx` — colored icon per ChannelType
- `src/components/messaging/ConversationCard.tsx` — full inbox list item
- `src/components/messaging/MessageBubble.tsx` — inbound/outbound variants
- `src/components/messaging/ChatInput.tsx` — text + send + attachment + onAISuggestion prop
- `src/components/ai/AISuggestionPill.tsx` — tappable chip that pre-fills ChatInput

---

## Phase 8 — Navigation Shell
**Goal:** Expo Router layouts, custom TabBar, auth redirect.

Files to create:
- `app/_layout.tsx` — root layout, safe area, fonts, auth gate
- `app/(auth)/_layout.tsx` — auth Stack with declarative Expo Router v55 API
- `app/(app)/_layout.tsx` — main Tabs with custom TabBar, role-conditional tabs
- `src/components/navigation/TabBar.tsx` — BlurView background, spring icon animation

---

## Phase 9 — Screens
**Goal:** All screens wired up with mock data.

Build order within this phase:
1. `app/(auth)/login.tsx` — Google Sign-In, Apple slot (hidden), Apple Music dark style
2. `app/(app)/inbox/index.tsx` — conversation list with filter bar
3. `app/(app)/inbox/[id].tsx` — chat view with KeyboardAvoidingView + AISuggestionPill
4. `app/(app)/inbox/[id]/client.tsx` — client profile slide-in sheet
5. `app/(app)/home/index.tsx` — dashboard metrics
6. `app/(app)/profile/index.tsx` — user profile + sign out
7. `app/(app)/ai/index.tsx` + sub-screens — AI Center hub + 4 sub-screens (stubs)
8. `app/(app)/team/index.tsx` — agent list (Manager+)
9. `app/(app)/reports/index.tsx` — metrics shell (Manager+)
10. `app/(app)/settings/index.tsx` — settings (Admin only)
11. `app/(auth)/onboarding.tsx` — name + avatar stub

[] TODO: estudiar sobre mono repos
[] TODO: crear tenant -> se crea automatico al crear un nuuevo usuario  
    [] TODO: evaluar si es en el wizard
[] TODO: crear chanel -> ws - instagram - tg
[] TODO: enlazar con API  (evolution - meta)
[] TODO: Obtener QR
[] TODO: probar que se conecte desde el tlfn
[] TODO: contexto de AI (como responde)



------
MEJORAR
[] TODO: wizzard debe contener info del tenant (nombre, razon social, etc...)
[] TODO: crear el canal tl - instagram - etc...
[] TODO: IA contexto (cerebro)
