export type QuestType = "main" | "side" | "boss";
export type Skill = "writing" | "speaking" | "marketing" | "sales";
export type ContentStage = "idea" | "learn" | "teach" | "sell";

export type Quest = {
  id: string;
  title: string;
  type: QuestType;
  skill: Skill;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
};

export type ContentItem = {
  id: string;
  title: string;
  stage: ContentStage;
  pain: string;
  insight: string;
  action: string;
};

export type DailyReview = {
  date: string;
  wins: [string, string, string];
  lessons: [string, string];
  intention: string;
};

export type TimerState = {
  durationSeconds: number;
  remainingSeconds: number;
  runningSince: number | null;
};

export type AppState = {
  version: 1;
  profile: {
    antiVision: string;
    vision: string;
    niche: string;
    ninetyDayOutcome: string;
    bossFight: string;
    onboarded: boolean;
  };
  humanScores: {
    mind: number;
    body: number;
    spirit: number;
    vocation: number;
    updatedAt: string;
  };
  dailyPriority: { date: string; text: string; completed: boolean };
  quests: Quest[];
  contentItems: ContentItem[];
  reviews: DailyReview[];
  resetPlan: {
    commitments: string[];
    startDate: string;
    completedDays: string[];
    resetSteps: boolean[];
  };
  activeDates: string[];
  timer: TimerState;
};

export const SKILLS: Skill[] = ["writing", "speaking", "marketing", "sales"];

export const localDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const createInitialState = (today = localDate()): AppState => ({
  version: 1,
  profile: {
    antiVision: "",
    vision: "",
    niche: "",
    ninetyDayOutcome: "",
    bossFight: "",
    onboarded: false,
  },
  humanScores: { mind: 3, body: 3, spirit: 3, vocation: 3, updatedAt: today },
  dailyPriority: { date: today, text: "", completed: false },
  quests: [],
  contentItems: [],
  reviews: [],
  resetPlan: {
    commitments: ["每日行 10,000 步", "30 分鐘阻力訓練", "睡前一小時離線"],
    startDate: today,
    completedDays: [],
    resetSteps: [false, false, false, false],
  },
  activeDates: [],
  timer: { durationSeconds: 3000, remainingSeconds: 3000, runningSince: null },
});

export const questXp = (type: QuestType) => ({ side: 20, main: 50, boss: 100 })[type];

export const calculateProgress = (quests: Quest[]) => {
  const completed = quests.filter((quest) => quest.completed);
  const lifetimeXp = completed.reduce((sum, quest) => sum + questXp(quest.type), 0);
  const skills = { writing: 0, speaking: 0, marketing: 0, sales: 0 };
  completed.forEach((quest) => {
    skills[quest.skill] += questXp(quest.type);
  });
  return {
    lifetimeXp,
    level: Math.floor(lifetimeXp / 500) + 1,
    levelXp: lifetimeXp % 500,
    skills,
  };
};

export const completeQuest = (quests: Quest[], id: string) =>
  quests.map((quest) =>
    quest.id === id ? { ...quest, completed: !quest.completed } : quest,
  );

const dayBefore = (value: string) => {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
};

export const calculateStreak = (dates: string[], today = localDate()) => {
  const active = new Set(dates);
  let cursor = today;
  let streak = 0;
  while (active.has(cursor)) {
    streak += 1;
    cursor = dayBefore(cursor);
  }
  return streak;
};

export const isPiaReady = (item: Pick<ContentItem, "pain" | "insight" | "action">) =>
  [item.pain, item.insight, item.action].every((value) => value.trim().length > 0);

export const remainingSeconds = (timer: TimerState, now = Date.now()) => {
  if (timer.runningSince === null) return timer.remainingSeconds;
  const elapsed = Math.floor((now - timer.runningSince) / 1000);
  return Math.max(0, timer.remainingSeconds - elapsed);
};

export const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
