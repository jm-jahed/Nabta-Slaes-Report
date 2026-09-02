'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StatCards from '@/components/dashboard/StatCards';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import OrderTable from '@/components/orders/OrderTable';
import DaySummaryCard from '@/components/orders/DaySummaryCard';
import OrderModal from '@/components/orders/OrderModal';
import PaymentModal from '@/components/orders/PaymentModal';
import NabtaReport from '@/components/dashboard/NabtaReport';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types';
import Link from 'next/link';
import {
  Plus,
  ArrowRight,
  Sparkles,
  Calendar,
  CreditCard,
  FileBarChart2,
  TrendingUp,
} from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const { orders, selectedDate, setSelectedDate } = useData();
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);

  const dayOrders = orders.filter((o) => o.date === selectedDate);

  const handleEditOrder = (order: Order) => {
    setOrderToEdit(order);
    setOrderModalOpen(true);
  };

  const handleNewOrder = () => {
    setOrderToEdit(null);
    setOrderModalOpen(true);
  };

  const handlePreviousDay = () => {
    const prev = format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd');
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd');
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  if (user?.role === 'nabta') {
    return <NabtaReport />;
  }

  return (
    <MainLayout>
      {/* Welcome & Date Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Sales & Payment Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time daily order list, Nabta balance calculations & automatic carry-forward
          </p>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm self-start md:self-auto">
          <button
            onClick={handlePreviousDay}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNextDay}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* 5 Primary Stat Cards */}
      <StatCards />

      {/* Analytics Charts */}
      <AnalyticsCharts />

      {/* Daily Orders Table for Selected Date */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Daily Orders & Day Summary ({selectedDate})
            </h2>
          </div>
          <Link
            href="/orders"
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
          >
            <span>Full Orders Book</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <OrderTable
          orders={dayOrders}
          onEditOrder={handleEditOrder}
          onNewOrder={handleNewOrder}
        />
      </div>

      {/* Day Summary Component */}
      <DaySummaryCard onOpenPaymentModal={() => setPaymentModalOpen(true)} />

      {/* Modals */}
      <OrderModal
        isOpen={orderModalOpen}
        onClose={() => {
          setOrderModalOpen(false);
          setOrderToEdit(null);
        }}
        orderToEdit={orderToEdit}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      />
    </MainLayout>
  );
}
