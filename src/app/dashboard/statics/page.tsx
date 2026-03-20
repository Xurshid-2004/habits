"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  formatDateKey,
  getDailyStatusSeries,
  getStatusCountsInRange,
  type HabitStatus,
} from "@/lib/habitStore";
import { TrendingUp, Flame, Target, CheckCircle, Clock, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────

type RangeKey = 1 | 3 | 7 | 14 | 30;

type DayStat = {
  date: string;
  label: string;
  success: number;
  in_progress: number;
  not_done: number;
  total: number;
};

// ─── Static habit keys (must match habits page) ───────────────────────────────

const STATIC_KEYS = [
  "static-erta-turish",
  "static-reja-tuzish",
  "static-moliyaviy-nazorat",
  "static-drink-water",
  "static-read-book",
  "static-coding",
  "static-workout",
  "static-stress",
  "static-detoks",
  "static-piyoda",
];

function readStaticStatus(key: string, dateKey: string): HabitStatus {
  try {
    const raw = localStorage.getItem(`habit_status:${key}:${dateKey}`);
    if (raw === "success" || raw === "in_progress" || raw === "not_done") return raw;
    return "not_done";
  } catch {
    return "not_done";
  }
}

function readSelectedStaticKeys(): string[] {
  try {
    const raw = localStorage.getItem("selected_static_habit_keys_v1");
    const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function addDays(base: Date, delta: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return d;
}

function dayLabel(dateStr: string, days: RangeKey): string {
  const parts = dateStr.split("-");
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (days === 1) {
    return d.toLocaleDateString("uz", { weekday: "short" });
  }
  return `${parts[2]}/${parts[1]}`;
}

const WEEK_DAYS = ["Yak", "Du", "Se", "Cho", "Pay", "Ju", "Sha"];

// ─── Animated number ──────────────────────────────────────────────────────────

function AnimNum({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 20) || 1;
    const timer = setInterval(() => {
      start = Math.min(start + step, value);
      setDisplay(start);
      if (start >= value) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
}

// ─── Donut chart ──────────────────────────────────────────────────────────────

function DonutChart({ percent, size = 110 }: { percent: number; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#donutGrad)" strokeWidth={10} strokeLinecap="round"
        strokeDasharray={`${circ}`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      <defs>
        <linearGradient id="donutGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Bar chart column ─────────────────────────────────────────────────────────

function BarColumn({ day, maxTotal, isToday }: { day: DayStat; maxTotal: number; isToday: boolean }) {
  const BAR_H = 120;
  const total = Math.max(day.total, 0);
  const barH = total === 0 ? 4 : Math.max(12, Math.round((total / Math.max(maxTotal, 1)) * BAR_H));
  const successPct = total === 0 ? 0 : day.success / total;
  const progPct    = total === 0 ? 0 : day.in_progress / total;
  const notPct     = total === 0 ? 1 : day.not_done / total;

  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <div className="relative flex items-end justify-center" style={{ height: `${BAR_H}px` }}>
        {/* Tooltip on hover */}
        <div className="group relative">
          <div
            className={`w-6 rounded-full overflow-hidden border flex flex-col justify-end transition-all ${
              isToday ? "border-blue-400/50" : "border-white/10"
            }`}
            style={{ height: `${barH}px` }}
          >
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${notPct * 100}%` }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-zinc-700/60 w-full"
            />
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${progPct * 100}%` }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-amber-400/70 w-full"
            />
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${successPct * 100}%` }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-gradient-to-t from-emerald-500 to-emerald-400 w-full"
            />
          </div>
          {/* Tooltip */}
          {total > 0 && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-[11px] whitespace-nowrap shadow-xl">
                <div className="text-emerald-400 font-bold">✓ {day.success}</div>
                <div className="text-amber-400">⏳ {day.in_progress}</div>
                <div className="text-zinc-400">✗ {day.not_done}</div>
              </div>
              <div className="w-2 h-2 bg-zinc-800 border-r border-b border-zinc-700 rotate-45 -mt-1" />
            </div>
          )}
        </div>
      </div>
      <span className={`text-[10px] font-bold ${isToday ? "text-blue-400" : "text-zinc-500"}`}>
        {day.label}
      </span>
      {isToday && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StatisticsPage() {
  const { user } = useAuth();
  const [days, setDays] = useState<RangeKey>(7);
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<DayStat[]>([]);
  const [totals, setTotals] = useState({ success: 0, in_progress: 0, not_done: 0, total: 0 });

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);

  const todayKey = formatDateKey(today);

  // ── Build date range ─────────────────────────────────────────────────────────
  const dateRange = useMemo(() => {
    const result: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      result.push(formatDateKey(addDays(today, -i)));
    }
    return result;
  }, [days, today]);

  // ── Get static habit stats for a date ────────────────────────────────────────
  const getStaticDayStat = useCallback((dateKey: string) => {
    const selectedKeys = readSelectedStaticKeys();
    let success = 0, in_progress = 0, not_done = 0;
    for (const key of selectedKeys) {
      const s = readStaticStatus(key, dateKey);
      if (s === "success") success++;
      else if (s === "in_progress") in_progress++;
      else not_done++;
    }
    return { success, in_progress, not_done, total: selectedKeys.length };
  }, []);

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const run = async () => {
      setLoading(true);

      // DB series
      let dbSeries: Array<{ date: string; success: number; in_progress: number; not_done: number; total: number }> = [];
      if (user?.id) {
        dbSeries = await getDailyStatusSeries(user.id, days);
      } else {
        dbSeries = dateRange.map((d) => ({ date: d, success: 0, in_progress: 0, not_done: 0, total: 0 }));
      }

      // Merge with static
      const merged: DayStat[] = dateRange.map((dateKey) => {
        const db = dbSeries.find((x) => x.date === dateKey) ?? { success: 0, in_progress: 0, not_done: 0, total: 0 };
        const st = getStaticDayStat(dateKey);
        const label = dayLabel(dateKey, days);
        return {
          date: dateKey,
          label,
          success:     db.success     + st.success,
          in_progress: db.in_progress + st.in_progress,
          not_done:    db.not_done    + st.not_done,
          total:       db.total       + st.total,
        };
      });

      setSeries(merged);

      // Totals
      const t = merged.reduce(
        (acc, d) => ({
          success:     acc.success     + d.success,
          in_progress: acc.in_progress + d.in_progress,
          not_done:    acc.not_done    + d.not_done,
          total:       acc.total       + d.total,
        }),
        { success: 0, in_progress: 0, not_done: 0, total: 0 },
      );
      setTotals(t);
      setLoading(false);
    };
    void run();
  }, [days, user?.id, dateRange, getStaticDayStat]);

  const percent = totals.total === 0 ? 0 : Math.round((totals.success / totals.total) * 100);
  const maxTotal = Math.max(1, ...series.map((d) => d.total));

  // ── Streak: nechi kun ketma-ket kamida 1 ta success ──────────────────────────
  const streak = useMemo(() => {
    let count = 0;
    const rev = [...series].reverse();
    for (const d of rev) {
      if (d.success > 0) count++;
      else break;
    }
    return count;
  }, [series]);

  // Today's stat
  const todayStat = series.find((d) => d.date === todayKey);

  const RANGES: { key: RangeKey; label: string }[] = [
    { key: 1, label: "Bugun" },
    { key: 3, label: "3 kun" },
    { key: 7, label: "7 kun" },
    { key: 14, label: "14 kun" },
    { key: 30, label: "30 kun" },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 pb-24">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statistika</h1>
          <p className="text-zinc-500 text-sm mt-1">Odatlaringiz bo'yicha natijalar</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Jonli
        </div>
      </div>

      {/* Range buttons */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setDays(r.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap border transition-all ${
              days === r.key
                ? "bg-blue-500/20 border-blue-400/50 text-blue-200 shadow-lg shadow-blue-500/10"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: <CheckCircle size={16} />, label: "Bajarildi",    value: totals.success,     color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { icon: <Clock size={16} />,       label: "Jarayonda",    value: totals.in_progress, color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
          { icon: <XCircle size={16} />,     label: "Bajarilmadi", value: totals.not_done,    color: "text-zinc-400",    bg: "bg-zinc-800/60 border-zinc-700/40" },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-3 text-center ${s.bg}`}
          >
            <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
            <div className={`text-xl font-black ${s.color}`}>
              {loading ? "…" : <AnimNum value={s.value} />}
            </div>
            <div className="text-[10px] text-zinc-500 font-semibold mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Main: Bar chart + Donut */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">

        {/* ── Bar chart ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-3 bg-zinc-900 border border-zinc-800 rounded-[24px] p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold">Kunlik ko'rinish</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">{days} kunlik diagramma</p>
            </div>
            <div className="flex gap-3 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Bajarildi</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />Jarayonda</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-zinc-600" />Bajarilmadi</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <div className="h-[120px] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : (
              <motion.div
                key={days}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-end gap-1.5 h-[120px]"
              >
                {series.map((day) => (
                  <BarColumn
                    key={day.date}
                    day={day}
                    maxTotal={maxTotal}
                    isToday={day.date === todayKey}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* X-axis total label */}
          {!loading && totals.total > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
              <span>Jami belgilangan: <span className="text-white font-bold">{totals.total}</span></span>
              <span>Eng yaxshi kun: <span className="text-emerald-400 font-bold">{Math.max(0, ...series.map((d) => d.success))} ✓</span></span>
            </div>
          )}
        </motion.div>

        {/* ── Donut + streak ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-2 flex flex-col gap-4"
        >
          {/* Donut card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-5 flex flex-col items-center">
            <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest mb-4">Bajarish foizi</p>
            <div className="relative">
              <DonutChart percent={loading ? 0 : percent} size={120} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-black">
                    {loading ? "…" : <AnimNum value={percent} suffix="%" />}
                  </div>
                  <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">bajarildi</div>
                </div>
              </div>
            </div>

            {/* Mini progress bars */}
            {!loading && totals.total > 0 && (
              <div className="w-full mt-4 space-y-2">
                {[
                  { label: "Bajarildi",    value: totals.success,     max: totals.total, color: "bg-emerald-500" },
                  { label: "Jarayonda",    value: totals.in_progress, max: totals.total, color: "bg-amber-400" },
                  { label: "Bajarilmadi", value: totals.not_done,    max: totals.total, color: "bg-zinc-600" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-400">{item.label}</span>
                      <span className="text-zinc-300 font-bold">{item.value}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${totals.total === 0 ? 0 : (item.value / totals.total) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${item.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Streak + Target cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900 border border-orange-500/20 rounded-2xl p-4 text-center">
              <Flame size={20} className="text-orange-400 mx-auto mb-1" />
              <div className="text-2xl font-black text-orange-400">
                {loading ? "…" : <AnimNum value={streak} />}
              </div>
              <div className="text-[10px] text-zinc-500 font-semibold">Streak kun</div>
            </div>
            <div className="bg-zinc-900 border border-blue-500/20 rounded-2xl p-4 text-center">
              <Target size={20} className="text-blue-400 mx-auto mb-1" />
              <div className="text-2xl font-black text-blue-400">
                {loading ? "…" : <AnimNum value={days} />}
              </div>
              <div className="text-[10px] text-zinc-500 font-semibold">Kun oralig'i</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Today highlight */}
      {todayStat && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-blue-950/60 via-zinc-900 to-emerald-950/40 border border-blue-500/20 rounded-[24px] p-5 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-sm font-bold">Bugungi holat</span>
            <span className="text-xs text-zinc-500 ml-auto">{todayKey}</span>
          </div>
          <div className="flex gap-4">
            {[
              { label: "Bajarildi",    value: todayStat.success,     color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
              { label: "Jarayonda",    value: todayStat.in_progress, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
              { label: "Bajarilmadi", value: todayStat.not_done,    color: "text-zinc-400 bg-zinc-800/60 border-zinc-700/40" },
              { label: "Jami",         value: todayStat.total,       color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
            ].map((s) => (
              <div key={s.label} className={`flex-1 rounded-xl border px-3 py-2.5 text-center ${s.color}`}>
                <div className="text-xl font-black">{s.value}</div>
                <div className="text-[10px] font-semibold opacity-70 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Today progress bar */}
          {todayStat.total > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                <span>Bugungi progress</span>
                <span className="text-white font-bold">
                  {Math.round((todayStat.success / todayStat.total) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(todayStat.success / todayStat.total) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Heatmap-style week view */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-5 mb-6"
      >
        <h2 className="text-sm font-bold mb-4">Haftalik ko'rinish (oxirgi 7 kun)</h2>
        <div className="grid grid-cols-7 gap-2">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] text-zinc-600 font-bold pb-1">{d}</div>
          ))}
          {(() => {
            // Show last 7 days aligned to weekday grid
            const last7 = series.slice(-7);
            // Pad left if needed
            const firstDay = last7[0] ? new Date(last7[0].date).getDay() : 0;
            const pads = Array(firstDay).fill(null);
            return (
              <>
                {pads.map((_, i) => <div key={`pad-${i}`} />)}
                {last7.map((d) => {
                  const pct = d.total === 0 ? 0 : d.success / d.total;
                  const isToday = d.date === todayKey;
                  return (
                    <div
                      key={d.date}
                      title={`${d.date}: ${d.success}/${d.total}`}
                      className={`aspect-square rounded-xl flex items-center justify-center text-[11px] font-bold border transition-all ${
                        isToday ? "border-blue-400/60 ring-2 ring-blue-400/20" : "border-transparent"
                      } ${
                        pct === 0 && d.total === 0 ? "bg-zinc-800/40 text-zinc-700" :
                        pct === 0                   ? "bg-red-500/15 text-red-400" :
                        pct < 0.5                   ? "bg-amber-500/20 text-amber-300" :
                        pct < 1                     ? "bg-emerald-500/20 text-emerald-300" :
                                                       "bg-emerald-500/30 text-emerald-200"
                      }`}
                    >
                      {d.date.slice(8)}
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
        <div className="mt-3 flex items-center gap-3 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-zinc-800/40 inline-block" />Ma'lumot yo'q</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/20 inline-block" />0%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500/20 inline-block" />&lt;50%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/30 inline-block" />100%</span>
        </div>
      </motion.div>

      {/* Info note */}
      {totals.total === 0 && !loading && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 text-center">
          <TrendingUp size={28} className="text-zinc-700 mx-auto mb-2" />
          <p className="text-zinc-400 text-sm font-medium">Hali ma'lumot yo'q</p>
          <p className="text-zinc-600 text-xs mt-1">
            Dashboard sahifasida odatlarni "Bajardim" yoki "Bajaryapman" deb belgilang.
          </p>
        </div>
      )}
    </div>
  );
}