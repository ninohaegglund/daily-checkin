import React from "react";
import { useHealthStore } from "../store/healthStore";
import type { DailyCheckIn } from "../types";

export default function CheckInForm() {
  const { checkIn, setCheckIn, generateStatuses } = useHealthStore();

  const handleChange = (field: keyof DailyCheckIn, value: string) => {
    setCheckIn({ ...checkIn, [field]: value } as DailyCheckIn);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateStatuses();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white animate-fadeIn p-8 rounded-xl shadow-lg w-full max-w-xl"
    >
      <h2 className="text-2xl font-bold mb-4 text-center">Today's Check-In</h2>

      <div className="flex flex-col">
        <label className="block mb-2 font-medium text-lg">Sleep</label>
        <select
          value={checkIn.sleep}
          onChange={(e) => handleChange("sleep", e.target.value)}
          className="p-2 border rounded text-lg"
        >
          <option value="poor">Poor</option>
          <option value="ok">Ok</option>
          <option value="good">Good</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label className="block mb-2 font-medium text-lg">Mood</label>
        <select
          value={checkIn.mood}
          onChange={(e) => handleChange("mood", e.target.value)}
          className="p-2 border rounded text-lg"
        >
          <option value="low">Low</option>
          <option value="neutral">Neutral</option>
          <option value="good">Good</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label className="block mb-2 font-medium text-lg">Stress</label>
        <select
          value={checkIn.stress}
          onChange={(e) => handleChange("stress", e.target.value)}
          className="p-2 border rounded text-lg"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label className="block mb-2 font-medium text-lg">Energy</label>
        <select
          value={checkIn.energy}
          onChange={(e) => handleChange("energy", e.target.value)}
          className="p-2 border rounded text-lg"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <button
        type="submit"
        className="mt-4 w-full px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded hover:bg-blue-700 transition"
      >
        Submit
      </button>
    </form>
  );
}
