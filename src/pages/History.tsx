import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, TriangleAlert, X } from "lucide-react";
import type { DailyCheckIn } from "../types";
import TagPicker from "../components/TagPicker";
import {
  ENERGY_LABELS,
  EXERCISE_LABELS,
  EXERCISE_OPTIONS,
  MOOD_LABELS,
  STRESS_LABELS,
  deleteStat,
  fromBackendStat,
  listStats,
  toBackendStat,
  updateStat,
} from "../api/stats";
import { useHealthStore } from "../store/healthStore";

type MetricKey = "sleep" | "mood" | "stress" | "energy" | "nature" | "steps";
type RangeOption = "7" | "14" | "30" | "all";

const metricLabel: Record<MetricKey, string> = {
  sleep: "Sleep",
  mood: "Mood",
  stress: "Stress",
  energy: "Energy",
  nature: "Nature",
  steps: "Steps",
};

const colorMap: Record<MetricKey, string> = {
  mood: "#8b5cf6", // violet-500
  sleep: "#06b6d4", // cyan-500
  stress: "#ef4444", // red-500
  energy: "#f59e0b", // amber-500
  nature: "#10b981", // emerald-500
  steps: "#3b82f6", // blue-500
};

const moodOptions: Array<{ value: DailyCheckIn["mood"]; label: string }> = [
  { value: "very-low", label: MOOD_LABELS["very-low"] },
  { value: "low", label: MOOD_LABELS.low },
  { value: "neutral", label: MOOD_LABELS.neutral },
  { value: "good", label: MOOD_LABELS.good },
  { value: "very-good", label: MOOD_LABELS["very-good"] },
];

const stressOptions: Array<{ value: DailyCheckIn["stress"]; label: string }> = [
  { value: "very-low", label: STRESS_LABELS["very-low"] },
  { value: "low", label: STRESS_LABELS.low },
  { value: "medium", label: STRESS_LABELS.medium },
  { value: "high", label: STRESS_LABELS.high },
  { value: "very-high", label: STRESS_LABELS["very-high"] },
];

const energyOptions: Array<{ value: DailyCheckIn["energy"]; label: string }> = [
  { value: "very-low", label: ENERGY_LABELS["very-low"] },
  { value: "low", label: ENERGY_LABELS.low },
  { value: "medium", label: ENERGY_LABELS.medium },
  { value: "high", label: ENERGY_LABELS.high },
  { value: "very-high", label: ENERGY_LABELS["very-high"] },
];

const metricMaxScore = (k: MetricKey): number =>
  k === "mood" || k === "stress" || k === "energy" ? 5 : 3;

const toScore = (k: MetricKey, v: string | number): number => {
  if (k === "sleep") return v === "good" ? 3 : v === "ok" ? 2 : 1;
  if (k === "mood") {
    if (v === "very-good") return 5;
    if (v === "good") return 4;
    if (v === "neutral") return 3;
    if (v === "low") return 2;
    return 1;
  }
  if (k === "stress") {
    if (v === "very-low") return 5;
    if (v === "low") return 4;
    if (v === "medium") return 3;
    if (v === "high") return 2;
    return 1;
  }
  if (k === "energy") {
    if (v === "very-high") return 5;
    if (v === "high") return 4;
    if (v === "medium") return 3;
    if (v === "low") return 2;
    return 1;
  }
  if (k === "nature") {
    const n = typeof v === "number" ? v : 0;
    return n >= 60 ? 3 : n >= 30 ? 2 : 1;
  }
  if (k === "steps") {
    const n = typeof v === "number" ? v : 0;
    return n >= 7000 ? 3 : n >= 3500 ? 2 : 1;
  }
  return 1;
};

const formatDateShort = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";

const getMetricValue = (entry: DailyCheckIn, key: MetricKey): string | number => {
  if (key === "nature") return entry.natureMinutes ?? 0;
  if (key === "steps") return entry.steps ?? 0;
  return entry[key];
};

const formatMood = (value: DailyCheckIn["mood"]) => MOOD_LABELS[value];

const formatStress = (value: DailyCheckIn["stress"]) => STRESS_LABELS[value];

