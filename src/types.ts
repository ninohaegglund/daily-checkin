export type DailyCheckIn = {
  sleep: "poor" | "ok" | "good";
  mood: "low" | "neutral" | "good";
  stress: "low" | "medium" | "high";
  energy: "low" | "medium" | "high";
};

export type StatusEffect = {
  id: string;
  label: string;
  severity: "info" | "warning";
  description: string;
  advice: string;
};
