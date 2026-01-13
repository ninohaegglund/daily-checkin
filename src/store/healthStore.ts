import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DailyCheckIn, StatusEffect } from "../types";

type HealthState = {
  checkIn: DailyCheckIn;
  statuses: StatusEffect[];
  history: DailyCheckIn[];
  setCheckIn: (checkIn: DailyCheckIn) => void;
  saveCheckIn: () => void;
  generateStatuses: () => void;
  clearHistory: () => void;
  removeEntry: (date: string) => void;
};

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
  checkIn: {
    sleep: "ok",
    mood: "neutral",
    stress: "medium",
    energy: "medium",
    natureMinutes: 0,
    steps: 0,
    exercise: [],
  },

  statuses: [],

  history: [], 

  setCheckIn: (checkIn) => set({ checkIn }),


  saveCheckIn: () => {
    const current = get().checkIn;
    set((state) => ({
      history: [
        {
          ...current,
          date: new Date().toISOString(), 
        },
        ...state.history,
      ],
    }));
  },

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

  clearHistory: () => set({ history: [] }),
  removeEntry: (date: string) =>
    set((state) => ({ history: state.history.filter((h) => h.date !== date) })),
    }),
    {
      name: "health-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ history: state.history, checkIn: state.checkIn }),
    }
  )
);
