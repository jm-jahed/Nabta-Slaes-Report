'use client';

import React from 'react';
import { useData } from '@/context/DataContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useData();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl shadow-xl backdrop-blur-xl border transition-all duration-300 animate-in slide-in-from-bottom-5 ${
              isSuccess
                ? 'bg-emerald-950/90 text-emerald-100 border-emerald-500/40 shadow-emerald-950/30'
                : isError
                ? 'bg-rose-950/90 text-rose-100 border-rose-500/40 shadow-rose-950/30'
                : 'bg-slate-900/90 text-slate-100 border-slate-700/60 shadow-slate-950/30'
            }`}
          >
            <div className="flex items-center gap-3">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-sky-400 flex-shrink-0" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/60 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
