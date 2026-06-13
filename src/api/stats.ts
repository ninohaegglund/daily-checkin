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

export const MOOD_LABELS: Record<DailyCheckIn["mood"], string> = {
  "very-low": "Very low",
  low: "Low",
  neutral: "Neutral",
  good: "Good",
  "very-good": "Very good",
};

export const ENERGY_LABELS: Record<DailyCheckIn["energy"], string> = {
  "very-low": "Very low",
  low: "Low",
  medium: "Medium",
  high: "High",
  "very-high": "Very high",
};

export const STRESS_LABELS: Record<DailyCheckIn["stress"], string> = {
  "very-low": "Very low",
  low: "Low",
  medium: "Medium",
  high: "High",
  "very-high": "Very high",
};

export const moodFromNumber = (value: number): DailyCheckIn["mood"] =>
  value <= 2
    ? "very-low"
    : value <= 4
      ? "low"
      : value <= 6
        ? "neutral"
        : value <= 8
          ? "good"
          : "very-good";

export const energyFromNumber = (value: number): DailyCheckIn["energy"] =>
  value <= 2
    ? "very-low"
    : value <= 4
      ? "low"
      : value <= 6
        ? "medium"
        : value <= 8
          ? "high"
          : "very-high";

export const stressFromNumber = (value: number): DailyCheckIn["stress"] =>
  value <= 2
    ? "very-low"
    : value <= 4
      ? "low"
      : value <= 6
        ? "medium"
        : value <= 8
          ? "high"
          : "very-high";

export const moodLabelFromNumber = (value: number) => MOOD_LABELS[moodFromNumber(value)];

export const energyLabelFromNumber = (value: number) => ENERGY_LABELS[energyFromNumber(value)];

export const stressLabelFromNumber = (value: number) => STRESS_LABELS[stressFromNumber(value)];

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

const moodNumberByState: Record<DailyCheckIn["mood"], number> = {
  "very-low": 1,
  low: 3,
  neutral: 5,
  good: 8,
  "very-good": 10,
};

const energyNumberByState: Record<DailyCheckIn["energy"], number> = {
  "very-low": 1,
  low: 3,
  medium: 5,
  high: 8,
  "very-high": 10,
};

const stressNumberByState: Record<DailyCheckIn["stress"], number> = {
  "very-low": 1,
  low: 3,
  medium: 5,
  high: 8,
  "very-high": 10,
};

export const toBackendStat = (checkIn: DailyCheckIn): DailyStatRequest => ({
  date: checkIn.date ?? new Date().toISOString().slice(0, 10),
  mood: moodNumberByState[checkIn.mood],
  energy: energyNumberByState[checkIn.energy],
  stress: stressNumberByState[checkIn.stress],
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
