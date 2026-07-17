# Change-Life OS Google Stack Design

## 1. Outcome

Move Change-Life OS from device-only storage to a Google-hosted, multi-user MVP where:

- Any user can sign in with a Google account.
- Every user can read and change only records attached to their verified Firebase UID.
- Google Sheets remains the operational database.
- Google Apps Script serves the application and performs all trusted reads and writes.
- Google Sites is the user-facing entry point and contains a dedicated usage guide.
- The existing Cloudflare version remains available until the Google version passes acceptance checks.

## 2. Architecture

### Google Sites

The published Google Site contains two pages:

1. **Change-Life OS** — embeds the deployed Apps Script Web App URL at full available width and at least 900 pixels high.
2. **使用指南** — native Google Sites content covering first login, onboarding, the five app modules, sync states, backup, mobile login and troubleshooting.

The Site may be publicly reachable because the embedded application enforces its own Firebase authentication. No personal state is rendered before authentication succeeds.

### Apps Script Web App

The Web App is deployed to execute as the owner and is accessible without Apps Script account authorization. Its responsibilities are:

- Serve `Index.html` through HTML Service with framing allowed for Google Sites.
- Expose only `google.script.run` server functions to the served client.
- Verify every Firebase ID token before any data operation.
- Use the verified Firebase UID as the only ownership key.
- Validate all state payloads.
- Read and write the backing Google Sheet with script-owner permissions.
- Serialize concurrent writes with `LockService`.

The web app never accepts a client-provided UID or email as proof of identity.

### Firebase Authentication

- Google is the only enabled sign-in provider.
- The client uses Firebase Authentication for `signInWithPopup`.
- On successful sign-in, the client retrieves a fresh Firebase ID token.
- The token is passed as an argument to every Apps Script data call.
- Apps Script verifies the token by calling Firebase Identity Toolkit `accounts:lookup` with the Firebase Web API key stored in Script Properties.
- A response is accepted only when it contains one enabled user with a non-empty `localId` and a verified email.
- Expired, disabled, malformed or unverifiable tokens fail closed and return `AUTH_REQUIRED`.
- The verified `localId` becomes `uid`; the verified email, name and photo URL are profile metadata only.

## 3. Google Sheets data model

The database spreadsheet contains seven tabs. Header names are fixed.

### `Users`

| Column | Field | Purpose |
|---|---|---|
| A | `uid` | Verified Firebase UID; primary key |
| B | `email` | Verified Google email |
| C | `displayName` | Display name from Firebase |
| D | `photoUrl` | Profile image URL |
| E | `guideCompleted` | `TRUE` after guide completion |
| F | `createdAt` | ISO timestamp |
| G | `lastLoginAt` | ISO timestamp |
| H | `stateVersion` | Latest accepted state version |

### `Profiles`

| Column | Field |
|---|---|
| A | `uid` |
| B | `antiVision` |
| C | `vision` |
| D | `niche` |
| E | `ninetyDayOutcome` |
| F | `bossFight` |
| G | `onboarded` |
| H | `updatedAt` |

### `Daily`

| Column | Field |
|---|---|
| A | `uid` |
| B | `date` |
| C | `priorityText` |
| D | `priorityCompleted` |
| E | `mind` |
| F | `body` |
| G | `spirit` |
| H | `vocation` |
| I | `win1` |
| J | `win2` |
| K | `win3` |
| L | `lesson1` |
| M | `lesson2` |
| N | `intention` |
| O | `timerDurationSeconds` |
| P | `timerRemainingSeconds` |
| Q | `timerRunningSince` |
| R | `updatedAt` |

The compound key is `uid + date`.

### `Quests`

| Column | Field |
|---|---|
| A | `id` |
| B | `uid` |
| C | `title` |
| D | `type` |
| E | `skill` |
| F | `completed` |
| G | `dueDate` |
| H | `createdAt` |
| I | `updatedAt` |

The primary key is `id`; reads and writes must additionally match `uid`.

### `Content`

| Column | Field |
|---|---|
| A | `id` |
| B | `uid` |
| C | `title` |
| D | `stage` |
| E | `pain` |
| F | `insight` |
| G | `action` |
| H | `updatedAt` |

### `Reset`

| Column | Field |
|---|---|
| A | `uid` |
| B | `startDate` |
| C | `commitmentsJson` |
| D | `completedDaysJson` |
| E | `resetStepsJson` |
| F | `updatedAt` |

### `Audit`

| Column | Field |
|---|---|
| A | `timestamp` |
| B | `uid` |
| C | `action` |
| D | `entityType` |
| E | `entityId` |
| F | `stateVersion` |
| G | `status` |

Audit never stores ID tokens, full state JSON or content field values.

## 4. Trusted server interface

The Apps Script client calls these functions through `google.script.run`:

### `bootstrap(idToken)`

Verifies the user, upserts `Users`, loads all rows matching the verified UID and returns:

```json
{
  "ok": true,
  "user": { "uid": "...", "email": "...", "displayName": "...", "photoUrl": "..." },
  "state": {},
  "serverVersion": 3,
  "serverTime": "2026-07-17T12:00:00.000Z"
}
```

