'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { formatAED } from '@/lib/calculations';
import {
  Wallet,
  Check,
  Edit3,
  CalendarDays,
  FileText,
  Trash2
} from 'lucide-react';

interface DaySummaryCardProps {
  onOpenPaymentModal?: () => void;
}

export default function DaySummaryCard({ onOpenPaymentModal }: DaySummaryCardProps) {
  const {
    daySummary,
    selectedDate,
    payments,
    orders,
    addPayment,
    removePayment,
    updateYesterdayOpeningBalance,
  } = useData();

  const [isEditingOpening, setIsEditingOpening] = useState(false);
  const [openingBalanceInput, setOpeningBalanceInput] = useState<string>('');

  // New Adjustment Form State
  const [adjName, setAdjName] = useState('');
  const [adjAmount, setAdjAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dayPayments = payments.filter((p) => p.date === selectedDate);
  const dayOrders = orders.filter((o) => o.date === selectedDate);

  const yesterdayBalance = Number(daySummary?.nabta_yesterday_balance || 0);
  const jahedBalance = Number(daySummary?.jahed_balance || 0);
  
  // Adjusted amounts
  const adjustmentsTotal = dayPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const todayBalance = Number(daySummary?.nabta_today_balance || 0);
  
  const isTodayBalancePositive = todayBalance >= 0;

  const handleSaveOpening = async () => {
    const num = Number(openingBalanceInput);
    if (!isNaN(num)) {
      await updateYesterdayOpeningBalance(num);
    }
    setIsEditingOpening(false);
  };

  const handleAddAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(adjAmount);
    if (!adjName.trim() || isNaN(amount)) return;
    
    setIsSubmitting(true);
    try {
      await addPayment({
        date: selectedDate,
        amount: amount,
        reason: adjName.trim(),
        payment_method: 'Adjustment',
        recipient: '',
      });
      setAdjName('');
      setAdjAmount('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-slate-50/80 to-slate-100/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Day Financial Summary & Balance Carry-Forward
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                {selectedDate}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Formula: Next Balance = Prev Balance − Jahed + Adjustments
            </p>
          </div>
        </div>
      </div>

      {/* Primary Summary Metric Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Nabta Yesterday Balance */}
        <div className="relative p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              NABTA {selectedDate} Balance
            </span>
            <button
              onClick={() => {
                setOpeningBalanceInput(String(yesterdayBalance));
                setIsEditingOpening(!isEditingOpening);
              }}
              title="Edit Opening / Yesterday balance"
              className="p-1 rounded-md text-slate-400 hover:text-emerald-500 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3">
            {isEditingOpening ? (
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="number"
                  step="any"
                  value={openingBalanceInput}
                  onChange={(e) => setOpeningBalanceInput(e.target.value)}
                  className="w-full px-2.5 py-1 text-sm font-bold font-mono rounded-lg bg-slate-100 dark:bg-slate-800 border border-emerald-500 text-slate-900 dark:text-white focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveOpening}
                  className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {formatAED(yesterdayBalance)}
              </p>
            )}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              <span>Auto-carried from previous day</span>
            </p>
          </div>
        </div>

        {/* 2. Jahed Balance (Profit) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-emerald-500/30 dark:border-emerald-500/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Jahed
            </span>
          </div>

          <div className="mt-3">
            <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              +{formatAED(jahedBalance)}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Total Profit automatically subtracted
            </p>
          </div>
        </div>

        {/* 3. Nabta Today Balance (Result) */}
        <div className={`p-5 rounded-2xl border shadow-lg flex flex-col justify-between ${
          isTodayBalancePositive
            ? 'bg-gradient-to-br from-emerald-950/80 to-emerald-900/90 border-emerald-500/50 text-emerald-100 shadow-emerald-950/30'
            : 'bg-gradient-to-br from-rose-950/80 to-rose-900/90 border-rose-500/50 text-rose-100 shadow-rose-950/30'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider opacity-90">
              Next Nabta Balance
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white/20">
              Result
            </span>
          </div>

          <div className="mt-3">
            <p className="text-2xl font-black font-mono tracking-tight">
              {formatAED(todayBalance)}
            </p>
            <p className="text-[11px] opacity-80 mt-1 font-medium">
              After {formatAED(adjustmentsTotal)} in adjustments
            </p>
          </div>
        </div>
      </div>

      {/* Adjustments Section */}
      <div className="rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800/80 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Summary Adjustments
            </h4>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
            Total: {formatAED(adjustmentsTotal)}
          </span>
        </div>

        {/* Dynamic Adjustment Input Form */}
        <form onSubmit={handleAddAdjustment} className="flex flex-col sm:flex-row gap-3 mb-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50">
          <div className="flex-1">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Name</label>
            <input 
              type="text" 
              placeholder="e.g. Abu Al Joud" 
              value={adjName}
              onChange={e => setAdjName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="w-full sm:w-1/3">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Amount (+ / -)</label>
            <input 
              type="text" 
              inputMode="decimal"
              placeholder="+1500 or -1800" 
              value={adjAmount}
              onChange={e => setAdjAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <button 
              type="submit"
              disabled={isSubmitting || !adjName.trim() || !adjAmount.trim()}
              className="w-full sm:w-auto px-5 py-2 h-[38px] rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold shadow-md transition-all flex items-center justify-center"
            >
              Add
            </button>
          </div>
        </form>

        {/* Adjustments List */}
        {dayPayments.length === 0 ? (
          <div className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">
            No adjustments recorded.
          </div>
        ) : (
          <div className="space-y-2">
            {dayPayments.map((pay) => (
              <div
                key={pay.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 text-xs sm:text-sm"
              >
                <div className="font-bold text-slate-900 dark:text-white">
                  {pay.reason}
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-extrabold font-mono text-sm ${pay.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {pay.amount > 0 ? '+' : ''}{pay.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => removePayment(pay.id)}
                    title="Delete adjustment"
                    className="p-1 rounded-md text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
