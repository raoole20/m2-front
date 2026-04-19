# Backend Followups — m2-back (raoole20/m2-back)

Audit of `feat/update-evolution-config` revealed critical gaps. File these as GitHub issues.

---

## Ticket 1 🚨 — Outbound message endpoint (BLOCKER for admin chat UI)

**Title:** Add `POST /api/conversations/:id/messages` for agent-sent replies

**Body:**
Currently there's no HTTP endpoint for a human agent to send a reply in a conversation. Outbound messages are only produced by the AI pipeline / Evolution sender inside BullMQ queues. The admin UI at `app.motomoto.app` cannot send messages without this.

**Required:**
- `POST /api/conversations/:id/messages` — body `{ content: string, attachments?: [] }`
- Auth: JwtAuthGuard + TenantGuard
- Role: ADMIN, AGENT, OWNER
- Returns: created `Message` entity
- Enqueues a `message-outbound` job that the `response-dispatcher` picks up and routes to the correct channel (Meta / Evolution / etc.)
- Idempotency via the existing `@@unique([channelId, externalId])` — accept optional `idempotencyKey` in body

**Blocks:** admin inbox MVP, mobile agent reply UX

---

## Ticket 2 🔒 — Evolution webhook URL + credentials hardening

**Title:** Env-drive Evolution callback URL + move apiKey out of querystring

**Body:**

Two issues in `api/src/modules/channels/evolution.controller.ts`:

1. **Hardcoded Docker URL**
   - Line ~67 sets webhook callback as `http://api:3000/webhooks/evolution/:channelId?token=...`
   - This only works inside the Compose network. Breaks on any prod/staging host.
   - **Fix:** read from `APP_PUBLIC_URL` env var.

2. **apiKey leaked in querystring**
   - The webhook token is appended as `?token=<apiKey>` — ends up in access logs, proxy logs, browser history.
   - **Fix:** use header `X-Webhook-Token: <apiKey>` and validate in the webhook controller.

**Priority:** security-sensitive, do before prod launch.

---

## Ticket 3 (Nice to have) — WebSocket gateway for inbox realtime

**Title:** Add NestJS WS gateway for conversation + message updates

**Body:**
Admin and mobile inbox currently poll `/api/conversations` every 5s. This is wasteful and slow. A `@WebSocketGateway` emitting:
- `conversation:created`
- `conversation:updated`
- `message:new`
- `message:updated`

...scoped per tenant via JWT would eliminate polling. Socket.IO with JWT handshake is the lightest path. See `service-analysis.md` in the backend repo for context.

**Priority:** after ticket 1 ships.

---

## Ticket 4 — File upload endpoint

**Title:** `POST /api/uploads` for outbound media (image / audio / doc)

**Body:**
No multipart endpoint exists. Needed for agents to send images/audio via WhatsApp or email. Should return a signed URL + asset id that can be referenced in `POST /messages`.

---

# Frontend Followups (in this repo)

After backend ships Ticket 1:

## TASK-NEXT-01 — Regenerate @m2/api-client schema from committed JSON

```bash
cp c:/Users/ramse/OneDrive/Documents/vacas/_m2-back-evolution/docs/m2-api-openapi.json \
   c:/Users/ramse/OneDrive/Documents/vacas/motomoto/packages/api-client/openapi.json

pnpm --filter @m2/api-client add -D openapi-typescript

# add to packages/api-client/package.json scripts:
#   "gen": "openapi-typescript openapi.json -o src/generated/schema.d.ts"

pnpm --filter @m2/api-client gen
```

Commit: `chore(api-client): regenerate schema.d.ts from evolution-config OpenAPI`

## TASK-NEXT-02 — Add resource modules to @m2/api-client

Mirror backend controllers. Create in `packages/api-client/src/resources/`:
- `channels.ts` — CRUD + `channels.evolution.{connect, qr, status, syncContacts}`
- `messages.ts` — list + get + `send()` (once ticket 1 lands)
- `tenants.ts` — get/update own tenant
- `aiContexts.ts` — CRUD
- `actions.ts` — list (audit log)

All typed via `paths` from generated schema. Export from `src/index.ts`.

## TASK-NEXT-03 — Migrate mobile services to @m2/api-client (SDD change)

Create new SDD change `mobile-api-client-migration`:
- Replace `apps/mobile/src/services/{auth,api,conversations}.ts` with calls to `@m2/api-client`
- Inject `expo-secure-store` as token adapter
- Keep `ai.ts` and `websocket.ts` stub local
- Delete old services

## TASK-NEXT-04 — Wire apps/admin to @m2/api-client

- `auth.login` in `useAuth` hook
- `conversations.list` + `.get` in inbox pages
- `messages.send()` on reply form (blocked on backend ticket 1)

---

## Critical note on the "actions" module

The backend has an `actions` module, but it's a **read-only audit log**, NOT a command bus. There is no `POST /api/actions/send-reply` or similar. Side-effects happen via:
- Webhook ingress → BullMQ → pipeline → dispatcher (automated)
- Specific verb endpoints like `POST /api/conversations/:id/close`

Do NOT design client code assuming a general "actions" facade exists.
