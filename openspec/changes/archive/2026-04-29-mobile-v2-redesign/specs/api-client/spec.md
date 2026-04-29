# Delta for `api-client` (`@m2/api-client`)

> Adds an Expo-flavored secure token store factory and a complete `channels` resource. Existing `createBrowserTokenStore` and the generic `TokenStore` interface remain unchanged.

No prior `openspec/specs/api-client/spec.md` exists, so every requirement below is **ADDED**.

---

## ADDED Requirements

### Requirement: `createSecureTokenStore()` factory

`@m2/api-client` MUST export a factory `createSecureTokenStore()` that returns a value satisfying the existing `TokenStore` interface, backed by `expo-secure-store`. The factory MUST live behind a subpath import (`@m2/api-client/expo`) so that web consumers do NOT pull `expo-secure-store` into their bundle. (See Risk R7 in proposal.)

The returned store MUST implement the same operations the generic `TokenStore` interface defines (at minimum: `getAccessToken`, `setAccessToken`, `getRefreshToken`, `setRefreshToken`, `clear`). Each operation MUST be `async` and MUST resolve to the same shapes as `createBrowserTokenStore`.

#### Scenario: Persist and retrieve access token

- GIVEN a fresh `createSecureTokenStore()` instance on an Expo device
- WHEN `setAccessToken('abc123')` is awaited and then `getAccessToken()` is awaited
- THEN the second call resolves to `'abc123'`

#### Scenario: Tokens survive app restart

- GIVEN tokens were written via `setAccessToken` / `setRefreshToken` in a previous session
- WHEN the app cold-starts and a new `createSecureTokenStore()` instance reads `getAccessToken()` / `getRefreshToken()`
- THEN both calls resolve to the previously-written values

#### Scenario: `clear()` wipes both tokens

- GIVEN a store with both access and refresh tokens set
- WHEN `clear()` is awaited
- THEN subsequent `getAccessToken()` and `getRefreshToken()` resolve to `null`

#### Scenario: Subpath import isolates Expo dep

- GIVEN a web consumer imports only from `@m2/api-client` (root entry, NOT `/expo`)
- WHEN the bundle is built
- THEN `expo-secure-store` does NOT appear in the bundle graph

### Requirement: `createBrowserTokenStore()` remains unchanged

The existing `createBrowserTokenStore` export MUST remain importable from `@m2/api-client` with the same signature and runtime behavior it had prior to this change. No rename, no breaking shape change.

#### Scenario: Browser store still works

- GIVEN a web consumer imports `createBrowserTokenStore` from `@m2/api-client` post-change
- WHEN the consumer instantiates and uses the store
- THEN behavior is identical to pre-change (tokens persisted in browser storage)

### Requirement: `channels` resource module

`@m2/api-client` MUST expose a `channels` resource with at minimum these methods, each calling the corresponding `m2-back` endpoint under `/channels`:

| Method | HTTP | Path | Returns |
|---|---|---|---|
| `list()` | GET | `/channels` | `Channel[]` |
| `get(id)` | GET | `/channels/:id` | `Channel` |
| `create(payload)` | POST | `/channels` | `Channel` |
| `update(id, payload)` | PATCH | `/channels/:id` | `Channel` |
| `delete(id)` | DELETE | `/channels/:id` | `void` |
| `connect(id, payload)` | POST | `/channels/:id/connect` | `Channel` (with credential metadata applied) |

`Channel` and the create/update/connect payload types MUST be defined in or sourced from `@m2/types` (manual mirror of m2-back DTOs is acceptable per Risk R8). The resource MUST attach the access token from the configured `TokenStore` to every request.

#### Scenario: List channels

- GIVEN the api-client is initialized with a base URL pointing at `m2-back` and a logged-in token store
- WHEN `channels.list()` is awaited
- THEN the result is an array of `Channel` whose shape matches `@m2/types`'s `Channel` interface
- AND the request carries an `Authorization: Bearer <token>` header

#### Scenario: Create then read back

- GIVEN no channel of a given name exists
- WHEN `channels.create({ type: 'whatsapp', ... })` is awaited and then `channels.list()` is awaited
- THEN the created channel appears in the list result with a server-assigned `id`

#### Scenario: Update returns the patched entity

- GIVEN a channel with `id` exists and is in `connected` status
- WHEN `channels.update(id, { status: 'paused' })` is awaited
- THEN the returned entity has `id === id` and `status === 'paused'`

#### Scenario: Delete is idempotent in the type system

- GIVEN a channel with `id` exists
- WHEN `channels.delete(id)` is awaited
- THEN the promise resolves with no payload, AND a subsequent `channels.get(id)` rejects with a 404-shaped error

#### Scenario: Auth required

- GIVEN the configured token store has no access token
- WHEN any `channels.*` method is invoked
- THEN the promise rejects with an authentication error (401-shaped) before or after the network call, AND the error is distinguishable from a network failure

### Requirement: Resource and store re-exports

`@m2/api-client`'s root `index.ts` MUST re-export the `channels` resource and the existing browser store. The root entry MUST NOT export `createSecureTokenStore` directly; that name is reachable only via `@m2/api-client/expo` (per Risk R7 mitigation).

#### Scenario: Root entry shape

- GIVEN a consumer imports `* as ApiClient from '@m2/api-client'`
- WHEN the consumer inspects the namespace
- THEN it has `channels` and `createBrowserTokenStore` (plus pre-existing exports)
- AND it does NOT have `createSecureTokenStore`

#### Scenario: Expo subpath shape

- GIVEN a consumer imports `* as ApiClientExpo from '@m2/api-client/expo'`
- WHEN the consumer inspects the namespace
- THEN it has `createSecureTokenStore`

### Requirement: `expo-secure-store` declared as peer dep

`packages/api-client/package.json` MUST declare `expo-secure-store` as a `peerDependency`, NOT as a direct dependency. Web consumers MUST be able to install `@m2/api-client` without pulling `expo-secure-store` into their dependency graph.

#### Scenario: Peer dep declared

- GIVEN `packages/api-client/package.json` after the change
- WHEN parsed
- THEN `peerDependencies` includes `expo-secure-store`
- AND `dependencies` does NOT include `expo-secure-store`
