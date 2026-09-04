'use client';

import React, { useState } from 'react';
import { Order } from '@/types';
import { formatAED, formatNumber } from '@/lib/calculations';
import { Edit2, Trash2, Plus, Receipt, AlertCircle, Sparkles, TrendingUp, Info } from 'lucide-react';
import { useData } from '@/context/DataContext';

interface OrderTableProps {
  orders: Order[];
  onEditOrder: (order: Order) => void;
  onNewOrder: () => void;
}

export default function OrderTable({ orders, onEditOrder, onNewOrder }: OrderTableProps) {
  const { removeOrder } = useData();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    await removeOrder(id);
    setDeleteConfirmId(null);
  };

  const totalQty = orders.reduce((sum, o) => sum + Number(o.qty || 0), 0);
  const totalNabtaBill = orders.reduce((sum, o) => sum + Number(o.nabta_bill || 0), 0);
  const totalClientBill = orders.reduce((sum, o) => sum + Number(o.client_bill || 0), 0);
  const totalJahedBalance = orders.reduce((sum, o) => sum + Number(o.jahed_balance || 0), 0);
  const totalAmountPaid = orders.reduce((sum, o) => sum + Number(o.amount_received || 0), 0);
  const totalNoPay = orders.reduce((sum, o) => sum + Math.max(0, Number(o.client_bill || 0) - Number(o.amount_received || 0)), 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-900/5 overflow-hidden">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850/50">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Daily Order List
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Nabta Bill (Qty × Cost) | Client Bill (Qty × Client Price) | Jahed Balance (Profit)
          </p>
        </div>

        <button
          onClick={onNewOrder}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Order</span>
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-850/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3.5 px-5">Date</th>
              <th className="py-3.5 px-5">Client Name</th>
              <th className="py-3.5 px-5 text-right">Qty</th>
              <th className="py-3.5 px-5 text-right">Cost Price</th>
              <th className="py-3.5 px-5 text-right">Nabta Bill</th>
              <th className="py-3.5 px-5 text-right">Client Bill</th>
              <th className="py-3.5 px-5 text-right">Jahed Balance</th>
              <th className="py-3.5 px-5 text-right">Amount Paid</th>
              <th className="py-3.5 px-5 text-right">No Pay</th>
              <th className="py-3.5 px-5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="max-w-xs mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">No orders recorded for this date</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Click the "Add New Order" button to start recording daily client sales.
                    </p>
                    <button
                      onClick={onNewOrder}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add First Order</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const isProfit = Number(order.jahed_balance) >= 0;

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-4 px-5 font-mono text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {order.date}
                    </td>

                    {/* Client Name */}
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {order.client_name}
                      </div>
                      {order.notes && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1">
                          {order.notes}
                        </p>
                      )}
                    </td>

                    {/* Qty */}
                    <td className="py-4 px-5 text-right font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {formatNumber(order.qty)}
                    </td>

                    {/* Cost Price */}
                    <td className="py-4 px-5 text-right font-medium text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {formatAED(order.cost_price)}
                    </td>

                    {/* Nabta Bill (Qty * Cost) */}
                    <td className="py-4 px-5 text-right font-bold text-slate-900 dark:text-white font-mono">
                      {formatAED(order.nabta_bill)}
                    </td>

                    {/* Client Bill (Qty * Client Price) */}
                    <td className="py-4 px-5 text-right font-bold text-amber-600 dark:text-amber-400 font-mono">
                      {formatAED(order.client_bill)}
                    </td>

                    {/* Jahed Balance (Client Bill - Nabta Bill) */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold font-mono ${
                          isProfit
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isProfit ? '+' : ''}
                        {formatAED(order.jahed_balance)}
                      </span>
                    </td>

                    {/* Amount Paid */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white font-mono">
                        {formatAED(order.amount_received || 0)}
                      </div>
                      <span
                        className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          order.paid_status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : order.paid_status === 'Partial'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {order.paid_status || 'Unpaid'}
                      </span>
                    </td>

                    {/* No Pay */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <span className={`font-bold font-mono ${Math.max(0, Number(order.client_bill || 0) - Number(order.amount_received || 0)) > 0 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-600'}`}>
                        {formatAED(Math.max(0, Number(order.client_bill || 0) - Number(order.amount_received || 0)))}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-center whitespace-nowrap">
                      {deleteConfirmId === order.id ? (
                        <div className="flex items-center justify-center gap-1.5 animate-in fade-in">
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditOrder(order)}
                            title="Edit Order"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(order.id)}
                            title="Delete Order"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Footer Totals */}
          {orders.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850/90 font-bold text-xs uppercase tracking-wider">
                <td colSpan={2} className="py-4 px-5 text-slate-900 dark:text-white">
                  Total for Date ({orders[0]?.date || 'Selected Day'})
                </td>
                <td className="py-4 px-5 text-right font-mono text-slate-900 dark:text-white">
                  {formatNumber(totalQty)}
                </td>
                <td className="py-4 px-5 text-right text-slate-400 font-mono">
                  -
                </td>
                <td className="py-4 px-5 text-right font-mono text-slate-900 dark:text-white">
                  {formatAED(totalNabtaBill)}
                </td>
                <td className="py-4 px-5 text-right font-mono text-amber-600 dark:text-amber-400">
                  {formatAED(totalClientBill)}
                </td>
                <td className="py-4 px-5 text-right font-mono">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                      totalJahedBalance >= 0
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {totalJahedBalance >= 0 ? '+' : ''}
                    {formatAED(totalJahedBalance)}
                  </span>
                </td>
                <td className="py-4 px-5 text-right font-mono font-bold text-slate-900 dark:text-white">
                  {formatAED(totalAmountPaid)}
                </td>
                <td className="py-4 px-5 text-right font-mono font-bold text-rose-500">
                  {formatAED(totalNoPay)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