### `saveSnapshot(idToken, state, expectedVersion)`

Verifies the user and state, obtains a script lock, rejects stale versions, then upserts the user's profile and daily record and replaces only that user's quest/content/reset rows.

Success:

```json
{ "ok": true, "serverVersion": 4, "savedAt": "2026-07-17T12:01:00.000Z" }
```

Conflict:

```json
{ "ok": false, "code": "VERSION_CONFLICT", "serverVersion": 4 }
```

### `markGuideCompleted(idToken)`

Verifies the user and sets `Users.guideCompleted` to `TRUE`.

### `healthCheck()`

Returns deployment version and current server time. It does not expose configuration or user data.

## 5. Client behaviour

### Authentication gate

- Logged-out users see the product promise, privacy statement and one `使用 Google 登入` button.
- The dashboard is not mounted until Firebase authentication succeeds and `bootstrap` returns user state.
- Sign-out clears in-memory state and cached ID tokens but preserves an encrypted-free local recovery snapshot on that device.
- If the embedded popup is blocked, the screen presents a clearly labelled standalone Web App link that opens in a new tab.

### Usage guide

The app adds a persistent `指南` control and a five-step guide:

1. Define the anti-vision and 90-day outcome.
2. Pick one daily priority.
3. Use the deep-work timer.
4. Turn experience into Learn–Teach–Sell content.
5. Complete the 3-2-1 evening review.

The guide is user-openable after completion. Completing or skipping it does not block normal use.

### Sync

- Mutations update React state immediately.
- The client debounces cloud saves for 1.2 seconds.
- Sync states are `syncing`, `saved`, `offline`, `conflict` and `error`.
- A successful save updates the local recovery snapshot and server version.
- Network or Apps Script failure keeps the local recovery snapshot and retries on the next mutation or explicit retry.
- `VERSION_CONFLICT` never silently overwrites either side. The user chooses `使用雲端版本` or `以本機版本覆蓋`.
- An explicit JSON export remains available.

## 6. Validation and limits

- State version must equal `1` for this MVP.
- Text lengths are capped server-side: profile fields 5,000 characters, quest/content titles 300 characters and PIA fields 5,000 characters.
- A user may hold at most 500 quests and 500 content items in this version.
- Quest type and skill values are allowlisted.
- Content stage values are allowlisted.
- Dates must be `YYYY-MM-DD`; timestamps must parse as ISO dates.
- Spreadsheet IDs and Firebase server configuration live only in Script Properties.
- Firebase's client configuration is public by design; security depends on token verification, not API-key secrecy.
- Google Sheets is suitable for this low-volume MVP, not high-frequency realtime collaboration, regulated sensitive data or complex role hierarchies.

## 7. Error handling

- Authentication errors show a Cantonese re-login prompt.
- Missing Sheet tabs are initialized by an owner-only setup function before deployment.
- Lock timeout returns `BUSY`; the client retries with bounded backoff.
- Invalid data returns `VALIDATION_ERROR` without any write.
- Before changing any tab, the server captures that user's affected rows in memory. If a later tab write fails, the server restores those captured rows under the same script lock and records the failed save in `Audit`. A rollback failure returns `ROLLBACK_FAILED` and blocks further automatic retries until the user reloads.
- The interface never claims a save succeeded until the server returns the new version.

## 8. Deployment sequence

1. Create or select a Firebase project.
2. Register a Firebase Web App and enable Google as the only Auth provider.
3. Create the database spreadsheet and seven tabs.
4. Create an Apps Script project, set Script Properties and initialize headers.
5. Deploy the Apps Script Web App as owner with public access; Firebase remains the application authentication layer.
6. Add the actual Apps Script iframe hostname to Firebase Authorized Domains when Firebase requires it.
7. Test sign-in and private record isolation with two different Google accounts.
8. Create the Google Site with `Change-Life OS` and `使用指南` pages.
9. Embed the Apps Script `/exec` URL, publish the Site and test desktop/mobile.
10. Keep the Cloudflare version unchanged until all acceptance checks pass.

The account owner may need to complete first-time Google/Firebase authorization prompts. Codex does not bypass account verification, consent or CAPTCHA.

## 9. Acceptance checks

1. Account A signs in, completes onboarding and creates data.
2. Reloading Account A restores the same server-backed data.
3. Account B signs in and cannot see or mutate Account A data.
4. A tampered client-provided UID does not alter server ownership.
5. An invalid, expired or missing token cannot load or save data.
6. A stale `expectedVersion` produces a visible conflict instead of silent overwrite.
7. The five-step guide can be completed, skipped and reopened.
8. Offline edits remain locally recoverable and sync after reconnection.
9. Google Site embed works at desktop width and 390-pixel mobile width without horizontal overflow.
10. The standalone Web App fallback works when embedded sign-in is blocked.
11. JSON export still works.
12. The published Google Site URL and Apps Script `/exec` URL both return the current version.

## 10. Completion boundary

The Google migration is complete only when the application code, Apps Script backend, Sheet schema and Google Site are deployed, the published URLs work, and the twelve acceptance checks pass or any account-owner-only authorization step is explicitly handed off with exact instructions.
