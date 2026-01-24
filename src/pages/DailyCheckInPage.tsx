import { useEffect, useState } from "react";

type ExerciseType =
  | "UpperBody"
  | "LowerBody"
  | "Mobility"
  | "Cardio"
  | "StrengthTraining";

interface Exercise {
  type: ExerciseType;
  durationMinutes: number;
  intensity: number;
  notes?: string;
}

interface DailyStat {
  id: number;
  date: string;
  mood: number;
  energy: number;
  stress: number;
  sleepHours: number;
  timeInNatureMinutes: number;
  steps: number;
  screenTimeMinutes?: number | null;
  exercises: Exercise[];
}

const API_URL = "https://localhost:7016/api/stats";

export default function DailyCheckInPage() {
  // UI state
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // form state
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [sleepHours, setSleepHours] = useState(8);
  const [natureMinutes, setNatureMinutes] = useState(30);
  const [steps, setSteps] = useState(5000);
  const [screenTime, setScreenTime] = useState<number | "">("");
  const [exerciseType, setExerciseType] = useState<ExerciseType>("UpperBody");
  const [exerciseDuration, setExerciseDuration] = useState(30);
  const [exerciseIntensity, setExerciseIntensity] = useState(5);

  // data
  const [stats, setStats] = useState<DailyStat[]>([]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);

      if (!res.ok) {
        throw new Error("Failed to load stats");
      }

      const data = await res.json();
      setStats(data);
    } catch {
      setError("Could not load stats. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const submit = async () => {
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        date: new Date().toISOString(),
        mood,
        energy,
        stress,
        sleepHours,
        timeInNatureMinutes: natureMinutes,
        steps,
        screenTimeMinutes: screenTime === "" ? null : screenTime,
        exercises: [
          {
            type: exerciseType,
            durationMinutes: exerciseDuration,
            intensity: exerciseIntensity,
            notes: "Test entry"
          }
        ]
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.title ?? "Failed to save daily stat");
      }

      await fetchStats();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not reach the API. Is the backend running?"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Daily Check-In</h2>

      <div className="space-y-4">
        <Field label={`Mood: ${mood}`}>
          <input type="range" min={1} max={10} value={mood} onChange={e => setMood(+e.target.value)} />
        </Field>

        <Field label={`Energy: ${energy}`}>
          <input type="range" min={1} max={10} value={energy} onChange={e => setEnergy(+e.target.value)} />
        </Field>

        <Field label={`Stress: ${stress}`}>
          <input type="range" min={1} max={10} value={stress} onChange={e => setStress(+e.target.value)} />
        </Field>

        <Field label="Sleep hours">
          <input type="number" className="input" value={sleepHours} onChange={e => setSleepHours(+e.target.value)} />
        </Field>

        <Field label="Time in nature (minutes)">
          <input type="number" className="input" value={natureMinutes} onChange={e => setNatureMinutes(+e.target.value)} />
        </Field>

        <Field label="Steps">
          <input type="number" className="input" value={steps} onChange={e => setSteps(+e.target.value)} />
        </Field>

        <Field label="Screen time (optional)">
          <input
            type="number"
            className="input"
            value={screenTime}
            onChange={e => setScreenTime(e.target.value === "" ? "" : +e.target.value)}
          />
        </Field>

        <hr />

        <h3 className="text-lg font-medium">Exercise</h3>

        <Field label="Type">
          <select className="input" value={exerciseType} onChange={e => setExerciseType(e.target.value as ExerciseType)}>
            <option value="UpperBody">Upper Body</option>
            <option value="LowerBody">Lower Body</option>
            <option value="Mobility">Mobility</option>
            <option value="Cardio">Cardio</option>
            <option value="StrengthTraining">Strength Training</option>
          </select>
        </Field>

        <Field label="Duration (minutes)">
          <input type="number" className="input" value={exerciseDuration} onChange={e => setExerciseDuration(+e.target.value)} />
        </Field>

        <Field label={`Intensity: ${exerciseIntensity}`}>
          <input type="range" min={1} max={10} value={exerciseIntensity} onChange={e => setExerciseIntensity(+e.target.value)} />
        </Field>

        {error && (
          <div className="rounded border border-red-300 bg-red-50 text-red-700 p-3 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Saving…" : "Save Daily Check-In"}
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Saved Entries</h3>

        {loading && <p className="text-sm text-gray-500">Loading…</p>}

        {stats.map(stat => (
          <div key={stat.id} className="border rounded p-4 space-y-1">
            <div className="font-medium">{new Date(stat.date).toDateString()}</div>
            <div className="text-sm">Mood: {stat.mood}</div>
            <div className="text-sm">Energy: {stat.energy}</div>
            <div className="text-sm">Stress: {stat.stress}</div>
            <div className="text-sm">Steps: {stat.steps}</div>

            {stat.exercises.length > 0 && (
              <ul className="mt-2 list-disc list-inside text-sm">
                {stat.exercises.map((ex, i) => (
                  <li key={i}>
                    {ex.type} – {ex.durationMinutes} min (intensity {ex.intensity})
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
