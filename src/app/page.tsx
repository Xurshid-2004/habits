"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import SignUp from "./sign/signUp";
import SignIn from "./sign/signIn";
import PermissionB from "./components/PermissionB";
import PermissionC from "./components/PermissionC";
import PermissionDate from "./components/PermissionDate";
import PermissionEnd from "./components/PermissionEnd";

export default function Home() {
  const [step, setStep] = useState<"signup" | "signin" | "B" | "C" | "date" | "end">("signup");
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Faqat yangi kirgan foydalanuvchi uchun — PermissionB ga o'tish
    if (!loading && isAuthenticated && step === "signup") {
      setStep("B");
    }
    if (!loading && isAuthenticated && step === "signin") {
      setStep("B");
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Permission flow (authenticated)
  if (isAuthenticated && (step === "B" || step === "C" || step === "date" || step === "end")) {
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
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
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
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 shadow-lg"
              >
                Keyingisi
              </button>
            )}
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2 mt-6">
          {(["B", "C", "date", "end"] as const).map((s) => (
            <div key={s} className={`h-2 rounded-full transition-all ${
              step === s ? "w-6 bg-cyan-500" : "w-2 bg-slate-700"
            }`} />
          ))}
        </div>
      </div>
    );
  }

  // Auth flow (not authenticated)
  return (
    <div>
      {step === "signup" && <SignUp onSignInClick={() => setStep("signin")} />}
      {step === "signin" && <SignIn onSignUpClick={() => setStep("signup")} />}
    </div>
  );
}