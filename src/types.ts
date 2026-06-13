export type DailyCheckIn = {
  sleep: "poor" | "ok" | "good";
  mood: "very-low" | "low" | "neutral" | "good" | "very-good";
  stress: "very-low" | "low" | "medium" | "high" | "very-high";
  energy: "very-low" | "low" | "medium" | "high" | "very-high";
  date?: string;
  natureMinutes?: number; // time spent in nature in minutes
  steps?: number; // steps taken today
  screenTime?: number; // minutes of screen time
  exercise?: ExerciseType[]; // selected exercise types
};

export type ExerciseType =
  | "cardio"
  | "strength"
  | "upper"
  | "lower"
  | "mobility"
  | "flexibility";

export type StatusEffect = {
  id: string;
  label: string;
  severity: "info" | "warning";
  description: string;
  advice: string;
};
