"use client";

export default function PermissionC() {
  return (
    <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-20 rounded-full"></div>
        <div className="relative w-24 h-24 bg-gradient-to-br from-cyan-400 to-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-cyan-500/20 hover:scale-110 transition-transform duration-500">
          <span className="text-5xl drop-shadow-lg">☁️</span>
        </div>
      </div>

      <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
        Bulutli <span className="text-cyan-400">Sinxronizatsiya</span>
      </h2>
      <p className="text-slate-400 leading-relaxed mb-8">
        Ma’lumotlaringiz har doim xavfsiz va barcha qurilmalaringizda mavjud bo’ladi.
      </p>

      <div className="grid grid-cols-2 gap-3 w-full">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center">
          <span className="text-cyan-400 font-bold">256-bit</span>
          <span className="text-[10px] uppercase tracking-tighter text-slate-500">Shifrlash</span>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center">
          <span className="text-indigo-400 font-bold">Unlimited</span>
          <span className="text-[10px] uppercase tracking-tighter text-slate-500">Xotira</span>
        </div>
      </div>
    </div>
  );
}
