import type { GrowthQuestChoice, LifeDimension } from "./domain";
import type { Locale } from "./i18n";

export type GrowthQuest = {
  id: string;
  dimension: LifeDimension;
  choice: Exclude<GrowthQuestChoice, "custom">;
  minutes: 2 | 10;
  title: Record<Locale, string>;
  doneWhen: Record<Locale, string>;
};

const quest = (
  dimension: LifeDimension,
  choice: GrowthQuest["choice"],
  index: number,
  zhTitle: string,
  enTitle: string,
  zhDone: string,
  enDone: string,
): GrowthQuest => ({
  id: `${dimension}-${choice}-${index}`,
  dimension,
  choice,
  minutes: choice === "short" ? 2 : 10,
  title: { "zh-HK": zhTitle, en: enTitle },
  doneWhen: { "zh-HK": zhDone, en: enDone },
});

export const GROWTH_QUESTS: GrowthQuest[] = [
  quest("mind", "short", 1, "寫低腦內最嘈嗰件事", "Name the loudest thought", "寫成一句完整句子。", "Write it as one complete sentence."),
  quest("mind", "short", 2, "關閉一個通知來源", "Silence one notification source", "至少關閉一個 app 或群組通知。", "Mute at least one app or group."),
  quest("mind", "short", 3, "做三次慢呼吸", "Take three slow breaths", "三次呼吸都比平時慢。", "Make all three breaths slower than usual."),
  quest("mind", "short", 4, "清走眼前一件雜物", "Clear one visible distraction", "工作範圍少咗一件雜物。", "Remove one item from your work area."),
  quest("mind", "short", 5, "將煩惱改寫成問題", "Turn a worry into a question", "問題以「下一步可以點做」為方向。", "Frame it around the next possible step."),
  quest("mind", "short", 6, "揀一件今日唔做嘅事", "Choose one thing not to do", "清楚寫低或刪走一項低價值工作。", "Write down or remove one low-value task."),
  quest("mind", "short", 7, "望遠處休息雙眼", "Rest your eyes on the distance", "離開螢幕望遠處至少 60 秒。", "Look away from the screen for at least 60 seconds."),
  quest("mind", "medium", 1, "做十分鐘腦袋清空", "Do a ten-minute mind sweep", "將所有掛心事情寫低，不用排序。", "Write every open loop down without sorting."),
  quest("mind", "medium", 2, "整理今日三項工作", "Sort today's three tasks", "只保留三項，並圈出第一項。", "Keep only three and circle the first."),
  quest("mind", "medium", 3, "讀十頁有用內容", "Read ten useful pages", "讀完並寫低一個重點。", "Finish and note one takeaway."),
  quest("mind", "medium", 4, "無螢幕行十分鐘", "Walk screen-free for ten minutes", "全程不看電話或耳機內容。", "Avoid your phone and audio for the full walk."),
  quest("mind", "medium", 5, "拆細一個模糊問題", "Break down one fuzzy problem", "寫出問題、限制同最細下一步。", "Write the problem, constraint, and smallest next step."),
  quest("mind", "medium", 6, "清理一個數碼角落", "Clear one digital corner", "清空一個收件箱、桌面區域或分頁組。", "Clear one inbox, desktop area, or tab group."),
  quest("mind", "medium", 7, "寫一頁不評價日記", "Write one page without judging", "連續寫十分鐘，不修改。", "Write continuously for ten minutes without editing."),

  quest("body", "short", 1, "飲一杯清水", "Drink a glass of water", "飲完整杯水。", "Finish one full glass."),
  quest("body", "short", 2, "伸展肩頸兩分鐘", "Stretch shoulders and neck", "左右肩頸都完成溫和伸展。", "Gently stretch both sides."),
  quest("body", "short", 3, "原地行二百步", "Walk two hundred steps", "步數或兩分鐘活動完成。", "Complete 200 steps or two minutes of movement."),
  quest("body", "short", 4, "企起身調整姿勢", "Stand and reset your posture", "雙腳站穩，肩膊放鬆一分鐘。", "Stand grounded with relaxed shoulders for one minute."),
  quest("body", "short", 5, "為下一餐加一種原形食物", "Add one whole food", "決定並準備一款水果、蔬菜或原形食物。", "Choose and prepare one fruit, vegetable, or whole food."),
  quest("body", "short", 6, "做十次慢深蹲", "Do ten slow squats", "用可控制速度完成十次；不適則改為坐站。", "Complete ten controlled reps, or chair stands if needed."),
  quest("body", "short", 7, "設定今晚停止工作時間", "Set tonight's stop-work time", "寫低一個具體時間並設提示。", "Choose a specific time and set a reminder."),
  quest("body", "medium", 1, "快步行十分鐘", "Take a brisk ten-minute walk", "連續活動十分鐘，保持可對話強度。", "Move continuously at a conversational pace."),
  quest("body", "medium", 2, "做一輪全身活動", "Do a full-body movement round", "完成深蹲、推牆、髖部伸展各一組。", "Complete one set each of squats, wall pushes, and hip mobility."),
  quest("body", "medium", 3, "準備一份簡單健康小食", "Prepare a simple healthy snack", "準備完成並放在容易取用位置。", "Prepare it and place it within easy reach."),
  quest("body", "medium", 4, "做十分鐘睡前降速", "Do a ten-minute bedtime wind-down", "調暗燈光並離開工作／社交內容。", "Dim the lights and leave work or social content."),
  quest("body", "medium", 5, "整理睡眠環境", "Reset your sleep space", "床邊清爽、溫度及光線較適合休息。", "Make the bedside, temperature, and light more restful."),
  quest("body", "medium", 6, "跟住身體做溫和伸展", "Follow a gentle body-led stretch", "照顧三個最繃緊位置，不追求痛感。", "Care for three tight areas without chasing pain."),
  quest("body", "medium", 7, "離開座位做一件生活事", "Do one life task away from your seat", "用站立或步行完成一件細家務。", "Complete one small household task while standing or walking."),

  quest("spirit", "short", 1, "寫低一件感恩小事", "Name one small gratitude", "寫出具體人物、時刻或細節。", "Name a specific person, moment, or detail."),
  quest("spirit", "short", 2, "靜默坐兩分鐘", "Sit in silence for two minutes", "不輸入內容，只留意當下。", "Take in no content and notice the present."),
  quest("spirit", "short", 3, "傳一句真心多謝", "Send one sincere thank-you", "向一個人傳出具體謝意。", "Send specific appreciation to one person."),
  quest("spirit", "short", 4, "望一樣自然景物", "Notice one piece of nature", "專心觀察光、天空或植物 60 秒。", "Observe light, sky, or a plant for 60 seconds."),
  quest("spirit", "short", 5, "讀一句提醒初心嘅文字", "Read one line that restores meaning", "讀完後寫低今日點樣實踐。", "Note how you can live it today."),
  quest("spirit", "short", 6, "放低一件控制唔到嘅事", "Release one thing you cannot control", "寫低它，再寫一件仍可選擇嘅事。", "Write it down, then name one choice you still have."),
  quest("spirit", "short", 7, "為一個人送上祝福", "Wish one person well", "安靜地想起對方並送上一句祝福。", "Think of them and offer one quiet wish."),
  quest("spirit", "medium", 1, "做十分鐘靜觀或祈禱", "Spend ten minutes in reflection or prayer", "全程不處理工作，只回到內在。", "Leave work aside and return inward for ten minutes."),
  quest("spirit", "medium", 2, "寫一封不一定寄出嘅感謝信", "Write a thank-you note you may not send", "具體寫出對方帶來嘅影響。", "Describe the person's specific impact."),
  quest("spirit", "medium", 3, "重讀自己嘅理想願景", "Reread your vision", "圈出仍然重要嘅一句，刪走一項雜音。", "Circle one line that still matters and remove one distraction."),
  quest("spirit", "medium", 4, "無目的散步十分鐘", "Take a ten-minute aimless walk", "不追步數或效率，只留意沿途。", "Do not chase steps or efficiency; notice the route."),
  quest("spirit", "medium", 5, "做一件無回報嘅善意行動", "Do one kindness without return", "完成一件不需要對方回報嘅幫助。", "Complete one helpful act without expecting repayment."),
  quest("spirit", "medium", 6, "整理一個有意義嘅物件", "Care for one meaningful object", "清潔、擺好或重新閱讀它背後嘅故事。", "Clean, place, or revisit the story behind it."),
  quest("spirit", "medium", 7, "寫低目前人生季節", "Name your current life season", "用三句描述正在結束、學習、開始嘅事。", "Use three lines for what is ending, teaching, and beginning."),

  quest("vocation", "short", 1, "寫低今日最有價值下一步", "Name today's highest-value next step", "下一步細到可以立即開始。", "Make it small enough to start now."),
  quest("vocation", "short", 2, "傳出一個必要訊息", "Send one necessary message", "完成一個會推進工作或合作嘅訊息。", "Send one message that advances work or collaboration."),
  quest("vocation", "short", 3, "刪走一個假忙動作", "Remove one piece of fake work", "取消、延後或委派一件低價值工作。", "Cancel, defer, or delegate one low-value task."),
  quest("vocation", "short", 4, "打開最重要文件", "Open the most important document", "打開並寫低第一句或第一個動作。", "Open it and add the first line or action."),
  quest("vocation", "short", 5, "記錄一個客戶或市場問題", "Capture one customer or market problem", "用對方語言寫成一句問題。", "Write the problem in their own language."),
  quest("vocation", "short", 6, "將一項工作改成可驗收結果", "Turn one task into a verifiable result", "句子包含清楚完成標準。", "Include a clear definition of done."),
  quest("vocation", "short", 7, "為深度工作預留時間", "Reserve time for deep work", "日曆或計時器預留最少 25 分鐘。", "Reserve at least 25 minutes in your calendar or timer."),
  quest("vocation", "medium", 1, "完成最重要工作嘅第一段", "Complete the first block of key work", "產出一個可見段落、草稿或決定。", "Produce one visible section, draft, or decision."),
  quest("vocation", "medium", 2, "整理一個可出售成果", "Shape one sellable outcome", "寫清楚幫邊個、解決咩、得到咩結果。", "State who it helps, what it solves, and the result."),
  quest("vocation", "medium", 3, "跟進一個重要關係", "Follow up one important relationship", "發出具體、有人味、有下一步嘅訊息。", "Send a specific, human message with a next step."),
  quest("vocation", "medium", 4, "教出一個剛學識嘅重點", "Teach one thing you just learned", "用簡單文字完成一段可分享解釋。", "Write one simple, shareable explanation."),
  quest("vocation", "medium", 5, "檢查今季主線", "Check your 90-day main quest", "確認今日行動有直接推進，否則改寫。", "Confirm today's action advances it, or rewrite the action."),
  quest("vocation", "medium", 6, "完成一個被拖延嘅細決定", "Make one delayed small decision", "寫低決定、原因同下一步。", "Record the decision, reason, and next step."),
  quest("vocation", "medium", 7, "建立明日第一個工作動作", "Set tomorrow's first work action", "準備好文件、材料及一句開始指令。", "Prepare the file, materials, and a one-line start cue."),
];

export const growthQuestsFor = (
  dimension: LifeDimension,
  choice: GrowthQuest["choice"],
) => GROWTH_QUESTS.filter((item) => item.dimension === dimension && item.choice === choice);

export const pickGrowthQuest = (
  dimension: LifeDimension,
  choice: GrowthQuest["choice"],
  date: string,
) => {
  const available = growthQuestsFor(dimension, choice);
  const dayNumber = Math.abs(Math.floor(Date.parse(`${date}T12:00:00Z`) / 86_400_000));
  return available[dayNumber % available.length];
};

export const localizeGrowthQuest = (item: GrowthQuest, locale: Locale) => ({
  title: item.title[locale],
  doneWhen: item.doneWhen[locale],
});
