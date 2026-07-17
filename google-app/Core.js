var GoogleCore = (function () {
  var QUEST_TYPES = ["main", "side", "boss"];
  var SKILLS = ["writing", "speaking", "marketing", "sales"];
  var STAGES = ["idea", "learn", "teach", "sell"];
  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  function fail(message) {
    throw new Error("VALIDATION_ERROR: " + message);
  }

  function assert(condition, message) {
    if (!condition) fail(message);
  }

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function text(value, max, field, allowEmpty) {
    assert(typeof value === "string", field + " must be text");
    assert(value.length <= max, field + " too long");
    if (!allowEmpty) assert(value.trim().length > 0, field + " required");
  }

  function date(value, field, allowEmpty) {
    if (allowEmpty && (value === "" || value === undefined || value === null)) return;
    assert(typeof value === "string" && DATE_RE.test(value), field + " must be YYYY-MM-DD");
  }

  function bool(value, field) {
    assert(typeof value === "boolean", field + " must be boolean");
  }

  function numberIn(value, min, max, field) {
    assert(typeof value === "number" && Number.isFinite(value) && value >= min && value <= max, field + " out of range");
  }

  function uniqueIds(items, field) {
    var ids = {};
    items.forEach(function (item) {
      text(item.id, 120, field + ".id", false);
      assert(!ids[item.id], field + " duplicate id");
      ids[item.id] = true;
    });
  }

  function validateState(state) {
    assert(isObject(state), "state required");
    assert(state.version === 1, "unsupported state version");
    assert(isObject(state.profile), "profile required");
    ["antiVision", "vision", "niche", "ninetyDayOutcome", "bossFight"].forEach(function (key) {
      text(state.profile[key], 5000, "profile." + key, true);
    });
    bool(state.profile.onboarded, "profile.onboarded");

    assert(isObject(state.humanScores), "humanScores required");
    ["mind", "body", "spirit", "vocation"].forEach(function (key) {
      numberIn(state.humanScores[key], 1, 5, "humanScores." + key);
    });
    date(state.humanScores.updatedAt, "humanScores.updatedAt");

    assert(isObject(state.dailyPriority), "dailyPriority required");
    date(state.dailyPriority.date, "dailyPriority.date");
    text(state.dailyPriority.text, 5000, "dailyPriority.text", true);
    bool(state.dailyPriority.completed, "dailyPriority.completed");

    assert(Array.isArray(state.quests) && state.quests.length <= 500, "quests limit exceeded");
    uniqueIds(state.quests, "quests");
    state.quests.forEach(function (quest) {
      text(quest.title, 300, "quest.title", false);
      assert(QUEST_TYPES.indexOf(quest.type) !== -1, "invalid quest type");
      assert(SKILLS.indexOf(quest.skill) !== -1, "invalid quest skill");
      bool(quest.completed, "quest.completed");
      date(quest.dueDate, "quest.dueDate", true);
      date(quest.createdAt, "quest.createdAt");
    });

    assert(Array.isArray(state.contentItems) && state.contentItems.length <= 500, "content limit exceeded");
    uniqueIds(state.contentItems, "contentItems");
    state.contentItems.forEach(function (item) {
      text(item.title, 300, "content.title", false);
      assert(STAGES.indexOf(item.stage) !== -1, "invalid content stage");
      text(item.pain, 5000, "content.pain", true);
      text(item.insight, 5000, "content.insight", true);
      text(item.action, 5000, "content.action", true);
    });

    assert(Array.isArray(state.reviews), "reviews required");
    state.reviews.forEach(function (review) {
      date(review.date, "review.date");
      assert(Array.isArray(review.wins) && review.wins.length === 3, "review requires three wins");
      assert(Array.isArray(review.lessons) && review.lessons.length === 2, "review requires two lessons");
      review.wins.forEach(function (value) { text(value, 1000, "review.win", true); });
      review.lessons.forEach(function (value) { text(value, 1000, "review.lesson", true); });
      text(review.intention, 1000, "review.intention", true);
    });

    assert(isObject(state.resetPlan), "resetPlan required");
    date(state.resetPlan.startDate, "resetPlan.startDate");
    assert(Array.isArray(state.resetPlan.commitments) && state.resetPlan.commitments.length <= 30, "invalid commitments");
    state.resetPlan.commitments.forEach(function (value) { text(value, 500, "commitment", true); });
    assert(Array.isArray(state.resetPlan.completedDays), "completedDays required");
    state.resetPlan.completedDays.forEach(function (value) { date(value, "completedDay"); });
    assert(Array.isArray(state.resetPlan.resetSteps) && state.resetPlan.resetSteps.length === 4, "four reset steps required");
    state.resetPlan.resetSteps.forEach(function (value) { bool(value, "resetStep"); });

    assert(Array.isArray(state.activeDates), "activeDates required");
    state.activeDates.forEach(function (value) { date(value, "activeDate"); });

    assert(isObject(state.timer), "timer required");
    numberIn(state.timer.durationSeconds, 1, 86400, "timer.durationSeconds");
    numberIn(state.timer.remainingSeconds, 0, state.timer.durationSeconds, "timer.remainingSeconds");
    assert(state.timer.runningSince === null || (typeof state.timer.runningSince === "number" && Number.isFinite(state.timer.runningSince)), "invalid timer.runningSince");
    return true;
  }

  function validateTokenUser(user) {
    assert(user && typeof user.localId === "string" && user.localId.length > 0, "token user missing uid");
    assert(typeof user.email === "string" && user.email.length > 0 && user.emailVerified === true, "verified email required");
    assert(user.disabled !== true, "user disabled");
    return {
      uid: user.localId,
      email: user.email,
      displayName: user.displayName || "",
      photoUrl: user.photoUrl || "",
    };
  }

  function defaultState(today) {
    return {
      version: 1,
      profile: { antiVision: "", vision: "", niche: "", ninetyDayOutcome: "", bossFight: "", onboarded: false },
      humanScores: { mind: 3, body: 3, spirit: 3, vocation: 3, updatedAt: today },
      dailyPriority: { date: today, text: "", completed: false },
      quests: [],
      contentItems: [],
      reviews: [],
      resetPlan: { commitments: ["每日行 10,000 步", "30 分鐘阻力訓練", "睡前一小時離線"], startDate: today, completedDays: [], resetSteps: [false, false, false, false] },
      activeDates: [],
      timer: { durationSeconds: 3000, remainingSeconds: 3000, runningSince: null },
    };
  }

  function toSheetRows(uid, state, now) {
    validateState(state);
    text(uid, 180, "verified uid", false);
    var dailyByDate = {};
    state.activeDates.forEach(function (day) { dailyByDate[day] = { date: day }; });
    state.reviews.forEach(function (review) {
      dailyByDate[review.date] = dailyByDate[review.date] || { date: review.date };
      dailyByDate[review.date].review = review;
    });
    var priorityDay = state.dailyPriority.date;
    dailyByDate[priorityDay] = dailyByDate[priorityDay] || { date: priorityDay };
    dailyByDate[priorityDay].priority = state.dailyPriority;
    var scoreDay = state.humanScores.updatedAt;
    dailyByDate[scoreDay] = dailyByDate[scoreDay] || { date: scoreDay };
    dailyByDate[scoreDay].scores = state.humanScores;
    dailyByDate[priorityDay].timer = state.timer;

    var daily = Object.keys(dailyByDate).sort().map(function (day) {
      var entry = dailyByDate[day];
      var review = entry.review || { wins: ["", "", ""], lessons: ["", ""], intention: "" };
      var priority = entry.priority || { text: "", completed: false };
      var scores = entry.scores || { mind: "", body: "", spirit: "", vocation: "" };
      var timer = entry.timer || { durationSeconds: "", remainingSeconds: "", runningSince: "" };
      return [uid, day, priority.text, priority.completed, scores.mind, scores.body, scores.spirit, scores.vocation,
        review.wins[0], review.wins[1], review.wins[2], review.lessons[0], review.lessons[1], review.intention,
        timer.durationSeconds, timer.remainingSeconds, timer.runningSince === null ? "" : timer.runningSince, now];
    });

    return {
      profile: [[uid, state.profile.antiVision, state.profile.vision, state.profile.niche, state.profile.ninetyDayOutcome, state.profile.bossFight, state.profile.onboarded, now]],
      daily: daily,
      quests: state.quests.map(function (quest) { return [quest.id, uid, quest.title, quest.type, quest.skill, quest.completed, quest.dueDate || "", quest.createdAt, now]; }),
      content: state.contentItems.map(function (item) { return [item.id, uid, item.title, item.stage, item.pain, item.insight, item.action, now]; }),
      reset: [[uid, state.resetPlan.startDate, JSON.stringify(state.resetPlan.commitments), JSON.stringify(state.resetPlan.completedDays), JSON.stringify(state.resetPlan.resetSteps), now]],
    };
  }

  function parseJsonArray(value, fallback) {
    if (Array.isArray(value)) return value;
    try {
      var parsed = JSON.parse(value || "");
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function fromSheetRows(rows, today) {
    var state = defaultState(today);
    var profile = (rows.profile || [])[0];
    if (profile) {
      state.profile = { antiVision: profile[1] || "", vision: profile[2] || "", niche: profile[3] || "", ninetyDayOutcome: profile[4] || "", bossFight: profile[5] || "", onboarded: profile[6] === true };
    }
    var daily = rows.daily || [];
    if (daily.length) {
      state.activeDates = daily.map(function (row) { return String(row[1]); }).filter(function (value, index, all) { return all.indexOf(value) === index; });
      daily.forEach(function (row) {
        var hasReview = [row[8], row[9], row[10], row[11], row[12], row[13]].some(function (value) { return String(value || "").length > 0; });
        if (hasReview) state.reviews.push({ date: String(row[1]), wins: [String(row[8] || ""), String(row[9] || ""), String(row[10] || "")], lessons: [String(row[11] || ""), String(row[12] || "")], intention: String(row[13] || "") });
      });
      var current = daily.filter(function (row) { return String(row[1]) === today; })[0] || daily[daily.length - 1];
      state.dailyPriority = { date: String(current[1]), text: String(current[2] || ""), completed: current[3] === true };
      state.humanScores = {
        mind: Number(current[4]) || 3, body: Number(current[5]) || 3, spirit: Number(current[6]) || 3, vocation: Number(current[7]) || 3, updatedAt: String(current[1]),
      };
      if (Number(current[14]) > 0) state.timer = { durationSeconds: Number(current[14]), remainingSeconds: Number(current[15]), runningSince: current[16] === "" ? null : Number(current[16]) };
    }
    state.quests = (rows.quests || []).map(function (row) {
      var quest = { id: String(row[0]), title: String(row[2] || ""), type: String(row[3]), skill: String(row[4]), completed: row[5] === true, createdAt: String(row[7]) };
      if (row[6]) quest.dueDate = String(row[6]);
      return quest;
    });
    state.contentItems = (rows.content || []).map(function (row) { return { id: String(row[0]), title: String(row[2] || ""), stage: String(row[3]), pain: String(row[4] || ""), insight: String(row[5] || ""), action: String(row[6] || "") }; });
    var reset = (rows.reset || [])[0];
    if (reset) state.resetPlan = { startDate: String(reset[1]), commitments: parseJsonArray(reset[2], []), completedDays: parseJsonArray(reset[3], []), resetSteps: parseJsonArray(reset[4], [false, false, false, false]) };
    validateState(state);
    return state;
  }

  return {
    validateState: validateState,
    validateTokenUser: validateTokenUser,
    defaultState: defaultState,
    toSheetRows: toSheetRows,
    fromSheetRows: fromSheetRows,
  };
})();
