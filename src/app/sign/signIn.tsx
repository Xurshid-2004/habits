import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface SignInProps {
  onSignUpClick: () => void;
}

const SignIn = ({ onSignUpClick }: SignInProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const success = await signIn(formData.email, formData.password);
      if (success) {
        alert("Muvaffaqiyatli kirdingiz!");
      } else {
        alert("Email yoki parol noto'g'ri");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      alert("Xatolik: " + message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGoogleSignIn = async () => {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Karta konteyneri */}
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-xl p-8 transition-all hover:shadow-2xl">
        
        {/* Sarlavha */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Xush kelibsiz</h1>
          <p className="text-gray-500 mt-2">Tizimga kirish uchun ma’lumotlarni kiriting</p>
        </div>

        {/* Form qismi */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email manzilingiz</label>
            <input 
              name="email"
              placeholder="Masalan: example@mail.com"
              type="email" 
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parol</label>
            <input 
              name="password"
              placeholder="••••••••" 
              type="password" 
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              required
            />
          </div>

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-4"
          >
            Google orqali kirish
          </button>

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-4">
            Kirish
          </button>
        </form>

        {/* Pastki qism */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Hisobingiz yo&apos;qmi? <span onClick={onSignUpClick} className="text-indigo-600 font-semibold cursor-pointer hover:underline">Ro&apos;yxatdan o&apos;ting</span>
          </p>
        </div>

      </div>
    </div>
  );
}

export default SignIn;
