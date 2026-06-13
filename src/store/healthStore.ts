import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DailyCheckIn, StatusEffect } from "../types";

type HealthState = {
  checkIn: DailyCheckIn;
  statuses: StatusEffect[];
  history: DailyCheckIn[];
  statsVersion: number;
  setCheckIn: (checkIn: DailyCheckIn) => void;
  saveCheckIn: (override?: Partial<DailyCheckIn>) => void;
  generateStatuses: () => void;
  markStatsChanged: () => void;
  clearHistory: () => void;
  removeEntry: (date: string) => void;
  updateEntry: (date: string, patch: Partial<DailyCheckIn>) => void;
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
    screenTime: 0,
    exercise: [],
  },

  statuses: [],

  history: [], 
  statsVersion: 0,

  setCheckIn: (checkIn) => set({ checkIn }),


  saveCheckIn: (override) => {
    const current = get().checkIn;
    const entry = { ...current, ...override, date: new Date().toISOString() };
    set((state) => ({
      history: [entry, ...state.history],
    }));
  },

  generateStatuses: () => {
    const { checkIn } = get();
    const newStatuses: StatusEffect[] = [];

    if (
      checkIn.mood === "very-low" ||
      checkIn.mood === "low" ||
      checkIn.stress === "high" ||
      checkIn.stress === "very-high"
    ) {
      newStatuses.push({
        id: "anxious",
        label: "Anxious",
        severity: "warning",
        description: "Your mood is low or stress is high today.",
        advice: "Take some deep breaths, meditate, or go for a short walk.",
      });
    }

    if (
      checkIn.sleep === "poor" ||
      checkIn.energy === "very-low" ||
      checkIn.energy === "low"
    ) {
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

  markStatsChanged: () => set((state) => ({ statsVersion: state.statsVersion + 1 })),
  clearHistory: () => set({ history: [] }),
  removeEntry: (date: string) =>
    set((state) => ({ history: state.history.filter((h) => h.date !== date) })),
  updateEntry: (date: string, patch: Partial<DailyCheckIn>) =>
    set((state) => ({ history: state.history.map((h) => (h.date === date ? { ...h, ...patch } : h)) })),
    }),
    {
      name: "health-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ checkIn: state.checkIn }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<Pick<HealthState, "checkIn">>;
        return {
          ...currentState,
          checkIn: persisted.checkIn ?? currentState.checkIn,
        };
      },
    }
  )
);
