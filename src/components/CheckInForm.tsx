import {
  Activity,
  Dumbbell,
  Footprints,
  Leaf,
  Monitor,
  Moon,
  Save,
  Smile,
  Zap,
} from "lucide-react";
import {
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  EXERCISE_LABELS,
  EXERCISE_OPTIONS,
  STATS_API_URL,
  energyFromNumber,
  moodFromNumber,
  sleepFromHours,
  stressFromNumber,
  toBackendExerciseType,
} from "../api/stats";
import { useHealthStore } from "../store/healthStore";
import type { DailyCheckIn, ExerciseType } from "../types";
import TagPicker from "./TagPicker";

export default function CheckInForm() {
  const { checkIn, setCheckIn, saveCheckIn, generateStatuses } = useHealthStore();
  const [screenTime, setScreenTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [moodNum, setMoodNum] = useState(5);
  const [energyNum, setEnergyNum] = useState(5);
  const [stressNum, setStressNum] = useState(5);
  const [sleepHours, setSleepHours] = useState(8);
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
  const [exerciseIntensity, setExerciseIntensity] = useState(5);

  const handleChange = <K extends keyof DailyCheckIn>(field: K, value: DailyCheckIn[K]) => {
    setCheckIn({ ...checkIn, [field]: value } as DailyCheckIn);
  };

  const setMoodFromNum = (value: number) => {
    setMoodNum(value);
    handleChange("mood", moodFromNumber(value));
  };

  const setEnergyFromNum = (value: number) => {
    setEnergyNum(value);
    handleChange("energy", energyFromNumber(value));
  };

  const setStressFromNum = (value: number) => {
    setStressNum(value);
    handleChange("stress", stressFromNumber(value));
  };

  const setSleepFromHours = (hours: number) => {
    setSleepHours(hours);
    handleChange("sleep", sleepFromHours(hours));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const parsedScreenTime = screenTime ? Number(screenTime) : undefined;
    const payload = {
      id: 0,
      date: new Date().toISOString(),
      mood: moodNum,
      energy: energyNum,
      stress: stressNum,
      sleepHours,
      timeInNatureMinutes: checkIn.natureMinutes ?? 0,
      steps: checkIn.steps ?? 0,
      screenTimeMinutes: parsedScreenTime ?? null,
      exercises: exerciseTypes.map((type) => ({
        type: toBackendExerciseType(type),
        durationMinutes: 30,
        intensity: exerciseIntensity,
        notes: undefined,
      })),
    };

    try {
      const res = await fetch(STATS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = "Failed to save to backend";
        try {
          const body = await res.json();
          message = body?.title ?? message;
        } catch {
          // Keep the fallback message when the backend response is not JSON.
        }
        throw new Error(message);
      }

      generateStatuses();
    } catch (err) {
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

  return (
    <form onSubmit={handleSubmit} className="dashboard-card checkin-card animate-fadeIn">
      <div className="panel-heading">
        <span className="panel-kicker">
          <Activity className="h-4 w-4" />
          Daily rhythm
        </span>
        <div>
          <h2>Today's Check-In</h2>
          <p>Capture the signals that shape how today feels.</p>
        </div>
      </div>

      <div className="checkin-section">
        <MetricSlider
          icon={<Smile className="h-5 w-5" />}
          label="Mood"
          value={moodNum}
          valueLabel={moodFromNumber(moodNum)}
          min={1}
          max={10}
          onChange={setMoodFromNum}
        />

        <MetricSlider
          icon={<Activity className="h-5 w-5" />}
          label="Stress"
          value={stressNum}
          valueLabel={stressFromNumber(stressNum)}
          min={1}
          max={10}
          onChange={setStressFromNum}
        />

        <MetricSlider
          icon={<Zap className="h-5 w-5" />}
          label="Energy"
          value={energyNum}
          valueLabel={energyFromNumber(energyNum)}
          min={1}
          max={10}
          onChange={setEnergyFromNum}
        />

        <MetricSlider
          icon={<Leaf className="h-5 w-5" />}
          label="Time in nature"
          value={checkIn.natureMinutes ?? 0}
          valueLabel={`${checkIn.natureMinutes ?? 0} min`}
          min={0}
          max={180}
          step={5}
          marks={["0", "60", "120", "180"]}
          onChange={(value) => handleChange("natureMinutes", value)}
        />
      </div>

      <div className="checkin-section checkin-section--compact">
        <FormField
          icon={<Moon className="h-5 w-5" />}
          label="Sleep hours"
          value={`${sleepHours} h`}
        >
          <input
            type="number"
            min={0}
            max={24}
            step={0.5}
            value={sleepHours}
            onChange={(event) => setSleepFromHours(Number(event.target.value))}
            className="wellness-input"
          />
        </FormField>

        <FormField
          icon={<Dumbbell className="h-5 w-5" />}
          label="Exercise"
          value={`Intensity ${exerciseIntensity}`}
        >
          <div className="exercise-stack">
            <TagPicker
              options={EXERCISE_OPTIONS}
              value={exerciseTypes}
              onChange={setExerciseTypes}
              labelFormatter={(option) => EXERCISE_LABELS[option]}
            />
            <MetricSlider
              label="Intensity"
              value={exerciseIntensity}
              valueLabel={`${exerciseIntensity}/10`}
              min={1}
              max={10}
              compact
              onChange={setExerciseIntensity}
            />
          </div>
        </FormField>

        <FormField
          icon={<Footprints className="h-5 w-5" />}
          label="Steps"
          value={(checkIn.steps ?? 0).toLocaleString()}
          helper="Typical range: 0-20,000 steps"
        >
          <input
            type="number"
            min={0}
            max={20000}
            inputMode="numeric"
            value={checkIn.steps ?? 0}
            onChange={(event) => {
              const steps = Math.max(0, Math.min(20000, Number(event.target.value)));
              handleChange("steps", steps);
            }}
            placeholder="e.g., 8000"
            className="wellness-input"
          />
        </FormField>

        <FormField
          icon={<Monitor className="h-5 w-5" />}
          label="Screen time"
          value={screenTime ? `${screenTime} min` : "Optional"}
          helper="Minutes of screen time today"
        >
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={screenTime}
            onChange={(event) => setScreenTime(event.target.value)}
            placeholder="e.g., 120"
            className="wellness-input"
          />
        </FormField>
      </div>

      {error && (
        <div className="form-alert" role="status">
          {error}
        </div>
      )}

      <button type="submit" disabled={submitting} className="primary-action">
        <Save className="h-5 w-5" />
        {submitting ? "Saving..." : "Save Today's Status"}
      </button>
    </form>
  );
}

type RangeStyle = CSSProperties & {
  "--range-progress": string;
};

type MetricSliderProps = {
  label: string;
  value: number;
  valueLabel: string;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  icon?: ReactNode;
  marks?: string[];
  compact?: boolean;
};

function MetricSlider({
  label,
  value,
  valueLabel,
  min,
  max,
  step = 1,
  onChange,
  icon,
  marks,
  compact = false,
}: MetricSliderProps) {
  const progress = ((value - min) / (max - min)) * 100;
  const rangeStyle: RangeStyle = {
    "--range-progress": `${Math.max(0, Math.min(100, progress))}%`,
  };

  return (
    <section className={compact ? "metric-row metric-row--compact" : "metric-row"}>
      <div className="metric-row__header">
        <div className="metric-row__label">
          {icon && <span className="metric-row__icon">{icon}</span>}
          <span>{label}</span>
        </div>
        <span className="metric-row__value">{valueLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="wellness-range"
        style={rangeStyle}
        aria-label={label}
      />
      {marks && (
        <div className="range-marks">
          {marks.map((mark) => (
            <span key={mark}>{mark}</span>
          ))}
        </div>
      )}
    </section>
  );
}

type FormFieldProps = {
  icon: ReactNode;
  label: string;
  value: string;
  helper?: string;
  children: ReactNode;
};

function FormField({ icon, label, value, helper, children }: FormFieldProps) {
  return (
    <section className="form-field">
      <div className="form-field__meta">
        <span className="form-field__icon">{icon}</span>
        <div>
          <div className="form-field__title">{label}</div>
          {helper && <p>{helper}</p>}
        </div>
      </div>
      <div className="form-field__control">
        <span className="form-field__value">{value}</span>
        {children}
      </div>
    </section>
  );
}
