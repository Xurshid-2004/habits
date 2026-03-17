"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    // Keep console logging for debugging; UI shows a friendly fallback.
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white p-6">
          <h1 className="text-xl font-bold">Xatolik yuz berdi</h1>
          <p className="mt-2 text-zinc-400 break-words">{this.state.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

