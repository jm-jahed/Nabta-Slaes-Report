'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Order, Payment, DaySummary } from '@/types';
import { DataStore } from '@/lib/storage';
import { format } from 'date-fns';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface DataContextType {
  orders: Order[];
  payments: Payment[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  daySummary: DaySummary | null;
  isLoading: boolean;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  addOrder: (order: Omit<Order, 'id' | 'nabta_bill' | 'client_bill' | 'jahed_balance' | 'created_at' | 'updated_at'>) => Promise<Order>;
  editOrder: (order: Order) => Promise<Order>;
  removeOrder: (id: string) => Promise<boolean>;
  addPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => Promise<Payment>;
  removePayment: (id: string) => Promise<boolean>;
  updateYesterdayOpeningBalance: (amount: number) => Promise<void>;
  refreshData: () => Promise<void>;
  resetToDefaultData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

/**
 * Compute day summary locally from in-memory data.
 * Returns null so the caller can fall back to an API fetch if no opening balance is known.
 */
function computeLocalSummary(
  dateStr: string,
  allOrders: Order[],
  allPayments: Payment[],
  openingBalance: number
): DaySummary {
  const dayOrders = allOrders.filter((o) => o.date === dateStr);
  const dayPayments = allPayments.filter((p) => p.date === dateStr);

  const jahed_balance = Number(
    dayOrders.reduce((s, o) => s + Number(o.jahed_balance || 0), 0).toFixed(2)
  );
  
  // Expenses/Vouchers
  const paid = Number(
    dayPayments.reduce((s, p) => s + Number(p.amount || 0), 0).toFixed(2)
  );
  
  // Total Client Payments
  const orders_paid = Number(
    dayOrders.reduce((s, o) => s + Number(o.amount_received || 0), 0).toFixed(2)
  );

  // Nabta Balance = Yesterday + Total Paid (by clients) - Vouchers
  const nabta_today_balance = Number((openingBalance + orders_paid - paid).toFixed(2));

  return {
    date: dateStr,
    nabta_yesterday_balance: openingBalance,
    jahed_balance,
    paid,
    nabta_today_balance,
    updated_at: new Date().toISOString(),
  };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedDate, setSelectedDateState] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [daySummary, setDaySummary] = useState<DaySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Cache: date -> opening balance (nabta_yesterday_balance) fetched from server
  const openingBalanceCache = useRef<Map<string, number>>(new Map());
  // Track whether initial data load has completed
  const initialLoadDone = useRef(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── Single full data load (runs once on mount) ───────────────────────────
  const loadData = useCallback(async (targetDate?: string) => {
    setIsLoading(true);
    try {
      const date = targetDate || selectedDate;
      const [fetchedOrders, fetchedPayments] = await Promise.all([
        DataStore.getOrders(),
        DataStore.getPayments(),
      ]);
      setOrders(fetchedOrders);
      setPayments(fetchedPayments);

      // Fetch the authoritative summary for the current date (includes opening balance)
      const summary = await DataStore.getDaySummaryForDate(date, fetchedOrders, fetchedPayments);
      setDaySummary(summary);

      // Cache the opening balance for this date
      openingBalanceCache.current.set(date, summary.nabta_yesterday_balance);
      initialLoadDone.current = true;
    } catch (err) {
      console.error('Failed to load data:', err);
      showToast('Error loading records', 'error');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast]); // NOTE: selectedDate intentionally NOT in deps to avoid re-fetch on date change

  useEffect(() => {
    loadData(selectedDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // ─── On date change: show instantly from cache, then refresh opening balance ─
  const setSelectedDate = useCallback((date: string) => {
    setSelectedDateState(date);
  }, []);

  const ordersRef = useRef<Order[]>([]);
  const paymentsRef = useRef<Payment[]>([]);

  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { paymentsRef.current = payments; }, [payments]);

  // ─── Rewrite the date-switch effect using refs ────────────────────────────
  const prevDateRef = useRef<string>('');
  useEffect(() => {
    const date = selectedDate;
    if (!initialLoadDone.current || date === prevDateRef.current) return;
    prevDateRef.current = date;

    const currentOrders = ordersRef.current;
    const currentPayments = paymentsRef.current;
    const cached = openingBalanceCache.current.get(date);

    if (cached !== undefined) {
      // Instant render — no network call
      setDaySummary(computeLocalSummary(date, currentOrders, currentPayments, cached));
    } else {
      // Show provisional instantly, then fetch real opening balance
      setDaySummary(computeLocalSummary(date, currentOrders, currentPayments, 0));
      DataStore.getDaySummaryForDate(date, currentOrders, currentPayments)
        .then((serverSummary) => {
          openingBalanceCache.current.set(date, serverSummary.nabta_yesterday_balance);
          setDaySummary(serverSummary);
        })
        .catch(console.error);
    }
  }, [selectedDate]);

  // ─── Mutators: optimistic in-memory updates ───────────────────────────────
  const refreshSummaryForDate = useCallback((date: string, updatedOrders: Order[], updatedPayments: Payment[]) => {
    const cached = openingBalanceCache.current.get(date);
    if (cached !== undefined) {
      setDaySummary(computeLocalSummary(date, updatedOrders, updatedPayments, cached));
    } else {
      DataStore.getDaySummaryForDate(date, updatedOrders, updatedPayments)
        .then((s) => {
          openingBalanceCache.current.set(date, s.nabta_yesterday_balance);
          setDaySummary(s);
        })
        .catch(console.error);
    }
  }, []);

  const addOrder = async (
    orderInput: Omit<Order, 'id' | 'nabta_bill' | 'client_bill' | 'jahed_balance' | 'created_at' | 'updated_at'>
  ) => {
    const newOrder = await DataStore.createOrder(orderInput);
    setOrders((prev) => {
      const updatedOrders = [newOrder, ...prev];
      refreshSummaryForDate(selectedDate, updatedOrders, paymentsRef.current);
      return updatedOrders;
    });
    showToast(`Order for ${newOrder.client_name} created successfully!`, 'success');
    return newOrder;
  };

  const editOrder = async (order: Order) => {
    const updated = await DataStore.updateOrder(order);
    setOrders((prev) => {
      const updatedOrders = prev.map((o) => (o.id === updated.id ? updated : o));
      refreshSummaryForDate(selectedDate, updatedOrders, paymentsRef.current);
      return updatedOrders;
    });
    showToast('Order updated successfully!', 'success');
    return updated;
  };

  const removeOrder = async (id: string) => {
    const success = await DataStore.deleteOrder(id);
    if (success) {
      setOrders((prev) => {
        const updatedOrders = prev.filter((o) => o.id !== id);
        refreshSummaryForDate(selectedDate, updatedOrders, paymentsRef.current);
        return updatedOrders;
      });
      showToast('Order removed', 'info');
      return true;
    }
    return false;
  };

  const addPayment = async (paymentInput: Omit<Payment, 'id' | 'created_at'>) => {
    const newPayment = await DataStore.createPayment(paymentInput);
    setPayments((prev) => {
      const updatedPayments = [newPayment, ...prev];
      refreshSummaryForDate(selectedDate, ordersRef.current, updatedPayments);
      return updatedPayments;
    });
    showToast(`Payment of AED ${newPayment.amount} recorded!`, 'success');
    return newPayment;
  };

  const removePayment = async (id: string) => {
    const success = await DataStore.deletePayment(id);
    if (success) {
      setPayments((prev) => {
        const updatedPayments = prev.filter((p) => p.id !== id);
        refreshSummaryForDate(selectedDate, ordersRef.current, updatedPayments);
        return updatedPayments;
      });
      showToast('Payment voucher removed', 'info');
      return true;
    }
    return false;
  };

  const updateYesterdayOpeningBalance = async (amount: number) => {
    const updated = await DataStore.updateYesterdayBalance(selectedDate, amount);
    // Update cache with new opening balance
    openingBalanceCache.current.set(selectedDate, updated.nabta_yesterday_balance);
    setDaySummary(updated);
    showToast(`Yesterday opening balance updated to AED ${amount}`, 'success');
  };

  const resetToDefaultData = () => {
    DataStore.resetToSeed();
    openingBalanceCache.current.clear();
    initialLoadDone.current = false;
    loadData(selectedDate);
    showToast('Reset to demo sample data', 'info');
  };

  return (
    <DataContext.Provider
      value={{
        orders,
        payments,
        selectedDate,
        setSelectedDate,
        daySummary,
        isLoading,
        toasts,
        showToast,
        removeToast,
        addOrder,
        editOrder,
        removeOrder,
        addPayment,
        removePayment,
        updateYesterdayOpeningBalance,
        refreshData: () => {
          openingBalanceCache.current.clear();
          return loadData(selectedDate);
        },
        resetToDefaultData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
