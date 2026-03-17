"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateKey, getDailyStatusSeries, getStatusCountsInRange } from "@/lib/habitStore";
import { BarChart3, TrendingUp } from "lucide-react";

type RangeKey = "day" | "week" | "month" | "year";

function addDays(base: Date, delta: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return d;
}

function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setDate(1);
  return x;
}

function startOfYear(d: Date) {
  const x = new Date(d);
  x.setMonth(0, 1);
  return x;
}

export default function StatisticsPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<RangeKey>("day");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(0);
  const [inProgress, setInProgress] = useState(0);
  const [notDone, setNotDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [series, setSeries] = useState<Array<{ date: string; success: number; in_progress: number; not_done: number; total: number }>>([]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { start, end } = useMemo(() => {
    const end = today;
    if (range === "day") return { start: end, end };
    if (range === "week") return { start: addDays(end, -6), end };
    if (range === "month") return { start: startOfMonth(end), end };
    return { start: startOfYear(end), end };
  }, [range, today]);

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return;
      setLoading(true);
      const res = await getStatusCountsInRange(user.id, formatDateKey(start), formatDateKey(end));
      setTotal(res.total);
      setSuccess(res.success);
      setInProgress(res.in_progress);
      setNotDone(res.not_done);

      const s = await getDailyStatusSeries(user.id, 7);
      setSeries(s);
      setLoading(false);
    };
    void run();
  }, [end, start, user?.id]);

  const percent = total === 0 ? 0 : Math.round((success / total) * 100);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dash = total === 0 ? 0 : Math.round((percent / 100) * circumference);
  const maxSeries = Math.max(1, ...series.map((d) => d.total));

  return (
    <div className="min-h-[calc(100vh-64px)] text-white">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Statistika</h1>
          <p className="text-zinc-500 text-sm mt-1">Odatlar bo‘yicha natijalar.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-zinc-400">
          <BarChart3 size={18} />
          <span className="text-sm">Jonli</span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { key: "day", label: "1 kun" },
          { key: "week", label: "1 hafta" },
          { key: "month", label: "1 oy" },
          { key: "year", label: "1 yil" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setRange(t.key as RangeKey)}
            className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${
              range === t.key
                ? "border-blue-400/40 bg-blue-500/15 text-blue-200"
                : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-500 font-bold tracking-widest uppercase">7 kunlik ko‘rinish</div>
              <div className="text-sm text-zinc-400 mt-1">Bajarildi / Jarayonda / Bajarilmadi</div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-zinc-400">
              <TrendingUp size={18} />
              <span className="text-sm">O‘sish</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-2 items-end h-36">
            {(loading ? Array.from({ length: 7 }, (_, i) => ({ date: String(i), success: 0, in_progress: 0, not_done: 0, total: 1 })) : series).map((d, idx) => {
              const h = Math.max(8, Math.round((d.total / maxSeries) * 120));
              const successH = Math.round((d.success / Math.max(1, d.total)) * h);
              const progH = Math.round((d.in_progress / Math.max(1, d.total)) * h);
              const notH = Math.max(0, h - successH - progH);
              const label = String(d.date).slice(8, 10);
              return (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className="w-full max-w-[22px] rounded-full border border-white/10 bg-black/30 overflow-hidden flex flex-col justify-end" style={{ height: `${h}px` }}>
                    <div style={{ height: `${notH}px` }} className="bg-white/10" />
                    <div style={{ height: `${progH}px` }} className="bg-amber-400/60" />
                    <div style={{ height: `${successH}px` }} className="bg-emerald-400/80" />
                  </div>
                  <div className="text-[10px] text-zinc-500 font-bold">{label}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-300">
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Bajarildi</span>
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-400" /> Jarayonda</span>
            <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-white/20" /> Bajarilmadi</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs text-zinc-500 font-bold tracking-widest uppercase">Bajarish foizi</div>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-28 w-28">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="url(#grad)"
                  strokeWidth="10"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference}`}
                />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-black">{loading ? "…" : `${percent}%`}</div>
                  <div className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">bajarildi</div>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-200">Bajarildi</span>
                <span className="font-bold">{loading ? "…" : success}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-amber-200">Jarayonda</span>
                <span className="font-bold">{loading ? "…" : inProgress}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-300">Bajarilmadi</span>
                <span className="font-bold">{loading ? "…" : notDone}</span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Jami</span>
                <span className="font-bold">{loading ? "…" : total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="text-sm font-semibold">Izoh</div>
        <p className="text-zinc-500 text-sm mt-1">
          Agar bu yerda 0 chiqsa: Supabase’da `habit_logs` jadvali hali yaratilmagan bo‘lishi mumkin. Yoki siz hali status bosmagan bo‘lishingiz mumkin.
        </p>
      </div>
    </div>
  );
}
