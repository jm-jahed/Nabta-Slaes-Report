'use client';

import React, { useState } from 'react';
import {
  Menu,
  Moon,
  Sun,
  Calendar,
  PlusCircle,
  CreditCard,
  Cloud,
  CheckCircle2,
  Database,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';

interface HeaderProps {
  onMenuClick: () => void;
  onNewOrderClick?: () => void;
  onNewPaymentClick?: () => void;
}

export default function Header({ onMenuClick, onNewOrderClick, onNewPaymentClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { selectedDate, setSelectedDate } = useData();
  const { user } = useAuth();
  const isCloudConnected = isSupabaseConfigured();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-4 sm:px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80">
      {/* Left: Mobile hamburger & Active Date Indicator */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onMenuClick}
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Date Selector Header */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">Active Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Right: Quick Action Buttons, Database Status, Theme Toggle & Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Add Order Button */}
        {onNewOrderClick && (
          <button
            onClick={onNewOrderClick}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden md:inline">New Order</span>
          </button>
        )}

        {/* Quick Add Payment Button */}
        {onNewPaymentClick && (
          <button
            onClick={onNewPaymentClick}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 transition-all"
          >
            <CreditCard className="w-4 h-4 text-amber-500" />
            <span className="hidden md:inline">Add Payment</span>
          </button>
        )}

        {/* Database Mode Badge */}
        <div
          title={isCloudConnected ? 'Connected to Supabase PostgreSQL' : 'Using persistent local SQLite/Storage (Supabase keys can be added in Settings)'}
          className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
            isCloudConnected
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{isCloudConnected ? 'Supabase Sync' : 'Local + Auto Sync'}</span>
        </div>

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-5 h-5 text-slate-700 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
            {user?.name?.[0]?.toUpperCase() || 'J'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {user?.name || 'Jahed Admin'}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
