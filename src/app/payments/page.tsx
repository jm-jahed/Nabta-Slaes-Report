'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PaymentModal from '@/components/orders/PaymentModal';
import { useData } from '@/context/DataContext';
import { formatAED } from '@/lib/calculations';
import { CreditCard, Plus, Trash2, Calendar, Search, Tag, Wallet } from 'lucide-react';

export default function PaymentsPage() {
  const { payments, removePayment } = useData();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredPayments = payments.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.reason.toLowerCase().includes(term) ||
      p.date.includes(term) ||
      (p.recipient && p.recipient.toLowerCase().includes(term)) ||
      (p.payment_method && p.payment_method.toLowerCase().includes(term))
    );
  });

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <MainLayout>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-lg">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Payments & Expense Log
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit history of all recorded payouts deducted from Nabta balance
          </p>
        </div>

        <button
          onClick={() => setPaymentModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Recorded Payments</p>
          <p className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
            {formatAED(totalPaid)}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Vouchers</p>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {payments.length}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Payout per Voucher</p>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {formatAED(payments.length > 0 ? totalPaid / payments.length : 0)}
          </p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl overflow-hidden">
        {/* Search */}
        <div className="p-4 sm:p-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search payments by reason, recipient, method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <span className="text-xs font-bold text-slate-400">
            Showing {filteredPayments.length} of {payments.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-850/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">Reason / Note</th>
                <th className="py-3.5 px-5">Method</th>
                <th className="py-3.5 px-5">Recipient</th>
                <th className="py-3.5 px-5 text-right">Amount (AED)</th>
                <th className="py-3.5 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-5 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {p.date}
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">
                      {p.reason}
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {p.payment_method || 'Cash'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-500 dark:text-slate-400">
                      {p.recipient || '-'}
                    </td>
                    <td className="py-4 px-5 text-right font-black font-mono text-amber-600 dark:text-amber-400">
                      {formatAED(p.amount)}
                    </td>
                    <td className="py-4 px-5 text-center whitespace-nowrap">
                      {deleteConfirmId === p.id ? (
                        <div className="flex items-center justify-center gap-1.5 animate-in fade-in">
                          <button
                            onClick={() => {
                              removePayment(p.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      />
    </MainLayout>
  );
}
