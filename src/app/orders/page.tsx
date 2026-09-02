'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import OrderTable from '@/components/orders/OrderTable';
import DaySummaryCard from '@/components/orders/DaySummaryCard';
import OrderModal from '@/components/orders/OrderModal';
import PaymentModal from '@/components/orders/PaymentModal';
import { useData } from '@/context/DataContext';
import { Order } from '@/types';
import { Calendar, ChevronLeft, ChevronRight, PlusCircle, CreditCard } from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';

export default function OrdersPage() {
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

  return (
    <MainLayout>
      {/* Top Banner & Date Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-lg">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Daily Order List & Balance Sheet
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Viewing records for active date: <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{selectedDate}</span>
          </p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousDay}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <button
            onClick={handleToday}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
          >
            Today
          </button>

          <button
            onClick={handleNextDay}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Daily Order List Table */}
      <OrderTable
        orders={dayOrders}
        onEditOrder={handleEditOrder}
        onNewOrder={handleNewOrder}
      />

      {/* 2. Day Summary Section with Carry Forward */}
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
