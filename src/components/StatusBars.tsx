import React from "react";
import { useHealthStore } from "../store/healthStore";
import type { DailyCheckIn } from "../types";
import { BatteryFull, BatteryMedium, BatteryLow, Bed, Smile, Meh, Frown, AlertTriangle } from "lucide-react";

type Metric = {
  key: "sleep" | "mood" | "stress" | "energy";
  label: string;
  valueLabel: string;
  percent: number;
  color: string; // tailwind bg color
  icon: React.ReactNode;
};

function getMetrics(checkIn: DailyCheckIn): Metric[] {
  const sleepMap = { poor: 33, ok: 66, good: 100 } as const;
  const moodMap = { low: 33, neutral: 66, good: 100 } as const;
  const stressMap = { low: 100, medium: 66, high: 33 } as const; // inverted (lower stress is better)
  const energyMap = { low: 33, medium: 66, high: 100 } as const;

  const sleepIcon = <Bed className="w-5 h-5" />;
  const moodIcon =
    checkIn.mood === "good" ? (
      <Smile className="w-5 h-5" />
    ) : checkIn.mood === "neutral" ? (
      <Meh className="w-5 h-5" />
    ) : (
      <Frown className="w-5 h-5" />
    );

  const stressIcon = <AlertTriangle className="w-5 h-5" />;
  const energyIcon =
    checkIn.energy === "high" ? (
      <BatteryFull className="w-5 h-5" />
    ) : checkIn.energy === "medium" ? (
      <BatteryMedium className="w-5 h-5" />
    ) : (
      <BatteryLow className="w-5 h-5" />
    );

  const sleepColor = checkIn.sleep === "good" ? "bg-green-500" : checkIn.sleep === "ok" ? "bg-yellow-400" : "bg-red-500";
  const moodColor = checkIn.mood === "good" ? "bg-green-500" : checkIn.mood === "neutral" ? "bg-yellow-400" : "bg-red-500";
  const stressColor = checkIn.stress === "low" ? "bg-green-500" : checkIn.stress === "medium" ? "bg-yellow-400" : "bg-red-500";
  const energyColor = checkIn.energy === "high" ? "bg-green-500" : checkIn.energy === "medium" ? "bg-yellow-400" : "bg-red-500";

  return [
    {
      key: "sleep",
      label: "Sleep",
      valueLabel: checkIn.sleep,
      percent: sleepMap[checkIn.sleep],
      color: sleepColor,
      icon: sleepIcon,
    },
    {
      key: "mood",
      label: "Mood",
      valueLabel: checkIn.mood,
      percent: moodMap[checkIn.mood],
      color: moodColor,
      icon: moodIcon,
    },
    {
      key: "stress",
      label: "Stress",
      valueLabel: checkIn.stress,
      percent: stressMap[checkIn.stress],
      color: stressColor,
      icon: stressIcon,
    },
    {
      key: "energy",
      label: "Energy",
      valueLabel: checkIn.energy,
      percent: energyMap[checkIn.energy],
      color: energyColor,
      icon: energyIcon,
    },
  ];
}

export default function StatusBars() {
  const { checkIn } = useHealthStore();

  const metrics = getMetrics(checkIn);
  const overall = Math.round(metrics.reduce((acc, m) => acc + m.percent, 0) / metrics.length);
  const overallColor = overall >= 75 ? "text-green-600" : overall >= 50 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="w-full bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 border border-white/40">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Status Overview</h2>
        <span className={`text-sm font-semibold ${overallColor}`}>Overall: {overall}%</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {metrics.map((m) => (
          <div key={m.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-700 font-semibold flex items-center gap-2">
                  {m.icon}
                  {m.label}
                </span>
                <span className="text-xs text-gray-500 uppercase">{m.valueLabel}</span>
              </div>
              <span className="text-sm text-gray-600 font-medium">{m.percent}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-3 ${m.color} rounded-full transition-all duration-300`} style={{ width: `${m.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
