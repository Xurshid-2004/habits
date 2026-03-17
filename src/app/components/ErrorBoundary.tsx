"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center p-4">
          <div className="bg-red-800/90 backdrop-blur-xl rounded-3xl p-8 max-w-2xl border border-red-700 shadow-2xl shadow-red-500/20">
            {/* Error Icon */}
            <div className="flex items-center justify-center w-16 h-16 bg-red-500 rounded-full mb-6 mx-auto">
              <svg className="w-8 h-8 text-red-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h.013M12 19v2m0 4h.01M9 19a3 3 0 00-3 3v2m0 4h.01M15 19a3 3 0 00-3 3v2m0 4h.01M21 19a3 3 0 00-3 3v2m0 4h.01" />
              </svg>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-red-100 mb-4 text-center">
              Xatolik yuz berdi!
            </h1>

            {/* Error Message */}
            <div className="bg-red-900/50 rounded-2xl p-6 mb-6 border border-red-800">
              <h2 className="text-lg font-semibold text-red-300 mb-3">
                Xatolik tafsiloti:
              </h2>
              <p className="text-red-400 font-mono text-sm leading-relaxed">
                {this.state.error?.message || 'Noma’lum xatolik yuz berdi'}
              </p>
            </div>

            {/* Error Details */}
            {this.state.errorInfo && (
              <details className="bg-red-900/30 rounded-2xl p-4 border border-red-800">
                <summary className="cursor-pointer text-red-300 font-medium mb-2 hover:text-red-200 transition-colors">
                  📋 Texnik ma’lumotlar
                </summary>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="text-red-500">
                    <span className="font-semibold text-red-400">Komponent:</span> {this.state.errorInfo.componentStack}
                  </div>
                  <div className="text-red-500">
                    <span className="font-semibold text-red-400">Fayl:</span> {this.state.errorInfo.componentStack?.split('\n')[1]?.trim()}
                  </div>
                  <div className="text-red-500">
                    <span className="font-semibold text-red-400">Qator:</span> {this.state.errorInfo.componentStack?.split('\n')[2]?.trim()}
                  </div>
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium py-3 px-6 rounded-xl transition-all active:scale-95"
              >
                🔄 Sahifani qayta yuklash
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                className="flex-1 bg-red-800 hover:bg-red-700 text-red-300 font-medium py-3 px-6 rounded-xl transition-all active:scale-95"
              >
                ❌ Yopish
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-red-500 text-sm">
                Agar xatolik davom etsa, iltimos <span className="font-semibold text-red-400">sahifangizni qayta yuklang</span> yoki <span className="font-semibold text-red-400">administrator bilan bog’laning</span>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children || this.props.fallback;
  }
}

export default ErrorBoundary;
