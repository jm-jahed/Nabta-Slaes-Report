'use client';

import React, { useState } from 'react';
import { Order } from '@/types';
import { formatAED, formatNumber } from '@/lib/calculations';
import { Edit2, Trash2, Plus, Receipt } from 'lucide-react';
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
      <div className="flex items-center justify-between gap-3 p-4 sm:p-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850/50">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              Daily Order List
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">
            Nabta Bill (Qty × Cost) | Client Bill (Qty × Client Price) | Jahed Balance (Profit)
          </p>
        </div>

        <button
          onClick={onNewOrder}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Order</span>
        </button>
      </div>

      {/* Mobile Card List (shown on small screens) */}
      <div className="block sm:hidden">
        {orders.length === 0 ? (
          <div className="py-12 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No orders for this date</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Tap the button above to add the first order.</p>
            <button
              onClick={onNewOrder}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-all min-h-[44px]"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Order
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {orders.map((order) => {
              const noPay = Math.max(0, Number(order.client_bill || 0) - Number(order.amount_received || 0));
              const isProfit = Number(order.jahed_balance) >= 0;
              return (
                <div key={order.id} className="p-4 space-y-3">
                  {/* Row 1: Client + Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{order.client_name}</p>
                      {order.notes && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{order.notes}</p>
                      )}
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{order.date}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {deleteConfirmId === order.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold min-h-[44px] min-w-[44px]"
                          >Del</button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold min-h-[44px] min-w-[44px]"
                          >No</button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => onEditOrder(order)}
                            className="p-2.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(order.id)}
                            className="p-2.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Key financials grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Qty</p>
                      <p className="font-bold font-mono text-slate-900 dark:text-white mt-0.5">{formatNumber(order.qty)}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Nabta Bill</p>
                      <p className="font-bold font-mono text-slate-900 dark:text-white mt-0.5 text-[11px]">{formatAED(order.nabta_bill)}</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase">Client Bill</p>
                      <p className="font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 text-[11px]">{formatAED(order.client_bill)}</p>
                    </div>
                  </div>

                  {/* Row 3: Payment + No Pay + Jahed */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Paid</p>
                      <p className="font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5 text-[11px]">{formatAED(order.amount_received || 0)}</p>
                    </div>
                    <div className={`rounded-xl p-2.5 text-center ${noPay > 0 ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30'}`}>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">No Pay</p>
                      <p className={`font-bold font-mono mt-0.5 text-[11px] ${noPay > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{formatAED(noPay)}</p>
                    </div>
                    <div className={`rounded-xl p-2.5 text-center ${order.jahed_balance > 0 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30'}`}>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Jahed</p>
                      <p className={`font-bold font-mono mt-0.5 text-[11px] ${order.jahed_balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-500'}`}>
                        {formatAED(order.jahed_balance)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Mobile Totals */}
            {orders.length > 0 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Day Totals — {orders[0]?.date}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400">Total Qty</p>
                    <p className="font-black font-mono text-slate-900 dark:text-white">{formatNumber(totalQty)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400">Nabta Total</p>
                    <p className="font-black font-mono text-slate-900 dark:text-white text-[11px]">{formatAED(totalNabtaBill)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-amber-500">Client Total</p>
                    <p className="font-black font-mono text-amber-600 dark:text-amber-400 text-[11px]">{formatAED(totalClientBill)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400">Total Paid</p>
                    <p className="font-black font-mono text-slate-800 dark:text-slate-200 text-[11px]">{formatAED(totalAmountPaid)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-rose-400">Total No Pay</p>
                    <p className="font-black font-mono text-rose-500 text-[11px]">{formatAED(totalNoPay)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-amber-500">Jahed Balance</p>
                    <p className="font-black font-mono text-amber-600 dark:text-amber-400 text-[11px]">{formatAED(totalJahedBalance)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop Table (hidden on small screens) */}
      <div className="hidden sm:block overflow-x-auto">
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
                <td colSpan={10} className="py-16 text-center">
                  <div className="max-w-xs mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">No orders recorded for this date</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Click the "New Order" button to start recording daily client sales.
                    </p>
                    <button
                      onClick={onNewOrder}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add First Order
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const isProfit = Number(order.jahed_balance) >= 0;
                const noPay = Math.max(0, Number(order.client_bill || 0) - Number(order.amount_received || 0));
                return (
                  <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="py-4 px-5 font-mono text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">{order.date}</td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 dark:text-white">{order.client_name}</div>
                      {order.notes && <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1">{order.notes}</p>}
                    </td>
                    <td className="py-4 px-5 text-right font-bold text-slate-800 dark:text-slate-200 font-mono">{formatNumber(order.qty)}</td>
                    <td className="py-4 px-5 text-right font-medium text-slate-600 dark:text-slate-400 font-mono text-xs">{formatAED(order.cost_price)}</td>
                    <td className="py-4 px-5 text-right font-bold text-slate-900 dark:text-white font-mono">{formatAED(order.nabta_bill)}</td>
                    <td className="py-4 px-5 text-right font-bold text-amber-600 dark:text-amber-400 font-mono">{formatAED(order.client_bill)}</td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold font-mono ${order.jahed_balance > 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'}`}>
                        {formatAED(order.jahed_balance)}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white font-mono">{formatAED(order.amount_received || 0)}</div>
                      <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${order.paid_status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : order.paid_status === 'Partial' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                        {order.paid_status || 'Unpaid'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <span className={`font-bold font-mono ${noPay > 0 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-600'}`}>
                        {formatAED(noPay)}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center whitespace-nowrap">
                      {deleteConfirmId === order.id ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => handleDelete(order.id)} className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700">Confirm</button>
                          <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onEditOrder(order)} className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteConfirmId(order.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {orders.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850/90 font-bold text-xs uppercase tracking-wider">
                <td colSpan={2} className="py-4 px-5 text-slate-900 dark:text-white">Total ({orders[0]?.date})</td>
                <td className="py-4 px-5 text-right font-mono text-slate-900 dark:text-white">{formatNumber(totalQty)}</td>
                <td className="py-4 px-5 text-right text-slate-400 font-mono">-</td>
                <td className="py-4 px-5 text-right font-mono text-slate-900 dark:text-white">{formatAED(totalNabtaBill)}</td>
                <td className="py-4 px-5 text-right font-mono text-amber-600 dark:text-amber-400">{formatAED(totalClientBill)}</td>
                <td className="py-4 px-5 text-right font-mono">
                  <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold ${totalJahedBalance > 0 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                    {formatAED(totalJahedBalance)}
                  </span>
                </td>
                <td className="py-4 px-5 text-right font-mono font-bold text-slate-900 dark:text-white">{formatAED(totalAmountPaid)}</td>
                <td className="py-4 px-5 text-right font-mono font-bold text-rose-500">{formatAED(totalNoPay)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
