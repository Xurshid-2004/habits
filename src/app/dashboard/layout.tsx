"use client";

import { LayoutDashboard, CheckSquare, BarChart3, Target, User, Settings } from 'lucide-react';
import Link from 'next/link';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

const Layout = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) router.replace('/');
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-slate-200 flex items-center justify-center">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="h-2 w-28 rounded bg-white/10 mb-4" />
          <div className="h-2 w-40 rounded bg-white/10 mb-2" />
          <div className="h-2 w-32 rounded bg-white/10" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-slate-200 flex items-center justify-center">
        <div className="text-slate-400">Yo‘naltirilmoqda...</div>
      </div>
    );
  }

  // Zamonaviy hover effekti va faol holat uchun uslub
  const navBtnClass = "flex items-center gap-4 p-3 rounded-xl transition-all duration-300 hover:bg-white/5 hover:text-emerald-400 text-slate-400 group/item w-full hover:translate-x-1";
  const isActive = (href: string) => pathname === href;
  const navItems = [
    { name: 'Bosh sahifa', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Odatlar', icon: CheckSquare, href: '/dashboard/habits' },
    { name: 'Statistika', icon: BarChart3, href: '/dashboard/statics' },
    { name: 'Profil', icon: User, href: '/dashboard/profile' },
  ];

  return (
    <div className="flex bg-[#0a0a0f] w-full overflow-hidden min-h-screen text-slate-200">
      {/* Sidebar (md+) */}
      <aside className="hidden md:flex group fixed left-0 top-0 h-screen w-20 hover:w-64 bg-[#0f0f15]/80 backdrop-blur-xl border-r border-white/5 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-50 flex-col p-4 shadow-2xl">
        
        {/* Logo */}
        <div className="flex items-center gap-4 mb-10 px-2 mt-4">
          <div className="min-w-[32px] h-8 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center rounded-xl shadow-lg shadow-emerald-500/20">
            <CheckSquare className="text-white" size={20} />
          </div>
          <span className="font-bold text-white text-lg tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            SmartHabit
          </span>
        </div>

        {/* Navigatsiya */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`${navBtnClass} ${isActive(item.href) ? "bg-white/5 text-emerald-200 border border-white/10" : ""}`}
            >
              <item.icon size={22} className="min-w-[24px]" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium whitespace-nowrap">
                {item.name}
              </span>
            </Link>
          ))}

          <div className="mt-auto border-t border-white/5 pt-4">
            <Link
              href="/dashboard/settings"
              className={`${navBtnClass} ${isActive("/dashboard/settings") ? "bg-white/5 text-emerald-200 border border-white/10" : ""}`}
            >
              <Settings size={22} className="min-w-[24px]" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">Sozlamalar</span>
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-20 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-[#0a0a0f] to-[#0a0a0f]">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0f0f15]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 py-2 grid grid-cols-4 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition ${
                isActive(item.href) ? "bg-white/5 text-emerald-200" : "text-slate-400"
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-semibold leading-none">{item.name}</span>
            </Link>
          ))}
        </div>
        <div className="px-3 pb-3">
          <Link
            href="/dashboard/settings"
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl border transition ${
              isActive("/dashboard/settings")
                ? "bg-white/5 border-white/15 text-emerald-200"
                : "bg-black/20 border-white/10 text-slate-300"
            }`}
          >
            <Settings size={18} />
            <span className="text-sm font-semibold">Sozlamalar</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Layout;