'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { Order } from '@/types';
import { computeOrderFields, formatAED } from '@/lib/calculations';
import { X, EyeOff, Sparkles, Check, Calculator } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit?: Order | null;
}

/**
 * Parse the Balance input string into amount_received.
 * +X  → client paid X AED           → amount_received = X
 * -X  → client owes X AED (No Pay)  → amount_received = client_bill - X
 *  0  → no payment                  → amount_received = 0
 */
function parseBalance(balanceStr: string, client_bill: number): number {
  const s = balanceStr.trim();
  if (s === '' || s === '+' || s === '-') return 0;

  if (s.startsWith('+')) {
    const v = parseFloat(s.slice(1));
    return isNaN(v) ? 0 : Math.max(0, v);
  }

  if (s.startsWith('-')) {
    const noPay = parseFloat(s.slice(1));
    if (isNaN(noPay)) return 0;
    return Math.max(0, client_bill - noPay);
  }

  const v = parseFloat(s);
  return isNaN(v) ? 0 : Math.max(0, v);
}

/** Returns true if the input string is a valid balance entry */
function isValidBalance(s: string): boolean {
  const t = s.trim();
  if (t === '') return true;          // empty is OK
  if (t === '+' || t === '-') return false; // incomplete
  if (/^[+-]/.test(t)) {
    return /^[+-]\d+(\.\d+)?$/.test(t);
  }
  return /^\d+(\.\d+)?$/.test(t);
}

export default function OrderModal({ isOpen, onClose, orderToEdit }: OrderModalProps) {
  const { addOrder, editOrder, selectedDate, orders } = useData();

  const [date, setDate] = useState(selectedDate);
  const [clientName, setClientName] = useState('');
  const [qty, setQty] = useState<number | string>(100);
  const [costPrice, setCostPrice] = useState<number | string>(4);
  const [clientPrice, setClientPrice] = useState<number | string>(5);
  const [paymentNote, setPaymentNote] = useState('');
  const [balanceInput, setBalanceInput] = useState('');
  const [balanceError, setBalanceError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  useEffect(() => {
    fetch('/api/clients')
      .then((res) => res.json())
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (orderToEdit) {
      setDate(orderToEdit.date);
      setClientName(orderToEdit.client_name);
      setQty(orderToEdit.qty);
      setCostPrice(orderToEdit.cost_price);
      setClientPrice(orderToEdit.client_price);
      setPaymentNote(orderToEdit.notes || '');
      // Represent stored amount_received as +X when editing
      const amt = orderToEdit.amount_received;
      setBalanceInput(amt && amt > 0 ? `+${amt}` : amt === 0 ? '' : '');
    } else {
      setDate(selectedDate);
      setClientName('');
      setQty(100);
      setCostPrice(4);
      setClientPrice(5);
      setPaymentNote('');
      setBalanceInput('');
    }
    setBalanceError('');
  }, [orderToEdit, selectedDate, isOpen]);

  const previousNoPay = React.useMemo(() => {
    if (!clientName.trim() || !orders) return 0;
    return orders.reduce((sum, o) => {
      if (orderToEdit && o.id === orderToEdit.id) return sum;
      if (o.client_name.toLowerCase().trim() === clientName.toLowerCase().trim()) {
        return sum + Math.max(0, Number(o.client_bill || 0) - Number(o.amount_received || 0));
      }
      return sum;
    }, 0);
  }, [clientName, orders, orderToEdit]);

  if (!isOpen) return null;

  const numQty = Number(qty) || 0;
  const numCost = Number(costPrice) || 0;
  const numClientPrice = Number(clientPrice) || 0;

  const { nabta_bill, client_bill, jahed_balance } = computeOrderFields({
    qty: numQty,
    cost_price: numCost,
    client_price: numClientPrice,
  });

  const computedAmt = parseBalance(balanceInput, client_bill);
  const currentNoPay = Math.max(0, client_bill - computedAmt);

  const handleBalanceChange = (val: string) => {
    setBalanceInput(val);
    if (val.trim() && !isValidBalance(val)) {
      setBalanceError('Invalid. Use +20, -30, or 0');
    } else {
      setBalanceError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || numQty <= 0 || numCost < 0 || numClientPrice < 0) return;
    if (balanceError) return;
    if (balanceInput.trim() && !isValidBalance(balanceInput)) return;

    const amt = parseBalance(balanceInput, client_bill);
    let computed_paid_status: 'Unpaid' | 'Paid' | 'Partial' = 'Unpaid';
    if (amt >= client_bill && client_bill > 0) computed_paid_status = 'Paid';
    else if (amt > 0) computed_paid_status = 'Partial';

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
          notes: paymentNote.trim(),
          paid_status: computed_paid_status,
          amount_received: amt,
        });
      } else {
        await addOrder({
          date,
          client_name: clientName.trim(),
          qty: numQty,
          cost_price: numCost,
          client_price: numClientPrice,
          notes: paymentNote.trim(),
          paid_status: computed_paid_status,
          amount_received: amt,
        });
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        } catch (_) {}
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
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[95vh] overflow-y-auto">
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
                Automatic Nabta &amp; Jahed Balance Calculations
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
          {/* Row 1: Date + Client Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Client Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Al Noor Trading"
                value={clientName}
                onChange={(e) => { setClientName(e.target.value); setShowAutocomplete(true); }}
                onFocus={() => setShowAutocomplete(true)}
                onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              {showAutocomplete && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {clients
                    .filter(c => c.name.toLowerCase().includes(clientName.toLowerCase()))
                    .map(c => (
                      <div
                        key={c.id}
                        className="px-4 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200"
                        onClick={() => { setClientName(c.name); setShowAutocomplete(false); }}
                      >
                        {c.name}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Qty / Cost Price / Client Price */}
          <div className="grid grid-cols-3 gap-3">
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

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Cost Price *
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

          {/* Row 3: Payment Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Payment Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Cash, Bank transfer, No cash..."
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Row 4: Balance (AED) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
              Balance (AED)
            </label>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">+20</span> = paid 20 AED &nbsp;·&nbsp;
              <span className="font-semibold text-rose-500">-30</span> = owes 30 AED &nbsp;·&nbsp;
              leave empty = no payment
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="w-full sm:w-1/2">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="+20 or -30 or 0"
                  value={balanceInput}
                  onChange={(e) => handleBalanceChange(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 text-base font-bold text-slate-900 dark:text-white focus:ring-4 focus:outline-none transition-all shadow-sm ${
                    balanceError
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-emerald-500/30 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
                {balanceError && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{balanceError}</p>
                )}
              </div>

              <div className="w-full sm:w-1/2 flex items-center justify-between sm:justify-end gap-3 text-sm">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Order No Pay:</span>
                <span className={`font-mono font-black text-lg ${currentNoPay > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {balanceInput.trim() === '' ? '—' : formatAED(currentNoPay)}
                </span>
              </div>
            </div>

            {previousNoPay > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50 flex flex-col gap-1 text-xs">
                <div className="flex justify-between items-center text-rose-500/80 font-semibold">
                  <span>Previous Outstanding No Pay:</span>
                  <span className="font-mono">{formatAED(previousNoPay)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-bold">
                  <span>Total Cumulative No Pay:</span>
                  <span className="font-mono">{formatAED(previousNoPay + currentNoPay)}</span>
                </div>
              </div>
            )}
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
              disabled={isSubmitting || !!balanceError}
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
