import { CircleAlert, CircleCheck, Info, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getStatsInsights, type InsightTone, type StatsInsight } from "../api/stats";
import { useHealthStore } from "../store/healthStore";

const toneClass: Record<InsightTone, string> = {
  Neutral: "care-note",
  Notice: "care-note care-note--notice",
  Positive: "care-note care-note--positive",
  Caution: "care-note care-note--warning",
};

const iconForTone = (tone: InsightTone) => {
  if (tone === "Positive") return CircleCheck;
  if (tone === "Caution") return CircleAlert;
  if (tone === "Notice") return Sparkles;
  return Info;
};

export default function StatusPanel() {
  const statsVersion = useHealthStore((state) => state.statsVersion);
  const [insights, setInsights] = useState<StatsInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getStatsInsights(30);
        if (!canceled) setInsights(data);
      } catch (caughtError) {
        if (!canceled) {
          setInsights([]);
          setError(caughtError instanceof Error ? caughtError.message : "Could not load insights");
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

  return (
    <section className="dashboard-card care-panel animate-fadeIn">
      <div className="panel-heading">
        <span className="panel-kicker">Insights</span>
        <div>
          <h2>Today&apos;s Signals</h2>
          <p>Notes from your last 30 days of check-ins.</p>
        </div>
      </div>

      {loading && <p className="sync-note">Loading insights...</p>}
      {error && (
        <div className="soft-alert" role="status">
          {error}
        </div>
      )}

      {!loading && !error && insights.length === 0 && (
        <div className="care-note">
          <div className="care-note__icon">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h3>No insights yet</h3>
            <p>Save check-ins to see patterns here.</p>
          </div>
        </div>
      )}

      {insights.length > 0 && (
        <div className="care-list">
          {insights.map((insight, index) => {
            const Icon = iconForTone(insight.tone);
            return (
              <article
                key={`${insight.type}-${index}`}
                className={toneClass[insight.tone]}
              >
                <div className="care-note__icon">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3>{insight.title}</h3>
                  <p>{insight.message}</p>
                  {insight.consideration && <strong>{insight.consideration}</strong>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
