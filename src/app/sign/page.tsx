"use client";
import { useState } from "react";
import SignUp from "./signUp";
import SignIn from "./signIn";

export default function SignPage() {
  const [isSignUp, setIsSignUp] = useState(true);
  return (
    <div>
      {isSignUp
        ? <SignUp onSignInClick={() => setIsSignUp(false)} />
        : <SignIn onSignUpClick={() => setIsSignUp(true)} />
      }
    </div>
  );
}