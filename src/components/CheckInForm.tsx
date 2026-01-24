import React from "react";
import { useHealthStore } from "../store/healthStore";
import type { DailyCheckIn, ExerciseType } from "../types";
import TagPicker from "./TagPicker";

const API_URL = "https://localhost:7016/api/stats";



export default function CheckInForm() {
  const { checkIn, setCheckIn, saveCheckIn, generateStatuses } = useHealthStore();
  const [screenTime, setScreenTime] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Numeric UI states for backend mapping
  const [moodNum, setMoodNum] = React.useState(5);
  const [energyNum, setEnergyNum] = React.useState(5);
  const [stressNum, setStressNum] = React.useState(5);
  const [sleepHours, setSleepHours] = React.useState(8);
  const [exerciseTypes, setExerciseTypes] = React.useState<ExerciseType[]>([]);
  const [exerciseIntensity, setExerciseIntensity] = React.useState(5);

  const handleChange = <K extends keyof DailyCheckIn>(field: K, value: DailyCheckIn[K]) => {
    setCheckIn({ ...checkIn, [field]: value } as DailyCheckIn);
  };

  // Map numeric sliders into store-friendly categories
  const setMoodFromNum = (v: number) => {
    setMoodNum(v);
    const moodStr: DailyCheckIn["mood"] = v <= 3 ? "low" : v <= 7 ? "neutral" : "good";
    handleChange("mood", moodStr);
  };
  const setEnergyFromNum = (v: number) => {
    setEnergyNum(v);
    const energyStr: DailyCheckIn["energy"] = v <= 3 ? "low" : v <= 7 ? "medium" : "high";
    handleChange("energy", energyStr);
  };
  const setStressFromNum = (v: number) => {
    setStressNum(v);
    const stressStr: DailyCheckIn["stress"] = v <= 3 ? "low" : v <= 7 ? "medium" : "high";
    handleChange("stress", stressStr);
  };
  const setSleepFromHours = (hrs: number) => {
    setSleepHours(hrs);
    const sleepStr: DailyCheckIn["sleep"] = hrs <= 6 ? "poor" : hrs === 7 ? "ok" : "good";
    handleChange("sleep", sleepStr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const parsedScreenTime = screenTime ? Number(screenTime) : undefined;

    // Helper mappers to translate local strings to backend numeric scales
    const mapMood = () => moodNum;
    const mapEnergy = () => energyNum;
    const mapStress = () => stressNum;
    const mapSleepHours = () => sleepHours;
    const mapExerciseType = (t: ExerciseType): "UpperBody" | "LowerBody" | "Mobility" | "Cardio" | "StrengthTraining" => {
      switch (t) {
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
        default:
          return "Mobility";
      }
    };

    // Build backend payload based on current check-in
    const payload = {
      id: 0,
      date: new Date().toISOString(),
      mood: mapMood(),
      energy: mapEnergy(),
      stress: mapStress(),
      sleepHours: mapSleepHours(),
      timeInNatureMinutes: checkIn.natureMinutes ?? 0,
      steps: checkIn.steps ?? 0,
      screenTimeMinutes: parsedScreenTime ?? null,
      exercises: (exerciseTypes.length ? exerciseTypes : []).map((t) => ({
        type: mapExerciseType(t),
        durationMinutes: 30, // default duration
        intensity: exerciseIntensity,
        notes: undefined,
      })),
    };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Try to read error message from backend and fall back locally
        let message = "Failed to save to backend";
        try {
          const body = await res.json();
          message = body?.title ?? message;
        } catch {}
        throw new Error(message);
      }

      // Backend success: still generate statuses locally
      generateStatuses();
    } catch (err) {
      // Fallback to local save if backend is unavailable
      saveCheckIn({ ...checkIn, screenTime: parsedScreenTime, exercise: exerciseTypes });
      generateStatuses();
      if (err instanceof Error) {
        setError(`${err.message}. Saved locally.`);
      } else {
        setError("Could not reach API. Saved locally.");
      }
    } finally {
      setScreenTime("");
      setSubmitting(false);
    }
  };

  // removed mood/stress/energy label arrays; using numeric sliders
  const exerciseOptions: ExerciseType[] = [
    "cardio",
    "strength",
    "upper",
    "lower",
    "mobility",
    "flexibility",
  ];
  const exerciseLabels: Record<ExerciseType, string> = {
    cardio: "Cardio",
    strength: "Strength Training",
    upper: "Upper Body",
    lower: "Lower Body",
    mobility: "Mobility",
    flexibility: "Flexibility",
  };

  // helper removed (not used)

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white animate-fadeIn p-10 rounded-2xl shadow-xl w-full max-w-2xl border border-white/40"
    >
      <h2 className="text-2xl font-bold mb-4 text-center">Today's Check-In</h2>


      {/* Mood slider (1-10) */}
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <label className="font-medium text-gray-700 text-sm uppercase tracking-wide">Mood</label>
          <span className="text-sm text-gray-600">{moodNum}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={moodNum}
          onChange={(e) => setMoodFromNum(Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
      </div>

      {/* Stress slider (1-10) */}
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <label className="font-medium text-gray-700 text-sm uppercase tracking-wide">Stress</label>
          <span className="text-sm text-gray-600">{stressNum}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={stressNum}
          onChange={(e) => setStressFromNum(Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
      </div>

      {/* Energy slider (1-10) */}
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <label className="font-medium text-gray-700 text-sm uppercase tracking-wide">Energy</label>
          <span className="text-sm text-gray-600">{energyNum}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={energyNum}
          onChange={(e) => setEnergyFromNum(Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
      </div>

  

      {/* Time in nature (minutes) */}
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <label className="font-medium text-gray-700 text-sm uppercase tracking-wide">Time in nature</label>
          <span className="text-sm text-gray-600">{checkIn.natureMinutes ?? 0} min</span>
        </div>
        <input
          type="range"
          min={0}
          max={180}
          step={5}
          value={checkIn.natureMinutes ?? 0}
          onChange={(e) => handleChange("natureMinutes", Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0</span>
          <span>60</span>
          <span>120</span>
          <span>180</span>
        </div>
      </div>

          {/* Sleep hours */}
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <label className="font-medium text-gray-700 text-sm uppercase tracking-wide">Sleep hours</label>
          <span className="text-sm text-gray-600">{sleepHours}</span>
        </div>
        <input
          type="number"
          min={0}
          max={24}
          step={0.5}
          value={sleepHours}
          onChange={(e) => setSleepFromHours(Number(e.target.value))}
          className="p-3 rounded-lg border border-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      {/* Exercise controls: multiple types, shared duration + intensity */}
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-white shadow-sm">
        <label className="font-medium text-gray-700 text-sm uppercase tracking-wide">Exercise</label>
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-xs text-gray-600">Types (you can add multiple)</label>
            <TagPicker
              options={exerciseOptions}
              value={exerciseTypes}
              onChange={(next) => setExerciseTypes(next as ExerciseType[])}
              labelFormatter={(opt) => exerciseLabels[opt as ExerciseType] ?? opt}
            />
          </div>
          {/* Duration removed; backend will use a default */}
          <div>
            <label className="text-xs text-gray-600">Intensity: {exerciseIntensity}</label>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={exerciseIntensity}
              onChange={(e) => setExerciseIntensity(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Steps input */}
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-white shadow-sm">
        <label className="font-medium text-gray-700 text-sm uppercase tracking-wide">Steps</label>
        <input
          type="number"
          min={0}
          max={20000}
          inputMode="numeric"
          value={checkIn.steps ?? 0}
          onChange={(e) => {
            const n = Math.max(0, Math.min(20000, Number(e.target.value)));
            handleChange("steps", n);
          }}
          placeholder="e.g., 8000"
          className="p-3 rounded-lg border border-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <p className="text-xs text-gray-500">Typical range: 0–20,000 steps</p>
      </div>

      {/* Screen Time input (not shown in status overview) */}
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-white shadow-sm">
        <label className="font-medium text-gray-700 text-sm uppercase tracking-wide">Screen Time (minutes, optional)</label>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={screenTime}
          onChange={(e) => setScreenTime(e.target.value)}
          placeholder="e.g., 120"
          className="p-3 rounded-lg border border-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <p className="text-xs text-gray-500">How many minutes of screen time today?</p>
      </div>

   

     {error && (
        <div className="rounded border border-red-300 bg-red-50 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}

     <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full px-6 py-4 bg-linear-to-r from-green-400 to-emerald-500 text-white text-lg font-semibold rounded-xl shadow-md hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Saving…" : "Save Today’s Status"}
    </button>
    </form>
  );
}
