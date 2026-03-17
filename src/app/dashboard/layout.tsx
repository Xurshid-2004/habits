"use client";

import { LayoutDashboard, CheckSquare, BarChart3, Target, User, Settings } from 'lucide-react';
import Link from 'next/link';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const Layout = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

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
        <div className="text-slate-400">Redirect...</div>
      </div>
    );
  }

  // Zamonaviy hover effekti va faol holat uchun uslub
  const navBtnClass = "flex items-center gap-4 p-3 rounded-xl transition-all duration-300 hover:bg-white/5 hover:text-emerald-400 text-slate-400 group/item w-full hover:translate-x-1";

  return (
    <div className="flex bg-[#0a0a0f] w-full overflow-hidden h-screen text-slate-200">
      {/* Sidebar - Glassmorphism effekti bilan */}
      <aside className="group fixed left-0 top-0 h-screen w-20 hover:w-64 bg-[#0f0f15]/80 backdrop-blur-xl border-r border-white/5 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-50 flex flex-col p-4 shadow-2xl">
        
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
          {[
            { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
            { name: 'Habits', icon: CheckSquare, href: '/dashboard/habits' },
            { name: 'Statistics', icon: BarChart3, href: '/dashboard/statics' },
            { name: 'Goals', icon: Target, href: '/dashboard/goals' },
            { name: 'Profile', icon: User, href: '/dashboard/profile' },
          ].map((item) => (
            <Link key={item.name} href={item.href} className={navBtnClass}>
              <item.icon size={22} className="min-w-[24px]" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium whitespace-nowrap">
                {item.name}
              </span>
            </Link>
          ))}

          <div className="mt-auto border-t border-white/5 pt-4">
            <Link href="/dashboard/settings" className={navBtnClass}>
              <Settings size={22} className="min-w-[24px]" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">Settings</span>
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 p-8 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-[#0a0a0f] to-[#0a0a0f]">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;