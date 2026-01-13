import React from "react";
import { useHealthStore } from "../store/healthStore";
import type { DailyCheckIn } from "../types";



export default function CheckInForm() {
  const { checkIn, setCheckIn, saveCheckIn, generateStatuses } = useHealthStore();

  const handleChange = (field: keyof DailyCheckIn, value: string) => {
    setCheckIn({ ...checkIn, [field]: value } as DailyCheckIn);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    saveCheckIn();       
    generateStatuses();   
  };

  const sleepVals = ["poor", "ok", "good"] as const;
  const moodVals = ["low", "neutral", "good"] as const;
  const stressVals = ["low", "medium", "high"] as const;
  const energyVals = ["low", "medium", "high"] as const;

  const idx = (arr: readonly string[], v: string) => Math.max(0, arr.indexOf(v));

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white animate-fadeIn p-10 rounded-2xl shadow-xl w-full max-w-2xl border border-white/40"
    >
      <h2 className="text-2xl font-bold mb-4 text-center">Today's Check-In</h2>

      {/* Sleep slider */}
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <label className="font-medium text-gray-700 text-sm uppercase tracking-wide">Sleep</label>
          <span className="text-sm text-gray-600">{checkIn.sleep}</span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={idx(sleepVals, checkIn.sleep)}
          onChange={(e) => handleChange("sleep", sleepVals[Number(e.target.value)])}
          className="w-full accent-emerald-500"
        />
        <div className="slider-marks">
          <span>Poor</span>
          <span className="text-center">Ok</span>
          <span className="text-right">Good</span>
        </div>
      </div>

      {/* Mood slider */}
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <label className="font-medium text-gray-700 text-sm uppercase tracking-wide">Mood</label>
          <span className="text-sm text-gray-600">{checkIn.mood}</span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={idx(moodVals, checkIn.mood)}
          onChange={(e) => handleChange("mood", moodVals[Number(e.target.value)])}
          className="w-full accent-emerald-500"
        />
        <div className="slider-marks">
          <span>Low</span>
          <span className="text-center">Neutral</span>
          <span className="text-right">Good</span>
        </div>
      </div>

      {/* Stress slider */}
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <label className="font-medium text-gray-700 text-sm uppercase tracking-wide">Stress</label>
          <span className="text-sm text-gray-600">{checkIn.stress}</span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={idx(stressVals, checkIn.stress)}
          onChange={(e) => handleChange("stress", stressVals[Number(e.target.value)])}
          className="w-full accent-emerald-500"
        />
        <div className="slider-marks">
          <span>Low</span>
          <span className="text-center">Medium</span>
          <span className="text-right">High</span>
        </div>
      </div>

      {/* Energy slider */}
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <label className="font-medium text-gray-700 text-sm uppercase tracking-wide">Energy</label>
          <span className="text-sm text-gray-600">{checkIn.energy}</span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={idx(energyVals, checkIn.energy)}
          onChange={(e) => handleChange("energy", energyVals[Number(e.target.value)])}
          className="w-full accent-emerald-500"
        />
        <div className="slider-marks">
          <span>Low</span>
          <span className="text-center">Medium</span>
          <span className="text-right">High</span>
        </div>
      </div>

     <button
        type="submit"
        className="mt-6 w-full px-6 py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-lg font-semibold rounded-xl shadow-md hover:scale-[1.02] transition-all duration-200"
      >
        Save Today’s Status
    </button>
    </form>
  );
}
