import { CircleAlert, CircleCheck } from "lucide-react";
import { useHealthStore } from "../store/healthStore";

export default function StatusPanel() {
  const { statuses } = useHealthStore();

  if (!statuses || statuses.length === 0) return null;

  return (
    <section className="dashboard-card care-panel animate-fadeIn">
      <div className="panel-heading">
        <span className="panel-kicker">Care notes</span>
        <div>
          <h2>Today&apos;s Signals</h2>
          <p>Small prompts based on your latest check-in.</p>
        </div>
      </div>

      <div className="care-list">
        {statuses.map((status) => {
          const isWarning = status.severity === "warning";
          const Icon = isWarning ? CircleAlert : CircleCheck;

          return (
            <article
              key={status.id}
              className={isWarning ? "care-note care-note--warning" : "care-note"}
            >
              <div className="care-note__icon">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3>{status.label}</h3>
                <p>{status.description}</p>
                <strong>{status.advice}</strong>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
