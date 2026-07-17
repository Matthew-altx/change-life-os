var APP_VERSION = "1.0.0-google";

function doGet() {
  var template = HtmlService.createTemplateFromFile("Index");
  template.firebaseConfigJson = JSON.stringify({
    apiKey: requiredProperty_("FIREBASE_API_KEY"),
    authDomain: requiredProperty_("FIREBASE_AUTH_DOMAIN"),
    projectId: requiredProperty_("FIREBASE_PROJECT_ID"),
    appId: requiredProperty_("FIREBASE_APP_ID"),
  }).replace(/</g, "\\u003c");
  return template.evaluate()
    .setTitle("Change-Life OS")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function setupDatabase() {
  ensureSchema_();
  return { ok: true, tabs: Object.keys(DB_SCHEMA), version: APP_VERSION };
}

function bootstrap(idToken) {
  var user = verifyFirebaseToken_(idToken);
  ensureSchema_();
  var version = getUserVersion_(user.uid);
  upsertUser_(user, version);
  var userRow = getUserRow_(user.uid);
  var today = Utilities.formatDate(new Date(), "Asia/Hong_Kong", "yyyy-MM-dd");
  return {
    ok: true,
    user: user,
    guideCompleted: userRow ? userRow[4] === true : false,
    state: GoogleCore.fromSheetRows(readUserData_(user.uid), today),
    serverVersion: version,
    serverTime: new Date().toISOString(),
  };
}

function saveSnapshot(idToken, state, expectedVersion) {
  var user = verifyFirebaseToken_(idToken);
  GoogleCore.validateState(state);
  ensureSchema_();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw appError_("BUSY", "系統繁忙，請稍後重試");
  try {
    var current = getUserVersion_(user.uid);
    if (Number(expectedVersion) !== current) {
      return { ok: false, code: "VERSION_CONFLICT", serverVersion: current };
    }
    return saveWithRollback_(user, state, current + 1);
  } finally {
    lock.releaseLock();
  }
}

function markGuideCompleted(idToken) {
  var user = verifyFirebaseToken_(idToken);
  ensureSchema_();
  setGuideCompleted_(user.uid);
  appendAudit_(user.uid, "guide_completed", "user", user.uid, getUserVersion_(user.uid), "success");
  return { ok: true };
}

function healthCheck() {
  return { ok: true, version: APP_VERSION, serverTime: new Date().toISOString() };
}

function verifyFirebaseToken_(idToken) {
  if (!idToken || typeof idToken !== "string") throw appError_("AUTH_REQUIRED", "請重新登入");
  var apiKey = requiredProperty_("FIREBASE_API_KEY");
  var response = UrlFetchApp.fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(apiKey),
    {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({ idToken: idToken }),
      muteHttpExceptions: true,
    }
  );
  if (response.getResponseCode() !== 200) throw appError_("AUTH_REQUIRED", "登入已過期，請重新登入");
  var payload = JSON.parse(response.getContentText());
  var users = payload.users || [];
  if (!users.length) throw appError_("AUTH_REQUIRED", "無法驗證登入身份");
  try {
    return GoogleCore.validateTokenUser(users[0]);
  } catch (error) {
    throw appError_("AUTH_REQUIRED", "Google 帳戶未完成驗證或已停用");
  }
}

function requiredProperty_(name) {
  var value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value) throw appError_("CONFIG_REQUIRED", "缺少系統設定：" + name);
  return value;
}

function appError_(code, message) {
  var error = new Error(code + ": " + (message || code));
  error.code = code;
  return error;
}
