'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from './ToastContainer';
import OrderModal from '../orders/OrderModal';
import PaymentModal from '../orders/PaymentModal';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex flex-col flex-1 min-h-screen">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onNewOrderClick={() => setOrderModalOpen(true)}
          onNewPaymentClick={() => setPaymentModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>

        <footer className="py-6 px-8 border-t border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} Sales & Payment Reports. Built for high-accuracy financial reporting & automatic balance carry forward.</p>
        </footer>
      </div>

      {/* Quick Global Modals */}
      <OrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      />

      {/* Floating Notifications */}
      <ToastContainer />
    </div>
  );
}
