"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import SignUp from "./sign/signUp";
import SignIn from "./sign/signIn";
import PermissionB from "./components/PermissionB";
import PermissionC from "./components/PermissionC";
import PermissionDate from "./components/PermissionDate";
import PermissionEnd from "./components/PermissionEnd";

export default function Home() {
  const [step, setStep] = useState(0); // 0: SignUp, 1: SignIn, 2: B, 3: C, 4: Date, 5: End
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handlePermissionFinish = (time: string) => {
    // Save the end time to localStorage
    localStorage.setItem('permissionEndTime', time);
    // Navigate to dashboard
    router.push('/dashboard');
  };

  const handlePermissionBack = () => {
    setStep(step - 1);
  };

  // If user is authenticated, show the main flow
  if (isAuthenticated) {
    // Reset step to start of main flow when authenticated
    if (step < 2) setStep(2);
    
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[400px] bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
          
          {/* Content Area */}
          <div className="p-6">
            {step === 2 && <PermissionB />}
            {step === 3 && <PermissionC />}
            {step === 4 && <PermissionDate />}
            {step === 5 && <PermissionEnd onBack={handlePermissionBack} onFinish={handlePermissionFinish} />}
          </div>

          {/* Navigation Buttons */}
          <div className="p-6 pt-0 flex justify-between gap-4">
            <button 
              onClick={() => setStep(step - 1)}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${step === 2 ? "bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-slate-700 text-white hover:bg-slate-600"}`}
              disabled={step === 2}
            >
              Orqaga
            </button>
            
            {/* PermissionEnd da o'z tugmasi borligi uchun "Keyingisi" tugmasini ko'rsatamiz */}
            {step < 5 && (
              <button 
                onClick={() => setStep(step + 1)}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20"
              >
                Keyingisi
              </button>
            )}
          </div>
        </div>
        
        {/* Progress Dots */}
        <div className="flex gap-2 mt-6">
          {[2, 3, 4, 5].map((s) => (
            <div key={s} className={`h-2 w-2 rounded-full transition-all ${step === s ? "w-6 bg-cyan-500" : "bg-slate-700"}`} />
          ))}
        </div>
      </div>
    );
  }

  // Show authentication flow
  return (
    <div>
      {step === 0 && <SignUp onSignInClick={() => setStep(1)} />}
      {step === 1 && <SignIn onSignUpClick={() => setStep(0)} />}
    </div>
  );
}