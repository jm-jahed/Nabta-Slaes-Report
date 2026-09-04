'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { formatAED } from '@/lib/calculations';
import {
  Wallet,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Plus,
  Trash2,
  Edit3,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  CalendarDays,
} from 'lucide-react';

interface DaySummaryCardProps {
  onOpenPaymentModal: () => void;
}

export default function DaySummaryCard({ onOpenPaymentModal }: DaySummaryCardProps) {
  const {
    daySummary,
    selectedDate,
    payments,
    orders,
    removePayment,
    updateYesterdayOpeningBalance,
  } = useData();

  const [isEditingOpening, setIsEditingOpening] = useState(false);
  const [openingBalanceInput, setOpeningBalanceInput] = useState<string>('');

  const dayPayments = payments.filter((p) => p.date === selectedDate);
  const dayOrders = orders.filter((o) => o.date === selectedDate);

  const yesterdayBalance = Number(daySummary?.nabta_yesterday_balance || 0);
  const jahedBalance = Number(daySummary?.jahed_balance || 0);
  const paidAmount = Number(daySummary?.paid || 0);
  const todayBalance = Number(daySummary?.nabta_today_balance || 0);
  
  const ordersPaid = dayOrders.reduce((sum, o) => sum + Number(o.amount_received || 0), 0);

  const isTodayBalancePositive = todayBalance >= 0;

  const handleSaveOpening = async () => {
    const num = Number(openingBalanceInput);
    if (!isNaN(num)) {
      await updateYesterdayOpeningBalance(num);
    }
    setIsEditingOpening(false);
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
              Formula: Nabta Today Balance = Yesterday Balance − Jahed Balance − Paid Amount
            </p>
          </div>
        </div>

        <button
          onClick={onOpenPaymentModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <CreditCard className="w-4 h-4" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* Primary Summary Metric Tiles in Pipeline Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Nabta Yesterday Balance */}
        <div className="relative p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Yesterday Balance
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

        {/* 2. Total Client Payments (Add) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-emerald-500/30 dark:border-emerald-500/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Client Payments
            </span>
            <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400">
              (+ Add)
            </span>
          </div>

          <div className="mt-3">
            <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {formatAED(ordersPaid)}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Money collected from clients
            </p>
          </div>
        </div>

        {/* 3. Expenses/Vouchers (Deduct) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              3. Expenses
            </span>
            <span className="text-xs font-bold text-rose-500 dark:text-rose-400">
              (− Deduct)
            </span>
          </div>

          <div className="mt-3">
            <p className="text-2xl font-black font-mono text-rose-500 dark:text-rose-400">
              {formatAED(paidAmount)}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {dayPayments.length} payment {dayPayments.length === 1 ? 'record' : 'records'}
            </p>
          </div>
        </div>

        {/* 4. Nabta Today Balance (Result) */}
        <div className={`p-5 rounded-2xl border shadow-lg flex flex-col justify-between ${
          isTodayBalancePositive
            ? 'bg-gradient-to-br from-emerald-950/80 to-emerald-900/90 border-emerald-500/50 text-emerald-100 shadow-emerald-950/30'
            : 'bg-gradient-to-br from-rose-950/80 to-rose-900/90 border-rose-500/50 text-rose-100 shadow-rose-950/30'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider opacity-90">
              4. Nabta Balance
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white/20">
              Today
            </span>
          </div>

          <div className="mt-3">
            <p className="text-2xl font-black font-mono tracking-tight">
              {formatAED(todayBalance)}
            </p>
            <p className="text-[11px] opacity-80 mt-1 font-medium">
              = Prev + Payments - Exp
            </p>
          </div>
        </div>

        {/* 5. Jahed Balance (No Pay) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-850 border border-amber-500/30 dark:border-amber-500/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              5. Jahed Balance
            </span>
            <span className="text-xs font-bold text-amber-500 dark:text-amber-400">
              (No Pay)
            </span>
          </div>

          <div className="mt-3">
            <p className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
              {formatAED(jahedBalance)}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Outstanding debt owed by clients
            </p>
          </div>
        </div>
      </div>

      {/* Payment Vouchers List for Active Date */}
      <div className="rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800/80 p-5">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Payments & Expense Vouchers for {selectedDate}
            </h4>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
            Total: {formatAED(paidAmount)}
          </span>
        </div>

        {dayPayments.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
            No payment deductions recorded for this date.
          </div>
        ) : (
          <div className="space-y-2">
            {dayPayments.map((pay) => (
              <div
                key={pay.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                    {pay.payment_method?.[0] || 'C'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {pay.reason}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Method: {pay.payment_method || 'Cash'} {pay.recipient ? `• Paid To: ${pay.recipient}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-extrabold font-mono text-amber-600 dark:text-amber-400 text-sm">
                    {formatAED(pay.amount)}
                  </span>
                  <button
                    onClick={() => removePayment(pay.id)}
                    title="Delete payment voucher"
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
