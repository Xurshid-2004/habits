"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Save, User, Clock, Sunrise, Sunset, CheckCircle, Mail } from "lucide-react";
import { motion } from "framer-motion";

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return Math.min(24 * 60 - 1, Math.max(0, h * 60 + m));
}
function minutesToTime(min: number): string {
  const safe = Number.isFinite(min) ? min : 0;
  const h = Math.floor(safe / 60) % 24;
  const m = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Simple time input with +/- buttons
function TimeInput({ label, icon, value, onChange, accentColor }: {
  label: string; icon: React.ReactNode; value: string;
  onChange: (v: string) => void; accentColor: string;
}) {
  const [h, m] = value.split(":").map(Number);

  const changeHour = (delta: number) => {
    const newH = ((h + delta) + 24) % 24;
    onChange(`${String(newH).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
  };
  const changeMin = (delta: number) => {
    const newM = ((m + delta) + 60) % 60;
    onChange(`${String(h).padStart(2,"0")}:${String(newM).padStart(2,"0")}`);
  };

  return (
    <div className={`rounded-2xl border bg-zinc-900/60 p-5 ${accentColor}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accentColor.includes('amber') ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'}`}>
          {icon}
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</span>
      </div>
      <div className="flex items-center justify-center gap-3">
        {/* Hours */}
        <div className="flex flex-col items-center gap-1">
          <button onClick={() => changeHour(1)} className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all text-lg font-bold">+</button>
          <div className="w-16 h-14 bg-zinc-800 rounded-xl flex items-center justify-center">
            <span className="text-3xl font-black text-white">{String(h).padStart(2,"0")}</span>
          </div>
          <button onClick={() => changeHour(-1)} className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all text-lg font-bold">−</button>
        </div>
        <span className="text-3xl font-black text-zinc-600 mb-1">:</span>
        {/* Minutes */}
        <div className="flex flex-col items-center gap-1">
          <button onClick={() => changeMin(5)} className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all text-lg font-bold">+</button>
          <div className="w-16 h-14 bg-zinc-800 rounded-xl flex items-center justify-center">
            <span className="text-3xl font-black text-white">{String(m).padStart(2,"0")}</span>
          </div>
          <button onClick={() => changeMin(-5)} className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all text-lg font-bold">−</button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("22:00");

  const fallbackName = useMemo(() => (
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Foydalanuvchi"
  ), [user]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const { data } = await supabase.from("profiles").select("id,name,start_day,end_day").eq("id", user.id).maybeSingle();
        const row = data as { name: string|null; start_day: number|null; end_day: number|null } | null;
        setName(row?.name || fallbackName);
        if (row?.start_day != null) setStartTime(minutesToTime(Number(row.start_day)));
        if (row?.end_day != null) setEndTime(minutesToTime(Number(row.end_day)));
      } catch (e) { console.error(e); setName(fallbackName); }
      finally { setLoading(false); }
    };
    void load();
  }, [fallbackName, user?.id]);

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        name: name.trim() || fallbackName,
        start_day: timeToMinutes(startTime),
        end_day: timeToMinutes(endTime),
      });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      alert("Saqlashda xatolik: " + (e instanceof Error ? e.message : String(e)));
    } finally { setSaving(false); }
  };

  // Duration between start and end
  const durationText = useMemo(() => {
    const s = timeToMinutes(startTime);
    const e = timeToMinutes(endTime);
    const diff = e > s ? e - s : (24 * 60 - s + e);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h} soat${m > 0 ? ` ${m} daqiqa` : ''}`;
  }, [startTime, endTime]);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 pb-24">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
            <p className="text-zinc-500 text-sm mt-1">Shaxsiy ma'lumotlar va kun rejimi</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => void save()}
            disabled={saving || loading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm border transition-all shadow-lg ${
              saved
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 shadow-emerald-500/10'
                : 'bg-blue-600 hover:bg-blue-500 border-blue-500/30 text-white shadow-blue-600/20 disabled:opacity-50'
            }`}
          >
            {saved ? <><CheckCircle size={16} /> Saqlandi!</> : saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saqlanmoqda...</> : <><Save size={16} /> Saqlash</>}
          </motion.button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Avatar + Name */}
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/20 flex-shrink-0">
                  {(name || fallbackName).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Ism</p>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={fallbackName}
                    className="w-full bg-transparent text-xl font-bold text-white outline-none border-b-2 border-zinc-700 focus:border-blue-500 pb-1 transition-colors"
                  />
                </div>
              </div>
              {user?.email && (
                <div className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-800/50 rounded-xl px-3 py-2">
                  <Mail size={14} />
                  <span>{user.email}</span>
                </div>
              )}
            </motion.div>

            {/* Day schedule */}
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-[24px] p-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-400/25 flex items-center justify-center"><Clock size={15} className="text-blue-400" /></div>
                <div>
                  <p className="text-sm font-bold">Kun rejimi</p>
                  <p className="text-[11px] text-zinc-500">Dashboard da ko'rsatiladi</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TimeInput label="Boshlanish" icon={<Sunrise size={14}/>} value={startTime} onChange={setStartTime} accentColor="border-amber-500/20" />
                <TimeInput label="Tugash" icon={<Sunset size={14}/>} value={endTime} onChange={setEndTime} accentColor="border-blue-500/20" />
              </div>

              {/* Duration info */}
              <div className="mt-4 flex items-center justify-between bg-zinc-800/50 rounded-xl px-4 py-3">
                <span className="text-xs text-zinc-500 font-semibold">Faol kun davomiyligi</span>
                <span className="text-sm font-bold text-white">{durationText}</span>
              </div>
            </motion.div>

            {/* Info note */}
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
              className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl px-4 py-3 flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={12} className="text-blue-400" />
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Kun rejimi <span className="text-zinc-300 font-semibold">Bosh sahifada</span> chiqadi. Ertalab boshlanish va kechqurun tugash vaqtlarini belgilang.
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}