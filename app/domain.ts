export type QuestType = "main" | "side" | "boss";
export type Skill = "writing" | "speaking" | "marketing" | "sales";
export type ContentStage = "idea" | "learn" | "teach" | "sell";
export type LifeDimension = "mind" | "body" | "spirit" | "vocation";
export type GrowthQuestChoice = "short" | "medium" | "custom";
export type GrowthCycleStatus = "active" | "completed";
export type GardenThemeId = "classic" | "first-light-garden";

export type DimensionScores = Record<LifeDimension, number>;

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

export type DailyCheckIn = {
  date: string;
  scores: DimensionScores;
  suggestedDimension: LifeDimension;
  selectedDimension: LifeDimension;
  questChoice: GrowthQuestChoice;
  questId: string | null;
  customAction: string;
  completedAt: string | null;
};

export type GrowthCycle = {
  startedOn: string | null;
  completedDates: string[];
  status: GrowthCycleStatus;
  completedOn: string | null;
};

export type GardenState = {
  growth: Record<LifeDimension, number>;
  guardianStage: 0 | 1 | 2 | 3 | 4;
  activeThemeId: GardenThemeId;
};

export type GrowthState = {
  checkIns: DailyCheckIn[];
  cycle: GrowthCycle;
  garden: GardenState;
};

export type AppState = {
  version: 2;
  profile: {
    antiVision: string;
    vision: string;
    niche: string;
    ninetyDayOutcome: string;
    bossFight: string;
    onboarded: boolean;
  };
  humanScores: DimensionScores & { updatedAt: string };
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
  growth: GrowthState;
};

export const SKILLS: Skill[] = ["writing", "speaking", "marketing", "sales"];
export const LIFE_DIMENSIONS: LifeDimension[] = ["mind", "body", "spirit", "vocation"];
export const CYCLE_LENGTH_DAYS = 14;
export const CYCLE_TARGET_DAYS = 7;

export const localDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const createInitialGrowthState = (): GrowthState => ({
  checkIns: [],
  cycle: {
    startedOn: null,
    completedDates: [],
    status: "active",
    completedOn: null,
  },
  garden: {
    growth: { mind: 0, body: 0, spirit: 0, vocation: 0 },
    guardianStage: 0,
    activeThemeId: "classic",
  },
});

export const createInitialState = (today = localDate()): AppState => ({
  version: 2,
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
  growth: createInitialGrowthState(),
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

export const calendarDayDiff = (from: string, to: string) => {
  const start = Date.parse(`${from}T12:00:00Z`);
  const end = Date.parse(`${to}T12:00:00Z`);
  return Math.floor((end - start) / 86_400_000);
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

export const guardianStageForSeeds = (seedCount: number): GardenState["guardianStage"] => {
  if (seedCount >= 7) return 4;
  if (seedCount >= 5) return 3;
  if (seedCount >= 3) return 2;
  if (seedCount >= 1) return 1;
  return 0;
};

export const isCycleExpired = (cycle: GrowthCycle, today: string) =>
  cycle.startedOn !== null && calendarDayDiff(cycle.startedOn, today) >= CYCLE_LENGTH_DAYS;

export const rotateGrowthCycle = (growth: GrowthState, today: string): GrowthState => {
  const hasToday = growth.checkIns.some((entry) => entry.date === today);
  const shouldRotate = !hasToday && (
    growth.cycle.status === "completed" || isCycleExpired(growth.cycle, today)
  );
  if (!shouldRotate && growth.cycle.startedOn !== null) return growth;

  return {
    ...growth,
    cycle: {
      startedOn: today,
      completedDates: [],
      status: "active",
      completedOn: null,
    },
  };
};

export const suggestLifeDimension = (
  scores: DimensionScores,
  gardenGrowth: Record<LifeDimension, number>,
  checkIns: DailyCheckIn[],
): LifeDimension => {
  const lastSelected = new Map<LifeDimension, number>();
  checkIns.forEach((entry, index) => lastSelected.set(entry.selectedDimension, index));

  return [...LIFE_DIMENSIONS].sort((left, right) => {
    if (scores[left] !== scores[right]) return scores[left] - scores[right];
    if (gardenGrowth[left] !== gardenGrowth[right]) return gardenGrowth[left] - gardenGrowth[right];
    const leftLast = lastSelected.get(left) ?? -1;
    const rightLast = lastSelected.get(right) ?? -1;
    if (leftLast !== rightLast) return leftLast - rightLast;
    return LIFE_DIMENSIONS.indexOf(left) - LIFE_DIMENSIONS.indexOf(right);
  })[0];
};

export const saveDailyCheckIn = (
  growth: GrowthState,
  checkIn: DailyCheckIn,
): GrowthState => {
  const rotated = rotateGrowthCycle(growth, checkIn.date);
  const checkIns = [
    ...rotated.checkIns.filter((entry) => entry.date !== checkIn.date),
    checkIn,
  ];
  return { ...rotated, checkIns };
};

export const completeDailyGrowth = (
  growth: GrowthState,
  date: string,
  completedAt = new Date().toISOString(),
): GrowthState => {
  const rotated = rotateGrowthCycle(growth, date);
  const entry = rotated.checkIns.find((item) => item.date === date);
  if (!entry || entry.completedAt || rotated.cycle.completedDates.includes(date)) return rotated;

  const completedDates = [...rotated.cycle.completedDates, date].sort();
  const totalSeeds = Object.values(rotated.garden.growth).reduce((sum, value) => sum + value, 0) + 1;
  const cycleComplete = completedDates.length >= CYCLE_TARGET_DAYS;
  const growthByDimension = {
    ...rotated.garden.growth,
    [entry.selectedDimension]: rotated.garden.growth[entry.selectedDimension] + 1,
  };

  return {
    ...rotated,
    checkIns: rotated.checkIns.map((item) =>
      item.date === date ? { ...item, completedAt } : item,
    ),
    cycle: {
      ...rotated.cycle,
      completedDates,
      status: cycleComplete ? "completed" : "active",
      completedOn: cycleComplete ? date : null,
    },
    garden: {
      ...rotated.garden,
      growth: growthByDimension,
      guardianStage: guardianStageForSeeds(totalSeeds),
    },
  };
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
