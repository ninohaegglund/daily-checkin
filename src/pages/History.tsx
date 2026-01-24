import { useHealthStore } from "../store/healthStore";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, Skull, X } from "lucide-react";
import type { DailyCheckIn, ExerciseType } from "../types";
import TagPicker from "../components/TagPicker";

const API_URL = "https://localhost:7016/api/stats";

type MetricKey = "sleep" | "mood" | "stress" | "energy" | "nature" | "steps";

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

const toScore = (k: MetricKey, v: string | number): number => {
  if (k === "sleep") return v === "good" ? 3 : v === "ok" ? 2 : 1;
  if (k === "mood") return v === "good" ? 3 : v === "neutral" ? 2 : 1;
  if (k === "stress") return v === "low" ? 3 : v === "medium" ? 2 : 1; // inverted
  if (k === "energy") return v === "high" ? 3 : v === "medium" ? 2 : 1;
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

export default function HistoryPage() {
  const { history, removeEntry } = useHealthStore();
  const { updateEntry } = useHealthStore();
  const [entries, setEntries] = useState<DailyCheckIn[]>([]);
  const [idByDate, setIdByDate] = useState<Map<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<MetricKey>("mood");
  const [range, setRange] = useState<"7" | "14" | "30" | "all">("7");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<DailyCheckIn | null>(null);
  const isEmpty = entries.length === 0;

  // Helpers to convert between backend stats and local DailyCheckIn
  type DailyStat = {
    id: number;
    date: string;
    mood: number;
    energy: number;
    stress: number;
    sleepHours: number;
    timeInNatureMinutes: number;
    steps: number;
    screenTimeMinutes?: number | null;
    exercises: Array<{ type: "UpperBody" | "LowerBody" | "Mobility" | "Cardio" | "StrengthTraining"; durationMinutes: number; intensity: number; notes?: string }>;
  };

  const moodStr = (n: number): DailyCheckIn["mood"] => (n <= 3 ? "low" : n <= 7 ? "neutral" : "good");
  const energyStr = (n: number): DailyCheckIn["energy"] => (n <= 3 ? "low" : n <= 7 ? "medium" : "high");
  const stressStr = (n: number): DailyCheckIn["stress"] => (n <= 3 ? "low" : n <= 7 ? "medium" : "high");
  const sleepStr = (hrs: number): DailyCheckIn["sleep"] => (hrs <= 6 ? "poor" : hrs === 7 ? "ok" : "good");
  const exTag = (t: DailyStat["exercises"][number]["type"]): ExerciseType => {
    switch (t) {
      case "UpperBody": return "upper";
      case "LowerBody": return "lower";
      case "Mobility": return "mobility";
      case "Cardio": return "cardio";
      case "StrengthTraining": return "strength";
      default: return "mobility";
    }
  };

  const toCheckIn = (s: DailyStat): DailyCheckIn => ({
    date: s.date,
    mood: moodStr(s.mood),
    energy: energyStr(s.energy),
    stress: stressStr(s.stress),
    sleep: sleepStr(s.sleepHours),
    natureMinutes: s.timeInNatureMinutes,
    steps: s.steps,
    screenTime: s.screenTimeMinutes ?? undefined,
    exercise: s.exercises?.length ? s.exercises.map((ex) => exTag(ex.type)) : [],
  });

  const toPayload = (d: DailyCheckIn, existing?: DailyStat): DailyStat => ({
    id: existing?.id ?? 0,
    date: d.date ?? new Date().toISOString(),
    mood: d.mood === "low" ? 3 : d.mood === "neutral" ? 5 : 8,
    energy: d.energy === "low" ? 3 : d.energy === "medium" ? 6 : 9,
    stress: d.stress === "low" ? 3 : d.stress === "medium" ? 6 : 9,
    sleepHours: d.sleep === "poor" ? 5 : d.sleep === "ok" ? 7 : 8,
    timeInNatureMinutes: d.natureMinutes ?? 0,
    steps: d.steps ?? 0,
    screenTimeMinutes: typeof d.screenTime === "number" ? d.screenTime : null,
    exercises: (d.exercise && d.exercise.length)
      ? d.exercise.map((t) => ({
          type: t === "upper" ? "UpperBody" : t === "lower" ? "LowerBody" : t === "mobility" || t === "flexibility" ? "Mobility" : t === "cardio" ? "Cardio" : "StrengthTraining",
          durationMinutes: 30,
          intensity: 5,
        }))
      : [],
  });

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Failed to load stats");
        const data: DailyStat[] = await res.json();
        if (canceled) return;
        const converted = data.map(toCheckIn);
        setEntries(converted);
        setIdByDate(new Map(data.map((s) => [s.date, s.id])));
      } catch (e) {
        // Fallback to local history
        setEntries(history);
        setIdByDate(null);
        if (e instanceof Error) setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { canceled = true; };
  }, [history]);

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

  const points = sliced.map((e, i) => {
    const val = metric === "nature" ? (e.natureMinutes ?? 0) : metric === "steps" ? (e.steps ?? 0) : (e[metric] as any);
    const score = toScore(metric, val); // 1..3
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
      : sliced.reduce((acc, e) => {
          const val = metric === "nature" ? (e.natureMinutes ?? 0) : metric === "steps" ? (e.steps ?? 0) : (e[metric] as any);
          return acc + toScore(metric, val);
        }, 0) / sliced.length; // 1..3
  const avgY = padding + innerH - ((avg - 1) / 2) * innerH;

  const pointsFor = (m: MetricKey) => {
    const pts = sliced.map((e, i) => {
      const val = m === "nature" ? (e.natureMinutes ?? 0) : m === "steps" ? (e.steps ?? 0) : (e[m] as any);
      const score = toScore(m, val);
      const y = padding + innerH - ((score - 1) / 2) * innerH;
      const x = padding + i * xStep;
      return { x, y };
    });
    const p = pts.map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" ");
    return { pts, p };
  };

  return (
    <div className="w-full bg-white/80 animate-fadeIn backdrop-blur rounded-2xl shadow-lg p-6 border border-white/40">
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
            onChange={(e) => setRange(e.target.value as any)}
            className="p-2 rounded-md border border-gray-300 text-sm"
          >
            <option value="7">Last 7</option>
            <option value="14">Last 14</option>
            <option value="30">Last 30</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {loading && (<p className="text-sm text-gray-500 mb-2">Syncing from backend…</p>)}
      {error && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}

      {/* Empty-state notice */}
      {isEmpty && (
        <div className="w-full mb-4 rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-800 p-3">
          No saved check-ins yet. Save today's status to see your history here.
        </div>
      )}

      {/* Mini-cards for nature and steps (latest entry) */}
      <MiniCards history={entries} />

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 relative">
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
              metric === "nature"
                ? (sliced[hoverIndex!]?.natureMinutes ?? 0)
                : metric === "steps"
                ? (sliced[hoverIndex!]?.steps ?? 0)
                : (sliced[hoverIndex!]?.[metric] as any)
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
                  {formatDateShort(sliced[hoverIndex!]?.date)} · Score {score}
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="font-semibold text-gray-800 mb-2">Weekly streaks</div>
        <StreakBadges history={entries} />
      </div>

      {/* List */}
      <div className="divide-y divide-gray-200/70">
        {[...sliced].reverse().map((entry, idx) => (
          <div key={idx} className="py-4 flex items-center justify-between flex-wrap gap-4">
            <div>
                      <div className="text-sm text-gray-500">{new Date(entry.date || 0).toLocaleString()}</div>
                      {!expanded[entry.date || String(idx)] ? (
                        <div className="text-gray-800 font-medium">
                          Sleep: <span className="text-gray-700">{entry.sleep}</span> · Mood: <span className="text-gray-700">{entry.mood}</span>
                        </div>
                      ) : (
                        <div className="text-gray-800 font-medium">
                          Sleep: <span className="text-gray-700">{entry.sleep}</span> · Mood: <span className="text-gray-700">{entry.mood}</span> · Stress: <span className="text-gray-700">{entry.stress}</span> · Energy: <span className="text-gray-700">{entry.energy}</span>
                          {typeof entry.natureMinutes === "number" && (
                            <> · Nature: <span className="text-gray-700">{entry.natureMinutes} min</span></>
                          )}
                          {typeof entry.steps === "number" && (
                            <> · Steps: <span className="text-gray-700">{entry.steps}</span></>
                          )}
                          {(entry.exercise && entry.exercise.length) ? (
                            <> · Exercise: <span className="text-gray-700">{entry.exercise.join(", ")}</span></>
                          ) : null}
                          {typeof entry.screenTime === "number" && (
                            <> · Screen: <span className="text-gray-700">{entry.screenTime} min</span></>
                          )}
                        </div>
                      )}
            </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-2 py-1 rounded-md text-sm border border-gray-200 hover:bg-gray-50"
                        onClick={() => setExpanded((s) => ({ ...s, [entry.date || String(idx)]: !s[entry.date || String(idx)] }))}
                      >
                        {expanded[entry.date || String(idx)] ? "Collapse" : "Details"}
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
      {/* Menacing confirm modal */}
      {pendingDelete && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPendingDelete(null)} />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-[92%] max-w-sm rounded-2xl border-2 border-red-600 bg-white shadow-2xl p-6 text-center ring-4 ring-red-600/20 animate-fadeIn"
          >
            <button
              aria-label="Close"
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setPendingDelete(null)}
            >
              <X className="w-4 h-4" />
            </button>
            <Skull className="w-10 h-10 text-red-600 mx-auto mb-3" />
            <h3 className="text-lg font-extrabold text-red-700 tracking-wide">Delete this entry?</h3>
            <p className="text-sm text-gray-700 mt-1 mb-4">This action is irreversible.</p>
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
                  // If we have backend IDs, try remote delete
                  const id = idByDate?.get(pendingDelete);
                  if (id) {
                    try {
                      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
                      if (!res.ok) throw new Error("Failed to delete");
                      setEntries((prev) => prev.filter((e) => e.date !== pendingDelete));
                    } catch {
                      // Fallback to local deletion
                      removeEntry(pendingDelete);
                      setEntries((prev) => prev.filter((e) => e.date !== pendingDelete));
                    }
                  } else {
                    removeEntry(pendingDelete);
                    setEntries((prev) => prev.filter((e) => e.date !== pendingDelete));
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
          <div className="relative w-[92%] max-w-md rounded-2xl border bg-white shadow-2xl p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Edit entry</h3>
              <button aria-label="Close" className="text-gray-400 hover:text-gray-600" onClick={() => setEditing(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">Sleep</label>
                <select className="w-full p-2 border rounded mt-1" value={editing.sleep} onChange={(e) => setEditing({ ...editing, sleep: e.target.value as any })}>
                  <option value="poor">poor</option>
                  <option value="ok">ok</option>
                  <option value="good">good</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Mood</label>
                <select className="w-full p-2 border rounded mt-1" value={editing.mood} onChange={(e) => setEditing({ ...editing, mood: e.target.value as any })}>
                  <option value="low">low</option>
                  <option value="neutral">neutral</option>
                  <option value="good">good</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Stress</label>
                <select className="w-full p-2 border rounded mt-1" value={editing.stress} onChange={(e) => setEditing({ ...editing, stress: e.target.value as any })}>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Energy</label>
                <select className="w-full p-2 border rounded mt-1" value={editing.energy} onChange={(e) => setEditing({ ...editing, energy: e.target.value as any })}>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
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
                  options={["cardio","strength","upper","lower","mobility","flexibility"]}
                  value={editing.exercise ?? []}
                  onChange={(next) => setEditing({ ...editing, exercise: next as ExerciseType[] })}
                  labelFormatter={(opt) => {
                    const map = {
                      cardio: "Cardio",
                      strength: "Strength Training",
                      upper: "Upper Body",
                      lower: "Lower Body",
                      mobility: "Mobility",
                      flexibility: "Flexibility",
                    };
                    return map[opt as ExerciseType] ?? opt;
                  }}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-3">
              <button className="px-4 py-2 rounded border" onClick={() => setEditing(null)}>Cancel</button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={async () => {
                if (!editing?.date) { setEditing(null); return; }
                const id = idByDate?.get(editing.date);
                if (id) {
                  // Remote update with fallback
                  try {
                    const existing: DailyStat = {
                      id,
                      date: editing.date,
                      mood: 5,
                      energy: 5,
                      stress: 5,
                      sleepHours: 7,
                      timeInNatureMinutes: editing.natureMinutes ?? 0,
                      steps: editing.steps ?? 0,
                      screenTimeMinutes: typeof editing.screenTime === "number" ? editing.screenTime : null,
                      exercises: (editing.exercise && editing.exercise.length)
                        ? [{ type: editing.exercise[0] === "upper" ? "UpperBody" : editing.exercise[0] === "lower" ? "LowerBody" : editing.exercise[0] === "mobility" || editing.exercise[0] === "flexibility" ? "Mobility" : editing.exercise[0] === "cardio" ? "Cardio" : "StrengthTraining", durationMinutes: 30, intensity: 5 }]
                        : [],
                    };
                    const payload = toPayload(editing, existing);
                    const res = await fetch(`${API_URL}/${id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    if (!res.ok) throw new Error("Failed to update");
                    // Update local entries view
                    setEntries((prev) => prev.map((e) => (e.date === editing.date ? { ...editing } : e)));
                  } catch {
                    updateEntry(editing.date, editing as Partial<DailyCheckIn>);
                    setEntries((prev) => prev.map((e) => (e.date === editing.date ? { ...editing } : e)));
                  }
                } else {
                  updateEntry(editing.date, editing as Partial<DailyCheckIn>);
                  setEntries((prev) => prev.map((e) => (e.date === editing.date ? { ...editing } : e)));
                }
                setEditing(null);
              }}>Save</button>
            </div>
          </div>
        </div>, document.body
      )}
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
      <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-gray-800">Nature</span>
          <span className="text-xs text-gray-600">Target: {natureTarget} min</span>
        </div>
        <div className="text-sm text-gray-700 mb-2">{nature} min</div>
        {bar(naturePct, nature >= natureTarget ? "bg-green-500" : nature >= natureTarget / 2 ? "bg-yellow-400" : "bg-red-500")}
      </div>
      <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
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
    if (!m) return "—";
    const hrs = Math.floor(m / 60);
    const mins = m % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
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
