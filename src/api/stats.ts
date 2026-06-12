import type { DailyCheckIn, ExerciseType } from "../types";

export const STATS_API_URL = "https://localhost:7016/api/stats";

export type BackendExerciseType =
  | "UpperBody"
  | "LowerBody"
  | "Mobility"
  | "Cardio"
  | "StrengthTraining";

export type BackendExercise = {
  type: BackendExerciseType;
  durationMinutes: number;
  intensity: number;
  notes?: string;
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

export const EXERCISE_OPTIONS: ExerciseType[] = [
  "cardio",
  "strength",
  "upper",
  "lower",
  "mobility",
  "flexibility",
];

export const EXERCISE_LABELS: Record<ExerciseType, string> = {
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

export const toBackendExerciseType = (type: ExerciseType): BackendExerciseType => {
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

export const fromBackendExerciseType = (type: BackendExerciseType): ExerciseType => {
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

export const toBackendStat = (
  checkIn: DailyCheckIn,
  existing?: Pick<BackendDailyStat, "id" | "date">
): BackendDailyStat => ({
  id: existing?.id ?? 0,
  date: existing?.date ?? checkIn.date ?? new Date().toISOString(),
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
      }))
    : [],
});
