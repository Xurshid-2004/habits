"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Moon, Bell, Shield, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { signOut } = useAuth();
  const [dark, setDark] = useState(true);
  const [notif, setNotif] = useState(true);

  useEffect(() => {
    // UI-only demo state (app theme hook bo'lsa keyin ulaymiz)
    setDark(true);
  }, []);

  const clearLocal = () => {
    try {
      localStorage.removeItem("selected_habit_ids_v1");
      localStorage.removeItem("permissionEndTime");
    } catch {
      // ignore
    }
    alert("Local data tozalandi");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] text-white">
      <div className="max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Ilova sozlamalari va xavfsizlik.</p>

        <div className="mt-6 grid grid-cols-1 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Moon size={18} className="text-zinc-200" />
                </div>
                <div>
                  <div className="font-semibold">Dark mode</div>
                  <div className="text-zinc-500 text-sm">Ko‘zga yoqimli qorong‘i dizayn.</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDark((v) => !v)}
                className={`h-10 w-16 rounded-full border transition ${
                  dark ? "bg-emerald-500/20 border-emerald-400/30" : "bg-white/5 border-white/10"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full bg-white transition transform ${
                    dark ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Bell size={18} className="text-zinc-200" />
                </div>
                <div>
                  <div className="font-semibold">Notifications</div>
                  <div className="text-zinc-500 text-sm">Eslatmalar (keyin push/email ulaymiz).</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotif((v) => !v)}
                className={`h-10 w-16 rounded-full border transition ${
                  notif ? "bg-blue-500/20 border-blue-400/30" : "bg-white/5 border-white/10"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full bg-white transition transform ${
                    notif ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Shield size={18} className="text-zinc-200" />
              </div>
              <div>
                <div className="font-semibold">Security</div>
                <div className="text-zinc-500 text-sm">Auth Supabase orqali ishlaydi.</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <button
              type="button"
              onClick={clearLocal}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-zinc-200"
            >
              <Trash2 size={18} />
              Local data’ni tozalash
            </button>

            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 font-semibold shadow-lg shadow-red-600/20"
            >
              <LogOut size={18} />
              Chiqish (Sign out)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
