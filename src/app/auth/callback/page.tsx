"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const [currentUrl, setCurrentUrl] = useState<string>('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('🚀 Auth callback started...');
      
      // Faqat client-side da window ga kirish
      if (typeof window !== 'undefined') {
        setCurrentUrl(window.location.href);
        console.log('📍 Current URL:', window.location.href);
        console.log('📍 Hash:', window.location.hash);
        console.log('📍 Search:', window.location.search);
      }
      
      try {
        // URL parametrlarini tekshirish
        const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        const hashParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.hash.substring(1) : '');
        
        console.log('📋 URL params:', Object.fromEntries(urlParams.entries()));
        console.log('📋 Hash params:', Object.fromEntries(hashParams.entries()));
        
        // Tokenlarni olish
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        console.log('🔑 Tokens found:', { 
          accessToken: !!accessToken, 
          refreshToken: !!refreshToken 
        });
        
        if (accessToken && refreshToken) {
          // Tokenlarni qo'lda session ga o'rnatish
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          console.log('🔧 Session set result:', { data, error });
          
          if (error) {
            console.error('❌ Session set error:', error);
            alert(`Session o'rnatish xatosi: ${error.message}`);
            router.push("/");
            return;
          }
        }
        
        // Supabase avtomatik ravishda session ni qayta tiklaydi
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Session ni tekshirish
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('🔍 Session check result:', { 
          session: !!session, 
          user: session?.user?.email,
          error: sessionError 
        });
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          alert(`Session xatolik: ${sessionError.message}`);
          router.push("/");
          return;
        }

        if (session) {
          console.log('✅ Success! User authenticated:', session.user.email);
          console.log('🎉 Redirecting to main page...');
          
          // Muvaffaqiyatli autentifikatsiya - asosiy sahifaga o'tish
          setTimeout(() => {
            router.push("/");
          }, 1000);
        } else {
          console.log('❌ No session found after OAuth callback');
          alert('Autentifikatsiya muvaffaqiyatli amalga oshmadi. Iltimos, qayta urinib ko\'ring.');
          router.push("/");
        }
      } catch (error: unknown) {
        console.error("💥 Callback error:", error);
        const message = error instanceof Error ? error.message : String(error);
        alert(`Xatolik yuz berdi: ${message}`);
        router.push("/");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 mb-2">Google bilan autentifikatsiya tekshirilmoqda...</p>
        <p className="text-gray-400 text-sm">Iltimos, kuting...</p>
        <div className="mt-4 p-4 bg-white rounded-lg shadow-sm max-w-md mx-auto">
          <p className="text-xs text-gray-500">Debug info: Console loglarini tekshiring (F12)</p>
          {currentUrl && <p className="text-xs text-gray-400 mt-1">URL: {currentUrl}</p>}
        </div>
      </div>
    </div>
  );
}
