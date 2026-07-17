# Change-Life OS Google Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy Change-Life OS inside Google Sites with Firebase Google login, UID-isolated Google Sheets storage, an Apps Script Web App and a Cantonese usage guide.

**Architecture:** Apps Script HTML Service serves one embedded React application and uses `google.script.run` for same-app RPC. Firebase Authentication provides Google account sign-in; every RPC carries a fresh Firebase ID token that Apps Script verifies before using the verified UID to read or write normalized Sheet rows. Google Sites is the published shell and guide surface, while localStorage remains a recovery cache.

**Tech Stack:** Google Sites, Google Apps Script, Google Sheets, Firebase Authentication, React UMD, Firebase Auth compat SDK, CSS, Node test runner, clasp

## Global Constraints

- Any Google account may sign in, but users read and write only rows keyed by their verified Firebase UID.
- Google Sheets remains the operational database.
- Google Apps Script executes as the owner and exposes no data operation without token verification.
- Google Sites contains `Change-Life OS` and `使用指南` pages.
- App state version is exactly `1`.
- UI copy is Cantonese-first for Hong Kong users.
- Brand colours remain `#143C2D`, `#DA8134`, `#9A3D1A`, `#FFFFFF` and gold `#D7AE5E`.
- Profile and PIA fields are capped at 5,000 characters; titles at 300 characters.
- Each user is capped at 500 quests and 500 content items.
- The existing Cloudflare deployment remains untouched until Google acceptance succeeds.

---

### Task 1: Testable validation and state mapping core

**Files:**
- Create: `google-app/Core.js`
- Create: `tests/google-core.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `GoogleCore.validateState(state)`, `GoogleCore.toSheetRows(uid, state, now)`, `GoogleCore.fromSheetRows(rows, today)`, `GoogleCore.validateTokenUser(user)`.
- Consumes: Change-Life OS state version `1` from `app/domain.ts`.

- [ ] **Step 1: Write failing Node tests.**

```js
test("rejects ownership and enum tampering", () => {
  const state = sampleState();
  state.quests[0].type = "admin";
  assert.throws(() => core.validateState(state), /VALIDATION_ERROR/);
});

test("maps rows without trusting a client uid", () => {
  const mapped = core.toSheetRows("verified-uid", sampleState(), NOW);
  assert.equal(mapped.quests[0][1], "verified-uid");
  assert.equal(mapped.content[0][1], "verified-uid");
});
```

- [ ] **Step 2: Run the test and confirm the module is missing.**

Run: `node --test tests/google-core.test.mjs`

Expected: FAIL with `ENOENT` or missing `GoogleCore`.

- [ ] **Step 3: Implement `Core.js` as a browser/Apps-Script compatible global.**

```js
var GoogleCore = (function () {
  var QUEST_TYPES = ["main", "side", "boss"];
  var SKILLS = ["writing", "speaking", "marketing", "sales"];
  var STAGES = ["idea", "learn", "teach", "sell"];

  function assert(condition, message) {
    if (!condition) throw new Error("VALIDATION_ERROR: " + message);
  }

  function validateTokenUser(user) {
    assert(user && user.localId, "token user missing uid");
    assert(user.email && user.emailVerified === true, "verified email required");
    assert(user.disabled !== true, "user disabled");
    return { uid: user.localId, email: user.email, displayName: user.displayName || "", photoUrl: user.photoUrl || "" };
  }

  return { validateState, toSheetRows, fromSheetRows, validateTokenUser };
})();
```

- [ ] **Step 4: Run the tests and commit.**

Run: `node --test tests/google-core.test.mjs`

Expected: all Google core tests pass.

Commit: `feat: add Google state validation core`

### Task 2: Apps Script authentication and normalized Sheet repository

**Files:**
- Create: `google-app/Code.gs`
- Create: `google-app/Repository.gs`
- Create: `google-app/appsscript.json`
- Create: `google-app/.claspignore`
- Create: `tests/google-script-contract.test.mjs`

**Interfaces:**
- Consumes: `GoogleCore` and Script Properties `SPREADSHEET_ID`, `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`.
- Produces: `doGet()`, `setupDatabase()`, `bootstrap(idToken)`, `saveSnapshot(idToken, state, expectedVersion)`, `markGuideCompleted(idToken)`, `healthCheck()`.

- [ ] **Step 1: Write contract tests for headers, public methods, token verification and lock use.**

```js
test("every trusted state method verifies an id token", () => {
  assert.match(code, /function bootstrap\(idToken\)[\s\S]*verifyFirebaseToken_\(idToken\)/);
  assert.match(code, /function saveSnapshot\(idToken, state, expectedVersion\)[\s\S]*verifyFirebaseToken_\(idToken\)/);
});

