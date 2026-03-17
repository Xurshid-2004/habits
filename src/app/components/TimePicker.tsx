"use client";

import { useState, useRef, useEffect } from "react";

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  isOpen: boolean;
  onClose: () => void;
  theme?: "fuchsia" | "indigo";
}

export default function TimePicker({ value, onChange, isOpen, onClose, theme = "fuchsia" }: TimePickerProps) {
  const [selectedHour, setSelectedHour] = useState(value.split(":")[0] || "07");
  const [selectedMinute, setSelectedMinute] = useState(value.split(":")[1] || "00");
  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);

  const hours = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, "0")
  );
  
  const minutes = Array.from({ length: 60 }, (_, i) => 
    i.toString().padStart(2, "0")
  );

  const themeColors = {
    fuchsia: {
      primary: "bg-fuchsia-500",
      border: "border-fuchsia-500/50",
      text: "text-fuchsia-400",
      hover: "hover:bg-fuchsia-500/10"
    },
    indigo: {
      primary: "bg-indigo-500",
      border: "border-indigo-500/50",
      text: "text-indigo-400",
      hover: "hover:bg-indigo-500/10"
    }
  };

  const colors = themeColors[theme];

  useEffect(() => {
    if (hourScrollRef.current) {
      const hourIndex = hours.indexOf(selectedHour);
      hourScrollRef.current.scrollTop = hourIndex * 60;
    }
    if (minuteScrollRef.current) {
      const minuteIndex = minutes.indexOf(selectedMinute);
      minuteScrollRef.current.scrollTop = minuteIndex * 60;
    }
  }, [selectedHour, selectedMinute]);

  const handleItemClick = (ref: React.RefObject<HTMLDivElement | null>, item: string, items: string[], setter: (value: string) => void) => {
    if (!ref.current) return;
    
    setter(item);
    
    const itemIndex = items.indexOf(item);
    const itemHeight = 60;
    const containerHeight = ref.current.clientHeight;
    const scrollPosition = itemIndex * itemHeight - (containerHeight / 2) + (itemHeight / 2);
    
    ref.current.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });
  };

  const handleSave = () => {
    onChange(`${selectedHour}:${selectedMinute}`);
    onClose();
  };

  const formatTimeDisplay = (hour: string, minute: string) => {
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minute} ${ampm}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-3xl p-6 w-full max-w-sm border border-slate-700 shadow-2xl">
        <h3 className="text-xl font-bold text-white text-center mb-6">
          Vaqtni tanlang
        </h3>
        
        <div className="text-3xl font-black text-white text-center mb-6">
          {formatTimeDisplay(selectedHour, selectedMinute)}
        </div>

        <div className="flex justify-center gap-4 mb-6">
          {/* Hour Selector */}
          <div className="relative">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-16 bg-slate-700/50 rounded-xl border-2 border-slate-600 pointer-events-none"></div>
            <div 
              ref={hourScrollRef}
              className="h-60 w-24 overflow-y-auto relative scrollbar-hide"
              style={{ scrollSnapType: 'y mandatory' }}
            >
              {hours.map((hour) => (
                <div
                  key={hour}
                  className={`h-16 flex items-center justify-center text-2xl font-bold cursor-pointer transition-all ${
                    selectedHour === hour 
                      ? `${colors.text} text-3xl` 
                      : 'text-slate-500 hover:text-white'
                  }`}
                  style={{ scrollSnapAlign: 'center' }}
                  onClick={() => handleItemClick(hourScrollRef, hour, hours, setSelectedHour)}
                >
                  {hour}
                </div>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="text-3xl font-bold text-white self-center">:</div>

          {/* Minute Selector */}
          <div className="relative">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-16 bg-slate-700/50 rounded-xl border-2 border-slate-600 pointer-events-none"></div>
            <div 
              ref={minuteScrollRef}
              className="h-60 w-24 overflow-y-auto relative scrollbar-hide"
              style={{ scrollSnapType: 'y mandatory' }}
            >
              {minutes.map((minute) => (
                <div
                  key={minute}
                  className={`h-16 flex items-center justify-center text-2xl font-bold cursor-pointer transition-all ${
                    selectedMinute === minute 
                      ? `${colors.text} text-3xl` 
                      : 'text-slate-500 hover:text-white'
                  }`}
                  style={{ scrollSnapAlign: 'center' }}
                  onClick={() => handleItemClick(minuteScrollRef, minute, minutes, setSelectedMinute)}
                >
                  {minute}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 transition-all"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 py-3 bg-gradient-to-r ${theme === 'fuchsia' ? 'from-fuchsia-600 to-rose-500' : 'from-indigo-600 to-violet-500'} text-white rounded-xl font-bold transition-all shadow-lg ${theme === 'fuchsia' ? 'shadow-fuchsia-500/20' : 'shadow-indigo-500/20'} hover:opacity-90`}
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
