'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { Order } from '@/types';
import { computeOrderFields, formatAED } from '@/lib/calculations';
import { X, Lock, EyeOff, Sparkles, Check, Calculator } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit?: Order | null;
}

export default function OrderModal({ isOpen, onClose, orderToEdit }: OrderModalProps) {
  const { addOrder, editOrder, selectedDate } = useData();

  const [date, setDate] = useState(selectedDate);
  const [clientName, setClientName] = useState('');
  const [qty, setQty] = useState<number | string>(100);
  const [costPrice, setCostPrice] = useState<number | string>(4);
  const [clientPrice, setClientPrice] = useState<number | string>(5);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (orderToEdit) {
      setDate(orderToEdit.date);
      setClientName(orderToEdit.client_name);
      setQty(orderToEdit.qty);
      setCostPrice(orderToEdit.cost_price);
      setClientPrice(orderToEdit.client_price);
      setNotes(orderToEdit.notes || '');
    } else {
      setDate(selectedDate);
      setClientName('');
      setQty(100);
      setCostPrice(4);
      setClientPrice(5);
      setNotes('');
    }
  }, [orderToEdit, selectedDate, isOpen]);

  if (!isOpen) return null;

  const numQty = Number(qty) || 0;
  const numCost = Number(costPrice) || 0;
  const numClientPrice = Number(clientPrice) || 0;

  const { nabta_bill, client_bill, jahed_balance } = computeOrderFields({
    qty: numQty,
    cost_price: numCost,
    client_price: numClientPrice,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || numQty <= 0 || numCost < 0 || numClientPrice < 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (orderToEdit) {
        await editOrder({
          ...orderToEdit,
          date,
          client_name: clientName.trim(),
          qty: numQty,
          cost_price: numCost,
          client_price: numClientPrice,
          nabta_bill,
          client_bill,
          jahed_balance,
          notes: notes.trim(),
        });
      } else {
        await addOrder({
          date,
          client_name: clientName.trim(),
          qty: numQty,
          cost_price: numCost,
          client_price: numClientPrice,
          notes: notes.trim(),
        });
        // Trigger celebratory confetti on new order
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
          });
        } catch (e) {}
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {orderToEdit ? 'Edit Order Details' : 'Create New Order'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automatic Nabta & Jahed Balance Calculations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Order Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Client Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Client Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Al Noor Trading"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Qty */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Qty *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Cost Price */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Cost Price (AED) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Client Price (Hidden from Table Column) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Client Price *
                </label>
                <span title="Stored internally - NOT shown in public daily table" className="text-[10px] text-amber-500 dark:text-amber-400 flex items-center gap-0.5">
                  <EyeOff className="w-3 h-3" />
                  <span className="hidden sm:inline">Hidden</span>
                </span>
              </div>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={clientPrice}
                onChange={(e) => setClientPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 text-sm font-bold text-amber-800 dark:text-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes / Reference */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Order Notes / Ref (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Invoice #1029, Branch A"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Live Calculation Preview Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-lg space-y-2.5 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Live Financial Computation Preview
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-md text-slate-300">
                Formula Verified
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <p className="text-[11px] text-slate-400 font-medium">Nabta Bill</p>
                <p className="text-xs text-slate-300 font-mono mt-0.5">Qty × Cost</p>
                <p className="text-sm font-extrabold text-white mt-1 font-mono">
                  {formatAED(nabta_bill)}
                </p>
              </div>

              <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <p className="text-[11px] text-slate-400 font-medium">Client Bill</p>
                <p className="text-xs text-slate-300 font-mono mt-0.5">Qty × Client Price</p>
                <p className="text-sm font-extrabold text-amber-400 mt-1 font-mono">
                  {formatAED(client_bill)}
                </p>
              </div>

              <div className={`p-2 rounded-xl border ${
                jahed_balance >= 0 
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-400'
              }`}>
                <p className="text-[11px] font-medium opacity-90">Jahed Balance</p>
                <p className="text-xs opacity-75 font-mono mt-0.5">Client - Nabta</p>
                <p className="text-sm font-extrabold mt-1 font-mono">
                  {formatAED(jahed_balance)}
                </p>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-bold shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{orderToEdit ? 'Save Changes' : 'Save Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
