var DB_SCHEMA = {
  Users: { uidColumn: 1, headers: ["uid", "email", "displayName", "photoUrl", "guideCompleted", "createdAt", "lastLoginAt", "stateVersion"] },
  Profiles: { uidColumn: 1, headers: ["uid", "antiVision", "vision", "niche", "ninetyDayOutcome", "bossFight", "onboarded", "updatedAt"] },
  Daily: { uidColumn: 1, headers: ["uid", "date", "priorityText", "priorityCompleted", "mind", "body", "spirit", "vocation", "win1", "win2", "win3", "lesson1", "lesson2", "intention", "timerDurationSeconds", "timerRemainingSeconds", "timerRunningSince", "updatedAt"] },
  Quests: { uidColumn: 2, headers: ["id", "uid", "title", "type", "skill", "completed", "dueDate", "createdAt", "updatedAt"] },
  Content: { uidColumn: 2, headers: ["id", "uid", "title", "stage", "pain", "insight", "action", "updatedAt"] },
  Reset: { uidColumn: 1, headers: ["uid", "startDate", "commitmentsJson", "completedDaysJson", "resetStepsJson", "updatedAt"] },
  Audit: { uidColumn: 2, headers: ["timestamp", "uid", "action", "entityType", "entityId", "stateVersion", "status"] },
};

var USER_DATA_TABS = ["Profiles", "Daily", "Quests", "Content", "Reset"];

function getSpreadsheet_() {
  return SpreadsheetApp.openById(requiredProperty_("SPREADSHEET_ID"));
}

function ensureSchema_() {
  var spreadsheet = getSpreadsheet_();
  Object.keys(DB_SCHEMA).forEach(function (name) {
    var definition = DB_SCHEMA[name];
    var sheet = spreadsheet.getSheetByName(name);
    if (!sheet) sheet = spreadsheet.insertSheet(name);
    var current = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0] : [];
    var matches = definition.headers.every(function (header, index) { return current[index] === header; });
    if (!matches) {
      if (sheet.getLastRow() > 0) sheet.clearContents();
      sheet.getRange(1, 1, 1, definition.headers.length).setValues([definition.headers]);
      sheet.setFrozenRows(1);
    }
  });
  return spreadsheet;
}

function getSheet_(name) {
  var sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw appError_("SETUP_REQUIRED", "缺少資料分頁：" + name);
  return sheet;
}

function readRawRows_(name) {
  var sheet = getSheet_(name);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, DB_SCHEMA[name].headers.length).getValues();
}

function readUserRows_(name, uid) {
  var uidIndex = DB_SCHEMA[name].uidColumn - 1;
  return readRawRows_(name).filter(function (row) { return String(row[uidIndex]) === uid; });
}

function safeCell_(value) {
  if (typeof value === "string" && /^[=+\-@]/.test(value)) return "'" + value;
  return value;
}

function replaceUserRows_(name, uid, rows) {
  var sheet = getSheet_(name);
  var definition = DB_SCHEMA[name];
  var existing = readRawRows_(name);
  var uidIndex = definition.uidColumn - 1;
  for (var index = existing.length - 1; index >= 0; index -= 1) {
    if (String(existing[index][uidIndex]) === uid) sheet.deleteRow(index + 2);
  }
  if (!rows || !rows.length) return;
  var sanitized = rows.map(function (row) {
    if (row.length !== definition.headers.length) throw appError_("VALIDATION_ERROR", name + " 欄位數量錯誤");
    if (String(row[uidIndex]) !== uid) throw appError_("VALIDATION_ERROR", name + " 擁有者錯誤");
    return row.map(safeCell_);
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, sanitized.length, definition.headers.length).setValues(sanitized);
}

function captureUserRows_(uid) {
  var snapshot = {};
  ["Users"].concat(USER_DATA_TABS).forEach(function (name) { snapshot[name] = readUserRows_(name, uid); });
  return snapshot;
}

function restoreUserRows_(uid, snapshot) {
  try {
    ["Users"].concat(USER_DATA_TABS).forEach(function (name) { replaceUserRows_(name, uid, snapshot[name] || []); });
  } catch (error) {
    throw appError_("ROLLBACK_FAILED", "資料回滾失敗，請重新載入後再處理");
  }
}

function readUserData_(uid) {
  return {
    profile: readUserRows_("Profiles", uid),
    daily: readUserRows_("Daily", uid),
    quests: readUserRows_("Quests", uid),
    content: readUserRows_("Content", uid),
    reset: readUserRows_("Reset", uid),
  };
}

function getUserRow_(uid) {
  var rows = readUserRows_("Users", uid);
  return rows.length ? rows[0] : null;
}

function getUserVersion_(uid) {
  var row = getUserRow_(uid);
  return row ? Number(row[7]) || 0 : 0;
}

function upsertUser_(user, version, guideCompleted) {
  var existing = getUserRow_(user.uid);
  var now = new Date().toISOString();
  var createdAt = existing ? existing[5] : now;
  var guide = typeof guideCompleted === "boolean" ? guideCompleted : existing ? existing[4] === true : false;
  replaceUserRows_("Users", user.uid, [[user.uid, user.email, user.displayName, user.photoUrl, guide, createdAt, now, Number(version) || 0]]);
}

function setGuideCompleted_(uid) {
  var row = getUserRow_(uid);
  if (!row) throw appError_("NOT_FOUND", "找不到用戶資料");
  row[4] = true;
  row[6] = new Date().toISOString();
  replaceUserRows_("Users", uid, [row]);
}

function appendAudit_(uid, action, entityType, entityId, version, status) {
  var sheet = getSheet_("Audit");
  sheet.appendRow([new Date().toISOString(), uid, action, entityType || "state", entityId || "", Number(version) || 0, status]);
}

function saveWithRollback_(user, state, version) {
  var snapshot = captureUserRows_(user.uid);
  var rows = GoogleCore.toSheetRows(user.uid, state, new Date().toISOString());
  try {
    replaceUserRows_("Profiles", user.uid, rows.profile);
    replaceUserRows_("Daily", user.uid, rows.daily);
    replaceUserRows_("Quests", user.uid, rows.quests);
    replaceUserRows_("Content", user.uid, rows.content);
    replaceUserRows_("Reset", user.uid, rows.reset);
    upsertUser_(user, version);
    appendAudit_(user.uid, "save", "state", "", version, "success");
    return { ok: true, serverVersion: version, savedAt: new Date().toISOString() };
  } catch (error) {
    try {
      restoreUserRows_(user.uid, snapshot);
      appendAudit_(user.uid, "save", "state", "", version, "failed");
    } catch (rollbackError) {
      if (String(rollbackError && rollbackError.message).indexOf("ROLLBACK_FAILED") !== -1) throw rollbackError;
      throw appError_("ROLLBACK_FAILED", "資料回滾失敗，請重新載入後再處理");
    }
    throw error;
  }
}
