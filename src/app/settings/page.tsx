'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import TelegramSettingsCard from '@/components/settings/TelegramSettingsCard';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  Database,
  Shield,
  Sun,
  Moon,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check,
  Code,
  KeyRound,
  FileJson,
} from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { orders, payments, refreshData, resetToDefaultData, showToast } = useData();
  const { user, logout } = useAuth();

  const [copiedSql, setCopiedSql] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');

  const isConnected = isSupabaseConfigured();

  const schemaSnippet = `-- Supabase Table Schema
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  client_name TEXT NOT NULL,
  qty NUMERIC NOT NULL,
  cost_price NUMERIC NOT NULL,
  client_price NUMERIC NOT NULL,
  nabta_bill NUMERIC GENERATED ALWAYS AS (qty * cost_price) STORED,
  client_bill NUMERIC GENERATED ALWAYS AS (qty * client_price) STORED,
  jahed_balance NUMERIC GENERATED ALWAYS AS ((qty * client_price) - (qty * cost_price)) STORED,
  notes TEXT
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  payment_method TEXT DEFAULT 'Cash'
);

CREATE TABLE public.day_summaries (
  date DATE PRIMARY KEY,
  nabta_yesterday_balance NUMERIC DEFAULT 0,
  jahed_balance NUMERIC DEFAULT 0,
  paid NUMERIC DEFAULT 0,
  nabta_today_balance NUMERIC DEFAULT 0
);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(schemaSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
    showToast('SQL Schema copied to clipboard', 'success');
  };

  const handleExportBackup = () => {
    const backup = {
      orders,
      payments,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('Backup JSON exported successfully!', 'success');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Application Settings & Integrations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure Telegram Bot, Supabase PostgreSQL, data backups, and visual themes
          </p>
        </div>

        {/* Telegram Bot Settings Card */}
        <TelegramSettingsCard />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cloud Database Integration Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-lg space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white">
                  Supabase PostgreSQL Cloud Storage
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {isConnected
                      ? 'Connected & Real-Time Synced'
                      : 'Local Storage Mode Active (Offline ready)'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              To connect your live Supabase project, supply your credentials in <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-emerald-600">.env.local</code> or use the database schema below.
            </p>

            {/* SQL Snippet Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-emerald-500" />
                  <span>PostgreSQL DDL Migration</span>
                </span>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1 text-emerald-600 hover:text-emerald-500 transition-colors"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                {schemaSnippet}
              </pre>
            </div>
          </div>

          {/* Backup & Data Controls */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-lg space-y-6">
            {/* Theme Settings */}
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white mb-3">
                Appearance & Theme
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-900 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span>Sleek Dark Mode</span>
                </button>

                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-bold transition-all ${
                    theme === 'light'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-500 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Clean Light Mode</span>
                </button>
              </div>
            </div>

            {/* Data Backup & Restore */}
            <div className="border-t border-slate-200/80 dark:border-slate-800/80 pt-5 space-y-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white">
                Data Management
              </h3>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={handleExportBackup}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-500" />
                  <span>Export JSON Backup</span>
                </button>

                <button
                  onClick={resetToDefaultData}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-500/20 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload Sample Demo Data</span>
                </button>
              </div>
            </div>

            {/* Admin Account */}
            <div className="border-t border-slate-200/80 dark:border-slate-800/80 pt-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Active Admin: {user?.email || 'admin@salesreport.ae'}
                </p>
                <p className="text-[11px] text-slate-400">Role: Administrator (Full Access)</p>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
