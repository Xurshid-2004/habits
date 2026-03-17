"use client";

import { useState } from "react";
import TimePicker from "./TimePicker";

export default function PermissionDate() {
  const [selectedTime, setSelectedTime] = useState("07:00");
  const [showTimePicker, setShowTimePicker] = useState(false);

  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <>
      <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-fuchsia-500 blur-3xl opacity-20 rounded-full"></div>
          <div className="relative w-24 h-24 bg-gradient-to-tr from-fuchsia-600 to-rose-400 rounded-2xl flex items-center justify-center shadow-xl shadow-fuchsia-500/20 -rotate-6">
            <span className="text-5xl drop-shadow-lg">📅</span>
          </div>
        </div>

        <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
          Sizning <span className="text-fuchsia-400">Ritmingiz</span>
        </h2>
        <p className="text-slate-400 mb-8">
          Kuningiz soat nechchidan boshlanadi? Biz shunga moslashamiz.
        </p>

        {/* Time Display Button */}
        <button
          onClick={() => setShowTimePicker(true)}
          className="w-full mb-8 bg-slate-800/50 border-2 border-white/10 rounded-[20px] p-6 text-4xl font-bold text-center text-white hover:border-fuchsia-500 outline-none transition-all cursor-pointer hover:bg-slate-700/50 group"
        >
          <div className="flex items-center justify-center gap-2">
            <span>{formatTimeDisplay(selectedTime)}</span>
            <span className="text-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity text-2xl">⏰</span>
          </div>
        </button>
        
        <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">
          Sizga mos eng yaxshi vaqt
        </p>
      </div>

      <TimePicker
        value={selectedTime}
        onChange={setSelectedTime}
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        theme="fuchsia"
      />
    </>
  );
}