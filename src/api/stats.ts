import { buildApiUrl } from "./config";
import { apiRequest } from "./http";
import type { DailyCheckIn, ExerciseType as UiExerciseType } from "../types";

export const STATS_API_URL = buildApiUrl("/api/stats");

export type BackendExerciseType =
  | "UpperBody"
  | "LowerBody"
  | "Mobility"
  | "Cardio"
  | "StrengthTraining";

export type ExerciseRequest = {
  type: BackendExerciseType;
  durationMinutes: number;
  intensity: number;
  notes?: string | null;
};

export type BackendExercise = ExerciseRequest & {
  id: number;
};

export type DailyStatRequest = {
  date: string;
  mood: number;
  energy: number;
  stress: number;
  sleepHours: number;
  timeInNatureMinutes: number;
  steps: number;
  screenTimeMinutes?: number | null;
  exercises: ExerciseRequest[];
};

export type BackendDailyStat = {
  id: number;
  date: string;
  mood: number;
  energy: number;
  stress: number;
  sleepHours: number;
  timeInNatureMinutes: number;
  steps: number;
  screenTimeMinutes?: number | null;
  exercises: BackendExercise[];
};

export type StatsOverview = {
  days: number;
  startDate: string;
  endDate: string;
  checkInCount: number;
  averageMood: number;
  averageEnergy: number;
  averageStress: number;
  averageSleep: number;
  averageNatureTime: number;
  averageScreenTime: number;
  averageSteps: number;
  currentStreak: number;
  bestStreak: number;
  overallWellnessScore: number;
};

export type InsightTone = "Neutral" | "Notice" | "Positive" | "Caution";

export type StatsInsight = {
  type: string;
  tone: InsightTone;
  title: string;
  message: string;
  consideration?: string | null;
};

export const EXERCISE_OPTIONS: UiExerciseType[] = [
  "cardio",
  "strength",
  "upper",
  "lower",
  "mobility",
  "flexibility",
];

export const EXERCISE_LABELS: Record<UiExerciseType, string> = {
  cardio: "Cardio",
  strength: "Strength Training",
  upper: "Upper Body",
  lower: "Lower Body",
  mobility: "Mobility",
  flexibility: "Flexibility",
};

export const moodFromNumber = (value: number): DailyCheckIn["mood"] =>
  value <= 3 ? "low" : value <= 7 ? "neutral" : "good";

export const energyFromNumber = (value: number): DailyCheckIn["energy"] =>
  value <= 3 ? "low" : value <= 7 ? "medium" : "high";

export const stressFromNumber = (value: number): DailyCheckIn["stress"] =>
  value <= 3 ? "low" : value <= 7 ? "medium" : "high";

export const sleepFromHours = (hours: number): DailyCheckIn["sleep"] =>
  hours <= 6 ? "poor" : hours === 7 ? "ok" : "good";

export const toBackendExerciseType = (type: UiExerciseType): BackendExerciseType => {
  switch (type) {
    case "upper":
      return "UpperBody";
    case "lower":
      return "LowerBody";
    case "mobility":
    case "flexibility":
      return "Mobility";
    case "cardio":
      return "Cardio";
    case "strength":
      return "StrengthTraining";
  }
};

export const fromBackendExerciseType = (type: BackendExerciseType): UiExerciseType => {
  switch (type) {
    case "UpperBody":
      return "upper";
    case "LowerBody":
      return "lower";
    case "Mobility":
      return "mobility";
    case "Cardio":
      return "cardio";
    case "StrengthTraining":
      return "strength";
  }
};

export const fromBackendStat = (stat: BackendDailyStat): DailyCheckIn => ({
  date: stat.date,
  mood: moodFromNumber(stat.mood),
  energy: energyFromNumber(stat.energy),
  stress: stressFromNumber(stat.stress),
  sleep: sleepFromHours(stat.sleepHours),
  natureMinutes: stat.timeInNatureMinutes,
  steps: stat.steps,
  screenTime: stat.screenTimeMinutes ?? undefined,
  exercise: stat.exercises?.length
    ? stat.exercises.map((exercise) => fromBackendExerciseType(exercise.type))
    : [],
});

export const toBackendStat = (checkIn: DailyCheckIn): DailyStatRequest => ({
  date: checkIn.date ?? new Date().toISOString().slice(0, 10),
  mood: checkIn.mood === "low" ? 3 : checkIn.mood === "neutral" ? 5 : 8,
  energy: checkIn.energy === "low" ? 3 : checkIn.energy === "medium" ? 6 : 9,
  stress: checkIn.stress === "low" ? 3 : checkIn.stress === "medium" ? 6 : 9,
  sleepHours: checkIn.sleep === "poor" ? 5 : checkIn.sleep === "ok" ? 7 : 8,
  timeInNatureMinutes: checkIn.natureMinutes ?? 0,
  steps: checkIn.steps ?? 0,
  screenTimeMinutes: typeof checkIn.screenTime === "number" ? checkIn.screenTime : null,
  exercises: checkIn.exercise?.length
    ? checkIn.exercise.map((type) => ({
        type: toBackendExerciseType(type),
        durationMinutes: 30,
        intensity: 5,
        notes: null,
      }))
    : [],
});

export const listStats = () => apiRequest<BackendDailyStat[]>("/api/stats");

export const getStat = (id: number) =>
  apiRequest<BackendDailyStat>(`/api/stats/${id}`);

export const saveStat = (request: DailyStatRequest) =>
  apiRequest<BackendDailyStat>("/api/stats", {
    method: "POST",
    body: request,
  });

export const updateStat = (id: number, request: DailyStatRequest) =>
  apiRequest<void>(`/api/stats/${id}`, {
    method: "PUT",
    body: request,
  });

export const deleteStat = (id: number) =>
  apiRequest<void>(`/api/stats/${id}`, { method: "DELETE" });

export const getStatsOverview = (days = 30) =>
  apiRequest<StatsOverview>("/api/stats/overview", { query: { days } });

export const getStatsInsights = (days = 30) =>
  apiRequest<StatsInsight[]>("/api/stats/insights", { query: { days } });
