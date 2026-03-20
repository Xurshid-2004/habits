"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import SignUp from "./sign/signUp";
import SignIn from "./sign/signIn";

export default function Home() {
  const [isSignUp, setIsSignUp] = useState(true);
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div>
      {isSignUp
        ? <SignUp onSignInClick={() => setIsSignUp(false)} />
        : <SignIn onSignUpClick={() => setIsSignUp(true)} />
      }
    </div>
  );
}