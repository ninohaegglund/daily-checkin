export type DailyCheckIn = {
  sleep: "poor" | "ok" | "good";
  mood: "low" | "neutral" | "good";
  stress: "low" | "medium" | "high";
  energy: "low" | "medium" | "high";
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
