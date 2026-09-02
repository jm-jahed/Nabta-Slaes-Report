'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { formatAED, formatNumber } from '@/lib/calculations';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, BarChart3, LineChart as LineIcon, PieChart, Users } from 'lucide-react';
import { format, subDays } from 'date-fns';

export default function AnalyticsCharts() {
  const { orders, payments } = useData();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="h-80 rounded-3xl bg-slate-100 dark:bg-slate-850" />
        <div className="h-80 rounded-3xl bg-slate-100 dark:bg-slate-850" />
      </div>
    );
  }

  // 1. Group past 7 days trend
  const last7Days = Array.from({ length: 7 })
    .map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      return format(d, 'yyyy-MM-dd');
    });

  const trendData = last7Days.map((dateStr) => {
    const dayOrders = orders.filter((o) => o.date === dateStr);
    const dayPayments = payments.filter((p) => p.date === dateStr);

    const jahedProfit = dayOrders.reduce((sum, o) => sum + Number(o.jahed_balance || 0), 0);
    const nabtaCost = dayOrders.reduce((sum, o) => sum + Number(o.nabta_bill || 0), 0);
    const clientSales = dayOrders.reduce((sum, o) => sum + Number(o.client_bill || 0), 0);
    const paid = dayPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return {
      date: format(new Date(dateStr), 'MMM dd'),
      rawDate: dateStr,
      'Jahed Profit': jahedProfit,
      'Nabta Bill': nabtaCost,
      'Client Sales': clientSales,
      'Paid Out': paid,
    };
  });

  // 2. Group by Top Clients
  const clientMap: Record<string, { ordersCount: number; totalQty: number; jahedProfit: number; clientSales: number }> = {};
  orders.forEach((o) => {
    const name = o.client_name || 'Other';
    if (!clientMap[name]) {
      clientMap[name] = { ordersCount: 0, totalQty: 0, jahedProfit: 0, clientSales: 0 };
    }
    clientMap[name].ordersCount += 1;
    clientMap[name].totalQty += Number(o.qty || 0);
    clientMap[name].jahedProfit += Number(o.jahed_balance || 0);
    clientMap[name].clientSales += Number(o.client_bill || 0);
  });

  const topClientsData = Object.entries(clientMap)
    .map(([name, data]) => ({
      name: name.length > 18 ? name.substring(0, 16) + '...' : name,
      fullName: name,
      'Total Profit (AED)': Number(data.jahedProfit.toFixed(2)),
      'Client Sales (AED)': Number(data.clientSales.toFixed(2)),
      'Units Sold': data.totalQty,
    }))
    .sort((a, b) => b['Total Profit (AED)'] - a['Total Profit (AED)'])
    .slice(0, 5);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-700 text-white shadow-xl text-xs space-y-1 backdrop-blur-md">
          <p className="font-bold text-slate-300 border-b border-slate-700 pb-1">{label}</p>
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: item.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                {item.name}:
              </span>
              <span className="font-mono font-bold">
                {typeof item.value === 'number' ? `AED ${item.value.toFixed(2)}` : item.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 7-Day Performance Chart */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-900/5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                7-Day Profit & Sales Revenue
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily Jahed Balance vs Nabta Cost vs Client Sales
              </p>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Client Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Nabta Bill" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Jahed Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performing Clients */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-900/5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Top Clients by Profit
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Highest contributing client accounts
              </p>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          {topClientsData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No client data recorded yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topClientsData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Total Profit (AED)" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
