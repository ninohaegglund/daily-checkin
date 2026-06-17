import {
  Activity,
  AlertTriangle,
  BatteryFull,
  Bed,
  Footprints,
  Leaf,
  Monitor,
  Smile,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";
import { getStatsOverview, type StatsOverview } from "../api/stats";
import { useHealthStore } from "../store/healthStore";

type MetricTone = "good" | "okay" | "attention";

type Metric = {
  key: "sleep" | "mood" | "stress" | "energy" | "nature" | "steps" | "screen";
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

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const scorePercent = (value: number) => clampPercent((value / 10) * 100);

const inverseScorePercent = (value: number) => clampPercent(((10 - value) / 9) * 100);

const formatAverage = (value: number, suffix: string) => `${value.toFixed(1)} ${suffix} avg`;

const formatDateRange = (overview: StatsOverview) => {
  const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
  return `${formatter.format(new Date(overview.startDate))} - ${formatter.format(
    new Date(overview.endDate)
  )}`;
};

function overviewMetrics(overview: StatsOverview): Metric[] {
  const metric = (
    key: Metric["key"],
    label: string,
    valueLabel: string,
    percent: number,
    icon: ReactNode
  ): Metric => {
    const rounded = clampPercent(percent);
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
      "mood",
      "Mood",
      formatAverage(overview.averageMood, "/10"),
      scorePercent(overview.averageMood),
      <Smile className="h-5 w-5" />
    ),
    metric(
      "energy",
      "Energy",
      formatAverage(overview.averageEnergy, "/10"),
      scorePercent(overview.averageEnergy),
      <BatteryFull className="h-5 w-5" />
    ),
    metric(
      "stress",
      "Stress",
      formatAverage(overview.averageStress, "/10"),
      inverseScorePercent(overview.averageStress),
      <AlertTriangle className="h-5 w-5" />
    ),
    metric(
      "sleep",
      "Sleep",
      formatAverage(overview.averageSleep, "h"),
      clampPercent((overview.averageSleep / 8) * 100),
      <Bed className="h-5 w-5" />
    ),
    metric(
      "nature",
      "Nature",
      `${Math.round(overview.averageNatureTime)} min avg`,
      clampPercent((overview.averageNatureTime / 60) * 100),
      <Leaf className="h-5 w-5" />
    ),
    metric(
      "steps",
      "Steps",
      `${Math.round(overview.averageSteps).toLocaleString()} avg`,
      clampPercent((overview.averageSteps / 7000) * 100),
      <Footprints className="h-5 w-5" />
    ),
    metric(
      "screen",
      "Screen time",
      `${Math.round(overview.averageScreenTime)} min avg`,
      clampPercent(100 - (overview.averageScreenTime / 480) * 100),
      <Monitor className="h-5 w-5" />
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

const visibleMetricCount = 3;

export default function StatusBars() {
  const statsVersion = useHealthStore((state) => state.statsVersion);
  const hiddenMetricsId = useId();
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [metricsExpanded, setMetricsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getStatsOverview(30);
        if (!canceled) setOverview(data);
      } catch (caughtError) {
        if (!canceled) {
          setOverview(null);
          setError(caughtError instanceof Error ? caughtError.message : "Could not load overview");
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    void load();

    return () => {
      canceled = true;
    };
  }, [statsVersion]);

  if (loading && !overview) {
    return (
      <section className="dashboard-card status-overview status-overview--empty">
        <div className="panel-heading">
          <span className="panel-kicker">
            <Leaf className="h-4 w-4" />
            Overview
          </span>
          <div>
            <h2>Status Overview</h2>
            <p>Loading your wellness summary.</p>
          </div>
        </div>
      </section>
    );
  }

  if (!overview || overview.checkInCount === 0) {
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
        {error && (
          <div className="soft-alert" role="status">
            {error}
          </div>
        )}
      </section>
    );
  }

  const metrics = overviewMetrics(overview);
  const visibleMetrics = metrics.slice(0, visibleMetricCount);
  const hiddenMetrics = metrics.slice(visibleMetricCount);
  const hiddenMetricCount = hiddenMetrics.length;
  const hasHiddenMetrics = hiddenMetricCount > 0;
  const overall = clampPercent(overview.overallWellnessScore);
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
            <p>
              {overview.checkInCount} saved check-in
              {overview.checkInCount === 1 ? "" : "s"} over {formatDateRange(overview)}
            </p>
          </div>
        </div>
        <div className={`score-ring score-ring--${overallTone}`} style={scoreStyle}>
          <span>{overall}%</span>
          <small>overall</small>
        </div>
      </div>

      {loading && <p className="sync-note">Syncing overview...</p>}
      {error && (
        <div className="soft-alert" role="status">
          {error}
        </div>
      )}

      <div className="overview-streaks">
        <span>
          <Activity className="h-4 w-4" />
          Current {overview.currentStreak}d
        </span>
        <span>
          <Activity className="h-4 w-4" />
          Best {overview.bestStreak}d
        </span>
      </div>

      <div className="metric-list">
        {visibleMetrics.map((metric) => (
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
        {hasHiddenMetrics && (
          <div
            id={hiddenMetricsId}
            aria-hidden={!metricsExpanded}
            className={`metric-list__expandable${
              metricsExpanded ? " metric-list__expandable--open" : ""
            }`}
          >
            <div className="metric-list__expandable-inner">
              {hiddenMetrics.map((metric) => (
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
          </div>
        )}
      </div>

      {hasHiddenMetrics && (
        <button
          type="button"
          className="metric-toggle"
          aria-expanded={metricsExpanded}
          aria-controls={hiddenMetricsId}
          onClick={() => setMetricsExpanded((isExpanded) => !isExpanded)}
        >
          {metricsExpanded ? (
            <>
              Show fewer metrics
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Show {hiddenMetricCount} more metric{hiddenMetricCount === 1 ? "" : "s"}
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </section>
  );
}
