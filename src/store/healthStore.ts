import { create } from "zustand";
import type { DailyCheckIn, StatusEffect } from "../types";

type HealthState = {
  checkIn: DailyCheckIn;
  statuses: StatusEffect[];
  setCheckIn: (checkIn: DailyCheckIn) => void;
  generateStatuses: () => void;
};

export const useHealthStore = create<HealthState>((set, get) => ({
  checkIn: {
    sleep: "ok",
    mood: "neutral",
    stress: "medium",
    energy: "medium",
  },
  statuses: [],
  setCheckIn: (checkIn) => set({ checkIn }),
  generateStatuses: () => {
    const { checkIn } = get();
    const newStatuses: StatusEffect[] = [];

    if (checkIn.mood === "low" || checkIn.stress === "high") {
      newStatuses.push({
        id: "anxious",
        label: "Anxious",
        severity: "warning",
        description: "Your mood is low or stress is high today.",
        advice: "Take some deep breaths, meditate, or go for a short walk.",
      });
    }

    if (checkIn.sleep === "poor" || checkIn.energy === "low") {
      newStatuses.push({
        id: "tired",
        label: "Tired",
        severity: "warning",
        description: "Your sleep quality is poor or energy is low.",
        advice: "Prioritize rest and avoid intense physical activity.",
      });
    }

    if (newStatuses.length === 0) {
      newStatuses.push({
        id: "well",
        label: "Feeling Good",
        severity: "info",
        description: "You seem to be in good shape today!",
        advice: "Keep it up and maintain your routine.",
      });
    }

    set({ statuses: newStatuses });
  },
}));
