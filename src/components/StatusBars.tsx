import {
  AlertTriangle,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Bed,
  Frown,
  Leaf,
  Meh,
  Smile,
} from "lucide-react";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  STATS_API_URL,
  fromBackendStat,
  type BackendDailyStat,
} from "../api/stats";
import { useHealthStore } from "../store/healthStore";
import type { DailyCheckIn } from "../types";

type MetricTone = "good" | "okay" | "attention";

type Metric = {
  key: "sleep" | "mood" | "stress" | "energy" | "nature";
  label: string;
  valueLabel: string;
  percent: number;
  tone: MetricTone;
  icon: ReactNode;
};

function toneFromPercent(percent: number): MetricTone {
  if (percent >= 75) return "good";
  if (percent >= 50) return "okay";
  return "attention";
}

function aggregateMetrics(entries: DailyCheckIn[]): Metric[] {
  const sleepMap = { poor: 33, ok: 66, good: 100 } as const;
  const moodMap = { low: 33, neutral: 66, good: 100 } as const;
  const stressMap = { low: 100, medium: 66, high: 33 } as const;
  const energyMap = { low: 33, medium: 66, high: 100 } as const;
  const natureTarget = 60;

  const avg = (nums: number[]) =>
    nums.length ? nums.reduce((sum, value) => sum + value, 0) / nums.length : 0;

  const sleepAvg = avg(entries.map((entry) => sleepMap[entry.sleep]));
  const moodAvg = avg(entries.map((entry) => moodMap[entry.mood]));
  const stressAvg = avg(entries.map((entry) => stressMap[entry.stress]));
  const energyAvg = avg(entries.map((entry) => energyMap[entry.energy]));
  const natureAvgMin = avg(
    entries.map((entry) =>
      typeof entry.natureMinutes === "number" ? entry.natureMinutes : 0
    )
  );
  const naturePercent = Math.min(100, Math.round((natureAvgMin / natureTarget) * 100));

  const moodIcon =
    moodAvg >= 75 ? (
      <Smile className="h-5 w-5" />
    ) : moodAvg >= 50 ? (
      <Meh className="h-5 w-5" />
    ) : (
      <Frown className="h-5 w-5" />
    );
  const energyIcon =
    energyAvg >= 75 ? (
      <BatteryFull className="h-5 w-5" />
    ) : energyAvg >= 50 ? (
      <BatteryMedium className="h-5 w-5" />
    ) : (
      <BatteryLow className="h-5 w-5" />
    );

  const metric = (
    key: Metric["key"],
    label: string,
    valueLabel: string,
    percent: number,
    icon: ReactNode
  ): Metric => {
    const rounded = Math.round(percent);
    return {
      key,
      label,
      valueLabel,
      percent: rounded,
      tone: toneFromPercent(rounded),
      icon,
    };
  };

  return [
    metric(
      "sleep",
      "Sleep",
      sleepAvg >= 75 ? "good" : sleepAvg >= 50 ? "ok" : "poor",
      sleepAvg,
      <Bed className="h-5 w-5" />
    ),
    metric(
      "mood",
      "Mood",
      moodAvg >= 75 ? "good" : moodAvg >= 50 ? "neutral" : "low",
      moodAvg,
      moodIcon
    ),
    metric(
      "stress",
      "Stress",
      stressAvg >= 75 ? "low" : stressAvg >= 50 ? "medium" : "high",
      stressAvg,
      <AlertTriangle className="h-5 w-5" />
    ),
    metric(
      "energy",
      "Energy",
      energyAvg >= 75 ? "high" : energyAvg >= 50 ? "medium" : "low",
      energyAvg,
      energyIcon
    ),
    metric(
      "nature",
      "Nature",
      `${Math.round(natureAvgMin)} min avg`,
      naturePercent,
      <Leaf className="h-5 w-5" />
    ),
  ];
}

type ScoreStyle = CSSProperties & {
  "--score": string;
  "--score-color": string;
};

const scoreColor: Record<MetricTone, string> = {
  good: "#159b70",
  okay: "#c98616",
  attention: "#d75a45",
};

export default function StatusBars() {
  const { history } = useHealthStore();
  const [entries, setEntries] = useState<DailyCheckIn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(STATS_API_URL);
        if (!res.ok) throw new Error("Failed to load stats");
        const data: BackendDailyStat[] = await res.json();
        if (canceled) return;
        setEntries(data.map(fromBackendStat));
      } catch (err) {
        if (!canceled) {
          setError(err instanceof Error ? err.message : "Could not reach API");
          setEntries(history);
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    load();
    return () => {
      canceled = true;
    };
  }, [history]);

  const all = entries.length ? entries : history;
  const sorted = [...all].sort(
    (a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
  );

  if (sorted.length === 0) {
    return (
      <section className="dashboard-card status-overview status-overview--empty">
        <div className="panel-heading">
          <span className="panel-kicker">
            <Leaf className="h-4 w-4" />
            Overview
          </span>
          <div>
            <h2>Status Overview</h2>
            <p>Save a check-in to see your wellness trends here.</p>
          </div>
        </div>
      </section>
    );
  }

  const metrics = aggregateMetrics(sorted);
  const overall = Math.round(
    metrics.reduce((acc, metric) => acc + metric.percent, 0) / metrics.length
  );
  const overallTone = toneFromPercent(overall);
  const scoreStyle: ScoreStyle = {
    "--score": `${overall * 3.6}deg`,
    "--score-color": scoreColor[overallTone],
  };

  return (
    <section className="dashboard-card status-overview animate-fadeIn">
      <div className="status-overview__top">
        <div className="panel-heading">
          <span className="panel-kicker">
            <Leaf className="h-4 w-4" />
            Overview
          </span>
          <div>
            <h2>Status Overview</h2>
            <p>{sorted.length} saved check-in{sorted.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        <div className={`score-ring score-ring--${overallTone}`} style={scoreStyle}>
          <span>{overall}%</span>
          <small>overall</small>
        </div>
      </div>

      {loading && <p className="sync-note">Syncing from backend...</p>}
      {error && (
        <div className="soft-alert" role="status">
          Showing local data. Backend: {error}
        </div>
      )}

      <div className="metric-list">
        {metrics.map((metric) => (
          <div key={metric.key} className="metric-item">
            <div className="metric-item__meta">
              <span className={`metric-item__icon metric-item__icon--${metric.tone}`}>
                {metric.icon}
              </span>
              <div>
                <div className="metric-item__label">{metric.label}</div>
                <div className="metric-item__value">{metric.valueLabel}</div>
              </div>
            </div>
            <div className="metric-item__track" aria-hidden>
              <span
                className={`metric-item__bar metric-item__bar--${metric.tone}`}
                style={{ width: `${metric.percent}%` }}
              />
            </div>
            <span className="metric-item__percent">{metric.percent}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