test("writes are serialized", () => {
  assert.match(code, /LockService\.getScriptLock\(\)/);
  assert.match(code, /tryLock\(10000\)/);
});
```

- [ ] **Step 2: Implement Firebase token verification using Identity Toolkit.**

```js
function verifyFirebaseToken_(idToken) {
  if (!idToken || typeof idToken !== "string") throw appError_("AUTH_REQUIRED");
  var apiKey = requiredProperty_("FIREBASE_API_KEY");
  var response = UrlFetchApp.fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(apiKey),
    { method: "post", contentType: "application/json", payload: JSON.stringify({ idToken: idToken }), muteHttpExceptions: true }
  );
  if (response.getResponseCode() !== 200) throw appError_("AUTH_REQUIRED");
  var users = JSON.parse(response.getContentText()).users || [];
  return GoogleCore.validateTokenUser(users[0]);
}
```

- [ ] **Step 3: Implement seven-tab setup and UID-scoped repository functions.**

`setupDatabase()` creates `Users`, `Profiles`, `Daily`, `Quests`, `Content`, `Reset`, `Audit` with the exact headers in the approved spec. `readUserState_(uid)` filters server-side rows by verified UID. `replaceUserRows_(sheetName, uid, rows)` deletes only rows whose UID column equals the verified UID and appends mapped rows.

- [ ] **Step 4: Implement optimistic versioning and rollback.**

```js
function saveSnapshot(idToken, state, expectedVersion) {
  var user = verifyFirebaseToken_(idToken);
  GoogleCore.validateState(state);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw appError_("BUSY");
  try {
    var current = getUserVersion_(user.uid);
    if (Number(expectedVersion) !== current) return { ok: false, code: "VERSION_CONFLICT", serverVersion: current };
    return saveWithRollback_(user, state, current + 1);
  } finally {
    lock.releaseLock();
  }
}
```

- [ ] **Step 5: Run all backend tests and commit.**

Run: `node --test tests/google-core.test.mjs tests/google-script-contract.test.mjs`

Expected: all tests pass.

Commit: `feat: add authenticated Sheets repository`

### Task 3: Google-embedded frontend, login gate, guide and sync engine

**Files:**
- Create: `google-app/Index.html`
- Create: `google-app/Styles.html`
- Create: `google-app/App.html`
- Create: `tests/google-client-contract.test.mjs`

**Interfaces:**
- Consumes: server methods from Task 2 and server-injected `window.FIREBASE_CONFIG`.
- Produces: Firebase Google sign-in, five-screen OS, five-step guide, debounced cloud sync, conflict resolver, local recovery and standalone fallback.

- [ ] **Step 1: Write client contract tests.**

```js
test("login uses Firebase and cloud calls use fresh tokens", () => {
  assert.match(app, /signInWithPopup/);
  assert.match(app, /getIdToken\(true\)/);
  assert.match(app, /google\.script\.run/);
});

test("guide and sync states are present", () => {
  for (const value of ["syncing", "saved", "offline", "conflict", "error"]) assert.match(app, new RegExp(value));
  assert.match(app, /反願景/);
  assert.match(app, /3-2-1/);
});
```

- [ ] **Step 2: Build `Index.html` with HTTPS React, ReactDOM, Babel and Firebase compat scripts.**

```html
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js"></script>
```

- [ ] **Step 3: Port the current MVP screens and brand system.**

Preserve onboarding, Today, Vision, Quests, Content and Reset behaviour. Add the persistent `指南` control, account chip and sync indicator without removing JSON export.

- [ ] **Step 4: Implement the RPC wrapper and sync reducer.**

```js
async function rpc(method, ...args) {
  const token = await firebase.auth().currentUser.getIdToken(true);
  return new Promise((resolve, reject) => google.script.run
    .withSuccessHandler(resolve)
    .withFailureHandler(reject)[method](token, ...args));
}
```

Mutations save locally immediately and call `saveSnapshot` after 1.2 seconds. A version conflict opens two explicit actions: reload cloud or save local using the returned current version.

- [ ] **Step 5: Run frontend/backend tests and commit.**

Run: `node --test tests/google-*.test.mjs`

Expected: all Google migration tests pass.

Commit: `feat: build Google authenticated Change-Life OS`

### Task 4: Create Google resources and configure deployment

**Files:**
- Create: `google-app/.clasp.json` only through `clasp create` or verified project metadata.
- Modify: `google-app/appsscript.json`
- Create: `docs/google-deployment-handoff.md`

**Interfaces:**
- Consumes: connected Google account, Firebase project configuration and tested `google-app/` source.
- Produces: spreadsheet ID, Apps Script project ID, `/exec` URL and a verified Firebase Google provider.

- [ ] **Step 1: Create the Google Sheet and record its exact ID.**

Title: `Change-Life OS Database`.

- [ ] **Step 2: Create or select a Firebase project, register a Web App and enable Google sign-in.**

Record only non-secret client config locally. Never commit account tokens or private credentials.

- [ ] **Step 3: Create the Apps Script project, set Script Properties and push source.**

Run: `npx @google/clasp push`

Expected: clasp reports that every project file in `google-app/` was pushed successfully.

- [ ] **Step 4: Run `setupDatabase`, authorize owner scopes and deploy Web App.**

Deployment settings: execute as owner; access anyone. The application itself remains Firebase-gated.

- [ ] **Step 5: Verify `/exec` health and two-account data isolation, then commit non-secret deployment metadata.**

Commit: `docs: add Google deployment handoff`

### Task 5: Google Site, usage guide and production acceptance

**Files:**
- Modify: `docs/google-deployment-handoff.md`
- Modify: implementation files only for defects found during acceptance.

**Interfaces:**
- Consumes: verified Apps Script `/exec` URL.
- Produces: published Google Site URL with `Change-Life OS` and `使用指南` pages.

- [ ] **Step 1: Create the Google Site and embed the `/exec` Web App.**

Use full available width, at least 900 pixels height and no duplicate Google Site navigation inside the embedded app.

- [ ] **Step 2: Create the native `使用指南` page.**

Include login, onboarding, daily priority, deep work, content flywheel, evening review, sync states, JSON backup and mobile popup fallback.

- [ ] **Step 3: Publish privately for acceptance, test desktop/mobile and then publish at the approved access level.**

- [ ] **Step 4: Run the twelve approved acceptance checks.**

Expected: Account B cannot see Account A rows; stale versions show a conflict; mobile has no horizontal overflow; standalone fallback signs in.

- [ ] **Step 5: Run final local tests, update handoff and commit.**

Run: `npm test && node --test tests/google-*.test.mjs`

Expected: existing Change-Life OS tests and all Google migration tests pass.

Commit: `docs: complete Google Site production handoff`
