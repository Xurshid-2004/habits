"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TimePicker from "./TimePicker";

interface PermissionEndProps {
  onBack: () => void;
  onFinish: (time: string) => void; // Vaqtni ota komponentga qaytarish uchun
}

export default function PermissionEnd({ onBack, onFinish }: PermissionEndProps) {
  const [endTime, setEndTime] = useState("22:00"); // Standart vaqt
  const [isSaving, setIsSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const router = useRouter();

  const handleFinish = async () => {
    setIsSaving(true);
    
    try {
      // Tugmani bosganda vaqtni onFinish orqali ota komponentga yuboramiz
      onFinish(endTime);
      
      // Ma'lumotlarni saqlash va navigatsiya
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate save delay
      
      // Dashboardga o'tish
      router.push("/dashboard");
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

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
        {/* Ikonka qismi */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 rounded-full"></div>
          <div className="relative w-24 h-24 bg-gradient-to-tr from-indigo-600 to-violet-400 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 -rotate-6">
            <span className="text-5xl drop-shadow-lg">🌙</span>
          </div>
        </div>

        <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
          Kuningizni <span className="text-indigo-400">qachon tugatasiz?</span>
        </h2>
        <p className="text-slate-400 mb-8">
          Biz sizning tungi dam olish vaqtingizga moslashamiz.
        </p>

        {/* Time Display Button */}
        <button
          onClick={() => setShowTimePicker(true)}
          className="w-full mb-8 bg-slate-800/50 border-2 border-white/10 rounded-[20px] p-6 text-4xl font-bold text-center text-white hover:border-indigo-500 outline-none transition-all cursor-pointer hover:bg-slate-700/50 group"
        >
          <div className="flex items-center justify-center gap-2">
            <span>{formatTimeDisplay(endTime)}</span>
            <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity text-2xl">⏰</span>
          </div>
        </button>

        {/* Tugmalar */}
        <div className="flex gap-4 w-full">
          <button
            onClick={handleFinish}
            disabled={isSaving}
            className={`flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 ${
              isSaving ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
            }`}
          >
            {isSaving ? "Saqlanmoqda..." : "Saqlash va Tugatish"}
          </button>
        </div>
      </div>

      <TimePicker
        value={endTime}
        onChange={setEndTime}
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        theme="indigo"
      />
    </>
  );
}