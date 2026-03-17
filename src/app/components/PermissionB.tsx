"use client";

export default function PermissionB() {
  return (
    <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
      {/* Rasm va Ikonka qismi */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-20 rounded-full"></div>
        <div className="relative w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-orange-500/20 rotate-3 hover:rotate-0 transition-transform duration-500">
          <span className="text-5xl drop-shadow-lg">🔔</span>
        </div>
      </div>

      {/* Matn qismi */}
      <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
        Eslatmalarni <span className="text-amber-400">Yoqing</span>
      </h2>
      <p className="text-slate-400 leading-relaxed max-w-[280px] mb-8">
        Muvaffaqiyat kaliti — bu tartib. Biz sizga kerakli vaqtda motivatsiya berib turamiz.
      </p>

      {/* Funksiyalar ro'yxati */}
      <div className="w-full space-y-3">
        {[
          { icon: "⚡", text: "Tezkor eslatmalar", color: "bg-amber-500/10" },
          { icon: "📊", text: "Haftalik hisobotlar", color: "bg-orange-500/10" },
        ].map((item, i) => (
          <div 
            key={i} 
            className={`flex items-center gap-4 p-4 rounded-2xl border border-white/5 ${item.color} backdrop-blur-sm hover:border-white/20 transition-colors`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-semibold text-slate-200">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}