# Tomoh / omkooora API — Developer Guide

The backend is a single **GraphQL** API (Apollo Server 3 + Express). One endpoint
serves every operation; there are no REST routes for data.

- **Production endpoint:** `https://api.omkooora.com/graphql`
- **Uploads/images host:** `https://api.omkooora.com/images/<filename>`
- **Health check:** `GET https://api.omkooora.com/health` → `{ "status": "ok" }`

The complete, machine-readable contract is in **[`schema.graphql`](./schema.graphql)**
(regenerate with `npm run schema:export` in `omkoora-backend--main`). Fields
annotated `@auth(requires: …)` require a token; fields without it are public.

---

## 1. Exploring the schema

- **The SDL file** [`schema.graphql`](./schema.graphql) is the source of truth —
  feed it to GraphQL Codegen to generate typed clients.
- **Interactive Playground / introspection** is available when the server runs
  with `GRAPHQL_TOOLS=true` (on by default in non-production). Point a dev build
  there and open `…/graphql` in a browser to browse every type and run queries.
  It is **disabled in production** for security, so develop against a dev/staging
  instance or the exported SDL.

---

## 2. Authentication

### 2.1 Log in → get a token

```graphql
mutation Login($content: loginInfo) {
  authenticateUser(content: $content) {
    token          # short-lived access token (JWT)
    user { id role person { id first_name } }
  }
}
```
Variables: `{ "content": { "email": "…", "password": "…" } }`

### 2.2 Send the token on every request

Attach these HTTP headers to each request to `/graphql`:

| Header | Value | Why |
| --- | --- | --- |
| `Authorization` | the `token` from login (raw, or `Bearer <token>`) | identifies the user |
| `apollo-require-preflight` | `true` | **required** — CSRF prevention rejects requests without it |
| `x-apollo-operation-name` | the operation name | CSRF/preflight |

Also send requests with **credentials included** (cookies) — the refresh token
lives in an httpOnly cookie.

Example (`fetch`):
```js
await fetch("https://api.omkooora.com/graphql", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    "Authorization": accessToken,
    "apollo-require-preflight": "true",
    "x-apollo-operation-name": "MyQuery",
  },
  body: JSON.stringify({ query, variables }),
});
```

### 2.3 Refresh & log out

The access token is short-lived. When a request fails with
`extensions.code === "UNAUTHENTICATED"`, get a new one:

```graphql
query { refreshToken { token } }   # reads the httpOnly refresh cookie
mutation { logOut { status } }     # clears the session
```

### 2.4 Per-app model (important for a NEW app)

Tokens are **audience-bound to the frontend origin** and each app reads **its own**
refresh cookie. Before a new app can authenticate against production, its web
origin must be registered server-side (CORS allow-list + the per-app origin→key
map in `src/Config/runtime.mjs`). Ask the backend maintainer to add your origin;
until then, requests from an unknown origin are rejected by CORS.

> Native mobile apps (no browser Origin) still work with the `Authorization`
> header; the cookie-based refresh is browser-only, so store/refresh the token
> per your platform.

---

## 3. Conventions

- **Public vs protected:** a field with `@auth(requires: user)` needs a valid
  token; a field without it (many read-only `*External` / `participating*` /
  print-facing queries) is public.
- **File uploads** use the GraphQL multipart spec (`Upload` scalar). Use an
  upload-capable client (e.g. `apollo-upload-client`) and keep the
  `apollo-require-preflight: true` header. Max 10 MB / 10 files per request.
- **Images:** fields return a stored filename; build the URL as
  `https://api.omkooora.com/images/<filename>`.
- **Dates:** fields tagged `@date(format: …)` are returned as formatted strings
  in that format (not ISO).
- **Errors:** client-safe errors carry an explicit `extensions.code`
  (`UNAUTHENTICATED`, `VALIDATION`, or app codes like `CARD_NUMBER_ALREADY_EXISTS`,
  `ATTACHMENT_UPLOAD_FAILED`). Anything else is masked as a generic
  `INTERNAL_SERVER_ERROR` — check the code, not the message text.
- **Mutations that change state** return `statusUpdate`/`statusDelete`
  (`{ status: Boolean }`).

---

## 4. Operation catalog (by domain)

A curated map of the main entry points — see `schema.graphql` for the full list,
arguments, and return types.

| Domain | Key queries | Key mutations |
| --- | --- | --- |
| Auth / users | `refreshToken`, `printToken`, `currentUser`, `user`, `allUser` | `authenticateUser`, `logOut`, `createUser`, `updateUser`, `activeUser`, `forgetPassword`, `changePassword` |
| Players | `player`, `allPlayers`, `allPlayersClub`, `allPlayersClubLoaned` | `createPlayer`/`addPlayer`, `updatePlayer`, `freePlayer`, `addAttachmentPlayer`, `deleteAttachmentPlayer` |
| Members / staff | `allMembers`, `allTechnicalApparatus`, `technicalApparatus` | `createMember`, `changeMemberClassification`, `createTechnicalApparatus`, `addAttachmentTechnical`, `deleteAttachmentTechnical` |
| Teams / clubs | `allTeam`, `allTeams`, `allClub` | `createTeamWithAdmin`, `resetTeamPassword` |
| Transfers / loans | `allTransferTeam`, `allTransferClub` | `createTransfer`, `updateTransfer` (accept/reject), `updateLoan`, `BackToOldTeamTransfer` |
| Leagues / competitions | `allLeaguesExternal`, `participatingTeamsByLeague`, `participatingPlayersByLeague`, `getMatch`, `getAllMatchesGroupedByType`, `yellowCardAlerts`, `matchLineup`, `teamRoster`, `calculatePoints`, `calculateGoalPlayer` | `createParticipatingPlayers`, `updateParticipatingPlayersMatch`, `accepteParticipatingTeams`, `rejecteParticipatingTeams`, `deleteParticipatingTeams`, `createMatchCard`, `updateMatchState` |
| Notifications | `allNotificationTeam`, `allNotificationClub` | `markNotificationsAsRead` |
| Sanctions / events | `allSanctions`, `allSanctionsTeam`, `allEvents`, `event` | `createSanction`, `updateSanction`, `createEvent`, `updateEvent` |

Real-time notifications are delivered over **Socket.IO** (same host); connect
after auth and listen for the `newNotification` event.

---

## 5. Quick start checklist for an app developer

1. Get the web origin registered (CORS) — or use header auth for a native app.
2. `authenticateUser` → store the `token`.
3. Send `Authorization` + `apollo-require-preflight: true` on every request,
   with credentials included.
4. On `UNAUTHENTICATED`, call `refreshToken` and retry.
5. Generate types from `schema.graphql`; treat `@auth` fields as login-required.
