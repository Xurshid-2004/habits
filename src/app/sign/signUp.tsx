import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface SignUpProps {
  onSignInClick: () => void;
}

const SignUp = ({ onSignInClick }: SignUpProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      alert("Muvaffaqiyatli ro'yxatdan o'tdingiz!")
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      alert("Xatolik: " + message)
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  const handleGoogleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Google orqali kirish boshlandi...');
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/callback`,
        }
      });
      
      console.log('OAuth response:', { data, error });
      
      if (error) {
        console.error('Google OAuth error:', error);
        alert("Google orqali kirishda xatolik: " + error.message);
      } else {
        console.log("Google sahifasiga yo'naltirilmoqda...");
      }
    } catch (error: unknown) {
      console.error('Google sign-in error:', error);
      const message = error instanceof Error ? error.message : String(error);
      alert("Google orqali kirishda xatolik: " + message);
    }
  };

  return (
    // min-h-screen o'rniga h-screen ishlatamiz va overflow-hidden beramiz
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-2 sm:p-4 overflow-hidden">
      
      {/* Karta konteyneri: paddinglar (p-6) va marginlar (mb-4) kamaytirildi */}
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl p-6 border border-emerald-100 mx-auto">
        
        {/* Sarlavha qismi: icon o'lchami va marginlar kichraytirildi */}
        <div className="text-center mb-5">
          <div className="inline-block p-2 bg-emerald-100 rounded-full mb-2">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Ro&apos;yxatdan o&apos;tish
          </h1>
        </div>

        {/* Form: space-y-3 orqali elementlar orasi yaqinlashtirildi */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ism</label>
              <input 
                name="name"
                placeholder="Masalan: Ali"
                type="text" 
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email</label>
            <input 
              name="email"
              placeholder="Masalan: example@mail.com"
              type="email" 
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-sm"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Parol</label>
            <input 
              name="password"
              placeholder="••••••••" 
              type="password" 
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-sm"
              required
            />
          </div>
          <button type="button" onClick={handleGoogleSignIn} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md transition-all transform active:scale-[0.98] mt-2 text-sm">
            Google orqali ro&apos;yxatdan o&apos;tish
          </button>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition-all transform active:scale-[0.98] mt-2 text-sm">
            Ro&apos;yxatdan o&apos;tish
          </button>
        </form>

        {/* Pastki qism: ixchamroq ko'rinishga keltirildi */}
        <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between gap-2">
          <span className="text-red-500">
            Hisobingiz bormi?
          </span>
          <button 
            onClick={onSignInClick}
            className="text-xs font-bold text-blue-500 hover:text-emerald-700 transition-colors uppercase tracking-wider"
          >
            Kirish
          </button>
        </div>

      </div>
    </div>
  );
}

export default SignUp;
