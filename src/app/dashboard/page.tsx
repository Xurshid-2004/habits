"use client";

import React, { useEffect, useState } from 'react';
import CalendarNavbar from "../calendar";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Check, Circle, Loader2 } from 'lucide-react';
import { formatDateKey, getHabitLogsByDate, getSelectedHabitIds, setHabitStatus, type HabitStatus } from '@/lib/habitStore';

type Habit = {
  id: number;
  title?: string | null;
  name?: string | null;
  icon_url: string;
  description: string;
  target_days: number;
  created_at: string;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedHabitIds, setSelectedHabitIds] = useState<number[]>([]);
  const [statusMap, setStatusMap] = useState<Record<number, HabitStatus>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const dateKey = formatDateKey(selectedDate);

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const { data, error } = await supabase
          .from('habits')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setHabits(data || []);
      } catch (err) {
        console.error("Xatolik:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHabits();
  }, []);

  useEffect(() => {
    const syncSelections = async () => {
      if (!user?.id) return;

      const remoteIds = await getSelectedHabitIds(user.id);
      if (remoteIds.length > 0) {
        setSelectedHabitIds(remoteIds);
        return;
      }

      // Fallback: old localStorage
      try {
        const raw = window.localStorage.getItem("selected_habit_ids_v1");
        const parsed = raw ? JSON.parse(raw) : [];
        const normalized = Array.isArray(parsed)
          ? (parsed as unknown[]).map((x) => Number(String(x))).filter((n) => Number.isFinite(n))
          : [];
        setSelectedHabitIds(normalized);
      } catch {
        setSelectedHabitIds([]);
      }
    };
    void syncSelections();
  }, [user?.id]);

  useEffect(() => {
    const syncDone = async () => {
      if (!user?.id) return;
      const map = await getHabitLogsByDate(user.id, dateKey);
      setStatusMap(map);
    };
    void syncDone();
  }, [dateKey, user?.id]);

  const selected = habits.filter((h) => selectedHabitIds.includes(h.id));

  const setStatus = async (habitId: number, status: HabitStatus) => {
    if (!user?.id) return;
    setSavingId(habitId);
    setStatusMap((prev) => ({ ...prev, [habitId]: status }));
    await setHabitStatus(user.id, habitId, dateKey, status);
    setSavingId((cur) => (cur === habitId ? null : cur));
  };

  const getPill = (status: HabitStatus) => {
    if (status === "success") return { label: "Bajarildi", cls: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30" };
    if (status === "in_progress") return { label: "Jarayonda", cls: "bg-amber-500/15 text-amber-200 border-amber-400/30" };
    return { label: "Bajarilmadi", cls: "bg-white/5 text-zinc-300 border-white/10" };
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <CalendarNavbar value={selectedDate} onChange={setSelectedDate} />
      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Mening odatlarim</h2>
          <p className="text-zinc-500 text-sm mt-1">Tanlangan odatlarni shu kunda bajarilganini belgilang.</p>
        </div>
        <div className="hidden md:block text-right">
          <div className="text-xs text-zinc-500">Kunlik progress</div>
          <div className="text-lg font-bold">
            {selected.length === 0 ? "—" : `${selected.filter((h) => statusMap[h.id] === "success").length}/${selected.length}`}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {selected.map((habit) => (
          <div
            key={habit.id}
            className={`relative overflow-hidden rounded-[24px] h-44 border text-left transition-all active:scale-95 ${
              statusMap[habit.id] === "success"
                ? "border-emerald-500 ring-4 ring-emerald-500/15"
                : statusMap[habit.id] === "in_progress"
                  ? "border-amber-400/40 ring-4 ring-amber-400/10"
                  : "border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <img
              src={habit.icon_url || 'https://via.placeholder.com/300'}
              alt={habit.title || habit.name || 'Odat'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4">
              <h3 className="text-white font-semibold text-sm leading-tight">{habit.title || habit.name || 'Nomsiz odat'}</h3>
              <p className="text-zinc-400 text-xs mt-1 line-clamp-1">{habit.description || ""}</p>
              <div className="mt-2">
                <span className={`inline-flex items-center gap-2 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${getPill(statusMap[habit.id] ?? "not_done").cls}`}>
                  {savingId === habit.id ? <Loader2 className="animate-spin" size={14} /> : null}
                  {getPill(statusMap[habit.id] ?? "not_done").label}
                </span>
              </div>
            </div>
            <div className="absolute top-3 right-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center border backdrop-blur ${
                statusMap[habit.id] === "success"
                  ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                  : statusMap[habit.id] === "in_progress"
                    ? "bg-amber-500/15 border-amber-400/30 text-amber-200"
                    : "bg-white/5 border-white/10 text-zinc-300"
              }`}>
                {statusMap[habit.id] === "success" ? <Check size={18} strokeWidth={3} /> : <Circle size={18} />}
              </div>
            </div>
            {/* Actions */}
            <div className="absolute bottom-3 right-3 left-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => void setStatus(habit.id, "in_progress")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                  statusMap[habit.id] === "in_progress"
                    ? "bg-amber-500/20 border-amber-400/40 text-amber-100"
                    : "bg-black/35 border-white/10 text-zinc-200 hover:border-white/20"
                }`}
              >
                Jarayonda
              </button>
              <button
                type="button"
                onClick={() => void setStatus(habit.id, "success")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                  statusMap[habit.id] === "success"
                    ? "bg-emerald-500/25 border-emerald-400/40 text-emerald-100"
                    : "bg-black/35 border-white/10 text-zinc-200 hover:border-white/20"
                }`}
              >
                Bajarildi
              </button>
            </div>
          </div>
        ))}

        {!loading && selected.length === 0 && (
          <p className="text-zinc-500 col-span-2">Hali odat tanlanmagan. Odatlar sahifasidan card tanlang.</p>
        )}
      </div>



    </div>
  );
};

export default Dashboard;
