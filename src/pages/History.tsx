import { useHealthStore } from "../store/healthStore";
import { useMemo, useState } from "react";

type MetricKey = "sleep" | "mood" | "stress" | "energy";

const metricLabel: Record<MetricKey, string> = {
  sleep: "Sleep",
  mood: "Mood",
  stress: "Stress",
  energy: "Energy",
};

const toScore = (k: MetricKey, v: string): number => {
  if (k === "sleep") return v === "good" ? 3 : v === "ok" ? 2 : 1;
  if (k === "mood") return v === "good" ? 3 : v === "neutral" ? 2 : 1;
  if (k === "stress") return v === "low" ? 3 : v === "medium" ? 2 : 1; // inverted
  if (k === "energy") return v === "high" ? 3 : v === "medium" ? 2 : 1;
  return 1;
};

const formatDateShort = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";

export default function HistoryPage() {
  const { history, clearHistory } = useHealthStore();
  const [metric, setMetric] = useState<MetricKey>("mood");
  const [range, setRange] = useState<"7" | "14" | "30" | "all">("7");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!history.length) {
    return (
      <div className="w-full bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 border border-white/40">
        <h2 className="text-xl font-bold mb-2">History</h2>
        <p className="text-gray-600">No saved check-ins yet. Save today's status to see your history here.</p>
      </div>
    );
  }

  const maxItems = range === "all" ? Number.POSITIVE_INFINITY : Number(range);
  const sorted = useMemo(
    () => [...history].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()),
    [history]
  );
  const sliced = sorted.slice(Math.max(0, sorted.length - (isFinite(maxItems) ? maxItems : sorted.length)));

  // Chart geometry
  const width = 600;
  const height = 160;
  const padding = 16;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const n = Math.max(1, sliced.length);
  const xStep = n > 1 ? innerW / (n - 1) : 0;

  const points = sliced.map((e, i) => {
    const score = toScore(metric, String(e[metric])); // 1..3
    const y = padding + innerH - ((score - 1) / 2) * innerH; // map 1..3 to bottom..top
    const x = padding + i * xStep;
    return { x, y, label: formatDateShort(e.date) };
  });
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  const avg =
    sliced.length === 0
      ? 0
      : sliced.reduce((acc, e) => acc + toScore(metric, String(e[metric])), 0) / sliced.length; // 1..3
  const avgY = padding + innerH - ((avg - 1) / 2) * innerH;

  return (
    <div className="w-full bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 border border-white/40">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold">History</h2>
        <div className="flex items-center gap-3">
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as MetricKey)}
            className="p-2 rounded-md border border-gray-300 text-sm"
          >
            <option value="mood">Mood</option>
            <option value="sleep">Sleep</option>
            <option value="stress">Stress</option>
            <option value="energy">Energy</option>
          </select>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as any)}
            className="p-2 rounded-md border border-gray-300 text-sm"
          >
            <option value="7">Last 7</option>
            <option value="14">Last 14</option>
            <option value="30">Last 30</option>
            <option value="all">All</option>
          </select>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Are you sure you want to clear your history?")) {
                clearHistory();
              }
            }}
            className="px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
            disabled={!history.length}
          >
            Clear history
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-gray-800">{metricLabel[metric]} trend</div>
          <div className="text-xs text-gray-500">Higher is better</div>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
          {/* grid lines */}
          <line x1={0} y1={height - 32} x2={width} y2={height - 32} className="stroke-gray-200" />
          <line x1={0} y1={height / 2} x2={width} y2={height / 2} className="stroke-gray-200" />
          <line x1={0} y1={32} x2={width} y2={32} className="stroke-gray-200" />

          {/* area + path */}
          {points.length > 0 && (
            <>
              <path d={`${path} L ${points[points.length - 1]?.x},${height - 16} L ${points[0]?.x},${height - 16} Z`} fill="#10b98111" />
              <path d={path} fill="none" stroke="#10b981" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
            </>
          )}
          {/* average line */}
          {sliced.length > 0 && (
            <line x1={16} y1={avgY} x2={width - 16} y2={avgY} className="stroke-emerald-400" strokeDasharray="4 4" />
          )}
          {/* points */}
          {points.map((p, i) => (
            <g key={i} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
              <circle cx={p.x} cy={p.y} r={4} fill="#10b981" />
              <circle cx={p.x} cy={p.y} r={10} fill="transparent" />
            </g>
          ))}

          {/* x labels */}
          {points.map((p, i) => (
            <text key={`t${i}`} x={p.x} y={height - 6} textAnchor="middle" className="fill-gray-500 text-[10px]">
              {p.label}
            </text>
          ))}
        </svg>

        {hoverIndex !== null && points[hoverIndex] && (
          <div className="mt-2 text-sm text-gray-700">
            <span className="font-semibold">{metricLabel[metric]}:</span> {formatDateShort(sliced[hoverIndex]?.date)} ·
            <span className="ml-1">Score {toScore(metric, String(sliced[hoverIndex]?.[metric]))}</span>
          </div>
        )}
      </div>

      {/* Weekly streaks */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="font-semibold text-gray-800 mb-2">Weekly streaks</div>
        <StreakBadges history={history} />
      </div>

      {/* List */}
      <div className="divide-y divide-gray-200/70">
        {[...sliced].reverse().map((entry, idx) => (
          <div key={idx} className="py-4 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-sm text-gray-500">{new Date(entry.date || 0).toLocaleString()}</div>
              <div className="text-gray-800 font-medium">
                Sleep: <span className="text-gray-700">{entry.sleep}</span> · Mood: <span className="text-gray-700">{entry.mood}</span> · Stress: <span className="text-gray-700">{entry.stress}</span> · Energy: <span className="text-gray-700">{entry.energy}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StreakBadges({ history }: { history: Array<{ date?: string }> }) {
  const days = [...history]
    .map((h) => new Date(h.date || 0))
    .map((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime())
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .sort((a, b) => a - b);

  const now = new Date();
  const todayKey = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let current = 0;
  let cursor = todayKey;
  const oneDay = 24 * 60 * 60 * 1000;
  while (days.includes(cursor)) {
    current++;
    cursor -= oneDay;
  }

  let best = 0;
  for (let i = 0; i < days.length; ) {
    let len = 1;
    while (i + len < days.length && days[i + len] - days[i + len - 1] === oneDay) len++;
    if (len > best) best = len;
    i += len;
  }

  const last7Start = todayKey - 6 * oneDay;
  const last7 = days.filter((d) => d >= last7Start).length;

  return (
    <div className="flex flex-wrap gap-3">
      <Badge label="Current streak" value={`${current} day${current === 1 ? "" : "s"}`} color="emerald" />
      <Badge label="Best streak" value={`${best} day${best === 1 ? "" : "s"}`} color="blue" />
      <Badge label="Last 7 days" value={`${last7} day${last7 === 1 ? "" : "s"}`} color="purple" />
    </div>
  );
}

function Badge({ label, value, color }: { label: string; value: string; color: "emerald" | "blue" | "purple" }) {
  const palettes: Record<string, { bg: string; text: string; ring: string }> = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
    blue: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200" },
    purple: { bg: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-200" },
  };
  const p = palettes[color];
  return (
    <div className={`px-3 py-2 rounded-lg ${p.bg} ${p.text} ring-1 ${p.ring} shadow-sm`}>
      <span className="text-xs uppercase tracking-wide">{label}</span>
      <span className="ml-2 font-semibold">{value}</span>
    </div>
  );
}
