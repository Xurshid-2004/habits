"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import SignUp from "./sign/signUp";
import SignIn from "./sign/signIn";
import PermissionB from "./components/PermissionB";
import PermissionC from "./components/PermissionC";
import PermissionDate from "./components/PermissionDate";
import PermissionEnd from "./components/PermissionEnd";

type Step = "signup" | "signin" | "B" | "C" | "date" | "end";

export default function Home() {
  const [step, setStep] = useState<Step>("signup");
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // Hash token (Google OAuth implicit flow) ni ushlash
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.substring(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (access_token && refresh_token) {
      void supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
        if (!error) window.history.replaceState(null, "", window.location.pathname);
      });
    }
  }, []);

  // Authenticated bo'lganda Permission flow ga o'tish
  useEffect(() => {
    if (!loading && isAuthenticated && (step === "signup" || step === "signin")) {
      setStep("B");
    }
  }, [isAuthenticated, loading, step]);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Permission flow (yangi ro'yxatdan o'tgan foydalanuvchi)
  if (isAuthenticated && (step === "B" || step === "C" || step === "date" || step === "end")) {
    const STEPS: Step[] = ["B", "C", "date", "end"];
    const currentIdx = STEPS.indexOf(step);

    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[400px] bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
          <div className="p-6">
            {step === "B"    && <PermissionB />}
            {step === "C"    && <PermissionC />}
            {step === "date" && <PermissionDate />}
            {step === "end"  && (
              <PermissionEnd
                onBack={() => setStep("date")}
                onFinish={(time) => {
                  localStorage.setItem("permissionEndTime", time);
                  router.replace("/dashboard");
                }}
              />
            )}
          </div>

          <div className="p-6 pt-0 flex justify-between gap-4">
            <button
              onClick={() => {
                if (step === "C")    setStep("B");
                if (step === "date") setStep("C");
                if (step === "end")  setStep("date");
              }}
              disabled={step === "B"}
              className={`flex-1 py-3 rounded-xl font-medium transition-all text-sm ${
                step === "B"
                  ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-slate-700 text-white hover:bg-slate-600"
              }`}
            >
              Orqaga
            </button>
            {step !== "end" && (
              <button
                onClick={() => {
                  if (step === "B")    setStep("C");
                  if (step === "C")    setStep("date");
                  if (step === "date") setStep("end");
                }}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition-all text-sm"
              >
                Keyingisi
              </button>
            )}
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2 mt-6">
          {STEPS.map((s) => (
            <div key={s} className={`h-2 rounded-full transition-all duration-300 ${
              s === step ? "w-6 bg-cyan-500" : STEPS.indexOf(s) < currentIdx ? "w-2 bg-cyan-800" : "w-2 bg-slate-700"
            }`} />
          ))}
        </div>

        {/* Skip button */}
        <button
          onClick={() => router.replace("/dashboard")}
          className="mt-4 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          O'tkazib yuborish →
        </button>
      </div>
    );
  }

  // Auth flow
  return (
    <div>
      {step === "signup" && <SignUp onSignInClick={() => setStep("signin")} />}
      {step === "signin" && <SignIn onSignUpClick={() => setStep("signup")} />}
    </div>
  );
}