const formatEnergy = (value: DailyCheckIn["energy"]) => ENERGY_LABELS[value];

export default function HistoryPage() {
  const { statsVersion, markStatsChanged } = useHealthStore();
  const [entries, setEntries] = useState<DailyCheckIn[]>([]);
  const [idByDate, setIdByDate] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<MetricKey>("mood");
  const [range, setRange] = useState<RangeOption>("7");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [details, setDetails] = useState<DailyCheckIn | null>(null);
  const [editing, setEditing] = useState<DailyCheckIn | null>(null);
  const isEmpty = entries.length === 0;

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listStats();
        if (canceled) return;
        const converted = data.map(fromBackendStat);
        setEntries(converted);
        setIdByDate(new Map(data.map((s) => [s.date, s.id])));
      } catch (e) {
        setEntries([]);
        setIdByDate(new Map());
        if (e instanceof Error) setError(e.message);
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    load();
    return () => { canceled = true; };
  }, [statsVersion]);

  // Always render the page; show notice/overlay when empty

  const maxItems = range === "all" ? Number.POSITIVE_INFINITY : Number(range);
  const sorted = useMemo(
    () => [...entries].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()),
    [entries]
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
  const scoreToY = (score: number, k: MetricKey) =>
    padding + innerH - ((score - 1) / (metricMaxScore(k) - 1)) * innerH;

  const points = sliced.map((e, i) => {
    const val = getMetricValue(e, metric);
    const score = toScore(metric, val);
    const y = scoreToY(score, metric);
    const x = padding + i * xStep;
    return { x, y, label: formatDateShort(e.date) };
  });
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  const avg =
    sliced.length === 0
      ? 0
      : sliced.reduce((acc, e) => {
          const val = getMetricValue(e, metric);
          return acc + toScore(metric, val);
        }, 0) / sliced.length;
  const avgY = scoreToY(avg, metric);

  const pointsFor = (m: MetricKey) => {
    const pts = sliced.map((e, i) => {
      const val = getMetricValue(e, m);
      const score = toScore(m, val);
      const y = scoreToY(score, m);
      const x = padding + i * xStep;
      return { x, y };
    });
    const p = pts.map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" ");
    return { pts, p };
  };

  return (
    <div className="dashboard-card history-card animate-fadeIn">
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
            <option value="nature">Nature</option>
            <option value="steps">Steps</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
            />
            All metrics
          </label>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as RangeOption)}
            className="p-2 rounded-md border border-gray-300 text-sm"
          >
            <option value="7">Last 7</option>
            <option value="14">Last 14</option>
            <option value="30">Last 30</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {loading && (<p className="text-sm text-gray-500 mb-2">Syncing from backend...</p>)}
      {error && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}

      {/* Empty-state notice */}
      {isEmpty && (
        <div className="w-full mb-4 rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-800 p-3">
          No saved check-ins yet. Save today's status to see your history here.
        </div>
      )}

      {/* Mini-cards for nature and steps (latest entry) */}
      <MiniCards history={entries} />

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6 relative">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-gray-800">{metricLabel[metric]} trend</div>
          <div className="text-xs text-gray-500">Higher is better</div>
        </div>
        <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
          {/* grid lines */}
          <line x1={0} y1={height - 32} x2={width} y2={height - 32} className="stroke-gray-200" />
          <line x1={0} y1={height / 2} x2={width} y2={height / 2} className="stroke-gray-200" />
          <line x1={0} y1={32} x2={width} y2={32} className="stroke-gray-200" />

          {/* area + path (single metric) or multi-series lines */}
          {!showAll && points.length > 0 && (
            <>
              <path d={`${path} L ${points[points.length - 1]?.x},${height - 16} L ${points[0]?.x},${height - 16} Z`} fill={colorMap[metric]} fillOpacity={0.07} />
              <path d={path} fill="none" stroke={colorMap[metric]} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
            </>
          )}
          {showAll && (
            <>
              {(["mood", "sleep", "stress", "energy", "nature", "steps"] as MetricKey[]).map((m) => {
                const s = pointsFor(m);
                return s.pts.length > 0 ? (
                  <path key={m} d={s.p} fill="none" stroke={colorMap[m]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                ) : null;
              })}
            </>
          )}
          {/* average line */}
          {!showAll && sliced.length > 0 && (
            <line x1={16} y1={avgY} x2={width - 16} y2={avgY} stroke={colorMap[metric]} className="" strokeDasharray="4 4" />
          )}
          {/* points */}
          {!showAll && points.map((p, i) => (
            <g
              key={i}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseMove={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <circle cx={p.x} cy={p.y} r={4} fill={colorMap[metric]} />
              {/* Enlarged invisible hit area to improve hover, including at edges/top */}
              <circle cx={p.x} cy={p.y} r={14} fill="transparent" pointerEvents="all" />
            </g>
          ))}

          {/* x labels */}
          {points.map((p, i) => (
            <text key={`t${i}`} x={p.x} y={height - 6} textAnchor="middle" className="fill-gray-500 text-[10px]">
              {p.label}
            </text>
          ))}

          {/* SVG-based tooltip (clamped horizontally, flips above/below to avoid clipping) */}
          {!showAll && hoverIndex !== null && points[hoverIndex] && (() => {
            const p = points[hoverIndex]!;
            const rectW = 140; // tooltip width
            const rectH = 40;  // tooltip height
            const edgePad = 8; // padding from svg edges
            const anchorOffset = 10; // gap between point and bubble

            // Horizontal clamping
            let dx = -rectW / 2; // center over point by default
            if (p.x + dx < edgePad) dx = edgePad - p.x; // clamp left
            if (p.x + dx + rectW > width - edgePad) dx = (width - edgePad) - (p.x + rectW); // clamp right

            // Prefer above, but flip below if not enough space at the top
            const hasRoomAbove = p.y - (rectH + anchorOffset) > edgePad;
            const rectY = hasRoomAbove ? -rectH - anchorOffset : anchorOffset;
            const pointerPath = hasRoomAbove
              ? `M 0 ${-anchorOffset} l 6 -6 l -12 0 z`
              : `M 0 ${anchorOffset} l 6 6 l -12 0 z`;

            const score = toScore(
              metric,
              getMetricValue(sliced[hoverIndex], metric)
            );

            return (
              <g transform={`translate(${p.x}, ${p.y})`} pointerEvents="none">
                {/* bubble */}
                <rect x={dx} y={rectY} width={rectW} height={rectH} rx={6} ry={6} fill="white" stroke="#e5e7eb" />
                {/* pointer */}
                <path d={pointerPath} fill="white" stroke="#e5e7eb" />
                {/* text */}
                <text x={dx + 8} y={rectY + 14} className="fill-gray-900" fontSize={12} fontWeight={600}>
                  {metricLabel[metric]}
                </text>
                <text x={dx + 8} y={rectY + 28} className="fill-gray-700" fontSize={12}>
                  {formatDateShort(sliced[hoverIndex!]?.date)} - Score {score}
                </text>
              </g>
            );
          })()}
        </svg>
        {/* Empty overlay to blur/disable chart when no data */}
        {isEmpty && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <span className="text-sm text-gray-700">No data yet</span>
          </div>
        )}
        </div>

        {showAll && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-700">
            {(["mood", "sleep", "stress", "energy", "nature", "steps"] as MetricKey[]).map((m) => (
              <span key={m} className="inline-flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colorMap[m] }} />
                {metricLabel[m]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Screen time average card (under trendline) */}
      <div className="mt-4 mb-6">
        <ScreenTimeCard sliced={sliced} />
      </div>

      {/* Weekly streaks */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <div className="font-semibold text-gray-800 mb-2">Weekly streaks</div>
        <StreakBadges history={entries} />
      </div>

      {/* List */}
      <div className="divide-y divide-gray-200/70">
        {[...sliced].reverse().map((entry, idx) => (
          <div key={idx} className="py-4 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-sm text-gray-500">{new Date(entry.date || 0).toLocaleString()}</div>
              <div className="text-gray-800 font-medium">
                Sleep: <span className="text-gray-700">{entry.sleep}</span> | Mood: <span className="text-gray-700">{formatMood(entry.mood)}</span>
              </div>
            </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-2 py-1 rounded-md text-sm border border-gray-200 hover:bg-gray-50"
                        onClick={() => setDetails(entry)}
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        className="px-2 py-1 rounded-md text-sm border border-gray-200 hover:bg-gray-50"
                        onClick={() => setEditing({ ...(entry as DailyCheckIn) })}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50"
                        title="Delete entry"
                        onClick={() => entry.date && setPendingDelete(entry.date)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
          </div>
        ))}
      </div>
      {/* Details modal */}
      {details && createPortal(
        <CheckInDetailsModal entry={details} onClose={() => setDetails(null)} />,
        document.body
      )}
      {/* Delete confirmation modal */}
      {pendingDelete && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPendingDelete(null)} />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-[92%] max-w-sm rounded-lg border border-red-200 bg-white shadow-2xl p-6 text-center ring-4 ring-red-100 animate-fadeIn"
          >
            <button
              aria-label="Close"
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setPendingDelete(null)}
            >
              <X className="w-4 h-4" />
            </button>
            <TriangleAlert className="w-10 h-10 text-red-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-red-700 tracking-wide">Delete this entry?</h3>
            <p className="text-sm text-gray-700 mt-1 mb-4">This removes the check-in from your history.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 shadow-[0_0_25px_rgba(220,38,38,0.45)]"
                onClick={async () => {
                  if (!pendingDelete) return;
                  const id = idByDate.get(pendingDelete);
                  if (id === undefined) {
                    setError("Could not find this entry on the backend.");
                    setPendingDelete(null);
                    return;
                  }

                  try {
                    await deleteStat(id);
                    setEntries((prev) => prev.filter((e) => e.date !== pendingDelete));
                    markStatsChanged();
                  } catch (caughtError) {
                    setError(
                      caughtError instanceof Error ? caughtError.message : "Could not delete entry"
                    );
                  }
                  setPendingDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Edit modal */}
      {editing && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditing(null)} />
          <div className="relative w-[92%] max-w-md rounded-lg border bg-white shadow-2xl p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Edit entry</h3>
              <button aria-label="Close" className="text-gray-400 hover:text-gray-600" onClick={() => setEditing(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">Sleep</label>
                <select className="w-full p-2 border rounded mt-1" value={editing.sleep} onChange={(e) => setEditing({ ...editing, sleep: e.target.value as DailyCheckIn["sleep"] })}>
                  <option value="poor">poor</option>
                  <option value="ok">ok</option>
                  <option value="good">good</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Mood</label>
                <select className="w-full p-2 border rounded mt-1" value={editing.mood} onChange={(e) => setEditing({ ...editing, mood: e.target.value as DailyCheckIn["mood"] })}>
                  {moodOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Stress</label>
                <select className="w-full p-2 border rounded mt-1" value={editing.stress} onChange={(e) => setEditing({ ...editing, stress: e.target.value as DailyCheckIn["stress"] })}>
                  {stressOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Energy</label>
                <select className="w-full p-2 border rounded mt-1" value={editing.energy} onChange={(e) => setEditing({ ...editing, energy: e.target.value as DailyCheckIn["energy"] })}>
                  {energyOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Nature minutes</label>
                <input type="number" className="w-full p-2 border rounded mt-1" value={editing.natureMinutes ?? 0} onChange={(e) => setEditing({ ...editing, natureMinutes: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Steps</label>
                <input type="number" className="w-full p-2 border rounded mt-1" value={editing.steps ?? 0} onChange={(e) => setEditing({ ...editing, steps: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Screen time (minutes)</label>
                <input type="number" className="w-full p-2 border rounded mt-1" value={editing.screenTime ?? 0} onChange={(e) => setEditing({ ...editing, screenTime: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Exercise</label>
                <TagPicker
                  options={EXERCISE_OPTIONS}
                  value={editing.exercise ?? []}
                  onChange={(next) => setEditing({ ...editing, exercise: next })}
                  labelFormatter={(opt) => EXERCISE_LABELS[opt]}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-3">
              <button className="px-4 py-2 rounded border" onClick={() => setEditing(null)}>Cancel</button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={async () => {
                if (!editing?.date) { setEditing(null); return; }
                const id = idByDate.get(editing.date);
                if (id === undefined) {
                  setError("Could not find this entry on the backend.");
                  setEditing(null);
                  return;
                }

                try {
                  await updateStat(id, toBackendStat(editing));
                  setEntries((prev) => prev.map((e) => (e.date === editing.date ? { ...editing } : e)));
                  markStatsChanged();
                  setEditing(null);
                } catch (caughtError) {
                  setError(caughtError instanceof Error ? caughtError.message : "Could not update entry");
                }
              }}>Save</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}

function CheckInDetailsModal({ entry, onClose }: { entry: DailyCheckIn; onClose: () => void }) {
  const detailDate = entry.date
    ? new Date(entry.date).toLocaleString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Saved check-in";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-details-title"
        className="relative w-full max-w-lg rounded-lg border border-emerald-100 bg-white shadow-2xl p-6 animate-fadeIn"
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-bold uppercase text-emerald-700">Check-in details</p>
            <h3 id="checkin-details-title" className="text-lg font-semibold text-gray-900 mt-1">
              {detailDate}
            </h3>
          </div>
          <button aria-label="Close" className="text-gray-400 hover:text-gray-600" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DetailItem label="Sleep" value={entry.sleep} />
          <DetailItem label="Mood" value={formatMood(entry.mood)} />
          <DetailItem label="Stress" value={formatStress(entry.stress)} />
          <DetailItem label="Energy" value={formatEnergy(entry.energy)} />
          <DetailItem label="Nature" value={`${entry.natureMinutes ?? 0} min`} />
          <DetailItem label="Steps" value={(entry.steps ?? 0).toLocaleString()} />
          <DetailItem label="Screen time" value={typeof entry.screenTime === "number" ? `${entry.screenTime} min` : "Not tracked"} />
          <DetailItem label="Exercise" value={entry.exercise?.length ? entry.exercise.join(", ") : "Not tracked"} />
        </div>

        <div className="mt-5 flex justify-end">
          <button type="button" className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="text-xs font-semibold uppercase text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function MiniCards({ history }: { history: Array<{ natureMinutes?: number; steps?: number }> }) {
  const latest = history[0] || {};
  const nature = typeof latest.natureMinutes === "number" ? latest.natureMinutes : 0;
  const steps = typeof latest.steps === "number" ? latest.steps : 0;
  const natureTarget = 60;
  const stepsTarget = 7000;
  const naturePct = Math.min(100, Math.round((nature / natureTarget) * 100));
  const stepsPct = Math.min(100, Math.round((steps / stepsTarget) * 100));

  const bar = (pct: number, color: string) => (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div className={`h-2 ${color} rounded-full`} style={{ width: `${pct}%` }} />
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-gray-800">Nature</span>
          <span className="text-xs text-gray-600">Target: {natureTarget} min</span>
        </div>
        <div className="text-sm text-gray-700 mb-2">{nature} min</div>
        {bar(naturePct, nature >= natureTarget ? "bg-green-500" : nature >= natureTarget / 2 ? "bg-yellow-400" : "bg-red-500")}
      </div>
      <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-gray-800">Steps</span>
          <span className="text-xs text-gray-600">Target: {stepsTarget}</span>
        </div>
        <div className="text-sm text-gray-700 mb-2">{steps.toLocaleString()}</div>
        {bar(stepsPct, steps >= stepsTarget ? "bg-green-500" : steps >= stepsTarget / 2 ? "bg-yellow-400" : "bg-red-500")}
      </div>
    </div>
  );
}

function ScreenTimeCard({ sliced }: { sliced: Array<DailyCheckIn> }) {
  const vals = sliced.map((s) => s.screenTime).filter((v): v is number => typeof v === "number");
  const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;

  const fmt = (m: number) => {
    if (!m) return "-";
    const hrs = Math.floor(m / 60);
    const mins = m % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-gray-800">Avg screen time</span>
        <span className="text-xs text-gray-600">Based on {vals.length} entries</span>
      </div>
      <div className="text-sm text-gray-700 mt-2">{fmt(avg)}</div>
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
