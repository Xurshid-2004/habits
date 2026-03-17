"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import TimePicker from "@/app/components/TimePicker";
import { Save } from "lucide-react";

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

type ProfileRow = {
  id: string;
  name: string | null;
  start_day: number | null;
  end_day: number | null;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("22:00");

  const [picker, setPicker] = useState<null | "start" | "end">(null);

  const fallbackName = useMemo(() => {
    return (
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      "User"
    );
  }, [user?.email, user?.user_metadata]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, start_day, end_day")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        const row = data as ProfileRow | null;
        setName(row?.name || fallbackName);
        if (row?.start_day != null) setStartTime(minutesToTime(Number(row.start_day)));
        if (row?.end_day != null) setEndTime(minutesToTime(Number(row.end_day)));
      } catch (e) {
        console.error(e);
        setName(fallbackName);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [fallbackName, user?.id]);

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const payload: ProfileRow = {
        id: user.id,
        name: name.trim() || fallbackName,
        start_day: timeToMinutes(startTime),
        end_day: timeToMinutes(endTime),
      };
      const { error } = await supabase.from("profiles").upsert(payload);
      if (error) throw error;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      alert("Saqlashda xatolik: " + message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] text-white">
      <div className="max-w-3xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profil</h1>
            <p className="text-zinc-500 text-sm mt-1">Ism va kun rejimini sozlang (tongni boshlash / tugatish).</p>
          </div>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed font-semibold shadow-lg shadow-emerald-600/20"
          >
            <Save size={18} />
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs text-zinc-500 font-bold tracking-widest uppercase">Ism</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={fallbackName}
              className="mt-2 w-full bg-transparent text-lg font-semibold outline-none border-b border-white/10 focus:border-emerald-500/60 pb-2"
            />
            <div className="text-xs text-zinc-500 mt-2">Bosh sahifada shu ism bilan ko‘rinadi.</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs text-zinc-500 font-bold tracking-widest uppercase">Kun rejimi</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPicker("start")}
                className="rounded-2xl border border-white/10 bg-black/30 p-4 text-left hover:border-emerald-400/30 transition"
              >
                <div className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Tongni boshlash</div>
                <div className="text-2xl font-black mt-2">{startTime}</div>
              </button>
              <button
                type="button"
                onClick={() => setPicker("end")}
                className="rounded-2xl border border-white/10 bg-black/30 p-4 text-left hover:border-emerald-400/30 transition"
              >
                <div className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Tongni tugatish</div>
                <div className="text-2xl font-black mt-2">{endTime}</div>
              </button>
            </div>
            <div className="text-xs text-zinc-500 mt-3">
              Bu vaqtlar statistika va kunlik hisobotlarda ishlatiladi.
            </div>
          </div>
        </div>
      </div>

      <TimePicker
        value={picker === "start" ? startTime : endTime}
        onChange={(t) => (picker === "start" ? setStartTime(t) : setEndTime(t))}
        isOpen={picker != null}
        onClose={() => setPicker(null)}
        theme="indigo"
      />
    </div>
  );
}
