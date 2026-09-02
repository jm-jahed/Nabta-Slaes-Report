'use client';

import React from 'react';
import { useData } from '@/context/DataContext';
import { formatAED, formatNumber } from '@/lib/calculations';
import {
  ShoppingBag,
  Package,
  TrendingUp,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';

export default function StatCards() {
  const { orders, daySummary, selectedDate } = useData();

  const dayOrders = orders.filter((o) => o.date === selectedDate);
  const totalQty = dayOrders.reduce((sum, o) => sum + Number(o.qty || 0), 0);
  const jahedBalance = Number(daySummary?.jahed_balance || 0);
  const paidAmount = Number(daySummary?.paid || 0);
  const todayNabtaBalance = Number(daySummary?.nabta_today_balance || 0);
  const yesterdayNabtaBalance = Number(daySummary?.nabta_yesterday_balance || 0);

  const isJahedPositive = jahedBalance >= 0;
  const isNabtaPositive = todayNabtaBalance >= 0;

  const stats = [
    {
      title: "Today's Orders",
      value: formatNumber(dayOrders.length),
      subtext: `For ${selectedDate}`,
      icon: ShoppingBag,
      color: 'from-blue-600 to-indigo-600',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Qty',
      value: formatNumber(totalQty),
      subtext: 'Units dispatched',
      icon: Package,
      color: 'from-cyan-600 to-teal-600',
      textColor: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-500/10',
    },
    {
      title: "Today's Jahed Balance",
      value: formatAED(jahedBalance),
      subtext: isJahedPositive ? 'Net profit margin' : 'Negative balance',
      icon: TrendingUp,
      color: isJahedPositive ? 'from-emerald-600 to-teal-600' : 'from-rose-600 to-red-600',
      textColor: isJahedPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
      bgColor: isJahedPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10',
      isProfit: isJahedPositive,
    },
    {
      title: "Today's Paid Amount",
      value: formatAED(paidAmount),
      subtext: 'Expenses deducted',
      icon: CreditCard,
      color: 'from-amber-600 to-orange-600',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Nabta Today Balance',
      value: formatAED(todayNabtaBalance),
      subtext: `Carry from ${formatAED(yesterdayNabtaBalance)}`,
      icon: Wallet,
      color: isNabtaPositive ? 'from-emerald-600 to-teal-600' : 'from-rose-600 to-red-600',
      textColor: isNabtaPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
      bgColor: isNabtaPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10',
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`relative p-5 rounded-3xl border transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between ${
              stat.highlight
                ? 'bg-gradient-to-br from-emerald-900/90 to-slate-900 text-white border-emerald-500/40 shadow-xl shadow-emerald-950/40 col-span-1 sm:col-span-2 lg:col-span-1'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-lg shadow-slate-900/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                stat.highlight ? 'text-emerald-300' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {stat.title}
              </span>
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                  stat.highlight
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : `${stat.bgColor} ${stat.textColor}`
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4">
              <h3 className={`text-2xl font-black font-mono tracking-tight ${
                stat.highlight
                  ? 'text-white'
                  : stat.textColor
              }`}>
                {stat.value}
              </h3>
              <p className={`text-[11px] mt-1 font-medium ${
                stat.highlight ? 'text-emerald-200/80' : 'text-slate-400 dark:text-slate-500'
              }`}>
                {stat.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
