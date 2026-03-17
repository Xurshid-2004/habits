

"use client";
import { useState, useMemo, useRef, useEffect } from "react";

const UZ_MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];
const UZ_WEEKDAYS = ["Yak","Dush","Sesh","Chor","Pay","Jum","Shan"];

function getWeekNumber(d: Date) {
  const date = new Date(d); date.setHours(0,0,0,0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((+date - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

type CalendarNavbarProps = {
  value?: Date;
  onChange?: (next: Date) => void;
};

export default function CalendarNavbar({ value, onChange }: CalendarNavbarProps) {

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  }, []);

  // Faqat o‘tgan 7 kun (bugun bilan birga): future yo‘q, old days 7 tadan oshmaydi
  const minDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    return d;
  }, [today]);

  const [selectedDate, setSelectedDate] = useState<Date>(value ? new Date(value) : new Date(today));
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) return;
    setSelectedDate(new Date(value));
  }, [value]);

  const days = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(minDate);
      d.setDate(minDate.getDate() + i);
      result.push(d);
    }
    return result;
  }, [minDate]);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center"
    });
  }, [selectedDate]);

  const isSame = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const titleMonth = UZ_MONTHS[selectedDate.getMonth()];
  const titleYear = selectedDate.getFullYear();

  return (
    <div className="w-full bg-[#0B0F1A] rounded-xl md:rounded-2xl shadow-xl border border-white/5">

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 md:px-6 pt-4 md:pt-5 pb-2 md:pb-3">

        <div>
          <p className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-blue-400">
            {isSame(selectedDate, today) ? "Bugun" : "O‘tgan kunlar"}
          </p>

          <h2 className="text-lg md:text-2xl font-bold text-slate-100 tracking-tight">
            {titleMonth}
            <span className="text-blue-400 ml-1">{titleYear}</span>
          </h2>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={() => {
              setSelectedDate(new Date(today));
            }}
            className="px-3 md:px-4 h-8 md:h-9 rounded-xl border border-blue-400/30 bg-blue-400/10 text-blue-400 text-[10px] md:text-xs font-semibold"
          >
            Bugun
          </button>
        </div>
      </div>

      {/* DAYS */}
      <div className="px-3 md:px-4 pb-4 md:pb-5  overflow-hidden">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide items-center overflow-y-hidden">

          {days.map((d, i) => {

            const isSelected = isSame(d, selectedDate);
            const disabled = d < minDate || d > today;

            return (
              <div
                key={i}
                ref={isSelected ? selectedRef : null}
                onClick={() => {
                  if (disabled) return;
                  const next = new Date(d);
                  setSelectedDate(next);
                  onChange?.(next);
                }}
                className={`flex-shrink-0
                w-12 h-16 md:w-14 md:h-20
                rounded-xl md:rounded-2xl
                flex flex-col items-center justify-center
                border cursor-pointer transition
                ${isSelected
                  ? "bg-blue-500 border-blue-500 scale-105"
                  : "bg-white/5 border-white/10"
                }
                ${disabled ? "opacity-30 pointer-events-none" : ""}
                `}
              >
                <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase">
                  {UZ_WEEKDAYS[d.getDay()]}
                </span>

                <span className="text-base md:text-xl font-bold text-slate-200">
                  {d.getDate()}
                </span>

              </div>
            );
          })}

        </div>
      </div>

      {/* INFO */}
      <div className="px-4 md:px-6 pb-4">
        <p className="text-[11px] md:text-xs text-slate-500 font-medium">
          {selectedDate.getDate()} {UZ_MONTHS[selectedDate.getMonth()]} • {getWeekNumber(selectedDate)}-hafta
        </p>
      </div>

    </div>
  );
}