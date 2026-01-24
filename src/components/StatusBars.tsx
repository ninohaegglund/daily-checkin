import React, { useEffect, useState } from "react";
import { useHealthStore } from "../store/healthStore";
import type { DailyCheckIn } from "../types";
import { BatteryFull, BatteryMedium, BatteryLow, Bed, Smile, Meh, Frown, AlertTriangle, Leaf } from "lucide-react";

const API_URL = "https://localhost:7016/api/stats";

type Metric = {
  key: "sleep" | "mood" | "stress" | "energy" | "nature";
  label: string;
  valueLabel: string;
  percent: number;
  color: string; // tailwind bg color
  icon: React.ReactNode;
};

function aggregateMetrics(entries: DailyCheckIn[]): Metric[] {
  const sleepMap = { poor: 33, ok: 66, good: 100 } as const;
  const moodMap = { low: 33, neutral: 66, good: 100 } as const;
  const stressMap = { low: 100, medium: 66, high: 33 } as const; // inverted (lower stress is better)
  const energyMap = { low: 33, medium: 66, high: 100 } as const;
  const natureTarget = 60; // minutes

  const avg = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);

  const sleepAvg = avg(entries.map((e) => sleepMap[e.sleep]));
  const moodAvg = avg(entries.map((e) => moodMap[e.mood]));
  const stressAvg = avg(entries.map((e) => stressMap[e.stress]));
  const energyAvg = avg(entries.map((e) => energyMap[e.energy]));
  const natureAvgMin = avg(entries.map((e) => (typeof e.natureMinutes === "number" ? e.natureMinutes : 0)));

  const catColor = (pct: number) => (pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-yellow-400" : "bg-red-500");
  const moodIcon = moodAvg >= 75 ? <Smile className="w-5 h-5" /> : moodAvg >= 50 ? <Meh className="w-5 h-5" /> : <Frown className="w-5 h-5" />;
  const energyIcon = energyAvg >= 75 ? <BatteryFull className="w-5 h-5" /> : energyAvg >= 50 ? <BatteryMedium className="w-5 h-5" /> : <BatteryLow className="w-5 h-5" />;

  return [
    { key: "sleep", label: "Sleep", valueLabel: sleepAvg >= 75 ? "good" : sleepAvg >= 50 ? "ok" : "poor", percent: Math.round(sleepAvg), color: catColor(sleepAvg), icon: <Bed className="w-5 h-5" /> },
    { key: "mood", label: "Mood", valueLabel: moodAvg >= 75 ? "good" : moodAvg >= 50 ? "neutral" : "low", percent: Math.round(moodAvg), color: catColor(moodAvg), icon: moodIcon },
    { key: "stress", label: "Stress", valueLabel: stressAvg >= 75 ? "low" : stressAvg >= 50 ? "medium" : "high", percent: Math.round(stressAvg), color: catColor(stressAvg), icon: <AlertTriangle className="w-5 h-5" /> },
    { key: "energy", label: "Energy", valueLabel: energyAvg >= 75 ? "high" : energyAvg >= 50 ? "medium" : "low", percent: Math.round(energyAvg), color: catColor(energyAvg), icon: energyIcon },
    { key: "nature", label: "Nature", valueLabel: `${Math.round(natureAvgMin)} min avg`, percent: Math.min(100, Math.round((natureAvgMin / natureTarget) * 100)), color: catColor(Math.min(100, Math.round((natureAvgMin / natureTarget) * 100))), icon: <Leaf className="w-5 h-5" /> },
  ];
}

export default function StatusBars() {
  const { history } = useHealthStore();
  const [entries, setEntries] = useState<DailyCheckIn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Backend -> local mapping helpers
  const moodStr = (n: number): DailyCheckIn["mood"] => (n <= 3 ? "low" : n <= 7 ? "neutral" : "good");
  const energyStr = (n: number): DailyCheckIn["energy"] => (n <= 3 ? "low" : n <= 7 ? "medium" : "high");
  const stressStr = (n: number): DailyCheckIn["stress"] => (n <= 3 ? "low" : n <= 7 ? "medium" : "high");
  const sleepStr = (hrs: number): DailyCheckIn["sleep"] => (hrs <= 6 ? "poor" : hrs === 7 ? "ok" : "good");

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Failed to load stats");
        const data: Array<{
          id: number;
          date: string;
          mood: number;
          energy: number;
          stress: number;
          sleepHours: number;
          timeInNatureMinutes: number;
          steps: number;
          screenTimeMinutes?: number | null;
        }> = await res.json();
        if (canceled) return;
        const list: DailyCheckIn[] = data.map((d) => ({
          date: d.date,
          mood: moodStr(d.mood),
          energy: energyStr(d.energy),
          stress: stressStr(d.stress),
          sleep: sleepStr(d.sleepHours),
          natureMinutes: d.timeInNatureMinutes,
          steps: d.steps,
          screenTime: d.screenTimeMinutes ?? undefined,
        }));
        setEntries(list);
      } catch (e) {
        if (!canceled) setError(e instanceof Error ? e.message : "Could not reach API");
        setEntries(history);
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    load();
    return () => {
      canceled = true;
    };
  }, [history]);

  // Use all available entries for overall preview
  const all = entries.length ? entries : history;
  const sorted = [...all].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
  const sliced = sorted;

  if (sliced.length === 0) {
    return (
      <div className="w-full bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 border border-white/40">
        <h2 className="text-xl font-bold mb-1">Status Overview</h2>
        <p className="text-gray-600">No saved check-in yet. Adjust sliders and click "Save Today’s Status" to see your overview.</p>
      </div>
    );
  }

  const metrics = aggregateMetrics(sliced);
  const overall = Math.round(metrics.reduce((acc, m) => acc + m.percent, 0) / metrics.length);
  const overallColor = overall >= 75 ? "text-green-600" : overall >= 50 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="w-full bg-white/80 animate-fadeIn backdrop-blur rounded-2xl shadow-lg p-6 border border-white/40">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Status Overview</h2>
        <span className={`text-sm font-semibold ${overallColor}`}>Overall: {overall}%</span>
      </div>

      {loading && (<p className="text-sm text-gray-500 mb-2">Syncing from backend…</p>)}
      {error && (
        <div className="mb-3 rounded border border-yellow-300 bg-yellow-50 text-yellow-800 p-3 text-sm">
          Showing local data. Backend: {error}
        </div>
      )}

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
